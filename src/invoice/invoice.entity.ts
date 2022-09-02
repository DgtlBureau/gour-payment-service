import { Entity, Column, OneToMany, BeforeInsert } from 'typeorm';
import { Currency } from '../@types/currency';
import { InvoiceStatus } from '../@types/statuses';
import { AppEntity } from '../app.entity';
import { AppConfigService } from '../app.module';

import { Payment } from '../payment/payment.entity';

export type InvoiceSignatureObject = Pick<
  Invoice,
  | 'amount'
  | 'currency'
  | 'payerUuid'
  | 'value'
  | 'callbackRejectUrl'
  | 'callbackSuccessUrl'
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

  @Column({ type: 'varchar', unique: true })
  signature: SignatureString;

  @Column({ type: 'enum', enum: InvoiceStatus })
  status: InvoiceStatus;

  @Column('varchar')
  paymentFormHtml: HTMLString;

  @Column('varchar')
  callbackSuccessUrl: URIString;

  @Column('varchar')
  callbackRejectUrl: URIString;

  @OneToMany(() => Payment, (p) => p.invoice)
  payments: Payment[];

  @Column('date')
  expiresAt: Date;

  @BeforeInsert()
  beforeInsert() {
    //FIXME:
    const currentTime = new Date();
    currentTime.setMinutes(
      currentTime.getMinutes() +
        new AppConfigService().get('SIGNATURE_SECRET_KEY_EXP'),
    );
    this.expiresAt = currentTime;
  }
}
