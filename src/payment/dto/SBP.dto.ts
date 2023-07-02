import {
  IsEmail,
  IsEnum,
  IsIP,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  ValidateIf,
} from 'class-validator';
import { Currency } from '../../@types/currency';

export enum UserAgent {
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
}

export class SBPDto {
  @IsEnum(UserAgent)
  userAgent: UserAgent;

  @IsIP()
  ipAddress: string;

  @IsEnum(Currency)
  currency: Currency;

  @IsNumber()
  amount: number;

  @IsString()
  description: string;

  @IsUUID()
  invoiceUuid: string;

  @IsUUID()
  @IsOptional()
  @ValidateIf(o => o.payerUuid !== '')
  payerUuid?: string;

  @IsEmail()
  @IsOptional()
  @ValidateIf(o => o.email !== '')
  email: string;

  @IsString()
  fullName: string;

  @IsString()
  code: string;
}
