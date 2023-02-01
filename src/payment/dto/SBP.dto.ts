import {
  IsEmail,
  IsEnum,
  IsIP,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
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
  payerUuid: string;

  @IsEmail()
  @IsOptional()
  email: string;
}
