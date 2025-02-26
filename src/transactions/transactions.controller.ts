import { Controller, Post, Body, Query } from '@nestjs/common';
import { IpnService } from './transactions.service';

@Controller('ipn')
export class IpnController {
  constructor(private readonly ipnService: IpnService) {}

  @Post()
  handleIpn(
    @Query('topic') topic: string,
    @Query('id') id: string,
    @Body() data: any,
  ) {
    console.log('Notificación IPN recibida - Topic:', topic, 'ID:', id, 'Data:', data);
    return this.ipnService.handleNotification({ topic, id, data });
  }
}