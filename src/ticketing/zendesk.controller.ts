import { Controller, Post, Body, Get } from '@nestjs/common';
import { ZendeskService } from './zendesk.service';

@Controller('zendesk')
export class ZendeskController {
    constructor(private readonly zendeskService: ZendeskService) { }

    @Get('tickets/open')
    async getOpenTickets() {
        return this.zendeskService.getOpenTickets();
    }

    @Post('create-ticket')
    async createTicket(
        @Body('subject') subject: string,
        @Body('description') description: string,
        @Body('email') email: string,
    ) {
        return this.zendeskService.createTicket(subject, description, email);
    }
}
