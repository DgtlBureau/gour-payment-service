import { IsEnum, IsNumber, IsObject, IsUUID } from 'class-validator';
import { Currency } from '../../@types/currency';

export class InvoiceCreateDto {
  @IsEnum(Currency)
  currency: Currency;

  @IsNumber()
  amount: AmountOfGoodsNumber;

  @IsNumber()
  value: PurchaseValueNumber;

  @IsObject()
  meta: SomeObject; // some meta information

  @IsUUID()
  payerUuid: UuidString;
}
