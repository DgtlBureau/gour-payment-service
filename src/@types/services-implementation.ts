import { PaymentApiCreateDto } from 'payment/dto/api-create.dto';
import { PaymentCreateDto } from 'payment/dto/create.dto';
import { PayDto } from 'payment/dto/pay.dto';
import { PaymentCreateResponseDto } from 'payment/dto/response.dto';
import { InvoiceCreateDto } from '../invoice/dto/create.dto';
import { Invoice } from '../invoice/invoice.entity';
import {
  Payment,
  PaymentSignatureObject,
  Secure3dData,
} from '../payment/payment.entity';
import { InvoiceStatus, PaymentStatus } from './statuses';

export interface IInvoiceService {
  create(dto: InvoiceCreateDto): Promise<Invoice>;
  updateStatus(uuid: UuidString, status: InvoiceStatus): Promise<Invoice>;
  sign(invoice: Invoice): SignatureString;
  verifySign(signature: SignatureString): boolean;
}

export interface IPaymentService {
  create(dto: PaymentCreateDto): Promise<Payment>;
  pay(dto: PayDto): unknown;
  updateStatus(status: PaymentStatus): Promise<Payment>;
  sign(invoice: PaymentSignatureObject): SignatureString;
  verifySign(signature: SignatureString): boolean;
}

export interface IJwtService {
  sign(payload: Record<string, unknown>): SignatureString;
  verify(signature: SignatureString): boolean;
}
export interface IPaymentApiService {
  createPayment(dto: PaymentApiCreateDto): Promise<PaymentCreateResponseDto>;
}
