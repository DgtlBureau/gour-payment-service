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
import axios from 'axios';
import { SBPDto, UserAgent } from './dto/SBP.dto';
import { SBPResponseDto } from './dto/SBP-response.dto';

@Injectable()
export class PaymentService implements IPaymentService {
  private emails = {};

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

  async sendReceipt(invoice: Invoice, email: string) {
    const receipt = {
      CustomerReceipt: {
        Items: [{
          label: 'Пополнение личного кабинета',
          price: invoice.value,
          quantity: 1.00,
          amount: invoice.value,
          vat: 0,
          measurementUnit: 'шт',
        }],
        calculatePlace: 'https://tastyoleg.com',
        taxationSystem: 1,
        email,
        phone: '',
        customerInfo: '',
        isBio: false,
        agentSign: null,
      },
    };

    const publicId = process.env.PAYMENT_SERVICE_LOGIN;
    const apiSecret = process.env.PAYMENT_SERVICE_API_KEY;

    // sending a check
    await axios.post(
      'https://api.cloudpayments.ru/kkt/receipt',
      {
        Inn: 325400286523,
        Type: 'Income',
        CustomerReceipt: receipt.CustomerReceipt,
        InvoiceId: invoice.uuid,
      },
      {
        auth: {
          username: publicId,
          password: apiSecret,
        },
      },
    );
  }

  async pay(dto: PayDto) {
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
        Email: dto.email || '',
        CardCryptogramPacket: dto.signature,
        Currency: dto.currency,
        IpAddress: dto.ipAddress,
        Description: 'Пополнение личного кабинета',
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
        this.emails[invoice.uuid] = dto.email;

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

      if (apiTsx.success) {
        await this.sendReceipt(invoice, dto.email);
      }

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

    const linkedInvoiceEmail = this.emails[invoice.uuid];
    delete this.emails[invoice.uuid];

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

      if (apiTsx.success) {
        await this.sendReceipt(invoice, linkedInvoiceEmail);
      }

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

  async getSBPQr(dto: SBPDto): Promise<SBPResponseDto> {
    const isMobile = dto.userAgent === UserAgent.MOBILE;
    const SBPQrPrefix = isMobile ? 'link' : 'image';
    const apiPath = `https://api.cloudpayments.ru/payments/qr/sbp/${SBPQrPrefix}`;

    const publicId = process.env.PAYMENT_SERVICE_LOGIN;
    const apiSecret = process.env.PAYMENT_SERVICE_API_KEY;

    const SBPQrReqBody = {
      IpAddress: dto.ipAddress,
      Amount: dto.amount,
      Currency: dto.currency,
      Description: dto.description,
      AccountId: dto.payerUuid,
      InvoiceId: dto.invoiceUuid,
    };

    // const mock = {
    //   IpAddress: '127.0.0.1',
    //   Amount: 200,
    //   Currency: 'RUB',
    //   Description: '',
    //   AccountId: '724fe6dd-2060-40bf-be41-f03eb1b5bdb9',
    //   InvoiceId: '724fe6dd-2060-40bf-be41-f03eb1b5bdb1',
    // };

    const res = await axios.post(
      apiPath,
      SBPQrReqBody,
      {
      auth: {
        username: publicId,
        password: apiSecret,
      },
    });

    console.log(res.data);
    return res.data;
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
