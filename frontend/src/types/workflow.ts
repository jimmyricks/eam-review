// Workflow-related types

export interface WorkflowTransition {
  name: string
  owner: string
  creation: string
  modified: string
  modified_by: string
  docstatus: number
  idx: number
  state: string
  action: string
  next_state: string
  allowed: string
  allow_self_approval: number
  send_email_to_creator: number
  condition: string | null
  workflow_builder_id: string | null
  parent: string
  parentfield: string
  parenttype: string
  doctype: string
}