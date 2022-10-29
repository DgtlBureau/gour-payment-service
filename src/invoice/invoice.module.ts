import { forwardRef, Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { invoiceProviders } from './invoice.providers';
import { DatabaseModule } from 'database/database.module';
import { PaymentModule } from 'payment/payment.module';
import { JwtModule } from 'jwt/jwt.module';
import { SchedulerRegistry } from '@nestjs/schedule';

@Module({
  imports: [DatabaseModule, forwardRef(() => PaymentModule), JwtModule],
  providers: [InvoiceService, ...invoiceProviders, SchedulerRegistry],
  controllers: [InvoiceController],
  exports: [InvoiceService],
})
export class InvoiceModule {}
