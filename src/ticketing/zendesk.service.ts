import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { CreateTicketDto } from 'src/users/dto/zendesk.dto';
import { env } from 'process';
@Injectable()
export class ZendeskService {
    private readonly ZENDESK_TOKEN: string;
    private readonly ZENDESK_EMAIL: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.ZENDESK_TOKEN = this.configService.get<string>('ZENDESK_TOKEN');
        this.ZENDESK_EMAIL = this.configService.get<string>('ZENDESK_EMAIL');
    }

    async getAllOpenTickets() {
        const auth = Buffer.from(`${this.ZENDESK_EMAIL}/token:${this.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
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

    async getAllTicketsWithUser(){
        const auth = Buffer.from(`${this.ZENDESK_EMAIL}/token:${this.ZENDESK_TOKEN}`).toString('base64');

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
            )

            const users = response.data.users;

            const tickets = await this.getAllOpenTickets();

            const ticketsWithUser = tickets.map(ticket => {
                const user = users.find(user => user.id === ticket.requester_id);
                return {
                    ...ticket,
                    user: {
                        name: user.name,
                        email: user.email,
                    }
                }
            })

            return ticketsWithUser;
        }
        catch(error){
            throw new Error(`Error fetching users: ${error.message}`);
        }

    }

    async createUserIfNotExists(email: string): Promise<number | null> {
        const auth = Buffer.from(`${this.ZENDESK_EMAIL}/token:${this.ZENDESK_TOKEN}`).toString('base64');
    
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
                return searchResponse.data.users[0].id;
            } else {
                const createUserResponse = await firstValueFrom(
                    this.httpService.post(env.ZENDESK_URL_USERS, { user: { email, name: email } }, { // You might want to add a proper name
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/json',
                        },
                    })
                );
                return createUserResponse.data.user.id;
            }
        } catch (error) {
            console.error('Error creating/finding user:', error.response?.data || error.message);
            return null; // Return null if user creation/search fails
        }
    }
    
    
    async createTicket(createTicketDto: CreateTicketDto) {
        const userId = await this.createUserIfNotExists(createTicketDto.email);
        if (userId === null) {
            throw new Error('Failed to create or find user.');
        }
    
        const auth = Buffer.from(`${this.ZENDESK_EMAIL}/token:${this.ZENDESK_TOKEN}`).toString('base64');
    
        const ticketData = {
            ticket: {
                subject: createTicketDto.subject,
                description: createTicketDto.description,
                requester_id: userId, // Use requester_id instead of requester_email
            },
        };
    
        try {
            const response = await firstValueFrom(
                this.httpService.post(env.ZENDESK_URL_TICKETS, ticketData, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );
    
            return response.data;
        } catch (error) {
            console.error('Zendesk API Error:', error.response?.data || error.message);
            throw new Error(`Error creating ticket: ${error.response?.data?.error || error.message}`);
        }
    }


}