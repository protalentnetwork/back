import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportService } from './report.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('tickets-by-status')
  @ApiOperation({ summary: 'Get ticket distribution by status' })
  @ApiResponse({
    status: 200,
    description: 'Ticket distribution by status',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          value: { type: 'number' }
        }
      }
    }
  })
  async getTicketsByStatus() {
    return this.reportService.getTicketsByStatus();
  }

  @Get('tickets-by-agent')
  @ApiOperation({ summary: 'Get tickets assigned by agent' })
  @ApiResponse({
    status: 200,
    description: 'Tickets distribution by agent',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          tickets: { type: 'number' }
        }
      }
    }
  })
  async getTicketsByAgent() {
    return this.reportService.getTicketsByAgent();
  }

  @Get('tickets-trend')
  @ApiOperation({ summary: 'Get tickets trend over time' })
  @ApiResponse({
    status: 200,
    description: 'Ticket count trend by month',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          mes: { type: 'string' },
          cantidad: { type: 'number' }
        }
      }
    }
  })
  async getTicketsTrend() {
    return this.reportService.getTicketsTrend();
  }

  @Get('messages-volume')
  @ApiOperation({ summary: 'Get message volume by hour' })
  async getMessageVolume() {
    return this.reportService.getMessageVolume();
  }

  @Get('messages-distribution')
  @ApiOperation({ summary: 'Get distribution of messages by sender type' })
  async getMessageDistribution() {
    return this.reportService.getMessageDistribution();
  }

  @Get('response-time-by-agent')
  @ApiOperation({ summary: 'Get average response time by agent' })
  async getResponseTimeByAgent() {
    return this.reportService.getResponseTimeByAgent();
  }

  @Get('login-activity')
  @ApiOperation({ summary: 'Get login activity by day' })
  async getLoginActivity() {
    return this.reportService.getLoginActivity();
  }

  @Get('user-roles')
  @ApiOperation({ summary: 'Get distribution of user roles' })
  async getUserRoles() {
    return this.reportService.getUserRoles();
  }

  @Get('new-users-by-month')
  @ApiOperation({ summary: 'Get new users registered by month' })
  async getNewUsersByMonth() {
    return this.reportService.getNewUsersByMonth();
  }

  @Get('dashboard-summary')
  @ApiOperation({ summary: 'Get dashboard summary metrics' })
  async getDashboardSummary() {
    return this.reportService.getDashboardSummary();
  }
}