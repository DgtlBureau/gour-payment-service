import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PayDto } from './dto/pay.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @MessagePattern('pay')
  createInvoice(@Payload() dto: PayDto) {
    return this.paymentService.pay(dto);
  }
}
