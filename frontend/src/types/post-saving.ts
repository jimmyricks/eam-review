/**
 * Response from post-saving operations
 */
export interface PostSavingResponse {
  message: {
    status: 'Success' | 'Error'
    message: string
    action: string
    exception?: any
  }
}
