import { IsNumber, IsString } from 'class-validator';

export class PaymentApiResponseDto {
  @IsString()
  paymentForm: HTMLString;

  @IsNumber()
  paymentId: UniqueIdNumber;
}
