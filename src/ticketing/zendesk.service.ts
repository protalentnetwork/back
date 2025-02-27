import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { env } from 'process';
import { AxiosResponse } from 'axios';
import { CreateTicketDto, TicketResponseDto, CommentResponseDto, UserResponseDto, GroupMembershipResponseDto, ChatMessageResponseDto, ChatConversationResponseDto, ChatMessageDto, CreateAgentDto } from './dto/zendesk.dto';
import { Ticket, TicketWithoutUser, User, Comment } from './zendesk.types';
import WebSocket from 'ws';

@Injectable()
export class ZendeskService {
    private readonly logger = new Logger(ZendeskService.name);
    constructor(private readonly httpService: HttpService) { }
    private ws: WebSocket | null = null; // Propiedad para almacenar el WebSocket
    private activeChats: Map<string, any> = new Map();

    onModuleDestroy() {
        if (this.ws) {
            this.ws.close();
            this.logger.log('WebSocket connection closed');
        }
    }

    private getOAuthHeader(): string {
        const token = process.env.ZENDESK_CHAT_TOKEN;
        if (!token) {
            this.logger.error('ZENDESK_CHAT_TOKEN is not defined');
            throw new Error('ZENDESK_CHAT_TOKEN is not defined');
        }
        this.logger.log('Using OAuth token:', token.substring(0, 10) + '...');
        return `Bearer ${token}`;
    }

