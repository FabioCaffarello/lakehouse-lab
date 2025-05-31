package gomongo

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	Equal            = "$eq"
	NotEqual         = "$ne"
	GreaterThan      = "$gt"
	GreaterThanEqual = "$gte"
	LessThan         = "$lt"
	LessThanEqual    = "$lte"
	In               = "$in"
	Nin              = "$nin"
	RetryConnection  = 1
	AddToSet         = "$addToSet"
	SetOnInsert      = "$setOnInsert"
	Pull             = "$pull"
	Or               = "$or"
	And              = "$and"
)

var (
	errNotFound = errors.New("not found")
)

type Client struct {
	authMechanism         string
	maxConnectionPoolSize uint64
	timeoutContext        time.Duration
	client                *mongo.Client
}

type ClientOptions struct {
	AuthMechanism         string
	MaxConnectionPoolSize uint64
	TimeoutContext        time.Duration
}

type Filter struct {
	LogicOperator string      `json:"logicOperator"` // $and, $or, $nor, $not
	Fields        interface{} `json:"fields"`        // Can be []Filter or []FilterField
}

type FilterField struct {
	Name               string      `json:"name"`
	Value              interface{} `json:"value"`
	ComparisonOperator string      `json:"comparisonOperator"` // $eq, $lt, $lte, $gt, $gte, $in, $ne, $nin
}

type NotFoundError struct {
	Msg string
}

func (e NotFoundError) Error() string {
	return e.Msg
}

type DuplicateKeyError struct {
	Msg string
}

type filterBuilder struct {
	fieldsToCheckIndex []string
}

// M is a convenient alias for a map[string]interface{} map.
// For instance:
//
//	mongo.M{"a": 1, "b": true}
type M map[string]interface{}

func New(URL string) (*Client, error) {
	mongo := &Client{}

	ctx, cancel := mongo.getContext(mongo.timeoutContext)
	defer cancel()

	client, err := mongo.getClient(ctx, URL, "", "")
	if err != nil {
		return nil, fmt.Errorf("error while establishing connection due to %w", err)
	}
	mongo.client = client

	return mongo, nil
}

func NewWithOptions(URL string, options *ClientOptions) (*Client, error) {
	mongo := &Client{
		maxConnectionPoolSize: options.MaxConnectionPoolSize,
		authMechanism:         options.AuthMechanism,
		timeoutContext:        options.TimeoutContext,
	}

	ctx, cancel := mongo.getContext(mongo.timeoutContext)
	defer cancel()

	client, err := mongo.getClient(ctx, URL, "", "")
	if err != nil {
		return nil, fmt.Errorf("error while establishing connection due to %w", err)
	}
	mongo.client = client

	return mongo, nil
}

func NewAuthWithOptions(URL, username, password string, options *ClientOptions) (*Client, error) {
	mongo := &Client{
		maxConnectionPoolSize: options.MaxConnectionPoolSize,
		authMechanism:         options.AuthMechanism,
		timeoutContext:        options.TimeoutContext,
	}

	ctx, cancel := mongo.getContext(mongo.timeoutContext)
	defer cancel()

	client, err := mongo.getClient(ctx, URL, username, password)
	if err != nil {
		return nil, fmt.Errorf("error while establishing connection due to %w", err)
	}
	mongo.client = client

	return mongo, nil
}

func (c *Client) getContext(timeout time.Duration) (context.Context, context.CancelFunc) {
	if timeout == 0 {
		timeout = 60 * time.Second
	}
	ctx, cancel := context.WithTimeout(context.TODO(), timeout)
	return ctx, cancel
}

func (c *Client) getClient(ctx context.Context, URL, username, password string) (*mongo.Client, error) {
	credentials := options.Credential{
		AuthMechanism: c.authMechanism,
		Username:      username,
		Password:      password,
	}

	clientOptions := options.Client().ApplyURI(URL)

	if credentials.Password != "" {
		clientOptions = clientOptions.SetAuth(credentials)
	}

	if c.maxConnectionPoolSize != 0 {
		clientOptions = clientOptions.SetMaxPoolSize(c.maxConnectionPoolSize)
	}

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("error while connecting to mongodb due to: %w", err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("error while trying to reach mongodb server due to: %w", err)
	}

	return client, nil
}

