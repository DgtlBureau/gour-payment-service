import {
  IsEmail,
  IsEnum,
  IsIP,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { Currency } from '../../@types/currency';

export class PayDto {
  @IsEnum(Currency)
  currency: Currency;

  @IsUUID()
  payerUuid: UuidString;

  @IsEmail()
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
}
