declare global {
  interface Window {
    ZAFClient: {init: () => Client}
  }
}

export interface Metadata<T> {
  appId: number
  name: string
  version: string
  installationId: number
  settings: T
}

export type AppLocation = 'deal_card' | 'lead_card' | 'person_card' | 'company_card' | 'modal'

export interface Context {
  // eq. "sell"
  product: string
  // location where the app is supposed to show up
  location: AppLocation
  // uniq instance id
  instanceGuid: string
  // account info
  account: AccountContext
  // user info
  currentUser: UserContext
}

export interface AccountContext {
  domain: string
  currency: string
  timezone: string
  numberFormat: string
  timeFormat: string
  dateFormat: string
  decimalSeparator: string
}

export interface UserContext {
  id: number
  name: string
  email: string
  status: string
  invited: boolean | null
  confirmed: boolean
  phone: string | null
  role: string
  roles: Role[]
  group: Group | null
  reportsTo: number | null
  timezone: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  locale: string
}

export interface Group {
  id: number
  name: string
}

export interface Role {
  id: number
  name: string
}

export interface RequestOptions {
  accepts?: unknown
  autoRetry?: boolean
  cache?: boolean
  contentType?: boolean | string
  cors?: boolean
  crossDomain?: boolean
  data?: unknown
  dataType?: 'text' | 'json'
  headers?: Record<string, string>
  httpCompleteResponse?: boolean
  ifModified?: boolean
  jwt?: unknown
  mimeType?: string
  secure?: boolean
  timeout?: number
  traditional?: boolean
  type?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  xhrFields?: XMLHttpRequest
}

export interface Client {
  on: <T>(event: string, callback: (data?: T) => void) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoke: <T>(name: string, ...options: any[]) => Promise<T>
  get: {
    (name: 'ticket'): Promise<{ticket: Ticket}>
    (name: 'ticket.comments'): Promise<{'ticket.comments': CommentEvent[]}>
    (name: 'comment'): Promise<{comment: Comment}>
    (name: 'comment.attachments'): Promise<{'comment.attachments': CommentAttachment[]}>
    (name: 'currentUser'): Promise<{
      currentUser: {
        id: number
        avatarUrl: string
        name: string
        email: string
        role: string
        locale: string
      }
    }>
    <T>(name: string | string[]): Promise<T>
  }
  set: <T>(name: string, value: string) => Promise<T>
  request: <Output>(data: RequestOptions) => Promise<Output>
  metadata: <T>() => Promise<Metadata<T>>
  context: () => Promise<Context>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trigger: (event: string, data?: any) => void
  instance: (Guid: string) => Client
}

export interface Ticket {
  assignee: {group: Group; user: User}
  collaborators: User[]
  comments: CommentEvent[]
  conversation: {
    attachments: {
      contentType: string
      contentUrl: string
      filename: string
    }[]
    author: {
      id: number | null
      avatar: string
      name: string
      role: string
    }
    channel: {
      name: string
    }
    message: {
      content: string | null
      contentType: string | null
    }
    timestamp: string
  }[]
  createdAt: string
  description: string
  externalId: string
  form: {id: number}
  id: number
  isNew: boolean
  organization: Organization
  postSaveAction: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  recipient: string
  requester: User
  status: 'open' | 'pending' | 'hold' | 'solved'
  statusCategory: 'open' | 'pending' | 'hold' | 'solved'
  subject: string
  tags: string[]
  type: 'question' | 'incident' | 'problem' | 'task'
  updatedAt: string
  via: Via
}

export interface Comment {
  attachments: CommentAttachment[]
  text: string
  type:
    | 'facebookPrivateMessage'
    | 'facebookWallReply'
    | 'internalNote'
    | 'publicReply'
    | 'twitterDirectMessage'
    | 'twitterReply'
  useRichText: boolean
}

