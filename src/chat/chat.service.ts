import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ChatService {
  private readonly zendeskDomain = process.env.ZENDESK_DOMAIN;
  private readonly zendeskToken = process.env.ZENDESK_API_TOKEN;
  private readonly zendeskEmail = process.env.ZENDESK_EMAIL;

  private readonly axiosInstance = axios.create({
    baseURL: `https://${this.zendeskDomain}.zendesk.com/api/v2`,
    auth: {
      username: `${this.zendeskEmail}/token`,
      password: this.zendeskToken
    }
  });

  async getActiveChats() {
    try {
      const response = await this.axiosInstance.get('/chats/online');
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching active chats: ${error.message}`);
    }
  }

  async getChatHistory(chatId: string) {
    try {
      const response = await this.axiosInstance.get(`/chats/${chatId}/messages`);
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching chat history: ${error.message}`);
    }
  }
}