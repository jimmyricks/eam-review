import 'pinia'

declare module 'pinia' {
  export interface DefineSetupStoreOptions<Id, SS, S, G, A> {
    persist?: boolean | {
      key?: string
      storage?: Storage
      paths?: string[]
      serializer?: {
        serialize: (value: any) => string
        deserialize: (value: string) => any
      }
    }
  }
} 