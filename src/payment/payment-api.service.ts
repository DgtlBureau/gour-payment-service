import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IPaymentApiService } from '../@types/services-implementation';
import { PaymentApiCreateDto } from './dto/api-create.dto';
import { firstValueFrom } from 'rxjs';
import { PaymentApiResponseDto } from './dto/api-response.dto';
import { PaymentCreateResponseDto } from './dto/response.dto';

@Injectable()
export class PaymentApiService implements IPaymentApiService {
  constructor(private readonly httpService: HttpService) {}
  async createPayment(
    dto: PaymentApiCreateDto,
  ): Promise<PaymentCreateResponseDto> {
    const { data } = await firstValueFrom(
      this.httpService.post<PaymentApiResponseDto>(
        '/payments/cards/charge',
        dto,
      ),
    );
    return {
      transactionId: data?.Model?.TransactionId,
      success: data.Success,
      errorMessage: data.Message,
    };
  }
}
