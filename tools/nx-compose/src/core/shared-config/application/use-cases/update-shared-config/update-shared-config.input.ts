import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsObject,
  validateSync,
} from 'class-validator';

export type UpdateSharedConfigInputConstructorProps = {
  id: string;
  name?: string;
  templates?: string[];
  appliesTo?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
};

export class UpdateSharedConfigInput {
  @IsString()
  @IsNotEmpty({ message: 'ID is required.' })
  id: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  templates?: string[];

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  appliesTo?: string[];

  @IsObject({ message: 'Environment must be an object.' })
  @IsOptional()
  environment?: Record<string, string>;

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  volumes?: string[];

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  networks?: string[];

  constructor(props?: UpdateSharedConfigInputConstructorProps) {
    if (!props) return;
    this.id = props.id;
    this.name = props.name = props.name;
    this.templates = props.templates;
    this.appliesTo = props.appliesTo;
    this.environment = props.environment;
    this.volumes = props.volumes;
    this.networks = props.networks;
  }
}

export class ValidateUpdateSharedConfigInput {
  static validate(input: UpdateSharedConfigInput) {
    return validateSync(input);
  }
}
