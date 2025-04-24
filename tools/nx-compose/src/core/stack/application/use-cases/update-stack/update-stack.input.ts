import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  IsObject,
  validateSync,
} from 'class-validator';

export type UpdateStackInputProps = {
  id: string;
  name?: string;
  services?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
  sharedConfigs?: string[];
};

export class UpdateStackInput {
  @IsString()
  @IsNotEmpty({ message: 'ID is required.' })
  id!: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Name cannot be empty.' })
  name?: string;

  @IsObject({ message: 'Environment must be an object.' })
  @IsOptional()
  environment?: Record<string, string>;

  @IsArray({ message: 'Volumes must be an array of strings.' })
  @ArrayNotEmpty({ message: 'Volumes cannot be empty.' })
  @IsString({ each: true, message: 'Each volume must be a string.' })
  @IsOptional()
  volumes?: string[];

  @IsArray({ message: 'Networks must be an array of strings.' })
  @ArrayNotEmpty({ message: 'Networks cannot be empty.' })
  @IsString({ each: true, message: 'Each network must be a string.' })
  @IsOptional()
  networks?: string[];

  @IsArray({ message: 'SharedConfigs must be an array of strings.' })
  @ArrayNotEmpty({ message: 'SharedConfigs array cannot be empty.' })
  @IsString({ each: true, message: 'Each sharedConfig must be a string.' })
  @IsOptional()
  sharedConfigs?: string[];

  @IsArray({ message: 'Services must be an array of strings.' })
  @ArrayNotEmpty({ message: 'Services array cannot be empty.' })
  @IsString({ each: true, message: 'Each service must be a string.' })
  @IsOptional()
  services?: string[];

  constructor(props?: UpdateStackInputProps) {
    if (props) Object.assign(this, props);
  }
}

export class ValidateUpdateStackInput {
  static validate(input: UpdateStackInput) {
    return validateSync(input, { skipMissingProperties: false });
  }
}
