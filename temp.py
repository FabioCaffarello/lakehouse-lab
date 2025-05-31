def get_food_selection(food_items):
    food_items_size = len(food_items)
    calories_buckets = {}
    total_price = 0
    max1 = max2 = 0

    for idx, (name, calories, price) in enumerate(food_items):
        total_price += price
        if not calories_buckets.get(calories):
            calories_buckets[calories] = []
        calories_buckets[calories].append(idx)

        if calories > max1:
            max2, max1 = max1, calories
        elif calories > max2 and calories != max1:
            max2 = calories

    avg_price = total_price / food_items_size

    overlap_items = set()
    for cal in (max1, max2):
        for idx in calories_buckets[cal]:
            name, _, price = food_items[idx]
            if price > avg_price:
                overlap_items.add(name)

    return sorted(overlap_items)


if __name__ == "__main__":

    # [name, calories, price]
    input = [
        ["ABUELO SUCIO (16oz)", 400, 26],
        ["Chick-fil-A Chicken Sandwich", 400, 6],
        ["Chicken in Lettuce Cups", 900, 19],
        ["Classic French Dip", 900, 16],
        ["Grilled Chicken Teriyaki", 400, 18],
        ["Medium 8 pc Wing Combo", 300, 10],
        ["Pad See You", 1000, 19],
        ["Tea Leaf Rice", 400, 15],
        ["Udon", 300, 12],
        ["Very Cherry Ghirardelli Chocolate Cheesecake", 900, 10],
    ]
    result = get_food_selection(input)
    # Answer key: ['Chicken in Lettuce Cups', 'Classic French Dip', 'Pad See You']
