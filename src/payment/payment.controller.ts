import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Check3dSecureDto } from './dto/check-3d-secure.dto';
import { PayDto } from './dto/pay.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @MessagePattern('pay')
  pay(@Payload() dto: PayDto) {
    return this.paymentService.pay(dto);
  }

  @MessagePattern('check-3d-secure-and-finish-pay')
  check3dSecure(@Payload() dto: Check3dSecureDto) {
    return this.paymentService.check3dSecureAndFinishPay(dto);
  }
}
