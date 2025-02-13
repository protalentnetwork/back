import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ZendeskService {
    private readonly ZENDESK_URL: string;
    private readonly ZENDESK_TOKEN: string;
    private readonly ZENDESK_EMAIL: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.ZENDESK_URL = this.configService.get<string>('ZENDESK_URL');
        this.ZENDESK_TOKEN = this.configService.get<string>('ZENDESK_TOKEN');
        this.ZENDESK_EMAIL = this.configService.get<string>('ZENDESK_EMAIL');
    }

    async getOpenTickets() {
        const auth = Buffer.from(`${this.ZENDESK_EMAIL}/token:${this.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.get(this.ZENDESK_URL, {
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

    async createUserIfNotExists(email: string): Promise<number | null> {
        const auth = Buffer.from(`${this.ZENDESK_EMAIL}/token:${this.ZENDESK_TOKEN}`).toString('base64');
        const url = `${this.ZENDESK_URL.replace('/api/v2/tickets.json', '/api/v2/users.json')}`; // URL for users
    
        try {
            // 1. Check if user exists (using search)
            const searchResponse = await firstValueFrom(
                this.httpService.get(`${url}?query=email:${email}`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );
    
            if (searchResponse.data.users.length > 0) {
                // User exists, return their ID
                return searchResponse.data.users[0].id;
            } else {
                // 2. User doesn't exist, create them
                const createUserResponse = await firstValueFrom(
                    this.httpService.post(url, { user: { email, name: email } }, { // You might want to add a proper name
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
    
    
    async createTicket(subject: string, description: string, requesterEmail: string) {
        const userId = await this.createUserIfNotExists(requesterEmail);
    
        if (userId === null) {
            throw new Error('Failed to create or find user.');
        }
    
        const auth = Buffer.from(`${this.ZENDESK_EMAIL}/token:${this.ZENDESK_TOKEN}`).toString('base64');
    
        const ticketData = {
            ticket: {
                subject,
                description,
                requester_id: userId, // Use requester_id instead of requester_email
            },
        };
    
        try {
            const response = await firstValueFrom(
                this.httpService.post(this.ZENDESK_URL, ticketData, {
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