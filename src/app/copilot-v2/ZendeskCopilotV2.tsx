'use client';

import { useAuth } from '@/contexts/AuthContext';
import { type Ticket, type User } from '@/lib/types/zafClient';
import { ConversationElement, DetailedComment, type TicketData } from '@/lib/types/zendesk';
import type { CopilotIntegration } from '@mavenagi/apps-core';
import { Loading } from '@mavenagi/components';
import {
  AuthProvider,
  CopilotProvider,
  UniversalCopilot,
} from '@mavenagi/components/apps/copilot/client';
import { marked } from 'marked';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import TurndownService from 'turndown';
import type { ZAFClient as ZAFClientType, ZAFContext, ZAFMetadata } from 'zafclient';

// Helper functions for data transformation
const transformToTicket = (
  context: ZAFContext,
  zendeskData: TicketData,
  turndownService: TurndownService,
  currentUser?: CopilotIntegration.User
): CopilotIntegration.Ticket => {
  // Transform Zendesk messages to Maven format
  const transformedMessages = transformMessages(zendeskData.conversation, turndownService);

  // Get customer info from ticket requester (like original implementation)
  const customerEmail =
    zendeskData?.via?.channel === 'mail'
      ? zendeskData.via?.source?.from?.address
      : zendeskData.user?.email || '';

  return {
    id: zendeskData.id,
    messages: transformedMessages,
    subject: zendeskData.subject || '',
    tags: zendeskData.tags?.map((tag: string) => tag) || [],
    customFields: zendeskData.customFields,
    customer: zendeskData.user
      ? {
          id: zendeskData.user.id.toString(),
          name: zendeskData.user.name || '',
          email: customerEmail?.length ? customerEmail : null,
        }
      : null,
    agent: currentUser || null,
    url: context.account?.subdomain
      ? 'https://' + context.account.subdomain + '.zendesk.com/agent/tickets/' + zendeskData.id
      : '',
  };
};

const transformMessages = (
  zendeskMessages: ConversationElement[],
  turndownService: TurndownService
): CopilotIntegration.Message[] => {
  return zendeskMessages
    .filter((message) => message.message.content) // Skip messages without content
    .map((message) => {
      let messageType: 'USER' | 'HUMAN_AGENT' | 'AI_AGENT';

      switch (message.author?.role?.toLowerCase?.()) {
        case 'admin':
        case 'agent':
          messageType = 'HUMAN_AGENT';
          break;
        case 'end-user':
          messageType = 'USER';
          break;
        default:
          messageType = 'HUMAN_AGENT'; // Default to human agent for system messages
      }

      // Convert HTML to markdown if needed
      const text =
        message.channel.name === 'email' || message.message.contentType === 'text/html'
          ? turndownService.turndown(message.message.content)
          : message.message.content;

      return {
        id: `${message.author.id || -1}-${message.timestamp}`,
        text: text,
        type: messageType,
        senderId: message.author.id?.toString() || 'unknown',
        createdAt: new Date(message.timestamp),
        updatedAt: new Date(message.timestamp),
      };
    })
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};

const transformToUser = (zendeskUser: User): CopilotIntegration.User => ({
  id: zendeskUser.id.toString(),
  name: zendeskUser.name || '',
  email: zendeskUser.email?.length ? zendeskUser.email : null,
});

interface TicketField {
  name: string;
  type: string;
  isEnabled: boolean;
  label: string;
}

interface TicketFieldsResponse {
  ticketFields: TicketField[];
}

async function fetchAndFormatCustomFields(
  zafClient: ZAFClientType
): Promise<Record<string, string> | undefined> {
  try {
    const response = (await zafClient.get('ticketFields')) as unknown as TicketFieldsResponse;
    const ticketFields: TicketField[] = response.ticketFields || [];
    const customFields: TicketField[] = ticketFields.filter((field) => {
      return field.name.startsWith('custom_field_') && field.type == 'text' && field.isEnabled;
    });
    const customFieldValues: Record<string, string> = {};
    await Promise.all(
      customFields.map(async (field) => {
        const fieldKey = `ticket.customField:${field.name}`;
        const fieldResponse = await zafClient.get(fieldKey);
        const fieldValue = fieldResponse[fieldKey] as string;
        customFieldValues[field.label] = fieldValue;
      })
    );

    if (Object.keys(customFieldValues).length === 0) {
      return;
    }

    return customFieldValues;
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    return undefined;
  }
}

