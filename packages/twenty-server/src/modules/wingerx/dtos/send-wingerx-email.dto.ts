import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class SendWingerXEmailDto {
  @IsEmail()
  @MaxLength(320)
  to: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[^\r\n]+$/, { message: 'subject cannot contain line breaks' })
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10_000)
  message: string;

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
