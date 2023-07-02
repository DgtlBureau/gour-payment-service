import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsString,
  IsUrl,
  IsUUID, ValidateIf,
} from 'class-validator';
import { Currency } from '../../@types/currency';

export class PaymentApiCreateDto {
  @IsEnum(Currency)
  Currency: Currency;

  @IsNumber()
  Amount: PurchaseValueNumber;

  @IsString()
  IpAddress: IpAddressString;

  @IsString()
  Description: string;

  @IsUUID()
  InvoiceId: UuidString;

  @IsEmail()
  @ValidateIf(o => o.Email !== '')
  Email: EmailString;

  @IsString()
  CardCryptogramPacket: SignatureString;

  @IsUUID()
  payerUuid: UuidString;
}
