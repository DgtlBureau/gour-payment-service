import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { IInvoiceService } from '../@types/services-implementation';
import { InvoiceCreateDto } from './dto/create.dto';
import { Invoice, InvoiceSignatureObject } from './invoice.entity';
import { InvoiceStatus } from '../@types/statuses';
import { Currency } from '../@types/currency';
import { InjectValues } from '../@types/inject-values';
import { PaymentApiService } from 'payment/payment-api.service';
import { JwtService } from 'jwt/jwt.service';

@Injectable()
export class InvoiceService implements IInvoiceService {
  constructor(
    @Inject<InjectValues>('INVOICE_REPOSITORY')
    private invoiceRepository: Repository<Invoice>,
    private paymentApiService: PaymentApiService,
    private jwtService: JwtService,
  ) {}

  async create(dto: InvoiceCreateDto): Promise<Invoice> {
    const invoiceSignatureObject: InvoiceSignatureObject = {
      ...dto,
    };

    const signature = this.sign(invoiceSignatureObject);

    try {
      const { paymentForm, paymentId } =
        await this.paymentApiService.createPayment({
          ...invoiceSignatureObject,
          signature,
        });

      const invoice = await this.invoiceRepository.save({
        ...invoiceSignatureObject,
        paymentFormHtml: paymentForm,
        signature,
      });

      return invoice;
    } catch (error) {
      throw new BadRequestException(error, 'Произошла ошибка при оплате');
    }
  }

  updateStatus(status: InvoiceStatus): Promise<Invoice> {
    throw new Error('Method not implemented.');
  }

  changeAmount(amount: number, currency: Currency): Promise<Invoice> {
    throw new Error('Method not implemented.');
  }

  sign(invoice: InvoiceSignatureObject): SignatureString {
    return this.jwtService.sign(invoice);
  }

  verifySign(signature: string): boolean {
    try {
      this.jwtService.verify(signature);
      return true;
    } catch (e) {
      return false;
    }
  }
}
