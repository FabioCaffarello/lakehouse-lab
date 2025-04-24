import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  IsObject,
  validateSync,
} from 'class-validator';

export type CreateComposerInputProps = {
  name: string;
  stacks?: string[];
  services?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
  sharedConfigs?: string[];
};

export class CreateComposerInput {
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty.' })
  name!: string;

  @IsObject({ message: 'Environment must be an object.' })
  @IsOptional()
  environment?: Record<string, string>;

  @IsArray({ message: 'Volumes must be an array of strings.' })
  @ArrayNotEmpty({ message: 'Volumes array cannot be empty.' })
  @IsString({ each: true, message: 'Each volume must be a string.' })
  @IsOptional()
  volumes?: string[];

  @IsArray({ message: 'Networks must be an array of strings.' })
  @ArrayNotEmpty({ message: 'Networks array cannot be empty.' })
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

  @IsArray({ message: 'Stacks must be an array of strings.' })
  @ArrayNotEmpty({ message: 'Stacks array cannot be empty.' })
  @IsString({ each: true, message: 'Each stack must be a string.' })
  @IsOptional()
  stacks?: string[];

  constructor(props?: CreateComposerInputProps) {
    if (props) Object.assign(this, props);
  }
}

export class ValidateCreateComposerInput {
  static validate(input: CreateComposerInput) {
    return validateSync(input, { skipMissingProperties: false });
  }
}
