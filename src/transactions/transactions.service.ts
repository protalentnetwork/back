import { Injectable } from '@nestjs/common';

@Injectable()
export class IpnService {
  handleNotification(data: any) {
    console.log('Procesando notificación IPN:', data);
    // Aquí puedes agregar lógica como:
    // - Validar la firma de Mercado Pago
    // - Guardar los datos en una base de datos
    // - Enviar datos al frontend (por ejemplo, vía WebSocket o API)
    return { status: 'success', message: 'Notificación procesada correctamente' };
  }
}