export interface SearchLinkRequest {
  txt: string
  doctype: string
  ignore_user_permissions?: string
  reference_doctype?: string
  page_length?: string
}

export interface SearchLinkResult {
  value: string
  description: string
  label: string
}

export interface SearchLinkResponse {
  message: SearchLinkResult[]
} 