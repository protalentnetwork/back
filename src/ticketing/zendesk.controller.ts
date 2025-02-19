import { Controller, Post, Body, Get, Param, Put, Query, Delete } from '@nestjs/common';
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

    @Get('chat/chats')
    @ApiOperation({ summary: 'List all chats' })
    @ApiResponse({ type: [ChatConversationResponseDto] })
    async getAllChats() {
        return this.zendeskService.getChats();
    }

    @Get('chat/chats/search')
    @ApiOperation({ summary: 'Search chats' })
    @ApiResponse({ type: [ChatConversationResponseDto] })
    async searchChats(@Query('q') query: string) {
        return this.zendeskService.searchChats(query);
    }

    @Get('chat/chats/:chatId')
    @ApiOperation({ summary: 'Show chat by ID' })
    @ApiResponse({ type: ChatConversationResponseDto })
    async getChat(@Param('chatId') chatId: string) {
        return this.zendeskService.getChat(chatId);
    }

    @Post('chat/chats')
    @ApiOperation({ summary: 'Create offline message' })
    @ApiBody({ type: ChatMessageDto })
    @ApiResponse({ type: ChatConversationResponseDto })
    async createOfflineMessage(@Body() messageDto: ChatMessageDto) {
        return this.zendeskService.createOfflineMessage(messageDto);
    }

    @Put('chat/chats/:chatId')
    @ApiOperation({ summary: 'Update chat' })
    @ApiResponse({ type: ChatConversationResponseDto })
    async updateChat(
        @Param('chatId') chatId: string,
        @Body() updateData: any
    ) {
        return this.zendeskService.updateChat(chatId, updateData);
    }

    @Delete('chat/chats/:chatId')
    @ApiOperation({ summary: 'Delete chat' })
    async deleteChat(@Param('chatId') chatId: string) {
        return this.zendeskService.deleteChat(chatId);
    }

    @Delete('chat/chats')
    @ApiOperation({ summary: 'Bulk delete chats' })
    async bulkDeleteChats(@Query('ids') ids: string) {
        return this.zendeskService.bulkDeleteChats(ids);
    }
}
