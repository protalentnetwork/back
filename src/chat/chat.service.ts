// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { env } from 'process';
import {
    ChatMessageResponseDto,
    ChatConversationResponseDto
} from 'src/ticketing/dto/zendesk.dto';

@Injectable()
export class ChatService {
    constructor(private readonly httpService: HttpService) { }

    async getConversation(conversationId: string): Promise<ChatConversationResponseDto> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL}/api/v2/chats/${conversationId}`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            return response.data.chat;
        } catch (error) {
            throw new Error(`Error fetching conversation: ${error.message}`);
        }
    }

    async resetUnreadCount(conversationId: string): Promise<void> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            await firstValueFrom(
                this.httpService.put(
                    `${env.ZENDESK_URL}/api/v2/chats/${conversationId}/read`,
                    {},
                    {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );
        } catch (error) {
            throw new Error(`Error resetting unread count: ${error.message}`);
        }
    }

    async getActiveChats(): Promise<ChatConversationResponseDto[]> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL}/api/v2/chats/online`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            return response.data.chats;
        } catch (error) {
            throw new Error(`Error fetching active chats: ${error.message}`);
        }
    }

    async getChatMessages(chatId: string): Promise<ChatMessageResponseDto[]> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.get(`${env.ZENDESK_URL}/api/v2/chats/${chatId}/messages`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            return response.data.messages;
        } catch (error) {
            throw new Error(`Error fetching chat messages: ${error.message}`);
        }
    }

    async sendMessage(chatId: string, message: string): Promise<ChatMessageResponseDto> {
        const auth = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_TOKEN}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${env.ZENDESK_URL}/api/v2/chats/${chatId}/messages`,
                    { message: { text: message } },
                    {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );

            return response.data.message;
        } catch (error) {
            throw new Error(`Error sending message: ${error.message}`);
        }
    }
}