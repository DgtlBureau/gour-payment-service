import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IPaymentApiService } from '../@types/services-implementation';
import { PaymentCreateDto } from './dto/create.dto';
import { firstValueFrom } from 'rxjs';
import { PaymentApiResponseDto } from './dto/api-response.dto';

@Injectable()
export class PaymentApiService implements IPaymentApiService {
  constructor(private readonly httpService: HttpService) {}
  async createPayment(dto: PaymentCreateDto): Promise<PaymentApiResponseDto> {
    const res = await firstValueFrom(
      this.httpService.post<PaymentApiResponseDto>('/pay', dto),
    );
    return {
      paymentForm: res.data.paymentForm,
      paymentId: res.data.paymentId,
    };
  }
}
