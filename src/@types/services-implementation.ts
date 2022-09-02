import { PaymentApiResponseDto } from 'payment/dto/api-response.dto';
import { InvoiceCreateDto } from '../invoice/dto/create.dto';
import { Invoice } from '../invoice/invoice.entity';
import { PaymentCreateDto } from '../payment/dto/create.dto';
import { Payment } from '../payment/payment.entity';
import { Currency } from './currency';
import { InvoiceStatus, PaymentStatus } from './statuses';

export interface IInvoiceService {
  create(dto: InvoiceCreateDto): Promise<Invoice>;
  updateStatus(status: InvoiceStatus): Promise<Invoice>;
  changeAmount(
    amount: AmountOfGoodsNumber,
    currency: Currency,
  ): Promise<Invoice>;
  sign(invoice: Invoice): SignatureString;
  verifySign(signature: SignatureString): boolean;
}

export interface IPaymentService {
  create(dto: PaymentCreateDto): Promise<Payment>;
  updateStatus(status: PaymentStatus): Promise<Payment>;
  sign(invoice: Payment): SignatureString;
  verifySign(signature: SignatureString): boolean;
}

export interface IJwtService {
  sign(payload: Record<string, unknown>): SignatureString;
  verify(signature: SignatureString): boolean;
}
export interface IPaymentApiService {
  createPayment(dto: PaymentCreateDto): Promise<PaymentApiResponseDto>;
}
