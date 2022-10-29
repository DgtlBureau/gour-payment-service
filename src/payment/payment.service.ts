import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectValues } from '../@types/inject-values';
import { Repository } from 'typeorm';
import { InvoiceStatus, PaymentStatus } from '../@types/statuses';
import { IPaymentService } from '../@types/services-implementation';
import { Payment, PaymentSignatureObject } from './payment.entity';
import { PaymentCreateDto } from './dto/create.dto';
import { JwtService } from 'jwt/jwt.service';
import { Invoice } from 'invoice/invoice.entity';
import { InvoiceService } from 'invoice/invoice.service';
import { PayDto } from './dto/pay.dto';
import { PaymentApiService } from './payment-api.service';

@Injectable()
export class PaymentService implements IPaymentService {
  constructor(
    @Inject<InjectValues>('PAYMENT_REPOSITORY')
    private paymentRepository: Repository<Payment>,
    private jwtService: JwtService,
    private invoiceService: InvoiceService,
    private paymentApiService: PaymentApiService,
  ) {}

  logger = new Logger('PaymentLogger');

  create(dto: PaymentCreateDto): Promise<Payment> {
    const paymentSignatureObject: PaymentSignatureObject = {
      amount: dto.amount,
      currency: dto.currency,
      payerUuid: dto.payerUuid,
      transactionId: dto.transactionId,
      invoiceUuid: dto.invoice.uuid,
    };

    const signature = this.sign(paymentSignatureObject);

    return this.paymentRepository.save({ ...dto, signature });
  }

  async pay(dto: PayDto): Promise<Invoice> {
    const invoice = await this.invoiceService.getOne(dto.invoiceUuid);

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException(
        'Счет закрыт, он больше не принимает платежи',
      );
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Счет уже был оплачен');
    }

    if (!invoice) {
      throw new NotFoundException(
        `Счета с uuid ${dto.invoiceUuid} не существует`,
      );
    }

    const apiTsx = await this.paymentApiService.createPayment({
      Amount: invoice.value,
      CardCryptogramPacket: dto.signature,
      Currency: dto.currency,
      Email: dto.email,
      IpAddress: dto.ipAddress,
      InvoiceId: invoice.uuid,
      payerUuid: dto.payerUuid,
    });

    if (apiTsx.errorMessage) this.logger.error(apiTsx.errorMessage);
    if (apiTsx) this.logger.error('Новая транзакция: ', apiTsx);

    const payment = await this.create({
      invoice,
      transactionId: apiTsx.transactionId || null,
      currency: dto.currency,
      status: apiTsx.success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
      amount: invoice.value,
      payerUuid: dto.payerUuid,
    });

    const updatedInvoice = await this.invoiceService.update(invoice.uuid, {
      status: apiTsx.success ? InvoiceStatus.PAID : InvoiceStatus.FAILED,
    });

    this.logger.log(`Создана оплата с uuid ${payment.uuid}`);

    return updatedInvoice;
  }

  updateStatus(status: PaymentStatus): Promise<Payment> {
    throw new Error('Method not implemented.');
  }

  sign(signatureObject: PaymentSignatureObject): SignatureString {
    return this.jwtService.sign(signatureObject);
  }

  verifySign(signature: string): boolean {
    throw new Error('Method not implemented.');
  }
}
