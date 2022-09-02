import { IsEnum, IsNumber, IsString, IsUUID } from 'class-validator';
import { Currency } from '../../@types/currency';

export class PaymentCreateDto {
  @IsEnum(Currency)
  currency: Currency;

  @IsNumber()
  amount: AmountOfGoodsNumber;

  @IsNumber()
  value: PurchaseValueNumber;

  @IsString()
  signature: SignatureString;

  @IsUUID()
  payerUuid: UuidString;
}
