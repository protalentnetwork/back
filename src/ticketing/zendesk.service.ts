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

        // Datos del usuario con más configuraciones específicas para agentes
        const agentData = {
            user: {
                name: createAgentDto.name,
                email: createAgentDto.email,
                role: createAgentDto.role || 'contributor', // Cambiado de 'agent' a 'contributor'
                verified: true, // Marcar como verificado para evitar el email de verificación
                active: true,   // Asegurarse de que la cuenta está activa
                default_group_id: createAgentDto.default_group_id,
                // Opcional: incluir configuraciones adicionales según sea necesario
                user_fields: {
                    agent_oboard_complete: true // Campo personalizado que puede ser necesario
                }
            }
        };

        try {
            // 1. Crear el usuario
            const response: AxiosResponse<{ user: User }> = await firstValueFrom(
                this.httpService.post(env.ZENDESK_URL_USERS, agentData, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            const user = response.data.user;

            // 2. Si es necesario, agregar explícitamente al usuario como agente
            // Este paso podría ser necesario en algunas configuraciones de Zendesk
            if (user.role === 'agent' && createAgentDto.default_group_id) {
                try {
                    // Crear membresía de grupo explícitamente
                    await firstValueFrom(
                        this.httpService.post(
                            `${env.ZENDESK_URL}/api/v2/group_memberships`,
                            {
                                group_membership: {
                                    user_id: user.id,
                                    group_id: createAgentDto.default_group_id
                                }
                            },
                            {
                                headers: {
                                    'Authorization': `Basic ${auth}`,
                                    'Content-Type': 'application/json',
                                },
                            }
                        )
                    );
                    this.logger.log(`Added user ${user.id} to group ${createAgentDto.default_group_id}`);
                } catch (groupError) {
                    this.logger.error('Error adding user to group:', groupError.response?.data || groupError.message);
                    // No lanzamos error aquí, ya que el usuario ya fue creado
                }
            }

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                default_group_id: user.default_group_id,
            };
        } catch (error) {
            // Registrar detalles completos del error
            console.error('Error creating agent:', {
                message: error.message,
                status: error.response?.status,
                data: JSON.stringify(error.response?.data, null, 2),
                details: JSON.stringify(error.response?.data?.details, null, 2)
            });

            // Si hay detalles específicos, mostrarlos
            if (error.response?.data?.details?.base) {
                throw new Error(`Error creating agent: ${error.response.data.error} - ${error.response.data.details.base[0].message || 'Unknown details'}`);
            } else {
                throw new Error(`Error creating agent: ${error.response?.data?.error || error.message}`);
            }
        }
    }

    async createTeamMember(createTeamMemberDto: {
        name: string;
        email: string;
        group_id?: number;
    }): Promise<UserResponseDto> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        // Datos específicos para un Team Member con rol contributor
        const teamMemberData = {
            user: {
                name: createTeamMemberDto.name,
                email: createTeamMemberDto.email,
                role: 'contributor', // Rol específico que parece funcionar en tu cuenta
                verified: true,
                active: true
            }
        };

        // Si se proporciona un ID de grupo, añadirlo a los datos
        if (createTeamMemberDto.group_id) {
            teamMemberData.user['default_group_id'] = createTeamMemberDto.group_id;
        }

        try {
            this.logger.log(`Creating team member with email: ${createTeamMemberDto.email}`);

            // Intentar crear el usuario
            const response: AxiosResponse<{ user: User }> = await firstValueFrom(
                this.httpService.post(env.ZENDESK_URL_USERS, teamMemberData, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            const user = response.data.user;
            this.logger.log(`Team member created successfully with ID: ${user.id}`);

            // Si se proporcionó un grupo pero no se asignó durante la creación, asignarlo explícitamente
            if (createTeamMemberDto.group_id && !user.default_group_id) {
                try {
                    await this.assignUserToGroup(user.id, createTeamMemberDto.group_id);
                } catch (groupError) {
                    this.logger.warn(`Created user but couldn't assign to group: ${groupError.message}`);
                }
            }

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                default_group_id: user.default_group_id
            };
        } catch (error) {
            // Registrar detalles completos del error
            this.logger.error('Error creating team member:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                details: error.response?.data?.details
            });

            throw new Error(`Error creating team member: ${error.response?.data?.details?.base?.[0]?.message ||
                error.response?.data?.error ||
                error.message
                }`);
        }
    }

    async checkAccountLimits(): Promise<any> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            // Verificar la información de la cuenta y los usuarios actuales
            const [usersResponse, accountResponse] = await Promise.all([
                firstValueFrom(
                    this.httpService.get(`${env.ZENDESK_URL}/api/v2/users`, {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/json',
                        },
                        params: {
                            role: ['agent', 'admin', 'contributor']
                        }
                    })
                ),
                firstValueFrom(
                    this.httpService.get(`${env.ZENDESK_URL}/api/v2/account/settings`, {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/json',
                        },
                    })
                )
            ]);

            // Contar usuarios por rol
            const users = usersResponse.data.users;
            const userCounts = {
                total: users.length,
                byRole: users.reduce((acc, user) => {
                    acc[user.role] = (acc[user.role] || 0) + 1;
                    return acc;
                }, {})
            };

            // Obtener información sobre roles disponibles
            const rolesResponse = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL}/api/v2/custom_roles`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            return {
                accountSettings: accountResponse.data.settings,
                userCounts,
                customRoles: rolesResponse.data.custom_roles,
                recommendedAction: userCounts.byRole.agent >= accountResponse.data.settings.agent_limit
                    ? "You've reached your agent limit. Try creating contributors instead."
                    : "You have agent capacity available."
            };
        } catch (error) {
            this.logger.error('Error checking account limits:', error.response?.data || error.message);
            throw new Error(`Error checking account limits: ${error.response?.data?.error || error.message}`);
        }
    }



    async createContributor(createContributorDto: {
        name: string;
        email: string;
        group_id?: number;
    }): Promise<UserResponseDto> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        // 1. Primero, obtenemos los roles personalizados para encontrar el ID del rol "Contributor"
        let contributorRoleId: number | null = null;

        try {
            const rolesResponse = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL}/api/v2/custom_roles`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            // Verificar y guardar la respuesta completa para debugging
            this.logger.log('Custom roles API response:', JSON.stringify(rolesResponse.data, null, 2));

            // Verificar que tenemos una estructura de datos válida
            if (rolesResponse.data && rolesResponse.data.custom_roles && Array.isArray(rolesResponse.data.custom_roles)) {
                const customRoles = rolesResponse.data.custom_roles;

                // Buscar el rol que contenga "contributor" en su nombre (insensible a mayúsculas/minúsculas)
                const contributorRole = customRoles.find(role =>
                    role && role.name && role.name.toLowerCase().includes('contributor')
                );

                if (contributorRole) {
                    contributorRoleId = contributorRole.id;
                    this.logger.log(`Found contributor role: ${contributorRole.name} (ID: ${contributorRoleId})`);
                } else {
                    this.logger.warn('No contributor role found in custom roles. Will create as regular agent.');
                }
            } else {
                this.logger.warn('Custom roles API response does not contain expected data structure');
            }
        } catch (error) {
            this.logger.warn('Failed to fetch custom roles, continuing as regular agent:', error.message);
        }

        // 2. Crear el usuario como agente (con o sin rol personalizado)
        const userData = {
            user: {
                name: createContributorDto.name,
                email: createContributorDto.email,
                role: 'agent', // Rol base válido para la API
                verified: true, // Marcar como verificado para evitar el email de verificación
                active: true    // Asegurarse de que la cuenta está activa
            }
        };

        // Solo añadir custom_role_id si lo encontramos
        if (contributorRoleId) {
            userData.user['custom_role_id'] = contributorRoleId;
        }

        // Si se proporciona un grupo, añadirlo a los datos del usuario
        if (createContributorDto.group_id) {
            userData.user['default_group_id'] = createContributorDto.group_id;
        }

        try {
            this.logger.log(`Creating contributor with email: ${createContributorDto.email}`);
            this.logger.log('Request payload:', JSON.stringify(userData, null, 2));

            // Crear el usuario
            const response = await firstValueFrom(
                this.httpService.post(env.ZENDESK_URL_USERS, userData, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            const user = response.data.user;
            this.logger.log(`User created successfully with ID: ${user.id}`);

            // Si se proporcionó un grupo pero no se asignó durante la creación, asignarlo explícitamente
            if (createContributorDto.group_id && !user.default_group_id) {
                try {
                    await this.assignUserToGroup(user.id, createContributorDto.group_id);
                } catch (groupError) {
                    this.logger.warn(`Created user but couldn't assign to group: ${groupError.message}`);
                }
            }

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                custom_role_id: user.custom_role_id,
                default_group_id: user.default_group_id
            };
        } catch (error) {
            // Registrar detalles completos del error
            this.logger.error('Error creating contributor:', {
                message: error.message,
                status: error.response?.status,
                data: JSON.stringify(error.response?.data, null, 2),
            });

            throw new Error(`Error creating contributor: ${error.response?.data?.error?.message ||
                error.response?.data?.error ||
                error.message
                }`);
        }
    }

    // Método auxiliar para asignar un usuario a un grupo
    async assignUserToGroup(userId: number, groupId: number): Promise<void> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        const groupMembershipData = {
            group_membership: {
                user_id: userId,
                group_id: groupId
            }
        };

        try {
            await firstValueFrom(
                this.httpService.post(
                    `${env.ZENDESK_URL}/api/v2/group_memberships`,
                    groupMembershipData,
                    {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );

            this.logger.log(`User ${userId} assigned to group ${groupId}`);
        } catch (error) {
            this.logger.error(`Failed to assign user ${userId} to group ${groupId}:`, error.message);
            throw error;
        }
    }

    async assignCustomRole(userId: number, customRoleId: number): Promise<UserResponseDto> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response: AxiosResponse<{ user: User }> = await firstValueFrom(
                this.httpService.put(`${env.ZENDESK_URL_USERS}/${userId}`,
                    {
                        user: {
                            custom_role_id: customRoleId
                        }
                    },
                    {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );

            const user = response.data.user;
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                default_group_id: user.default_group_id,
                custom_role_id: user.custom_role_id
            };
        } catch (error) {
            console.error('Error assigning custom role:', error.response?.data || error.message);
            throw new Error(`Error assigning custom role: ${error.response?.data?.error || error.message}`);
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

    async addTicketComment(ticketId: string, comment: string, authorId: string): Promise<TicketResponseDto> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        // Asegurarse de que authorId sea un número válido
        const authorIdNum = parseInt(authorId);
        if (isNaN(authorIdNum)) {
            throw new Error(`Invalid author ID: ${authorId}`);
        }

        this.logger.log(`Adding comment to ticket ${ticketId} by agent ${authorId}: ${comment.substring(0, 50)}...`);

        const commentData = {
            ticket: {
                comment: {
                    body: comment,
                    public: true,
                    author_id: authorIdNum, // Asegurar que es un número
                },
            },
        };

        try {
            // Registrar los datos que se están enviando a la API
            this.logger.log(`Sending comment data to Zendesk: ${JSON.stringify(commentData)}`);

            const response: AxiosResponse<{ ticket: Ticket }> = await firstValueFrom(
                this.httpService.put(
                    `${env.ZENDESK_URL_TICKETS}/${ticketId}`,
                    commentData,
                    {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );

            const ticket = response.data.ticket;
            this.logger.log(`Comment successfully added to ticket ${ticketId} by agent ${authorId}`);

            // Esperar brevemente para asegurar que el comentario se haya procesado
            await new Promise(resolve => setTimeout(resolve, 1000));

            return {
                id: ticket.id,
                subject: ticket.subject,
                description: ticket.description,
                status: ticket.status,
                requester_id: ticket.requester_id,
                assignee_id: ticket.assignee_id,
                user: ticket.user,
                group_id: ticket.group_id,
            };
        } catch (error) {
            this.logger.error('Error adding comment to ticket:', error.response?.data || error.message);

            // Registrar detalles completos del error para diagnóstico
            if (error.response) {
                this.logger.error('Error response data:', error.response.data);
                this.logger.error('Error response status:', error.response.status);
                this.logger.error('Error response headers:', error.response.headers);
            } else if (error.request) {
                this.logger.error('Error request:', error.request);
            }

            throw new Error(`Error adding comment to ticket: ${error.response?.data?.error || error.message}`);
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