import { type User } from '@/lib/types/zafClient';

export interface ZAFClient {
  invoke: (method: string, params: any) => void;
  get: (path: string) => Promise<any>;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
}

export interface Metadata<T> {
  appId: number;
  name: string;
  version: string;
  installationId: number;
  settings: T;
}

export interface ConversationAuthor {
  id: number | null;
  avatar: string;
  name: string;
  role: 'admin' | 'end-user' | 'system';
}

export interface ConversationChannel {
  name: string;
}

export interface ConversationMessage {
  content: string;
  contentType: string;
}

export interface ConversationElement {
  attachments: any[]; // You can specify a more detailed type for attachments if needed
  author: ConversationAuthor;
  channel: ConversationChannel;
  message: ConversationMessage;
  timestamp: string;
}

export interface DetailedComment extends ConversationElement {
  id: number;
  via: {
    channel: string;
    source: {
      to: Record<string, unknown>;
      from: Record<string, unknown>;
      rel: null;
    };
  };
}

export type Comment = DetailedComment;

export interface TicketData {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  comments: Comment[];
  conversation: ConversationElement[];
  via: any;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  customFields?: Record<string, any>;
  user: User;
}
