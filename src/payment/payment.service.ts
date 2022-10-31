import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
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

    if (!invoice) {
      this.logger.error(`Счета с uuid ${dto.invoiceUuid} не существует`);
      throw new NotFoundException(`Счета  не существует`);
    }

    if (!this.invoiceService.verifySign(invoice.signature)) {
      throw new ForbiddenException('Ошибка проверки подлинности счета');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      this.logger.error(`Счет с uuid ${dto.invoiceUuid} не принимает платежи`);
      throw new BadRequestException('Счет больше не принимает платежи');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      this.logger.error(`Счет с uuid ${dto.invoiceUuid} уже оплачен`);
      throw new BadRequestException('Счет уже оплачен');
    }

    try {
      const apiTsx = await this.paymentApiService.createPayment({
        Amount: invoice.value,
        InvoiceId: invoice.uuid,
        payerUuid: dto.payerUuid,
        Email: dto.email,
        CardCryptogramPacket: dto.signature,
        Currency: dto.currency,
        IpAddress: dto.ipAddress,
      });

      if (apiTsx.errorMessage) this.logger.error(apiTsx.errorMessage);
      const logType = apiTsx.success ? 'log' : 'error';
      this.logger[logType]('Новая транзакция в сервисе оплаты: ', apiTsx);

      const payment = await this.create({
        invoice,
        transactionId: apiTsx.transactionId || null,
        errorMessage: apiTsx.errorMessage || null,
        currency: dto.currency,
        status: apiTsx.success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
        amount: invoice.value,
        payerUuid: dto.payerUuid,
      });

      await this.invoiceService.update(invoice.uuid, {
        status: apiTsx.success ? InvoiceStatus.PAID : InvoiceStatus.FAILED,
      });

      this.logger.log(`Создана оплата с uuid ${payment.uuid}`);

      return this.invoiceService.getOne(invoice.uuid);
    } catch (error) {
      throw new InternalServerErrorException('Неизвестная ошибка', error);
    }
  }

  sign(signatureObject: PaymentSignatureObject): SignatureString {
    return this.jwtService.sign(signatureObject);
  }

  updateStatus(status: PaymentStatus): Promise<Payment> {
    throw new Error('Method not implemented.');
  }

  verifySign(signature: SignatureString): boolean {
    throw new Error('Method not implemented.');
  }
}
