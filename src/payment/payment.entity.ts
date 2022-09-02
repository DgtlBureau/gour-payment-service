import { Entity, Column, ManyToOne } from 'typeorm';
import { Currency } from '../@types/currency';
import { PaymentStatus } from '../@types/statuses';
import { AppEntity } from '../app.entity';
import { Invoice } from '../invoice/invoice.entity';

@Entity({ name: 'payment' })
export class Payment extends AppEntity {
  @Column('uuid')
  payerUuid: UuidString;

  @Column('uuid')
  invoiceUuid: UuidString;

  @Column('double precision')
  amount: number;

  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @Column({ type: 'varchar', unique: true })
  signature: SignatureString;

  @Column({ type: 'enum', enum: PaymentStatus })
  status: PaymentStatus;

  @ManyToOne(() => Invoice)
  invoice: Invoice;
}