    async getAllAgents(): Promise<UserResponseDto[]> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL_USERS}`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                    params: {
                        query: 'role:agent'
                    }
                })
            );

            return response.data.users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                default_group_id: user.default_group_id
            }));
        } catch (error) {
            console.log(error.response.data);
            throw new Error(`Error fetching agents: ${error.message}`);
        }
    }

    async getAllUsers(): Promise<UserResponseDto[]> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.get(env.ZENDESK_URL_USERS, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            return response.data.users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                default_group_id: user.default_group_id,
                organization_id: user.organization_id,
                custom_role_id: user.custom_role_id
            }));
        } catch (error) {
            throw new Error(`Error fetching users: ${error.message}`);
        }
    }

    async getAllTickets(): Promise<TicketResponseDto[]> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            // Get all users first
            const usersResponse = await firstValueFrom(
                this.httpService.get(env.ZENDESK_URL_USERS, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                    params: {
                        query: 'role:end-user'
                    }
                })
            );

            const users: User[] = usersResponse.data.users;

            // Get all tickets
            const ticketsResponse: AxiosResponse<{ tickets: TicketWithoutUser[] }> = await firstValueFrom(
                this.httpService.get(env.ZENDESK_URL_TICKETS, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            // Map tickets and include user information
            return ticketsResponse.data.tickets.map(ticket => {
                const user = users.find(user => user.id === ticket.requester_id);
                return {
                    id: ticket.id,
                    subject: ticket.subject,
                    description: ticket.description,
                    status: ticket.status,
                    requester_id: ticket.requester_id,
                    assignee_id: ticket.assignee_id,
                    created_at: ticket.created_at,
                    updated_at: ticket.updated_at,
                    user: user ? {
                        name: user.name,
                        email: user.email,
                    } : undefined,
                    group_id: ticket.group_id,
                    custom_fields: ticket.custom_fields
                };
            });
        } catch (error) {
            throw new Error(`Error fetching tickets: ${error.message}`);
        }
    }

    async createAgent(createAgentDto: CreateAgentDto): Promise<UserResponseDto> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        const agentData = {
            user: {
                name: createAgentDto.name,
                email: createAgentDto.email,
                role: createAgentDto.role || 'agent', // Por defecto 'agent'
                default_group_id: createAgentDto.default_group_id, // Opcional
            },
        };

        try {
            const response: AxiosResponse<{ user: User }> = await firstValueFrom(
                this.httpService.post(env.ZENDESK_URL_USERS, agentData, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            const user = response.data.user;
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                default_group_id: user.default_group_id,
            };
        } catch (error) {
            console.error('Error creating agent:', error.response?.data || error.message);
            throw new Error(`Error creating agent: ${error.response?.data?.error || error.message}`);
        }
    }

    async deleteAgent(userId: string): Promise<{ message: string }> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            await firstValueFrom(
                this.httpService.delete(`${env.ZENDESK_URL_USERS}/${userId}`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            return { message: `Agent with ID ${userId} deleted successfully` };
        } catch (error) {
            console.error('Error deleting agent:', error.response?.data || error.message);
            throw new Error(`Error deleting agent: ${error.response?.data?.error || error.message}`);
        }
    }


    async createUserIfNotExists(email: string): Promise<number | null> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');
        console.log(email, 'email on createUserIfNotExists');
        try {
            const searchResponse = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL_USERS}/search`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                    params: {
                        query: `email:${email}`
                    }
                })
            );

            if (searchResponse.data.users.length > 0) {
                console.log(searchResponse.data.users[0].id, 'id on createUserIfNotExists');
                return searchResponse.data.users[0].id;
            } else {
                const createUserResponse = await firstValueFrom(
                    this.httpService.post(env.ZENDESK_URL_USERS, { user: { email, name: email } }, {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/json',
                        },
                    })
                );
                console.log(createUserResponse.data.user.id, 'id on createUserIfNotExists');
                return createUserResponse.data.user.id;
            }
        } catch (error) {
            console.error('Error creating/finding user:', error.response?.data || error.message);
            return null;
        }
    }

    async createTicket(createTicketDto: CreateTicketDto) {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');
        const MONEY_GROUP_ID = '34157406608155';
        const MONEY_CUSTOM_FIELD_ID = 34161101814811;

        const userId = await this.createUserIfNotExists(createTicketDto.email);
        console.log(userId, 'userId on createTicket');
        if (userId === null) {
            throw new Error('Failed to create or find user.');
        }

        // Check if this is a money-related ticket by checking the custom field value
        const moneyCustomField = createTicketDto.custom_fields?.find(
            field => field.id === MONEY_CUSTOM_FIELD_ID
        );
        const isMoneyTicket = moneyCustomField?.value === "Dinero";

        const ticketData = {
            ticket: {
                subject: createTicketDto.subject,
                description: createTicketDto.description,
                requester_id: userId,
                custom_fields: createTicketDto.custom_fields,
                ...(isMoneyTicket && { group_id: parseInt(MONEY_GROUP_ID) })
            },
        };

        try {
            const response: AxiosResponse<{ ticket: Ticket }> = await firstValueFrom(
                this.httpService.post(env.ZENDESK_URL_TICKETS, ticketData, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            const ticket = response.data.ticket;

            // If it's a money ticket, find and assign the agent with least tickets
            if (isMoneyTicket) {
                try {
                    // Get all group memberships to find Money Agent members
                    const groupMembershipsResponse = await firstValueFrom(
                        this.httpService.get(`${env.ZENDESK_URL_GROUP_MEMBERSHIPS}`, {
                            headers: {
                                'Authorization': `Basic ${auth}`,
                                'Content-Type': 'application/json',
                            },
                        })
                    );

                    // Get all tickets to count assignments
                    const ticketsResponse = await firstValueFrom(
                        this.httpService.get(env.ZENDESK_URL_TICKETS, {
                            headers: {
                                'Authorization': `Basic ${auth}`,
                                'Content-Type': 'application/json',
                            },
                        })
                    );

                    const tickets = ticketsResponse.data.tickets;

                    // Filter group memberships to get only Money Agent members
                    const moneyAgentMemberships = groupMembershipsResponse.data.group_memberships
                        .filter(membership => membership.group_id.toString() === MONEY_GROUP_ID);

                    if (moneyAgentMemberships.length > 0) {
                        // Count tickets for each Money Agent member
                        const agentTicketCounts = moneyAgentMemberships.map(membership => ({
                            user_id: membership.user_id,
                            ticketCount: tickets.filter(ticket => ticket.assignee_id === membership.user_id).length
                        }));

                        // Find the agent with the least tickets
                        const agentWithLeastTickets = agentTicketCounts.reduce((prev, current) =>
                            prev.ticketCount <= current.ticketCount ? prev : current
                        );

                        // Use the asignTicket method to assign the ticket
                        const updatedTicket = await this.asignTicket(
                            ticket.id.toString(),
                            agentWithLeastTickets.user_id.toString()
                        );
                        return updatedTicket;
                    }
                } catch (error) {
                    console.error('Error finding Money Agent:', error);
                    // Return the original ticket if there's an error in assignment
                }
            }

            return {
                id: ticket.id,
                subject: ticket.subject,
                description: ticket.description,
                status: ticket.status,
                requester_id: ticket.requester_id,
                assignee_id: ticket.assignee_id,
                user: ticket.user,
                group_id: ticket.group_id,
                custom_fields: ticket.custom_fields
            };
        } catch (error) {
            console.error('Zendesk API Error:', error.response?.data || error.message);
            throw new Error(`Error creating ticket: ${error.response?.data?.error || error.message}`);
        }
    }

    async getTicket(ticketId: string): Promise<TicketResponseDto> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response: AxiosResponse<{ ticket: Ticket }> = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL_TICKETS}/${ticketId}`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            const ticket = response.data.ticket;
            return {
                id: ticket.id,
                subject: ticket.subject,
                description: ticket.description,
                status: ticket.status,
                requester_id: ticket.requester_id,
                assignee_id: ticket.assignee_id,
                user: ticket.user,
                group_id: ticket.group_id
            };
        } catch (error) {
            throw new Error(`Error fetching ticket: ${error.response?.data || error.message}`);
        }
    }

    async getTicketComments(ticketId: string): Promise<CommentResponseDto[]> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response: AxiosResponse = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL_TICKETS}/${ticketId}/comments`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            return response.data;
        } catch (error) {
            throw new Error(`Error fetching comments: ${error.response?.data || error.message}`);
        }
    }

    async changeTicketStatus(ticketId: string, status: string): Promise<TicketResponseDto> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response: AxiosResponse<{ ticket: Ticket }> = await firstValueFrom(
                this.httpService.put(`${env.ZENDESK_URL_TICKETS}/${ticketId}`, { ticket: { status } }, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            const ticket = response.data.ticket;
            return {
                id: ticket.id,
                subject: ticket.subject,
                description: ticket.description,
                status: ticket.status,
                requester_id: ticket.requester_id,
                assignee_id: ticket.assignee_id,
                user: ticket.user,
                group_id: ticket.group_id
            };
        } catch (error) {
            throw new Error(`Error changing ticket status: ${error.response?.data || error.message}`);
        }
    }

    async asignTicket(ticketId: string, userId: string): Promise<TicketResponseDto> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response: AxiosResponse<{ ticket: Ticket }> = await firstValueFrom(
                this.httpService.put(`${env.ZENDESK_URL_TICKETS}/${ticketId}`, { ticket: { assignee_id: userId } }, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            const ticket = response.data.ticket;
            return {
                id: ticket.id,
                subject: ticket.subject,
                description: ticket.description,
                status: ticket.status,
                requester_id: ticket.requester_id,
                assignee_id: ticket.assignee_id,
                user: ticket.user,
                group_id: ticket.group_id
            };
        } catch (error) {
            throw new Error(`Error assigning ticket: ${error.response?.data || error.message}`);
        }
    }

    async getAgentsWithGroups(): Promise<GroupMembershipResponseDto[]> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        // Define group names mapping
        const groupNames = {
            '34157406608155': 'Money Agent',
            '34157418101659': 'Administrative Agent',
            '33924618663451': 'Support'
        };

        try {
            // First, get all users to have their information available
            const usersResponse = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL_USERS}`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            const users = usersResponse.data.users;

            // Get all tickets to count assignments
            const ticketsResponse = await firstValueFrom(
                this.httpService.get(env.ZENDESK_URL_TICKETS, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            const tickets = ticketsResponse.data.tickets;

            // Then get the group memberships
            const groupMembershipsResponse = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL_GROUP_MEMBERSHIPS}`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            // Map the response to include user information, ticket count and group name
            return groupMembershipsResponse.data.group_memberships.map(membership => {
                const user = users.find(u => u.id === membership.user_id);
                const assignedTicketsCount = tickets.filter(ticket => ticket.assignee_id === membership.user_id).length;

                return {
                    ...membership,
                    group_name: groupNames[membership.group_id.toString()] || 'Unknown Group',
                    user: user ? {
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        assigned_tickets_count: assignedTicketsCount
                    } : undefined
                };
            });
        } catch (error) {
            throw new Error(`Error fetching agents with groups: ${error.response?.data || error.message}`);
        }
    }

    async getActiveChats(): Promise<ChatConversationResponseDto[]> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL}/api/v2/chat/chats`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    }
                })
            );

            return response.data.chats;
        } catch (error) {
            throw new Error(`Error fetching chats: ${error.message}`);
        }
    }

    async getChatMessages(chatId: string): Promise<ChatMessageResponseDto[]> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL}/api/v2/chat/conversations/${chatId}/messages`, {
                    headers: {
                        'Authorization': this.getOAuthHeader(),
                        'Content-Type': 'application/json',
                    },
                })
            );

            return response.data.messages.map(msg => ({
                id: msg.id,
                message: msg.text,
                sender: msg.author_type === 'visitor' ? 'visitor' : 'agent',
                created_at: msg.timestamp,
                conversation_id: chatId
            }));
        } catch (error) {
            throw new Error(`Error fetching chat messages: ${error.message}`);
        }
    }

    async sendChatMessage(chatId: string, message: string): Promise<ChatMessageResponseDto> {
        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${env.ZENDESK_URL}/api/v2/chats/${chatId}/messages`,
                    { message: { text: message } },
                    {
                        headers: {
                            'Authorization': this.getOAuthHeader(),
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );
            const msg = response.data.message;
            return {
                id: msg.id,
                message: msg.text,
                sender: msg.sender.type,
                created_at: msg.created_at,
                conversation_id: chatId,
            };
        } catch (error) {
            throw new Error(`Error sending message: ${error.response?.data?.error || error.message}`);
        }
    }

    async sendMessageViaWebSocket(chatId: string, message: string): Promise<void> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket connection is not open. Call startChatSubscription first.');
        }

        const sendMessageQuery = {
            payload: {
                query: `mutation {
                    sendMessage(channel_id: "${chatId}", msg: "${message}") {
                        success
                    }
                }`,
            },
            type: 'request',
            id: 'SEND_MESSAGE_' + Date.now(), // ID único basado en timestamp
        };

        this.ws.send(JSON.stringify(sendMessageQuery));
        this.logger.log(`Message sent to chat ${chatId}: ${message}`);
    }

    async getChatConversations(): Promise<ChatConversationResponseDto[]> {
        const baseUrl = env.ZENDESK_URL;
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${baseUrl}/api/v2/chat/chats`, {
                    headers: {
                        'Authorization': this.getOAuthHeader(),
                        'Content-Type': 'application/json',
                    }
                })
            );

            console.log('Conversations Response:', response.data);
            return response.data.conversations || [];
        } catch (error) {
            this.logger.error('Error fetching conversations:', error);
            throw error;
        }
    }


    async getChats(): Promise<ChatConversationResponseDto[]> {
        const baseUrl = env.ZENDESK_URL;
        if (!baseUrl) {
            this.logger.error('ZENDESK_URL is not defined');
            throw new Error('ZENDESK_URL is not defined');
        }

        const chatUrl = `${baseUrl}/api/v2/chat/chats`;
        this.logger.log('Fetching chats from:', chatUrl);

        try {
            const response = await firstValueFrom(
                this.httpService.get(chatUrl, {
                    headers: {
                        'Authorization': this.getOAuthHeader(),
                        'Content-Type': 'application/json',
                    },
                })
            );
            this.logger.log('Response from Zendesk:', JSON.stringify(response.data, null, 2));
            const chats = response.data.chats || [];
            return chats.map(chat => ({
                id: chat.id,
                visitor: {
                    name: chat.visitor?.name || 'Anonymous',
                    email: chat.visitor?.email || '',
                },
                status: chat.status,
                timestamp: chat.timestamp,
                agent: chat.agent_ids?.length > 0 ? {
                    id: chat.agent_ids[0].toString(),
                    name: chat.agents?.[0]?.display_name || 'Unknown'
                } : undefined,
                lastMessage: chat.history?.slice(-1)[0]?.msg || '',
            }));
        } catch (error) {
            this.logger.error('Error fetching chats:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            throw new Error(`Failed to fetch chats: ${error.response?.data?.error || error.message}`);
        }
    }

    async searchChats(query: string): Promise<ChatConversationResponseDto[]> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL}/api/v2/chat/chats/search`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                    params: { q: query }
                })
            );

            return response.data.chats;
        } catch (error) {
            throw new Error(`Error searching chats: ${error.message}`);
        }
    }

    async getChat(chatId: string): Promise<ChatConversationResponseDto> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL}/api/v2/chats/${chatId}`, {
                    headers: {
                        'Authorization': this.getOAuthHeader(),
                        'Content-Type': 'application/json',
                    },
                })
            );
            const chat = response.data;
            return {
                id: chat.id, // string
                visitor: {
                    name: chat.visitor?.name || 'Anonymous',
                    email: chat.visitor?.email || '',
                },
                status: chat.status,
                timestamp: chat.timestamp,
                agent: chat.agent_ids?.length > 0 ? {
                    id: chat.agent_ids[0].toString(),
                    name: chat.agents?.[0]?.display_name || 'Unknown'
                } : undefined,
                lastMessage: chat.history?.slice(-1)[0]?.msg || '',
            };
        } catch (error) {
            throw new Error(`Error fetching chat: ${error.response?.data?.error || error.message}`);
        }
    }


    async createOfflineMessage(messageDto: ChatMessageDto): Promise<ChatConversationResponseDto> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.post(`${env.ZENDESK_URL}/api/v2/chat/chats`,
                    {
                        type: 'offline_msg',
                        message: messageDto.message,
                        timestamp: Date.now(),
                        session: {
                            browser: 'API',
                            city: 'Unknown',
                            country_code: 'XX',
                            country_name: 'Unknown',
                            ip: '0.0.0.0',
                            platform: 'API',
                            user_agent: 'API Client'
                        }
                    },
                    {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/json',
                        }
                    }
                )
            );

            return response.data;
        } catch (error) {
            throw new Error(`Error creating offline message: ${error.message}`);
        }
    }

    // Nuevo método en ZendeskService
    async startAgentSession(): Promise<any> {
        try {
            const mutation = `mutation {
            startAgentSession(access_token: "${process.env.ZENDESK_CHAT_TOKEN}") {
                websocket_url
                session_id
                client_id
            }
        }`;

            const response = await firstValueFrom(
                this.httpService.post('https://chat-api.zopim.com/graphql/request', {
                    query: mutation
                })
            );

            if (response.data.data?.startAgentSession) {
                // Conectar al WebSocket y actualizar el estado del agente a ONLINE
                await this.connectToWebSocket(response.data.data.startAgentSession);
            }

            return response.data;
        } catch (error) {
            this.logger.error('Error starting agent session:', error);
            throw new Error('Failed to start agent session');
        }
    }

    private async connectToWebSocket(sessionData: any) {
        try {
            const updateAgentStatusQuery = {
                payload: {
                    query: `mutation {
                    updateAgentStatus(status: ONLINE) {
                        node {
                            id
                        }
                    }
                }`
                },
                type: 'request',
                id: 'UPDATE_AGENT_STATUS'
            };

            // Aquí implementarías la conexión WebSocket
            // Usando la URL: sessionData.websocket_url

            // Por ahora, hacemos una petición HTTP simple para actualizar el estado
            const response = await firstValueFrom(
                this.httpService.post('https://chat-api.zopim.com/graphql/request',
                    updateAgentStatusQuery,
                    {
                        headers: {
                            'Authorization': this.getOAuthHeader()
                        }
                    }
                )
            );

            return response.data;
        } catch (error) {
            this.logger.error('Error connecting to WebSocket:', error);
            throw error;
        }
    }

    async getActiveChatsViaGraphQL(): Promise<any> {
        const mutation = `query {
            chats {
                edges {
                    node {
                        id
                        visitor { name email }
                        status
                        timestamp
                    }
                }
            }
        }`;

        const response = await firstValueFrom(
            this.httpService.post('https://chat-api.zopim.com/graphql/request',
                { query: mutation },
                { headers: { 'Authorization': this.getOAuthHeader() } }
            )
        );
        return response.data.data.chats.edges.map(edge => edge.node);
    }

    async startChatSubscription(): Promise<void> {
        const session = await this.startAgentSession();
        const wsUrl = session.data.startAgentSession.websocket_url;
        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
            this.logger.log('WebSocket connection opened');
            const subscriptionQuery = {
                payload: {
                    query: `subscription {
                        chat {
                            node {
                                id
                                visitor { name email }
                                status
                                timestamp
                            }
                        }
                    }`,
                },
                type: 'request',
                id: 'CHAT_SUBSCRIPTION',
            };
            this.ws.send(JSON.stringify(subscriptionQuery));
        });

        this.ws.on('message', async (data) => {
            const parsed = JSON.parse(data);
            if (parsed.sig === 'DATA' && parsed.payload.data) {
                const chat = parsed.payload.data.chat.node;
                this.activeChats.set(chat.id, chat);
                this.logger.log('Nuevo chat:', chat);

                // Responder automáticamente (opcional)
                await this.sendMessageViaWebSocket(chat.id, '¡Hola! ¿En qué puedo ayudarte?');
            }
        });

        this.ws.on('error', (error) => {
            this.logger.error('WebSocket error:', error);
        });

        this.ws.on('close', () => {
            this.logger.log('WebSocket connection closed');
            this.ws = null;
            this.activeChats.clear();
        });
    }
}