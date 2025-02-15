import { ApiProperty } from "@nestjs/swagger";

export class CreateTicketDto {
    @ApiProperty({
        description: 'Asunto del ticket',
        example: 'Problema con mi pedido'
    })
    subject: string;

    @ApiProperty({
        description: 'Descripción del ticket',
        example: 'No he recibido mi pedido #12345 que realicé hace 3 días'
    })
    description: string;

    @ApiProperty({
        description: 'Email del cliente',
        example: 'cliente@ejemplo.com'
    })
    email: string;
}
