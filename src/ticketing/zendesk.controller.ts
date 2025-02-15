import { Controller, Post, Body, Get, Param, Put } from '@nestjs/common';
import { ZendeskService } from './zendesk.service';
import { ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { CreateTicketDto } from 'src/users/dto/zendesk.dto';


@ApiTags('Zendesk')
@Controller('zendesk')
export class ZendeskController {
    constructor(private readonly zendeskService: ZendeskService) { }

    @Post('create-ticket')
    @ApiOperation({ summary: 'Create a new ticket' })
    async createTicket(@Body() createTicketDto: CreateTicketDto) {
        return this.zendeskService.createTicket(createTicketDto);
    }

    @Get('tickets/all')
    async getAllTickets() {
        return this.zendeskService.getAllTicketsWithUser();
    }

    @Get('tickets/:ticketId')
    async getTicket(@Param('ticketId') ticketId: string) {
        return this.zendeskService.getTicket(ticketId);
    }

    @Get('tickets/:ticketId/comments')
    async getTicketComments(@Param('ticketId') ticketId: string) {
        return this.zendeskService.getTicketComments(ticketId);
    }


}
