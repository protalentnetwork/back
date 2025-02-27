export interface Ticket {
  url: string
  id: number
  external_id: any
  via: Via
  created_at: string
  updated_at: string
  generated_timestamp: number
  type: string
  subject: string
  raw_subject: string
  description: string
  priority: string
  status: string
  recipient: any
  requester_id: number
  submitter_id: number
  assignee_id: number
  organization_id: any
  group_id: number
  collaborator_ids: any[]
  follower_ids: any[]
  email_cc_ids: any[]
  forum_topic_id: any
  problem_id: any
  has_incidents: boolean
  is_public: boolean
  due_at: any
  tags: string[]
  custom_fields: CustomField[]
  satisfaction_rating: SatisfactionRating
  sharing_agreement_ids: any[]
  custom_status_id: number
  encoded_id: string
  fields: Field[]
  followup_ids: any[]
  ticket_form_id: number
  brand_id: number
  allow_channelback: boolean
  allow_attachments: boolean
  from_messaging_channel: boolean
  user: {
    name: string
    email: string
  }
}

export type TicketWithoutUser = Omit<Ticket, "user">;

export interface Via {
  channel: string
  source: Source
}

export interface Source {
  from: From
  to: To
  rel: any
}

export interface From { }

export interface To { }

export interface CustomField {
  id: number
  value: any
}

export interface SatisfactionRating {
  score: string
}

export interface Field {
  id: number
  value: any
}

/* FIN TICKET INTERFACE */

/* INICIO USER INTERFACE */

export interface User {
  id: number
  url: string
  name: string
  created_at: string
  updated_at: string
  time_zone: string
  email: string
  phone: string
  locale: string
  locale_id: number
  organization_id: number
  role: string
  verified: boolean
  photo: Photo
  default_group_id?: number; // Agrega esta propiedad como opcional
  custom_role_id?: number; // Si también está en tu DTO
}

export interface Photo {
  id: number
  name: string
  content_url: string
  content_type: string
  size: number
  thumbnails: Thumbnail[]
}

export interface Thumbnail {
  id: number
  name: string
  content_url: string
  content_type: string
  size: number
}

/* FIN USER INTERFACE */

/* INICIO COMMENT INTERFACE */

export interface Comment {
  id: number
  type: string
  author_id: number
  body: string
  html_body: string
  plain_body: string
  public: boolean
  attachments: any[]
  audit_id: number
  via: Via
  created_at: string
  metadata: Metadata
}

export interface Via {
  channel: string
  source: Source
}

export interface Source {
  from: From
  to: To
  rel: any
}

export interface From { }

export interface To {
  name: string
  address: string
}

export interface Metadata {
  system: System
  custom: Custom
}

export interface System {
  client: string
  ip_address: string
  location: string
  latitude: number
  longitude: number
}

export interface Custom { }

/* FIN COMMENT INTERFACE */

/* INICIO UPDATE TICKET INTERFACE */

export interface UpdateTicketDto {
  ticket: Ticket;
}

/* FIN UPDATE TICKET INTERFACE */
