import { Entity, Column, ManyToOne } from 'typeorm';
import { Currency } from '../@types/currency';
import { PaymentStatus } from '../@types/statuses';
import { AppEntity } from '../app.entity';
import { Invoice } from '../invoice/invoice.entity';

export type PaymentSignatureObject = { invoiceUuid: UuidString } & Pick<
  Payment,
  'amount' | 'payerUuid' | 'currency' | 'transactionId' | 'fullName' | 'code'
>;

export type Secure3dData = {
  redirectUri: URIString;
};

@Entity({ name: 'payment' })
export class Payment extends AppEntity {
  @Column('uuid')
  payerUuid: UuidString;

  @Column({ type: 'double precision', nullable: true })
  transactionId: UniqueIdNumber; // id транзакции платежной системы

  @Column('double precision')
  amount: PurchaseValueNumber;

  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @Column({ type: 'text', unique: true, select: false })
  signature: SignatureString;

  @Column({ type: 'enum', enum: PaymentStatus })
  status: PaymentStatus;

  @Column({ type: 'text', default: '', nullable: true })
  fullName: string;

  @Column({ type: 'text', default: '', nullable: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: ErrorString;

  @ManyToOne(() => Invoice)
  invoice: Invoice;
}
