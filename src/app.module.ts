import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from 'payment/payment.module';
import { InvoiceModule } from './invoice/invoice.module';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigServiceVariables } from './@types/config-service';
import { config } from 'dotenv';
import { DatabaseModule } from './database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { dataSource } from 'database/database.providers';
import { getRequiredEnvsByNodeEnv } from 'common/utils/getRequiredEnvsByNodeEnv';
import { NodeEnv } from 'common/types/App';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SentryInterceptor } from 'common/interceptors/sentry.interceptor';

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

const jwtFactory = {
  useFactory: async (configService: AppConfigService) => ({
    secret: configService.get<string>('SIGNATURE_SECRET_KEY'),
    signOptions: {
      expiresIn: configService.get('SIGNATURE_SECRET_KEY_EXP') + 'M',
    },
  }),
  inject: [ConfigService],
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    TypeOrmModule.forRoot(dataSource.options),
    JwtModule.registerAsync(jwtFactory),
    InvoiceModule,
    PaymentModule,
    JwtModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
})
export class AppModule {}
