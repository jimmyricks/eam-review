// Document-related types

export interface Document {
  name: string
  owner: string
  creation: string
  modified: string
  modified_by: string
  docstatus: number
  idx: number
  doctype: string
  [key: string]: any // All other fields are dynamic
}

export interface DocumentPermissions {
  select: number
  read: number
  write: number
  create: number
  delete: number
  submit: number
  cancel: number
  amend: number
  print: number
  email: number
  report: number
  import: number
  export: number
  share: number
}

export interface WorkflowLog {
  name: string
  creation: string
  content: string
  owner: string
  comment_type: string
  published: number
}

export interface UserInfo {
  fullname: string
  image: string | null
  name: string
  email: string
  time_zone: string
}

export interface DocInfo {
  user_info: Record<string, UserInfo>
  comments: any[]
  shared: any[]
  assignment_logs: any[]
  attachment_logs: any[]
  info_logs: any[]
  like_logs: any[]
  workflow_logs: WorkflowLog[]
  doctype: string
  name: string
  attachments: any[]
  communications: any[]
  automated_messages: any[]
  versions: any[]
  assignments: any[]
  permissions: DocumentPermissions
  views: any[]
  additional_timeline_content: any[]
  milestones: any[]
  is_document_followed: boolean | null
  tags: string
  document_email: string | null
}

export interface LinkTitles {
  [key: string]: string // Format: "Doctype::name": "title"
}

export interface GetDocResponse {
  docs: Document[]
  docinfo: DocInfo
  _link_titles?: LinkTitles
} 