func (c *Client) Disconnect() error {
	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()
	if err := c.client.Disconnect(ctx); err != nil {
		return fmt.Errorf("error while disconnecting due to: %w", err)
	}
	return nil
}

func (c *Client) getCollection(database, collection string) (*mongo.Collection, error) {
	return c.client.Database(database).Collection(collection), nil
}

func (c *Client) validID(id interface{}) error {
	switch id.(type) {
	case int, string:
		return nil
	}
	return fmt.Errorf("id must be string or integer: received %T", id)
}

func (e DuplicateKeyError) Error() string {
	return e.Msg
}

func (c *Client) parseError(err error) error {
	if errors.Is(err, mongo.ErrNoDocuments) {
		return NotFoundError{Msg: errNotFound.Error()}
	}
	if mongo.IsDuplicateKeyError(err) {
		return DuplicateKeyError{Msg: err.Error()}
	}
	return err
}

func (c *Client) unmarshalMultipleResults(records []map[string]interface{}) ([]map[string]interface{}, error) {
	recordsBytes, err := json.Marshal(records)
	if err != nil {
		return nil, errors.New("error while marshalling multiple records")
	}

	var result []map[string]interface{}
	if err := json.Unmarshal(recordsBytes, &result); err != nil {
		return nil, errors.New("error while unmarshalling multiplr records")
	}

	return result, nil
}

func marshalToFilterFieldSlice(filter interface{}) ([]FilterField, error) {
	result := []FilterField{}
	byteFilter, err := json.Marshal(filter)
	if err != nil {
		return nil, fmt.Errorf("error to marshal filter to byte {%s}", err.Error())
	}

	if err := json.Unmarshal(byteFilter, &result); err != nil {
		return nil, fmt.Errorf("error to unmarshal filter interface to []FilterField")
	}
	return result, nil
}

func (f *filterBuilder) generateFilter(result []bson.M, parentLogicOperator string, filters interface{}) ([]bson.M, error) {
	mapSliceFields, err := toMapSlice(filters)
	if err != nil {
		return nil, fmt.Errorf("error to parse interface{} to []map[string]interface{}: %s", err.Error())
	}

	if isParentFields(mapSliceFields) {
		filterSlice, err := marshalToFilterSlice(mapSliceFields)
		if err != nil {
			return nil, fmt.Errorf("error to parse []map[string]interface{} to to Filter: %s", err.Error())
		}

		if len(filterSlice) == 0 {
			return []bson.M{}, nil
		}
		for _, currentFilter := range filterSlice {
			logicOperator := getLogicOperator(currentFilter.LogicOperator)
			currentRes, err := f.generateFilter(result, logicOperator, currentFilter.Fields)
			if err != nil {
				return nil, fmt.Errorf("error to generate filter: %s", err)
			}
			result = currentRes
		}

		result = []bson.M{{parentLogicOperator: result}}
		return result, nil

	}

	filterFieldsSlice, err := marshalToFilterFieldSlice(mapSliceFields)
	if err != nil {
		return nil, fmt.Errorf("error to parse []map[string]interface{} to FilterField {%s}", err.Error())
	}

	filterFieldBsonSlice := []bson.M{}
	for _, currentField := range filterFieldsSlice {
		if currentField.Name == "" {
			return nil, fmt.Errorf("error to parse due to missing field name")
		}

		if currentField.ComparisonOperator == "" {
			currentField.ComparisonOperator = Equal
		}
		filterFieldBsonSlice = append(filterFieldBsonSlice, bson.M{currentField.Name: bson.M{currentField.ComparisonOperator: currentField.Value}})
		f.fieldsToCheckIndex = append(f.fieldsToCheckIndex, currentField.Name)
	}
	result = append(result, bson.M{parentLogicOperator: filterFieldBsonSlice})

	return result, nil
}

func hasKey(sliceKeys []map[string]interface{}, key string) bool {
	for _, v := range sliceKeys {
		for k := range v {
			if k == key {
				return true
			}
		}
	}
	return false
}

func isParentFields(fields []map[string]interface{}) bool {
	return hasKey(fields, "fields")
}

