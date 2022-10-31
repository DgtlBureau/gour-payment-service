import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { DatabaseModule } from 'database/database.module';
import { paymentProviders } from './payment.providers';
import { PaymentService } from './payment.service';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from 'app.module';
import { PaymentApiService } from './payment-api.service';
import { JwtModule } from 'jwt/jwt.module';
import { InvoiceModule } from 'invoice/invoice.module';
import { PaymentController } from './payment.controller';

const httpFactory = {
  useFactory: async (configService: AppConfigService) => ({
    timeout: 5000,
    maxRedirects: 5,
    baseURL: configService.get('PAYMENT_SERVICE_URL'),
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(
          `${configService.get('PAYMENT_SERVICE_LOGIN')}:${configService.get(
            'PAYMENT_SERVICE_API_KEY',
          )}`,
        ).toString('base64'),
    },
  }),
  inject: [ConfigService],
};

@Module({
  imports: [
    HttpModule.registerAsync(httpFactory),
    DatabaseModule,
    JwtModule,
    forwardRef(() => InvoiceModule),
  ],
  providers: [...paymentProviders, PaymentService, PaymentApiService],
  exports: [PaymentApiService],
  controllers: [PaymentController],
})
export class PaymentModule {}
