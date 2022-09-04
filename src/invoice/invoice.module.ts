import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { invoiceProviders } from './invoice.providers';
import { DatabaseModule } from 'database/database.module';
import { PaymentModule } from 'payment/payment.module';
import { JwtModule } from 'jwt/jwt.module';

@Module({
  imports: [DatabaseModule, PaymentModule, JwtModule],
  providers: [InvoiceService, ...invoiceProviders],
  controllers: [InvoiceController],
})
export class InvoiceModule {}