export interface CommentAttachment {
  contentType: string
  contentUrl: string
  filename: string
  thumbnailUrl: string
}

export interface CommentEvent {
  id: number
  value: string
  author: User
  via: Via
  imageAttachments: CommentAttachment[]
  nonImageAttachments: CommentAttachment[]
}

export interface Via {
  channel:
    | 'web_form'
    | 'mail'
    | 'web_service'
    | 'rule'
    | 'linked_problem'
    | 'group_deletion'
    | 'user_change'
    | 'user_deletion'
    | 'group_change'
    | 'resource_push'
    | 'iphone'
    | 'get_satisfaction'
    | 'dropbox'
    | 'merge'
    | 'batch'
    | 'recovered_from_suspended_tickets'
    | 'automatic_solution_suggestions'
    | 'twitter_favorite'
    | 'topic'
    | 'user_merge'
    | 'twitter_dm'
    | 'closed_ticket'
    | 'logmein_rescue'
    | 'chat'
    | 'twitter'
    | 'ticket_sharing'
    | 'macro_reference'
    | 'voicemail'
    | 'phone_call_inbound'
    | 'phone_call_outbound'
    | 'blog'
    | 'text_message'
    | 'facebook_post'
    | 'import'
    | 'github'
    | 'facebook_message'
    | 'lotus'
    | 'monitor_event'
    | 'api_voicemail'
    | 'api_phone_call_inbound'
    | 'api_phone_call_outbound'
    | 'churned_account'
    | 'web_widget'
    | 'mobile_sdk'
    | 'helpcenter'
    | 'sample_ticket'
    | 'sample_interactive_ticket'
    | 'admin_setting'
    | 'satisfaction_prediction'
    | 'any_channel'
    | 'mobile'
    | 'sms'
    | 'ticket_tagging'
    | 'connect_ipm'
    | 'connect_mail'
    | 'connect_sms'
    | 'rule_revision'
    | 'answer_bot_for_agents'
    | 'answer_bot_for_slack'
    | 'answer_bot_for_sdk'
    | 'answer_bot_api'
    | 'answer_bot_for_web_widget'
    | 'symphony'
    | 'side_conversation'
    | 'answer_bot'
    | 'omnichannel'
    | 'line'
    | 'wechat'
    | 'whatsapp'
    | 'native_messaging'
    | 'mailgun'
    | 'messagebird_sms'
    | 'sunshine_conversations_facebook_messenger'
    | 'telegram'
    | 'twilio_sms'
    | 'viber'
    | 'google_rcs'
    | 'apple_business_chat'
    | 'google_business_messages'
    | 'kakaotalk'
    | 'instagram_dm'
    | 'sunshine_conversations_api'
    | 'sunshine_conversations_twitter_dm'
    | 'chat_offline_message'
    | 'chat_transcript'
    | 'business_messaging_slack_connect'
    | number
  source: unknown
}

export interface User {
  id: number
  email: string
  groups: Group[]
  organizations: Organization[]
  name: string
  identities: Identity[]
  role: 'end-user' | 'agent' | 'admin' | number
  externalId: string
  locale: string
  details: string
  notes: string
  alias: string
  signature: string
  timeZone: TimeZone
  tags: string[]
  avatarUrl: string
}

export interface Group {
  id: number
  name: string
}

export interface Organization {
  details: string
  domains: string
  externalId: string
  group: Group
  id: number
  name: string
  notes: string
  sharedComments: boolean
  sharedTickets: boolean
  tags: string[]
}

export interface Identity {
  id: number
  type: 'email' | 'twitter' | 'facebook' | 'google' | 'agent_forwarding' | 'phone_number'
  value: string
  verified: boolean
  primary: boolean
  userId: number
  undeliverableCount: number
  deliverableState: 'deliverable' | 'undeliverable'
}

export interface TimeZone {
  name: string
  translatedName: string
  ianaName: string
  offset: string
  formattedOffset: string
}
