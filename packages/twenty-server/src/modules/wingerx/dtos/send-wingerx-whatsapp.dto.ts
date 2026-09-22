import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class SendWingerXWhatsAppDto {
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'to must be an E.164 phone number, for example +919876543210',
  })
  to: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+$/)
  @MaxLength(512)
  templateName: string;

  @IsString()
  @Matches(/^[a-z]{2,3}(?:_[A-Z]{2})?$/)
  @MaxLength(10)
  languageCode: string;

  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(1_024, { each: true })
  variables: string[];

  @IsBoolean()
  consentConfirmed: boolean;

  @IsUUID()
  idempotencyKey: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  clientReference?: string;
}
