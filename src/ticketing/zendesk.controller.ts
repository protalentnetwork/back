import { Controller, Post, Body, Get, Param, Put, Query, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ZendeskService } from './zendesk.service';
import { ApiOperation, ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateTicketDto, ChangeTicketStatusDto, AssignTicketDto, TicketResponseDto, CommentResponseDto, UserResponseDto, GroupMembershipResponseDto, ChatMessageResponseDto, ChatMessageDto, ChatConversationResponseDto, CreateAgentDto } from './dto/zendesk.dto';
import { ApiKeyAuth } from '../auth/apikeys/decorators/api-key-auth.decorator';
import { API_PERMISSIONS } from '../auth/apikeys/permissions.constants';

@ApiTags('Zendesk')
@Controller('zendesk')
export class ZendeskController {
    logger: any;
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

    @Post('contributors')
    async createContributor(@Body() createContributorDto: {
        name: string;
        email: string;
        group_id?: number;
    }) {
        try {
            return await this.zendeskService.createContributor({
                name: createContributorDto.name,
                email: createContributorDto.email,
                group_id: createContributorDto.group_id
            });
        } catch (error) {
            throw new HttpException(
                `Failed to create contributor: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('team-members')
    async createTeamMember(@Body() createTeamMemberDto: any) {
        try {
            // Primero, verificar los límites de la cuenta
            const limits = await this.zendeskService.checkAccountLimits();

            // Si hay una recomendación específica, registrarla
            if (limits.recommendedAction) {
                this.logger.log(`Account limits check: ${limits.recommendedAction}`);
            }

            // Crear el miembro del equipo usando el nuevo método
            return await this.zendeskService.createTeamMember({
                name: createTeamMemberDto.name,
                email: createTeamMemberDto.email,
                group_id: createTeamMemberDto.group_id
            });
        } catch (error) {
            throw new HttpException(
                `Failed to create team member: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
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

    @Post('tickets/:ticketId/comments')
    async addTicketComment(
        @Param('ticketId') ticketId: string,
        @Body('comment') comment: string,
        @Body('authorId') authorId: string,
    ) {
        return this.zendeskService.addTicketComment(ticketId, comment, authorId);
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
}