export default function ZendeskCopilotV2() {
  const { token } = useAuth();
  const [ticket, setTicket] = useState<CopilotIntegration.Ticket | null>(null);
  const [currentUser, setCurrentUser] = useState<CopilotIntegration.User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [zafClient, setZafClient] = useState<ZAFClientType | null>(null);
  const [turndownService] = useState(() => new TurndownService());

  // Maven Organization and Agent IDs - loaded from Zendesk metadata
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);

  // Ref to prevent multiple initializations
  const isTicketingClientInitialized = useRef(false);

  // Initialize Zendesk client
  useEffect(() => {
    if (isTicketingClientInitialized.current) return;

    // Initialize ZAF client ref once when component mounts
    if (!zafClient) {
      console.log('Initializing Zendesk client ref!');
      const client = (
        window as unknown as { ZAFClient?: { init: () => ZAFClientType } }
      ).ZAFClient?.init();
      setZafClient(client || null);
    }

    const client =
      zafClient ||
      (window as unknown as { ZAFClient?: { init: () => ZAFClientType } }).ZAFClient?.init();
    if (client) {
      const fetchTicketData = async () => {
        try {
          // Get actual Zendesk subdomain for ticket URL
          const context = await client.context();
          const data = (await client.get(['ticket', 'ticket.requester'])) as unknown as {
            ticket: Ticket;
            ['ticket.requester']: User;
          };
          const customFields = await fetchAndFormatCustomFields(client);
          console.log('Fetched Zendesk ticket data', data);

          const zendeskTicketData: TicketData = {
            id: data.ticket.id.toString(),
            subject: data.ticket.subject,
            description: data.ticket.description,
            status: data.ticket.status,
            priority: data.ticket.priority,
            comments: (data.ticket.comments || []) as unknown as DetailedComment[],
            conversation: (data.ticket.conversation || []) as unknown as ConversationElement[],
            via: data.ticket.via,
            createdAt: new Date(data.ticket.createdAt),
            updatedAt: new Date(data.ticket.updatedAt),
            tags: data.ticket.tags || [],
            customFields: customFields,
            user: data['ticket.requester'],
          };
          if (zendeskTicketData.conversation.length > 0) {
            const transformedTicket = transformToTicket(
              context,
              zendeskTicketData,
              turndownService,
              currentUser || undefined
            );

            setTicket(transformedTicket);
          }
        } catch (error) {
          console.error('Error fetching ticket data:', error);
        }
      };

      // Listen for app registration and fetch data
      client.on('app.registered', () => {
        console.log('ZAF App Registered');
        setTimeout(() => {
          void fetchTicketData();
        }, 500);
      });

      // Listen for ticket conversation updates
      client.on('ticket.conversation.changed', function (conversation: ConversationElement[]) {
        console.log('Ticket conversation changed:', conversation);
        // Update ticket data when conversation changes
        void fetchTicketData();
      });
      client.invoke('resize', { width: '100%', height: '575px' });
      client.metadata().then((metadata: ZAFMetadata) => {
        setOrganizationId(metadata.settings.organizationId as string);
        setAgentId(metadata.settings.agentId as string);
      });
      isTicketingClientInitialized.current = true;
      setIsInitialized(true);
      console.log('Zendesk client initialized successfully.');
    } else {
      console.error('ZAFClient not initialized!');
    }
  }, []);

  // Fetch current user info
  useEffect(() => {
    if (zafClient) {
      const fetchUserInfo = async () => {
        try {
          const data = (await zafClient.get('currentUser')) as unknown as { currentUser: User };
          if (data && data.currentUser) {
            setCurrentUser(transformToUser(data.currentUser));
          } else {
            console.error('Failed to fetch agent info: currentUser data is missing');
          }
        } catch (error) {
          console.error('Error fetching agent info:', error);
        }
      };

      void fetchUserInfo();
    }
  }, [zafClient]);

  // Handle text insertion back to Zendesk
  const insertText = useCallback(
    async (text: string) => {
      if (!zafClient || !ticket) return;

      try {
        const normalizedText = text.replace(/\r\n/g, '\n');
        const htmlContent = await marked(normalizedText, {
          breaks: true,
          gfm: true,
        });

        const processedHtml = htmlContent
          .replace(/(<br\s*\/?>(\s*)){2,}/gi, '<br><br>')
          .replace(/<\/p>\s*<p>/g, '</p><br><p>')
          .replace(/<p>\s*<\/p>/g, '<br>')
          .replace(/\n/g, '')
          .trim();

        zafClient.invoke('ticket.editor.insert', processedHtml);
      } catch (error) {
        console.error('Error inserting text:', error);
        const formattedText = text
          .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
          .replace(/\n/g, '<br>'); // Convert remaining newlines to <br>
        zafClient.invoke('ticket.editor.insert', formattedText);
      }
    },
    [zafClient, ticket]
  );

  if (!isInitialized || !zafClient) {
    return <div className="p-4">Connecting to Zendesk...</div>;
  }

  if (!organizationId || !agentId) {
    return <div className="p-4">Loading configuration...</div>;
  }

  if (!ticket) {
    return <div className="p-4">No active ticket selected.</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <AuthProvider token={token}>
        <CopilotProvider
          organizationId={organizationId}
          agentId={agentId}
          userInfo={currentUser}
          trackEvent={(event) => {
            // Optional: Custom event tracking
            console.log('Copilot event:', event);
          }}
        >
          <Suspense fallback={<Loading />}>
            <UniversalCopilot ticket={ticket} insertText={insertText} />
          </Suspense>
        </CopilotProvider>
      </AuthProvider>
    </div>
  );
}