func toMapSlice(fields interface{}) ([]map[string]interface{}, error) {
	if reflect.TypeOf(fields).Kind() != reflect.Slice {
		return nil, fmt.Errorf("interface is not a slice {%v}", fields)
	}

	data, err := json.Marshal(fields)
	if err != nil {
		return nil, fmt.Errorf("error to marshal fields {%v}: {%s}", fields, err.Error())
	}

	var result []map[string]interface{}

	err = json.Unmarshal([]byte(data), &result)
	if err != nil {
		return nil, fmt.Errorf("error to unmarshal fields {%v}: {%s}", fields, err.Error())
	}

	return result, nil
}

func marshalToFilter(filter interface{}) (*Filter, error) {
	result := Filter{}
	byteFilter, err := json.Marshal(filter)
	if err != nil {
		return nil, fmt.Errorf("error to marshal filter to byte {%s}", err.Error())
	}

	if err := json.Unmarshal(byteFilter, &result); err != nil {
		return nil, fmt.Errorf("error to unmarshal filter interface to Filter")
	}
	return &result, nil
}

func marshalToFilterSlice(filter []map[string]interface{}) ([]Filter, error) {
	result := []Filter{}
	byteFilter, err := json.Marshal(filter)
	if err != nil {
		return nil, fmt.Errorf("error to marshal filter to byte {%s}", err.Error())
	}

	if err := json.Unmarshal(byteFilter, &result); err != nil {
		return nil, fmt.Errorf("error to unmarshal filter interface to []Filter")
	}

	return result, nil
}

func getLogicOperator(logicOperator string) string {
	if logicOperator == "" {
		return And
	}
	return logicOperator
}

func (c *Client) getFilter(filters interface{}) (mongoFilter bson.M, fields []string, err error) {
	filter, err := marshalToFilter(filters)
	if err != nil {
		return nil, nil, fmt.Errorf("error to parse marshal interface{} to Filter")
	}
	if filter.Fields == nil {
		return bson.M{}, nil, nil
	}

	var resFilter []bson.M
	logicOperator := getLogicOperator(filter.LogicOperator)
	filterBuilder := newFilterBuilder()
	resultFilter, err := filterBuilder.generateFilter(resFilter, logicOperator, filter.Fields)
	if err != nil {
		return nil, nil, fmt.Errorf("error to generate filter: %s", err)
	}

	return resultFilter[0], filterBuilder.fieldsToCheckIndex, nil
}

func (c *Client) filter(filter interface{}, databaseName, collectionName string, opts *options.FindOptions) ([]map[string]interface{}, error) {
	collection, err := c.getCollection(databaseName, collectionName)
	if err != nil {
		return nil, fmt.Errorf("error while getting collection %s due to: %w", collectionName, err)
	}

	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()
	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}

	var documents []map[string]interface{}
	if err = cursor.All(context.TODO(), &documents); err != nil {
		return nil, fmt.Errorf("error while decoding documents due to %w", err)
	}

	if err := cursor.Err(); err != nil {
		return nil, c.parseError(err)
	}

	cursor.Close(ctx)

	if len(documents) == 0 {
		return nil, mongo.ErrNoDocuments
	}

	result, err := c.unmarshalMultipleResults(documents)
	if err != nil {
		return nil, c.parseError(err)
	}

	return result, nil
}

func (c *Client) Get(database, collection string, filters Filter) ([]map[string]interface{}, error) {
	filter, _, err := c.getFilter(filters)
	if err != nil {
		return nil, fmt.Errorf("error to get mongo filter: %s", err.Error())
	}

	result, err := c.filter(filter, database, collection, &options.FindOptions{})
	if err != nil {
		return nil, c.parseError(fmt.Errorf("error while fetching data due to: %w", err))
	}

	return result, nil
}

func (c *Client) GetIfIndexesExists(database, collection string, filters Filter, limit int64) ([]map[string]interface{}, error) {
	if database == "" || collection == "" || filters.Fields == nil {
		return nil, fmt.Errorf("missing parameter while calling GetEnsureIndex function")
	}

	filter, fieldsToCheckIndex, err := c.getFilter(filters)
	if err != nil {
		return nil, fmt.Errorf("error to get mongo filter: %s", err.Error())
	}

	allIndexesExist, err := c.AllIndexesExists(database, collection, fieldsToCheckIndex)
	if err != nil {
		return nil, fmt.Errorf("checking indexes: %s", err.Error())
	}
	if !allIndexesExist {
		return nil, fmt.Errorf("checking indexes: index not found")
	}
	opts := &options.FindOptions{}
	if limit != 0 {
		opts.Limit = &limit
	}

	result, err := c.filter(filter, database, collection, opts)
	if err != nil {
		return nil, c.parseError(fmt.Errorf("error while fetching data due to: %w", err))
	}

	return result, nil
}

