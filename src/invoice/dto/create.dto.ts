import { IsEnum, IsNumber, IsUUID } from 'class-validator';
import { Currency } from '../../@types/currency';

export class InvoiceCreateDto {
  @IsEnum(Currency)
  currency: Currency;

  @IsNumber()
  amount: AmountOfGoodsNumber;

  @IsNumber()
  value: PurchaseValueNumber;

  @IsUUID()
  payerUuid: UuidString;
}
