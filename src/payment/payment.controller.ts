import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Check3dSecureDto } from './dto/check-3d-secure.dto';
import { PayDto } from './dto/pay.dto';
import { PaymentService } from './payment.service';
import { SBPDto } from './dto/SBP.dto';

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

  @MessagePattern('sbp-link')
  // @Get('sbp-link')
  getSBPQr(@Payload() dto: SBPDto) {
    return this.paymentService.getSBPQr(dto);
  }
}