func getMapValue(inputMap map[string]interface{}, key string) (interface{}, error) {
	value, ok := inputMap[key]
	if !ok {
		return nil, fmt.Errorf("key %s not found within map", key)
	}
	return value, nil
}

func (c *Client) CreateIndex(database, collection string, keys []map[string]interface{}) error {
	coll, err := c.getCollection(database, collection)
	if err != nil {
		return fmt.Errorf("error while getting collection %s due to: %w", collection, err)
	}

	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()

	var document bson.D
	for _, keyMap := range keys {
		field, err := getMapValue(keyMap, "field")
		if err != nil {
			return err
		}
		fieldStr, ok := field.(string)
		if !ok {
			return fmt.Errorf("error to cast field of type interface{} to string")
		}
		order, err := getMapValue(keyMap, "order")
		if err != nil {
			return err
		}
		orderInt, ok := order.(int)
		if !ok {
			return fmt.Errorf("error to cast field of type interface{} to int")
		}
		document = append(document, bson.E{fieldStr, orderInt})

	}
	indexModel := mongo.IndexModel{
		Keys: document,
	}

	indexes := coll.Indexes()

	result, err := indexes.CreateOne(ctx, indexModel)
	if err != nil {
		return fmt.Errorf("result is %s error to create index due to: %w", result, err)
	}

	fmt.Printf("Created index: %s\n", result)
	return nil
}

