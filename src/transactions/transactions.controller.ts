import { Controller, Post, Body } from '@nestjs/common';
import { IpnService } from './transactions.service';

@Controller('ipn')
export class IpnController {
  constructor(private readonly ipnService: IpnService) {}

  @Post()
  handleIpn(@Body() data: any) {
    return this.ipnService.handleNotification(data);
  }
}