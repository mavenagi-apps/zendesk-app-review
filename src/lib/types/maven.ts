import { type User } from '@/lib/types/zafClient';
import {
  BotMessage,
  ConversationMessageRequest,
  ConversationMessageResponse,
} from 'mavenagi/api';

// Message type constants to avoid magic strings
const MESSAGE_TYPES = {
  USER: 'USER',
  ERROR: 'ERROR',
  SIMULATED: 'SIMULATED',
  ACTION_RESPONSE: 'ACTION_RESPONSE',
  HUMAN_AGENT: 'HUMAN_AGENT',
} as const;

// Base message interface
interface BaseMessage {
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage extends BaseMessage {
  text: string;
  type: (typeof MESSAGE_TYPES)[keyof Pick<typeof MESSAGE_TYPES, 'USER' | 'ERROR' | 'SIMULATED' | 'HUMAN_AGENT'>];
}

export interface ActionChatMessage extends BaseMessage {
  type: (typeof MESSAGE_TYPES)['ACTION_RESPONSE'];
}

// Union type for all message variations
export type Message = (ConversationMessageResponse | ChatMessage | ActionChatMessage) & {
  createdAt: Date | string;
  updatedAt: Date | string;
  timestamp?: number;
  conversationId?: string;
};

export interface Conversation extends BaseMessage {
  id: string;
  customerName: string | null;
  customerUserId: string | null;
  customerEmail: string | null;
  subject: string;
  channel: string;
  messages: ConversationMessageRequest[];
  tags: string[];
  customFields?: Record<string, string>;
  user: User;
}

export interface AnalysisData {
  userRequest: string;
  agentResponse: string;
  resolutionStatus: string;
  category: string;
  sentiment: string;
}

export const SupportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸', locale: 'en-US' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', locale: 'es-ES' },
  { code: 'fr', name: 'French', flag: '🇫🇷', locale: 'fr-FR' },
  { code: 'de', name: 'German', flag: '🇩🇪', locale: 'de-DE' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', locale: 'it-IT' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', locale: 'pt-PT' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', locale: 'ja-JP' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', locale: 'ko-KR' },
  { code: 'zh-hans', name: 'Chinese Simplified', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'zh-hant', name: 'Chinese Traditional', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'yue', name: 'Cantonese', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', locale: 'ar-SA' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', locale: 'ru-RU' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷', locale: 'tr-TR' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', locale: 'hi-IN' },
];

export enum Integration {
  SALESFORCE = 'SALESFORCE',
  ZENDESK = 'ZENDESK',
  FRESHDESK = 'FRESHDESK',
  SLACK_QA_BOT = 'SLACK_QA_BOT',
  TWILIO = 'TWILIO',
}

export interface Metadata<T> {
  appId: number;
  name: string;
  version: string;
  installationId: number;
  settings: T;
}

export interface UserInfo {
  id: string | undefined | null;
  name: string | undefined | null;
  email: string | undefined | null;
}