func (c *Client) GetIndexes(database, collection string) ([]map[string]interface{}, error) {
	if database == "" || collection == "" {
		return nil, fmt.Errorf("missing parameter while calling GetIndexes function")
	}

	coll, err := c.getCollection(database, collection)
	if err != nil {
		return nil, fmt.Errorf("error while getting collection %s due to: %w", collection, err)
	}

	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()

	indexes := coll.Indexes()
	cursor, err := indexes.List(ctx)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var documents []map[string]interface{}
	if err = cursor.All(ctx, &documents); err != nil {
		return nil, fmt.Errorf("error while decoding documents due to %w", err)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return documents, nil
}

func (c *Client) AllIndexesExists(database, collection string, keysToFind []string) (bool, error) {
	if database == "" || collection == "" || keysToFind == nil {
		return false, fmt.Errorf("missing parameter while calling AllIndexesExists function")
	}

	indexes, err := c.GetIndexes(database, collection)
	if err != nil {
		return false, err
	}

	if len(indexes) == 0 {
		return false, nil
	}

	for _, keyName := range keysToFind {
		found := false
		for _, index := range indexes {
			mapIndex, ok := index["key"].(map[string]interface{})
			if !ok {
				return false, fmt.Errorf("cannot cast index key to map[string]interface{}")
			}

			if _, ok := mapIndex[keyName]; !ok {
				continue
			}
			found = true
		}
		if !found {
			return false, nil
		}
	}
	return true, nil
}

func (c *Client) GetAll(database, collection string) ([]map[string]interface{}, error) {
	result, err := c.Get(database, collection, Filter{})
	if err != nil {
		return nil, c.parseError(fmt.Errorf("error while fetching all data due to: %w", err))
	}

	return result, nil
}

func (c *Client) GetByID(database, collection string, id interface{}) (map[string]interface{}, error) {
	if err := c.validID(id); err != nil {
		return nil, err
	}

	filter := bson.M{"_id": id}
	limit := int64(1)

	result, err := c.filter(filter, database, collection, &options.FindOptions{Limit: &limit})
	if err != nil {
		return nil, c.parseError(fmt.Errorf("error while fetching data by id due to: %w", err))
	}

	if len(result) == 0 {
		return nil, c.parseError(mongo.ErrNoDocuments)
	}

	return result[0], nil
}

func (c *Client) GetIds(database, collection string, ids []interface{}, limit int64) ([]map[string]interface{}, error) {
	for _, id := range ids {
		if err := c.validID(id); err != nil {
			return nil, err
		}
	}

	filter := bson.M{"_id": bson.M{"$in": ids}}

	result, err := c.filter(filter, database, collection, &options.FindOptions{Limit: &limit})
	if err != nil {
		return nil, c.parseError(fmt.Errorf("error while fetching ids due to: %w", err))
	}

	return result, nil
}

func (c *Client) Distinct(database, collection, field string, filters Filter) ([]interface{}, error) {
	filter, _, err := c.getFilter(filters)
	if err != nil {
		return nil, fmt.Errorf("error to get mongo filter: %s", err.Error())
	}

	coll, err := c.getCollection(database, collection)
	if err != nil {
		return nil, fmt.Errorf("error while getting collection %s due to: %w", collection, err)
	}

	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()

	emptyOpts := &options.DistinctOptions{}
	values, err := coll.Distinct(ctx, field, filter, emptyOpts)
	if err != nil {
		return nil, fmt.Errorf("distinct error due to: %w", err)
	}

	return values, nil
}

func (c *Client) Insert(database, collection string, id interface{}, record map[string]interface{}) error {
	if err := c.validID(id); err != nil {
		return err
	}

	coll, err := c.getCollection(database, collection)
	if err != nil {
		return c.parseError(fmt.Errorf("error while getting collection %s due to: %w", collection, err))
	}

	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()

	record["_id"] = id
	insertedId, err := coll.InsertOne(ctx, record)
	if err != nil {
		return c.parseError(err)
	}

	if insertedId.InsertedID == nil {
		return c.parseError(fmt.Errorf("inserted id is nil while it should be %d", id))
	}

	return nil
}

func (c *Client) Upsert(database, collection string, id interface{}, record map[string]interface{}) error {
	if err := c.validID(id); err != nil {
		return err
	}

	coll, err := c.getCollection(database, collection)
	if err != nil {
		return c.parseError(fmt.Errorf("error while getting collection %s due to: %w", collection, err))
	}

	record["_id"] = id
	filter := bson.M{"_id": id}
	updateRecord := bson.M{"$set": record}

	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()
	result, err := coll.UpdateOne(ctx, filter, updateRecord, options.Update().SetUpsert(true))
	if err != nil {
		return c.parseError(fmt.Errorf("error while uptading collection %s due to: %w", collection, err))
	}

	if result == nil {
		return c.parseError(fmt.Errorf("upsert result should not be nil"))
	}

	return nil
}

func (c *Client) UpdateMany(database, collection string, filters Filter, fields map[string]interface{}) (*mongo.UpdateResult, error) {

	if err := validateUpdateParams(database, collection, filters, fields); err != nil {
		return nil, c.parseError(err)
	}

	filter, fieldsToCheckIndex, err := c.getFilter(filters)
	if err != nil {
		return nil, fmt.Errorf("error to get mongo filter: %s", err.Error())
	}

	allIndexesExist, err := c.AllIndexesExists(database, collection, fieldsToCheckIndex)
	if err != nil {
		return nil, fmt.Errorf("checking indexes: %s", err.Error())
	}
	if !allIndexesExist {
		return nil, fmt.Errorf("err checking indexes for fields {%v}: index not found", fieldsToCheckIndex)
	}

	coll, err := c.getCollection(database, collection)

	if err != nil {
		return nil, c.parseError(fmt.Errorf("error while getting collection %s due to: %w", collection, err))
	}

	updateFields := bson.M{"$set": fields}
	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()

	result, err := coll.UpdateMany(ctx, filter, updateFields, options.Update().SetUpsert(true))

	if err != nil {
		return result, c.parseError(fmt.Errorf("error while updating collection %s due to: %w", collection, err))
	}

	if result == nil {
		return result, c.parseError(fmt.Errorf("update result should not be nil"))
	}

	return result, nil
}

func (c *Client) UpdateOne(database, collection string, filters Filter, fields map[string]interface{}) error {

	if err := validateUpdateParams(database, collection, filters, fields); err != nil {
		return c.parseError(err)
	}

	filter, fieldsToCheckIndex, err := c.getFilter(filters)
	if err != nil {
		return fmt.Errorf("error to get mongo filter: %s", err.Error())
	}

	allIndexesExist, err := c.AllIndexesExists(database, collection, fieldsToCheckIndex)
	if err != nil {
		return fmt.Errorf("checking indexes: %s", err.Error())
	}
	if !allIndexesExist {
		return fmt.Errorf("checking indexes: index not found")
	}

	coll, err := c.getCollection(database, collection)

	if err != nil {
		return c.parseError(fmt.Errorf("error while getting collection %s due to: %w", collection, err))
	}

	updateFields := bson.M{"$set": fields}
	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()

	_, err = coll.UpdateOne(ctx, filter, updateFields)
	if err != nil {
		return c.parseError(fmt.Errorf("error while updating collection %s due to: %w", collection, err))
	}

	return nil
}

func (c *Client) Remove(database, collection string, id interface{}) error {
	if err := c.validID(id); err != nil {
		return err
	}

	coll, err := c.getCollection(database, collection)
	if err != nil {
		return c.parseError(fmt.Errorf("error while getting collection %s due to: %w", collection, err))
	}

	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()
	result, err := coll.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return c.parseError(err)
	}

	if result == nil {
		return c.parseError(fmt.Errorf("deleteOne result should not be nil"))
	}

	return nil
}

