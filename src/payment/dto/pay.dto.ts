import { IsEmail, IsEnum, IsIP, IsString, IsUUID } from 'class-validator';
import { Currency } from '../../@types/currency';

export class PayDto {
  @IsEnum(Currency)
  currency: Currency;

  @IsUUID()
  payerUuid: UuidString;

  @IsEmail()
  email: EmailString;

  @IsIP()
  ipAddress: IpAddressString;

  @IsString()
  signature: SignatureString;

  @IsUUID()
  invoiceUuid: UuidString;
}
