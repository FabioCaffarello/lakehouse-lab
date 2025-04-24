import {
  IsString,
  IsNotEmpty,
  ValidateIf,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
  IsObject,
} from 'class-validator';

export type CreateServiceInputConstructorProps = {
  name: string;
  image?: string;
  templateFile?: string;
  environment?: Record<string, string>;
  ports?: string[];
  volumes?: string[];
  networks?: string[];
  sharedConfigs?: string[];
};

export class CreateServiceInput {
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty.' })
  name!: string;

  @ValidateIf((o) => !o.templateFile)
  @IsString({ message: 'Image must be a non-empty string.' })
  @IsNotEmpty({ message: 'Either image or templates must be provided.' })
  image?: string;

  @ValidateIf((o) => !o.image)
  @IsString()
  templateFile?: string;

  @IsObject({ message: 'Environment must be an object.' })
  @IsOptional()
  environment?: Record<string, string>;

  @IsArray({ message: 'Ports must be an array of strings.' })
  @ArrayNotEmpty({ message: 'Ports array cannot be empty.' })
  @IsString({ each: true, message: 'Each port must be a string.' })
  @IsOptional()
  ports?: string[];

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

  constructor(props: CreateServiceInputConstructorProps) {
    Object.assign(this, props);
  }
}

export class ValidateCreateServiceInput {
  static validate(input: CreateServiceInput) {
    return validateSync(input);
  }
}