func (c *Client) RemoveMany(database, collection string, filters Filter) error {
	if database == "" || collection == "" || filters.Fields == nil {
		return fmt.Errorf("missing parameter while calling RemoveMany function")
	}

	filter, fieldsToCheckIndex, err := c.getFilter(filters)
	if err != nil {
		return fmt.Errorf("error to get mongo filter: %s", err.Error())
	}

	allIndexesExist, err := c.AllIndexesExists(database, collection, fieldsToCheckIndex)
	if err != nil {
		return fmt.Errorf("checking indexes: %s", err.Error())
	}
	if !allIndexesExist {
		return fmt.Errorf("checking indexes: index not found")
	}

	coll, err := c.getCollection(database, collection)
	if err != nil {
		return c.parseError(fmt.Errorf("error while getting collection %s due to: %w", collection, err))
	}

	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()

	result, err := coll.DeleteMany(ctx, filter)
	if err != nil {
		return c.parseError(err)
	}

	if result == nil {
		return c.parseError(fmt.Errorf("deleteMany result should not be nil"))
	}

	return nil
}

func (c *Client) RemoveAll(database, collection string) error {
	if database == "" || collection == "" {
		return fmt.Errorf("missing parameter while calling RemoveAll function")
	}
	emptyFilter := Filter{
		Fields: nil,
	}
	filter, _, err := c.getFilter(emptyFilter)
	if err != nil {
		return fmt.Errorf("error to get mongo filter: %s", err.Error())
	}

	coll, err := c.getCollection(database, collection)
	if err != nil {
		return c.parseError(fmt.Errorf("error while getting collection %s due to: %w", collection, err))
	}

	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()

	result, err := coll.DeleteMany(ctx, filter)
	if err != nil {
		return c.parseError(err)
	}

	if result == nil {
		return c.parseError(fmt.Errorf("deleteMany result should not be nil"))
	}

	return nil
}

func (c *Client) GetLastRecord(database, collection, sortField string) (map[string]interface{}, error) {
	limit := int64(1)
	descendentSort := -1
	sort := bson.M{sortField: descendentSort}
	result, err := c.filter(bson.M{}, database, collection, &options.FindOptions{Limit: &limit, Sort: &sort})
	if err != nil {
		return nil, c.parseError(fmt.Errorf("error while fetching data due to: %w", err))
	}

	if len(result) == 0 {
		return nil, c.parseError(c.parseError(mongo.ErrNoDocuments))
	}

	return result[0], nil
}

func (c *Client) GetLastRecordWithFilter(database, collection string, filters Filter, sortField string) (map[string]interface{}, error) {
	limit := int64(1)
	descendentSort := -1
	sort := bson.M{sortField: descendentSort}
	filter, _, err := c.getFilter(filters)
	if err != nil {
		return nil, fmt.Errorf("error to get mongo filter: %s", err.Error())
	}

	result, err := c.filter(filter, database, collection, &options.FindOptions{Limit: &limit, Sort: &sort})
	if err != nil {
		return nil, c.parseError(fmt.Errorf("error while fetching data due to: %w", err))
	}

	if len(result) == 0 {
		return nil, c.parseError(mongo.ErrNoDocuments)
	}

	return result[0], nil
}

func (c *Client) Count(database, collection string, filters Filter) (int64, error) {

	coll, err := c.getCollection(database, collection)
	if err != nil {
		return 0, c.parseError(fmt.Errorf("error while getting collection %s due to: %w", collection, err))
	}

	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()
	filter, _, err := c.getFilter(filters)
	if err != nil {
		return 0, fmt.Errorf("error to get mongo filter: %s", err.Error())
	}

	result, err := coll.CountDocuments(ctx, filter)
	if err != nil {
		return 0, c.parseError(err)
	}

	return result, nil
}

