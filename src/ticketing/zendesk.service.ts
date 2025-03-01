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

}