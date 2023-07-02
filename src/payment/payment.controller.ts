import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Check3dSecureDto } from './dto/check-3d-secure.dto';
import { PayDto } from './dto/pay.dto';
import { PaymentService } from './payment.service';
import { SBPDto } from './dto/SBP.dto';
import { ExportDto } from './dto/export.dto';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @MessagePattern('pay')
  pay(@Payload() dto: PayDto) {
    return this.paymentService.pay(dto);
  }

  @MessagePattern('success-payments')
  successPayments(@Payload() dto: ExportDto) {
    return this.paymentService.getSuccessPayments(dto);
  }

  @MessagePattern('check-3d-secure-and-finish-pay')
  check3dSecure(@Payload() dto: Check3dSecureDto) {
    return this.paymentService.check3dSecureAndFinishPay(dto);
  }

  @MessagePattern('sbp-link')
  getSBPQr(@Payload() dto: SBPDto) {
    return this.paymentService.getSBPQr(dto);
  }

  @MessagePattern('sbp-check')
  // @Get('sbp-link')
  checkSBPPaymentStatus(dto: { transactionId: number; email: string }) {
    return this.paymentService.checkSBPPaymentStatus(
      dto.transactionId,
      dto.email,
    );
  }
}
