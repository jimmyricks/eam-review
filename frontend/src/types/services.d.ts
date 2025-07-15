// Type declarations for service files

declare module '@/services/PurchaseStoreAPI' {
  export const frappeDB: {
    getDocList: (doctype: string, options?: any) => Promise<any[]>
    createDoc: (doctype: string, data: any) => Promise<any>
    updateDoc: <T>(doctype: string, name: string, data: Partial<T>) => Promise<T>
    deleteDoc: (doctype: string, name: string) => Promise<void>
  }
}

declare module '@/services/AssetManagementAPI' {
  export const frappeDB: {
    getDocList: (doctype: string, options?: any) => Promise<any[]>
    createDoc: (doctype: string, data: any) => Promise<any>
    updateDoc: <T>(doctype: string, name: string, data: Partial<T>) => Promise<T>
    deleteDoc: (doctype: string, name: string) => Promise<void>
  }
} 