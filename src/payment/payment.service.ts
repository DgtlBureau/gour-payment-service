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
import { Invoice, InvoiceWith3dSecure } from 'invoice/invoice.entity';
import { InvoiceService } from 'invoice/invoice.service';
import { PayDto } from './dto/pay.dto';
import { PaymentApiService } from './payment-api.service';
import { Check3dSecureDto } from './dto/check-3d-secure.dto';
import { ConfigService } from '@nestjs/config';
import { Currency } from '../@types/currency';

@Injectable()
export class PaymentService implements IPaymentService {
  constructor(
    @Inject<InjectValues>('PAYMENT_REPOSITORY')
    private paymentRepository: Repository<Payment>,
    private jwtService: JwtService,
    private invoiceService: InvoiceService,
    private paymentApiService: PaymentApiService,
    private configService: ConfigService,
  ) {}

  logger = new Logger('PaymentLogger');

  async getOne(transactionId: UniqueIdNumber): Promise<Payment> {
    return this.paymentRepository.findOne({
      where: { transactionId },
      relations: ['invoice'],
    });
  }

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

  async pay(dto: PayDto) {
    const invoice = await this.invoiceService.getOne(dto.invoiceUuid);
    // const dto = {
    //   invoiceUuid: 'sadsad',
    //   payerUuid: '412',
    //   email: 'gagelj@mail.ru',
    //   signature: 'eyJUeXBlIjoiQ2xvdWRDYXJkIiwiQnJvd3NlckluZm9CYXNlNjQiOiJleUpCWTJObGNIUklaV0ZrWlhJaU9pSXFMeW9pTENKS1lYWmhSVzVoWW14bFpDSTZabUZzYzJVc0lrcGhkbUZUWTNKcGNIUkZibUZpYkdWa0lqcDBjblZsTENKTVlXNW5kV0ZuWlNJNkltVnVMVlZUSWl3aVEyOXNiM0pFWlhCMGFDSTZJak13SWl3aVNHVnBaMmgwSWpvaU9UQXdJaXdpVjJsa2RHZ2lPaUl4TkRRd0lpd2lWR2x0WlZwdmJtVWlPaUl0TWpRd0lpd2lWWE5sY2tGblpXNTBJam9pVFc5NmFXeHNZUzgxTGpBZ0tFMWhZMmx1ZEc5emFEc2dTVzUwWld3Z1RXRmpJRTlUSUZnZ01UQXVNVFU3SUhKMk9qRXdPQzR3S1NCSFpXTnJieTh5TURFd01ERXdNU0JHYVhKbFptOTRMekV3T0M0d0luMD0iLCJGb3JtYXQiOjEsIkNhcmRJbmZvIjp7IkZpcnN0U2l4RGlnaXRzIjoiMjIwMjIwIiwiTGFzdEZvdXJEaWdpdHMiOiI3MzY5IiwiRXhwRGF0ZVllYXIiOiIyNCIsIkV4cERhdGVNb250aCI6IjAxIn0sIktleVZlcnNpb24iOiIyIiwiVmFsdWUiOiJnRC9zUUNQOHpDSEFZTjhMWm12WEZENitOemNkK2hUdFI5aDZSZUY2N0ljWTZ5MUF4aHY5cS84UHRsbWJDWGVBVEl4ODdESzFWeDhmcDdLUEZNWjg3VGdQakxpanZubWdIckJGczBjRW1DN0wzK2xkUHRScUFDamRFcndZbVJYWk1nTTR5cm9wUkZXT1VsbmRHWDZGcVFENGE1SzZYUnk5K1dPZXhUUE41bWlodVp4eFc2djdhT1hNZzRzbDc3d1NRcFM4MzNERXNINzl1VzU5bEVvbVVTY21oVStWdVpvWWVteElJUUxVYWExN1NRcml2QzE4WTlscWdxOG5JTlJBaTdJczN2dmhXWU1Kd2h5YUliOEZ4NVkyZlJhVzR2MW01a1FKZm8wb050VTlGbnpnN0F5TVcvOEtacFVEc0x2TjdnV1ZoSjdMbktpUWthdVBldSt0THc9PSJ9',
    //   currency: Currency.RUB,
    //   ipAddress: '127.0.0.1',
    // };

    // const invoice = {
    //   signature: 'test',
    //   status: InvoiceStatus.WAITING,
    //   value: 50,
    //   uuid: 'f6a16ff7-4a31-11eb-be7b-8344edc8f36b',
    // };

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

    const receipt = {
      cloudpayments: {
        Items: [{
          label: 'Пополнение личного кабинета',
          price: invoice.value,
          quantity: 1.00,
          amount: invoice.value,
          vat: 0,
          measurementUnit: 'шт',
        }],
        calculatePlace: 'https://tastyoleg.com',
        taxationSystem: 0,
        email: dto.email,
        phone: '',
        customerInfo: '',
        isBio: false,
        agentSign: null,
      },
    };

    try {
      const apiTsx = await this.paymentApiService.createPayment({
        Amount: invoice.value,
        InvoiceId: invoice.uuid,
        payerUuid: dto.payerUuid,
        Email: dto.email || '',
        CardCryptogramPacket: dto.signature,
        Currency: dto.currency,
        IpAddress: dto.ipAddress,
        Description: 'Пополнение личного кабинета',
        JsonData: JSON.stringify(receipt),
      });

      if (apiTsx.errorMessage) this.logger.error(apiTsx.errorMessage);
      const logType = apiTsx.success ? 'log' : 'error';
      this.logger[logType]('Новая транзакция в сервисе оплаты: ', apiTsx);

      const paymentData = {
        invoice,
        transactionId: apiTsx.transactionId || null,
        errorMessage: apiTsx.errorMessage || null,
        currency: dto.currency,
        amount: invoice.value,
        payerUuid: dto.payerUuid,
      };

      const redirectUrl = `${this.configService.get(
        'FINISH_3D_SECURE_URL',
      )}?successUrl=${dto.successUrl}&rejectUrl=${dto.rejectUrl}`;

      if (apiTsx.acsUrl) {
        const payment3d = await this.create({
          ...paymentData,
          status: PaymentStatus.INIT,
        });

        await this.invoiceService.update(invoice.uuid, {
          status: InvoiceStatus.WAITING,
        });

        this.logger.log(`Создана оплата по 3d-secure с uuid ${payment3d.uuid}`);

        return {
          MD: apiTsx.transactionId,
          PaReq: apiTsx.paReq,
          TermUrl: redirectUrl,
          acsUrl: apiTsx.acsUrl,
        };
      }

      const payment = await this.create({
        ...paymentData,
        status: apiTsx.success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
      });

      await this.invoiceService.update(invoice.uuid, {
        status: apiTsx.success ? InvoiceStatus.PAID : InvoiceStatus.FAILED,
      });

      this.logger.log(`Создана оплата без 3d-secure с uuid ${payment.uuid}`);

      return this.invoiceService.getOne(invoice.uuid);
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'неизвестная ошибка',
        error,
      );
    }
  }

  async check3dSecureAndFinishPay({
    code,
    successUrl,
    rejectUrl,
    transactionId: tsxId,
  }: Check3dSecureDto): Promise<{ redirect: URIString }> {
    const candidatePayment = await this.getOne(tsxId);
    const invoice = candidatePayment.invoice;

    if (!candidatePayment) {
      this.logger.error(`Транзакции с id ${tsxId} не найден`);
      throw new NotFoundException(`Транзакции не существует`);
    }

    if (!invoice) {
      this.logger.error(`Счет с id транзакции ${tsxId} не найден`);
      throw new NotFoundException(`Счета не существует`);
    }

    if (!this.invoiceService.verifySign(invoice.signature)) {
      throw new ForbiddenException('Ошибка проверки подлинности счета');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      this.logger.error(`Счет с id транзакции ${tsxId} не принимает платежи`);
      throw new BadRequestException('Счет больше не принимает платежи');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      this.logger.error(`Счет с id транзакции ${tsxId} уже оплачен`);
      throw new BadRequestException('Счет уже оплачен');
    }

    try {
      const apiTsx = await this.paymentApiService.finish3dSecure({
        TransactionId: String(tsxId),
        PaRes: code,
      });

      const updatedPayment = await this.paymentRepository.save({
        uuid: candidatePayment.uuid,
        status: apiTsx.success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
      });

      await this.invoiceService.update(invoice.uuid, {
        status: apiTsx.success ? InvoiceStatus.PAID : InvoiceStatus.FAILED,
      });

      this.logger.log(`Оплата с uuid ${updatedPayment.uuid} обновлена`);

      return {
        redirect: apiTsx.success ? successUrl : rejectUrl,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'неизвестная ошибка',
        error,
      );
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
