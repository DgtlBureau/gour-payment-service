import {
  IsEmail,
  IsEnum,
  IsIP,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { Currency } from '../../@types/currency';

export class PayDto {
  @IsEnum(Currency)
  currency: Currency;

  @IsUUID()
  @ValidateIf(o => o.payerUuid !== '')
  @IsOptional()
  payerUuid?: string;

  @IsEmail()
  @ValidateIf(o => o.email !== '')
  @IsOptional()
  email: EmailString;

  @IsIP()
  ipAddress: IpAddressString;

  @IsString()
  signature: SignatureString;

  @IsUUID()
  invoiceUuid: UuidString;

  @IsUrl()
  successUrl: URIString;

  @IsUrl()
  rejectUrl: URIString;

  @IsString()
  fullName: string;

  @IsString()
  code: string;
}
