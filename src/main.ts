import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.HOST,
        port: +process.env.PORT,
      },
    },
  );

  // const app = await NestFactory.create(AppModule);
  if (['production', 'development'].includes(process.env.NODE_ENV)) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
    });
  }

  await app.listen();

  console.info('SERVICE STARTED ON PORT: ', process.env.PORT);
}
bootstrap();
