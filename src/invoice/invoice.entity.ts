import { Entity, Column, OneToMany, BeforeInsert } from 'typeorm';
import { Currency } from '../@types/currency';
import { InvoiceStatus } from '../@types/statuses';
import { AppEntity } from '../app.entity';

import { Payment } from '../payment/payment.entity';

export type InvoiceSignatureObject = Pick<
  Invoice,
  'amount' | 'currency' | 'payerUuid' | 'value'
>;

@Entity({ name: 'invoice' })
export class Invoice extends AppEntity {
  @Column('uuid')
  payerUuid: UuidString;

  @Column('double precision')
  amount: AmountOfGoodsNumber;

  @Column('double precision')
  value: PurchaseValueNumber;

  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @Column({ type: 'text', unique: true, select: false })
  signature: SignatureString;

  @Column({ type: 'enum', enum: InvoiceStatus })
  status: InvoiceStatus;

  @OneToMany(() => Payment, (p) => p.invoice)
  payments: Payment[];

  @Column({ type: 'timestamp' })
  expiresAt: Date;
}
