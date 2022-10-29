import { IsUUID } from 'class-validator';

export class InvoiceGetOneDto {
  @IsUUID()
  uuid: UuidString;
}
