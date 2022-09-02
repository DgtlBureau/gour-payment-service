import { Inject, Injectable } from '@nestjs/common';
import { InjectValues } from '../@types/inject-values';
import { Repository } from 'typeorm';
import { PaymentStatus } from '../@types/statuses';
import { IPaymentService } from '../@types/services-implementation';
import { PaymentCreateDto } from './dto/create.dto';
import { Payment } from './payment.entity';

@Injectable()
export class PaymentService implements IPaymentService {
  constructor(
    @Inject<InjectValues>('PAYMENT_REPOSITORY')
    paymentRepository: Repository<Payment>,
  ) {}

  create(dto: PaymentCreateDto): Promise<Payment> {
    throw new Error('Method not implemented.');
  }
  updateStatus(status: PaymentStatus): Promise<Payment> {
    throw new Error('Method not implemented.');
  }
  sign(invoice: Payment): string {
    throw new Error('Method not implemented.');
  }
  verifySign(signature: string): boolean {
    throw new Error('Method not implemented.');
  }
}
