import { Currency } from '../../@types/currency';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Invoice } from 'invoice/invoice.entity';
import { PaymentStatus } from '../../@types/statuses';

export class PaymentCreateDto {
  @IsEnum(Currency)
  currency: Currency;

  @IsNumber()
  amount: PurchaseValueNumber;

  @IsString()
  @IsOptional()
  errorMessage: ErrorString;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsNumber()
  transactionId: UniqueIdNumber;

  @IsUUID()
  payerUuid: UuidString;

  invoice: Invoice;
}
