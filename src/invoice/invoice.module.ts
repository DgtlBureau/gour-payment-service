import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { invoiceProviders } from './invoice.providers';
import { DatabaseModule } from 'database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [InvoiceService, ...invoiceProviders],
  controllers: [InvoiceController],
})
export class InvoiceModule {}
