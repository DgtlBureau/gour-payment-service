import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { DatabaseModule } from 'database/database.module';
import { paymentProviders } from './payment.providers';
import { PaymentService } from './payment.service';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from 'app.module';

const httpFactory = {
  useFactory: async (configService: AppConfigService) => ({
    timeout: 5000,
    maxRedirects: 5,
    baseURL: configService.get('PAYMENT_SERVICE_URL'),
  }),
  inject: [ConfigService],
};

@Module({
  imports: [HttpModule.registerAsync(httpFactory), DatabaseModule],
  providers: [...paymentProviders, PaymentService],
})
export class PaymentModule {}
