import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
  IsArray,
  ArrayNotEmpty,
  IsObject,
  validateSync,
} from 'class-validator';

export type UpdateServiceInputProps = {
  id: string;
  name?: string;
  image?: string;
  templateFile?: string;
  environment?: Record<string, string>;
  ports?: string[];
  volumes?: string[];
  networks?: string[];
  sharedConfigs?: string[];
};

export class UpdateServiceInput {
  @IsString()
  @IsNotEmpty({ message: 'ID is required.' })
  id!: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Name cannot be empty.' })
  name?: string;

  @ValidateIf((o) => !o.templateFile)
  @IsString({ message: 'Image must be a string.' })
  @IsOptional()
  image?: string;

  @ValidateIf((o) => !o.image)
  @IsString({ message: 'Template file must be a string.' })
  @IsOptional()
  templateFile?: string;

  @IsObject({ message: 'Environment must be an object.' })
  @IsOptional()
  environment?: Record<string, string>;

  @IsArray({ message: 'Ports must be an array of strings.' })
  @ArrayNotEmpty({ message: 'Ports cannot be empty.' })
  @IsString({ each: true, message: 'Each port must be a string.' })
  @IsOptional()
  ports?: string[];

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
  @ArrayNotEmpty({ message: 'SharedConfigs cannot be empty.' })
  @IsString({ each: true, message: 'Each sharedConfig name must be a string.' })
  @IsOptional()
  sharedConfigs?: string[];

  constructor(props?: UpdateServiceInputProps) {
    if (props) Object.assign(this, props);
  }
}

export class ValidateUpdateServiceInput {
  static validate(input: UpdateServiceInput) {
    return validateSync(input, { skipMissingProperties: false });
  }
}
