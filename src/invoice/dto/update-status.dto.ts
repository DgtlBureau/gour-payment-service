import { IsEnum } from 'class-validator';
import { InvoiceStatus } from '../../@types/statuses';

export class InvoiceUpdateStatusDto {
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;
}
