import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InvoiceCreateDto } from './dto/create.dto';
import { InvoiceGetOneDto } from './dto/get-one.dto';
import { InvoiceService } from './invoice.service';

@Controller('invoice')
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @MessagePattern('create-invoice')
  createInvoice(@Payload() dto: InvoiceCreateDto) {
    return this.invoiceService.create(dto);
  }

  @MessagePattern('get-invoice')
  getInvoice(@Payload() dto: InvoiceGetOneDto) {
    return this.invoiceService.getOne(dto.uuid);
  }

  @MessagePattern('get-invoices')
  getInvoices(@Payload() userId: UuidString) {
    return this.invoiceService.getMany(userId);
  }
}
