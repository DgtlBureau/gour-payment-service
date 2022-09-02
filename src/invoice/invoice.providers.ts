import { FactoryProvider } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Invoice } from './invoice.entity';

export const invoiceProviders: FactoryProvider<Repository<Invoice>>[] = [
  {
    provide: 'INVOICE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Invoice),
    inject: ['DATA_SOURCE'],
  },
];
