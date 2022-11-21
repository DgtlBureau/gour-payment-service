import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { IInvoiceService } from '../@types/services-implementation';
import { InvoiceCreateDto } from './dto/create.dto';
import { Invoice, InvoiceSignatureObject } from './invoice.entity';
import { InvoiceStatus } from '../@types/statuses';
import { InjectValues } from '../@types/inject-values';
import { JwtService } from 'jwt/jwt.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvoiceService implements IInvoiceService {
  constructor(
    @Inject<InjectValues>('INVOICE_REPOSITORY')
    private invoiceRepository: Repository<Invoice>,
    private jwtService: JwtService,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService,
  ) {}

  logger = new Logger('InvoiceLogger');

  async create(dto: InvoiceCreateDto): Promise<Invoice> {
    const invoiceExpMin = +this.configService.get('SIGNATURE_SECRET_KEY_EXP');

    const candidateInvoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.expiresAt >= :currentDate', {
        currentDate: new Date().toUTCString(),
      })
      .andWhere('invoice.payerUuid = :payerUuid', { payerUuid: dto.payerUuid })
      .andWhere('invoice.status != :status', { status: InvoiceStatus.PAID })
      .getOne();

    const invoiceSignatureObject: InvoiceSignatureObject = {
      ...dto,
    };

    const signature = this.sign(invoiceSignatureObject);

    if (candidateInvoice && !this.verifySign(candidateInvoice.signature)) {
      throw new ForbiddenException('Ошибка проверки подлинности инвойса');
    }

    if (candidateInvoice && this.verifySign(candidateInvoice.signature)) {
      return this.invoiceRepository.save({
        uuid: candidateInvoice.uuid,
        ...dto,
        signature,
      });
    }

    const invoiceExpiresAt = new Date();
    invoiceExpiresAt.setMinutes(invoiceExpiresAt.getMinutes() + invoiceExpMin);

    const invoice = await this.invoiceRepository.save({
      ...invoiceSignatureObject,
      signature,
      status: InvoiceStatus.WAITING,
      expiresAt: invoiceExpiresAt,
    });

    const cancelInvoice = async () => {
      const currentInvoice = await this.getOne(invoice.uuid);
      if (currentInvoice.status !== InvoiceStatus.PAID) {
        await this.updateStatus(invoice.uuid, InvoiceStatus.CANCELLED);
      }
      this.schedulerRegistry.deleteTimeout(invoice.uuid);
    };

    const expiresMilliseconds = invoiceExpMin * 60 * 1000;
    const timeout = setTimeout(cancelInvoice, expiresMilliseconds);
    this.schedulerRegistry.addTimeout(invoice.uuid, timeout);

    this.logger.log(`Создан новый счет ${invoice.uuid}`);

    return invoice;
  }

  async getOne(uuid: UuidString): Promise<Invoice> {
    return this.invoiceRepository.findOne({
      where: { uuid },
      relations: ['payments'],
    });
  }

  async getMany(payerUuid: UuidString): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { payerUuid },
    });
  }

  async update(uuid: UuidString, values: Partial<Invoice>): Promise<Invoice> {
    return this.invoiceRepository.save({ uuid, ...values });
  }

  updateStatus(uuid: UuidString, status: InvoiceStatus): Promise<Invoice> {
    return this.invoiceRepository.save({
      uuid,
      status,
    });
  }

  sign(invoice: InvoiceSignatureObject): SignatureString {
    return this.jwtService.sign(invoice);
  }

  verifySign(signature: SignatureString): boolean {
    try {
      this.jwtService.verify(signature);
      return true;
    } catch (e) {
      return false;
    }
  }
}
