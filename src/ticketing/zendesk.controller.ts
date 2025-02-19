import { Controller, Post, Body, Get, Param, Put } from '@nestjs/common';
import { ZendeskService } from './zendesk.service';
import { ApiOperation, ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateTicketDto, ChangeTicketStatusDto, AssignTicketDto, TicketResponseDto, CommentResponseDto, UserResponseDto, GroupMembershipResponseDto, ChatMessageResponseDto, ChatMessageDto, ChatConversationResponseDto } from './dto/zendesk.dto';

@ApiTags('Zendesk')
@Controller('zendesk')
export class ZendeskController {
    constructor(private readonly zendeskService: ZendeskService) { }

    @Post('create-ticket')
    @ApiOperation({ summary: 'Create a new ticket' })
    @ApiResponse({ type: TicketResponseDto })
    async createTicket(@Body() createTicketDto: CreateTicketDto) {
        return this.zendeskService.createTicket(createTicketDto);
    }

    @Get('agents')
    @ApiOperation({ summary: 'Get all Zendesk agents' })
    @ApiResponse({ type: [UserResponseDto] })
    async getAllAgents() {
        return this.zendeskService.getAllAgents();
    }

    @Get('users')
    @ApiOperation({ summary: 'Get all Zendesk users' })
    @ApiResponse({ type: [UserResponseDto] })
    async getAllUsers() {
        return this.zendeskService.getAllUsers();
    }
    
    @Get('tickets/any-status-tickets')
    @ApiOperation({ summary: 'Get all tickets with any status' })
    @ApiResponse({ type: [TicketResponseDto] })
    async getAllTicketsWithAnyStatus() {
        return this.zendeskService.getAllTickets();
    }

    @Get('tickets/all')
    @ApiOperation({ summary: 'Get all tickets with user information' })
    @ApiResponse({ type: [TicketResponseDto] })
    async getAllTickets() {
        return this.zendeskService.getAllTicketsWithUser();
    }

    @Get('tickets/:ticketId')
    @ApiOperation({ summary: 'Get a ticket by ID' })
    @ApiResponse({ type: TicketResponseDto })
    async getTicket(@Param('ticketId') ticketId: string) {
        return this.zendeskService.getTicket(ticketId);
    }

    @Get('tickets/:ticketId/comments')
    @ApiOperation({ summary: 'Get the comments of a ticket' })
    @ApiResponse({ type: [CommentResponseDto] })
    async getTicketComments(@Param('ticketId') ticketId: string) {
        return this.zendeskService.getTicketComments(ticketId);
    }

    @Put('tickets/:ticketId/status')
    @ApiOperation({ summary: 'Change the status of a ticket' })
    @ApiResponse({ type: TicketResponseDto })
    async changeTicketStatus(
        @Param('ticketId') ticketId: string,
        @Body() statusDto: ChangeTicketStatusDto
    ) {
        return this.zendeskService.changeTicketStatus(ticketId, statusDto.status);
    }

    @Put('tickets/:ticketId/assign')
    @ApiOperation({ summary: 'Assign a ticket to an agent' })
    @ApiResponse({ type: TicketResponseDto })
    async assignTicket(
        @Param('ticketId') ticketId: string,
        @Body() assignDto: AssignTicketDto
    ) {
        return this.zendeskService.asignTicket(ticketId, assignDto.userId);
    }

    @Get('agents/groups')
    @ApiOperation({ summary: 'Get all agents with their group memberships' })
    @ApiResponse({ type: [GroupMembershipResponseDto] })
    async getAgentsWithGroups() {
        return this.zendeskService.getAgentsWithGroups();
    }

    @Get('chats/active')
    @ApiOperation({ summary: 'Get all active chats' })
    @ApiResponse({ type: [ChatConversationResponseDto] })
    async getActiveChats() {
        return this.zendeskService.getActiveChats();
    }

    @Get('chats/:chatId/messages')
    @ApiOperation({ summary: 'Get messages from a specific chat' })
    @ApiResponse({ type: [ChatMessageResponseDto] })
    async getChatMessages(@Param('chatId') chatId: string) {
        return this.zendeskService.getChatMessages(chatId);
    }

    @Post('chats/:chatId/messages')
    @ApiOperation({ summary: 'Send a message to a chat' })
    @ApiBody({ type: ChatMessageDto })
    @ApiResponse({ type: ChatMessageResponseDto })
    async sendChatMessage(
        @Param('chatId') chatId: string,
        @Body() messageDto: ChatMessageDto
    ) {
        return this.zendeskService.sendMessage(chatId, messageDto.message);
    }
}
