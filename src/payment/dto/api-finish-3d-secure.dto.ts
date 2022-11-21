import { IsString } from 'class-validator';
export class PaymentApiFinish3dSecureDto {
  @IsString()
  TransactionId: string;

  @IsString()
  PaRes: string; // 3d secure code
}
