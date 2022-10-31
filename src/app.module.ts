import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from 'payment/payment.module';
import { InvoiceModule } from './invoice/invoice.module';
import { JwtModule } from './jwt/jwt.module';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigServiceVariables } from './@types/config-service';
import { config } from 'dotenv';
import { DatabaseModule } from './database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { dataSource } from 'database/database.providers';
import { getRequiredEnvsByNodeEnv } from 'common/utils/getRequiredEnvsByNodeEnv';
import { NodeEnv } from 'common/types/App';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { SentryInterceptor } from 'common/interceptors/sentry.interceptor';
import { HttpExceptionFilter } from 'common/filters/http-exception.filter';

config();

const envs: (keyof ConfigServiceVariables)[] = [
  'SIGNATURE_SECRET_KEY',
  'SIGNATURE_SECRET_KEY_EXP',
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
  'PAYMENT_SERVICE_URL',
  'PAYMENT_SERVICE_LOGIN',
  'PAYMENT_SERVICE_API_KEY',
];

const requiredEnvs = getRequiredEnvsByNodeEnv(
  { common: envs, development: ['SENTRY_DSN'], production: ['SENTRY_DSN'] },
  process.env.NODE_ENV as NodeEnv,
);

for (const field of requiredEnvs) {
  if (!process.env[field]) {
    throw new Error(`Added to .env file ${field}!`);
  }
}

// Используй этот метод для получения переменных окружения, в нем описаны названия ключей
export class AppConfigService extends ConfigService<ConfigServiceVariables> {}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    TypeOrmModule.forRoot(dataSource.options),
    JwtModule,
    InvoiceModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
