import { Controller, Post, Body, Get, Param, Put, Query, Delete } from '@nestjs/common';
import { ZendeskService } from './zendesk.service';
import { ApiOperation, ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateTicketDto, ChangeTicketStatusDto, AssignTicketDto, TicketResponseDto, CommentResponseDto, UserResponseDto, GroupMembershipResponseDto, ChatMessageResponseDto, ChatMessageDto, ChatConversationResponseDto, CreateAgentDto } from './dto/zendesk.dto';
import { ApiKeyAuth } from '../auth/apikeys/decorators/api-key-auth.decorator';
import { API_PERMISSIONS } from '../auth/apikeys/permissions.constants';

@ApiTags('Zendesk')
@Controller('zendesk')
export class ZendeskController {
    constructor(private readonly zendeskService: ZendeskService) { }

    @Post('create-ticket')
    @ApiKeyAuth(API_PERMISSIONS.ZENDESK_CREATE_TICKET)
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

    @Post('new-agents')
    //@ApiKeyAuth(API_PERMISSIONS.ZENDESK_CREATE_AGENT) 
    @ApiOperation({ summary: 'Create a new Zendesk agent' })
    @ApiBody({ type: CreateAgentDto })
    @ApiResponse({ type: UserResponseDto })
    async createAgent(@Body() createAgentDto: CreateAgentDto) {
        return this.zendeskService.createAgent(createAgentDto);
    }

    @Delete('agents/:userId')
    //@ApiKeyAuth(API_PERMISSIONS.ZENDESK_DELETE_AGENT) // Nuevo permiso
    @ApiOperation({ summary: 'Delete a Zendesk agent by ID' })
    @ApiResponse({ status: 200, description: 'Agent deleted successfully', type: Object })
    async deleteAgent(@Param('userId') userId: string) {
        return this.zendeskService.deleteAgent(userId);
    }

    @Get('users')
    @ApiOperation({ summary: 'Get all Zendesk users' })
    @ApiResponse({ type: [UserResponseDto] })
    async getAllUsers() {
        return this.zendeskService.getAllUsers();
    }

    @Get('tickets/all')
    @ApiOperation({ summary: 'Get all tickets with user information' })
    @ApiResponse({ type: [TicketResponseDto] })
    async getAllTickets() {
        return this.zendeskService.getAllTickets();
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
    async getAllChats(): Promise<ChatConversationResponseDto[]> {
        try {
            return await this.zendeskService.getChats();
        } catch (error) {
            console.error("Error en getAllChats:", error);
            throw new Error('Failed to fetch chats');
        }
    }

    @Get('chat/chats/search')
    @ApiOperation({ summary: 'Search chats' })
    @ApiResponse({ type: [ChatConversationResponseDto] })
    async searchChats(@Query('q') query: string) {
        return this.zendeskService.searchChats(query);
    }

    @Post('chat/chats/:chatId/messages')
    @ApiOperation({ summary: 'Send a message in a chat' })
    @ApiBody({ type: ChatMessageDto })
    @ApiResponse({ type: ChatMessageResponseDto })
    async sendChatMessage(
        @Param('chatId') chatId: string,
        @Body() messageDto: ChatMessageDto
    ) {
        return this.zendeskService.sendChatMessage(chatId, messageDto.message);
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

    @Get('chat/conversations')
    @ApiOperation({ summary: 'Get all chat conversations' })
    @ApiResponse({ type: [ChatConversationResponseDto] })
    async getChatConversations() {
        try {
            return await this.zendeskService.getChatConversations();
        } catch (error) {
            console.error("Error en getChatConversations:", error);
            throw new Error('Failed to fetch chat conversations');
        }
    }

    @Post('chat/start-session')
    @ApiOperation({ summary: 'Start agent chat session' })
    async startAgentSession() {
        return this.zendeskService.startAgentSession();
    }

    @Get('start-chat')
    async startChatSubscription() {
        await this.zendeskService.startChatSubscription();
        return { message: 'Chat subscription started' };
    }

    @Post('send-message')
    async sendMessage(@Body() body: { chatId: string; message: string }) {
        await this.zendeskService.sendMessageViaWebSocket(body.chatId, body.message);
        return { message: 'Message sent' };
    }

    @Get('chats')
    getActiveChats() {
        return this.zendeskService.getActiveChatsViaGraphQL();
    }
}