func (c *Client) CountIfIndexesExists(database, collection string, filters Filter) (int64, error) {
	if database == "" || collection == "" || filters.Fields == nil {
		return 0, fmt.Errorf("missing parameter while calling CountEnsureIndex function")
	}

	filter, fieldsToCheckIndex, err := c.getFilter(filters)
	if err != nil {
		return 0, fmt.Errorf("error to get mongo filter: %s", err.Error())
	}

	allIndexesExist, err := c.AllIndexesExists(database, collection, fieldsToCheckIndex)
	if err != nil {
		return 0, fmt.Errorf("checking indexes: %s", err.Error())
	}
	if !allIndexesExist {
		return 0, fmt.Errorf("checking indexes: index not found")
	}

	coll, err := c.getCollection(database, collection)
	if err != nil {
		return 0, c.parseError(fmt.Errorf("error while getting collection %s due to: %w", collection, err))
	}

	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()

	result, err := coll.CountDocuments(ctx, filter)
	if err != nil {
		return 0, c.parseError(err)
	}

	return result, nil
}

// GetRecordsByAggregation return records using aggregation framework.
// More information here https://www.mongodb.com/docs/manual/aggregation/
func (c *Client) GetRecordsByAggregation(database, collection string, pipeline []M) ([]map[string]interface{}, error) {
	coll, err := c.getCollection(database, collection)
	if err != nil {
		return nil, c.parseError(fmt.Errorf("error while getting collection %s due to: %w", collection, err))
	}

	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()

	var records []map[string]interface{}
	cursor, err := coll.Aggregate(ctx, pipeline, nil)
	if err != nil {
		return nil, c.parseError(fmt.Errorf("error while getting collection %s due to: %w", collection, err))
	}

	if err = cursor.All(context.TODO(), &records); err != nil {
		return nil, c.parseError(fmt.Errorf("error while decoding documents due to %w", err))
	}

	if err := cursor.Err(); err != nil {
		return nil, c.parseError(err)
	}

	cursor.Close(ctx)

	result, err := c.unmarshalMultipleResults(records)
	if err != nil {
		return nil, c.parseError(err)
	}

	return result, nil
}

// UpsertAtomic will update record only if dateField is equal with the already existent date in database, will return an error otherwise.
// This method was created to solve a problem with two parallel processes executing data transformation in the same _id, the dateField here works like a secondary id.
// So if oldDate is is changed, the Upsert operation will fail and return an error, that can be handled by the process. If not UpsertAtomic will update dateField with the newDate value and update the record.
// Parameter id is used to set field _id.
func (c *Client) UpsertAtomic(database string, collection string, id interface{}, record map[string]interface{}, dateField string, oldDate, newDate time.Time) error {
	if err := c.validID(id); err != nil {
		return err
	}

	coll, err := c.getCollection(database, collection)
	if err != nil {
		return c.parseError(fmt.Errorf("error while getting collection %s due to: %w", collection, err))
	}

	record["_id"] = id
	record[dateField] = newDate
	updateRecord := bson.M{"$set": record}
	filter := bson.M{"_id": id, dateField: oldDate}

	ctx, cancel := c.getContext(c.timeoutContext)
	defer cancel()
	result, err := coll.UpdateOne(ctx, filter, updateRecord, options.Update().SetUpsert(true))
	if err != nil {
		return c.parseError(fmt.Errorf("error while uptading collection %s due to: %w", collection, err))
	}

	if result == nil {
		return c.parseError(fmt.Errorf("upsert result should not be nil"))
	}

	return nil

}

func validateUpdateParams(database, collection string, filters Filter, fields map[string]interface{}) error {
	if database == "" {
		return errors.New("a database must be specified")
	}

	if collection == "" {
		return errors.New("a collection must be specified")
	}

	if filters.Fields == nil {
		return errors.New("filters must be specified")
	}

	if fields == nil {
		return errors.New("fields to be updated must be specified")
	}

	return nil
}

func newFilterBuilder() *filterBuilder {
	return &filterBuilder{fieldsToCheckIndex: []string{}}
}
