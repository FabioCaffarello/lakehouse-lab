import {
  IsNotEmpty,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

export type CreateSharedConfigInputConstructorProps = {
  name: string;
  templates: string[]; // Must have at least one YAML template
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
  appliesTo: string[];
};

export class CreateSharedConfigInput {
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty.' })
  name: string;

  @IsString({ each: true })
  @IsNotEmpty({ message: 'At least one template is required.' })
  templates: string[];

  @IsOptional()
  @IsString({ each: true })
  volumes?: string[];

  @IsOptional()
  @IsString({ each: true })
  networks?: string[];

  @IsOptional()
  environment?: Record<string, string>;

  @IsString({ each: true })
  @IsNotEmpty({ message: 'At least one appliesTo is required.' })
  appliesTo: string[];

  constructor(props: CreateSharedConfigInputConstructorProps) {
    Object.assign(this, props);
  }
}

export class ValidateCreateSharedConfigInput {
  static validate(input: CreateSharedConfigInput) {
    return validateSync(input);
  }
}
