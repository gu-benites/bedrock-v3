import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import { customerServicePrompts } from '../prompts/customer-service';

// Context type for this agent
export interface CustomerServiceContext {
  customerId?: string;
  ticketId?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Tools for customer service
const lookupCustomerTool = tool({
  name: 'lookup_customer',
  description: 'Look up customer information by ID',
  parameters: z.object({
    customerId: z.string().describe('The customer ID to look up'),
  }),
  execute: async ({ customerId }) => {
    // Simulate customer lookup
    return `Customer ${customerId}: John Doe, Premium Plan, Account Status: Active`;
  },
});

const createTicketTool = tool({
  name: 'create_ticket',
  description: 'Create a support ticket for the customer',
  parameters: z.object({
    customerId: z.string().describe('The customer ID'),
    issue: z.string().describe('Description of the issue'),
    priority: z.enum(['low', 'medium', 'high']).describe('Priority level'),
  }),
  execute: async ({ customerId, issue, priority }) => {
    const ticketId = `TICKET-${Date.now()}`;
    return `Created ticket ${ticketId} for customer ${customerId}: ${issue} (Priority: ${priority})`;
  },
});

// Customer Service Agent
export const customerServiceAgent = new Agent<CustomerServiceContext>({
  name: 'Customer Service Agent',
  model: 'gpt-4o',
  instructions: customerServicePrompts.main,
  tools: [lookupCustomerTool, createTicketTool],
  modelSettings: {
    temperature: 0.3, // More consistent responses for customer service
    maxTokens: 1000,
  },
});
