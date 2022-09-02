import { FactoryProvider } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Payment } from './payment.entity';

export const paymentProviders: FactoryProvider<Repository<Payment>>[] = [
  {
    provide: 'PAYMENT_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Payment),
    inject: ['DATA_SOURCE'],
  },
];
