import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { env } from 'process';
import { AxiosResponse } from 'axios';
import { CreateTicketDto, TicketResponseDto, CommentResponseDto, UserResponseDto, GroupMembershipResponseDto, ChatMessageResponseDto, ChatConversationResponseDto, ChatMessageDto } from './dto/zendesk.dto';
import { Ticket, TicketWithoutUser, User, Comment } from './zendesk.types';

@Injectable()
export class ZendeskService {
    constructor(private readonly httpService: HttpService) { }

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

    async getAllOpenTickets(): Promise<TicketWithoutUser[]> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response: AxiosResponse<{ tickets: TicketWithoutUser[] }> = await firstValueFrom(
                this.httpService.get(env.ZENDESK_URL_TICKETS, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            return response.data.tickets.filter(ticket => ticket.status === 'open');
        } catch (error) {
            throw new Error(`Error fetching tickets: ${error.message}`);
        }
    }

    async getAllTicketsWithUser(): Promise<TicketResponseDto[]> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
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

            const users: User[] = response.data.users;
            const tickets: TicketWithoutUser[] = await this.getAllOpenTickets();

            return tickets.map(ticket => {
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
                    group_id: ticket.group_id
                };
            });
        } catch (error) {
            throw new Error(`Error fetching users: ${error.message}`);
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
                this.httpService.get(`${env.ZENDESK_URL}/api/v2/chat/chats/${chatId}`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    }
                })
            );

            // Los mensajes están en el historial del chat
            return response.data.history
                .filter(event => event.type === 'chat.msg')
                .map(msg => ({
                    id: msg.id || Date.now(),
                    message: msg.msg,
                    sender: msg.name.includes('Visitor') ? 'visitor' : 'agent',
                    created_at: msg.timestamp,
                    conversation_id: chatId
                }));
        } catch (error) {
            throw new Error(`Error fetching chat messages: ${error.message}`);
        }
    }

    async sendChatMessage(chatId: string, message: string): Promise<ChatMessageResponseDto> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.post(`${env.ZENDESK_URL}/api/v2/chats/${chatId}/messages`,
                    { message: { text: message } },
                    {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );

            const sentMessage = response.data.message;
            return {
                id: sentMessage.id,
                message: sentMessage.text,
                sender: sentMessage.sender.type,
                created_at: sentMessage.created_at,
                conversation_id: sentMessage.conversation_id
            };
        } catch (error) {
            console.error('Error sending chat message:', error.response?.data || error.message);
            throw new Error(`Error sending chat message: ${error.response?.data?.error || error.message}`);
        }
    }

    async sendMessage(chatId: string, message: string): Promise<ChatMessageResponseDto> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            // Según la documentación, no hay un endpoint directo para enviar mensajes
            // Podríamos necesitar usar el Real Time Chat API para esto
            throw new Error('Sending messages through REST API is not supported. Use Real Time Chat API instead.');
        } catch (error) {
            throw new Error(`Error sending message: ${error.message}`);
        }
    }

    async getChats() {
        try {
            const chatToken = 'IGFgmhsMxNrG2R8l9VEa20CXnAIRcdUP046G7ThI';
            const accountKey = process.env.ZENDESK_CHAT_ACCOUNT_KEY;
    
            if (!chatToken || !accountKey) {
                throw new Error('Missing Zendesk Chat credentials. Please check ZENDESK_CHAT_TOKEN and ZENDESK_CHAT_ACCOUNT_KEY');
            }
    
            console.log('Attempting to fetch chats with Chat API credentials');
    
            const response = await firstValueFrom(
                this.httpService.get('https://www.zopim.com/api/v2/chats', {
                    headers: {
                        'Authorization': `Bearer ${chatToken}`,
                        'X-Account-Key': accountKey,
                        'Content-Type': 'application/json',
                    }
                })
            );
    
            if (!response.data.chats) {
                console.warn('Unexpected response structure:', response.data);
                return [];
            }
    
            return response.data.chats.map(chat => ({
                id: chat.id,
                visitor: {
                    name: chat.visitor?.name || 'Anonymous',
                    email: chat.visitor?.email || ''
                },
                status: chat.status || 'unknown',
                timestamp: chat.timestamp,
                agent: chat.agent_names?.[0] ? {
                    name: chat.agent_names[0]
                } : undefined,
                lastMessage: chat.history?.[chat.history.length - 1]?.msg || ''
            }));
    
        } catch (error) {
            console.error('Detailed error information:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method
                }
            });
    
            if (error.response?.status === 401) {
                throw new Error('Zendesk Chat API authentication failed. Please check your Chat API credentials.');
            }
    
            if (error.response?.status === 403) {
                throw new Error('Access forbidden. Please verify your Zendesk Chat subscription and permissions.');
            }
    
            throw new Error(`Error fetching chats: ${error.response?.data?.error || error.message}`);
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
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL}/api/v2/chat/chats/${chatId}`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    }
                })
            );

            return response.data;
        } catch (error) {
            throw new Error(`Error fetching chat: ${error.message}`);
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

    async updateChat(chatId: string, updateData: any): Promise<ChatConversationResponseDto> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.put(`${env.ZENDESK_URL}/api/v2/chat/chats/${chatId}`,
                    updateData,
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
            throw new Error(`Error updating chat: ${error.message}`);
        }
    }

    async deleteChat(chatId: string): Promise<void> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            await firstValueFrom(
                this.httpService.delete(`${env.ZENDESK_URL}/api/v2/chat/chats/${chatId}`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    }
                })
            );
        } catch (error) {
            throw new Error(`Error deleting chat: ${error.message}`);
        }
    }

    async bulkDeleteChats(ids: string): Promise<void> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            await firstValueFrom(
                this.httpService.delete(`${env.ZENDESK_URL}/api/v2/chat/chats`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                    params: { ids }
                })
            );
        } catch (error) {
            throw new Error(`Error bulk deleting chats: ${error.message}`);
        }
    }
}