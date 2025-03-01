import { Controller, Post, Query, Body, Get, Logger } from '@nestjs/common';
import { IpnService } from './transactions.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IpnNotification } from './transaction.types';

@Controller('ipn')
export class IpnController {
  private readonly logger = new Logger('IpnController');
  constructor(private readonly ipnService: IpnService) { }


  @Post()
  handleIpn(
    @Query('topic') topic: string,
    @Query('id') id: string,
    @Body() data: any,
  ) {
    console.log('Notificación IPN recibida - Topic:', topic, 'ID:', id, 'Data:', data);
    return this.ipnService.handleNotification({ topic, id, data });
  }

  @Post('mercadopago')
  @ApiOperation({ summary: 'Recibir notificación IPN de Mercado Pago' })
  @ApiResponse({ status: 200, description: 'Notificación procesada correctamente' })
  async receiveMercadoPagoNotification(@Body() notification: IpnNotification) {
    this.logger.log(`Recibida notificación IPN de Mercado Pago: ${JSON.stringify(notification)}`);
    const result = await this.ipnService.handleNotification(notification);
    return result;
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Obtener todas las transacciones registradas' })
  @ApiResponse({ status: 200, description: 'Lista de transacciones' })
  getTransactions() {
    return this.ipnService.getTransactions();
  }
}