import { IsString, IsNumber } from 'class-validator';

export class SBPResponseDto {
  @IsString()
  qrUrl: string;

  @IsString()
  qrImage: string;

  @IsNumber()
  transactionId: number;

  @IsNumber()
  providerQrId: number;

  @IsNumber()
  amount: number;

  @IsString()
  message: string;
}
