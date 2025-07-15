import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { frappeDB } from '@/services/PurchaseStoreAPI'
import { useRouter } from 'vue-router'

export interface BaseDoc {
  name: string
  [key: string]: any
}

export function createBaseStore<T extends BaseDoc>(options: {
  storeName: string
  doctype: string
  formatLabel?: (doc: T) => string
}) {
  return defineStore(options.storeName, () => {
    const documents = ref<T[]>([])
    const loaded = ref(false)
    const router = useRouter()

    const fetchDocuments = async (filters = {}) => {
      if (loaded.value) return
      try {
        const fetchedDocs = await frappeDB.getDocList(options.doctype, {
          fields: ['*'],
          filters,
        })
        documents.value = fetchedDocs
        loaded.value = true
      } catch (error) {
        console.error(`Error fetching ${options.doctype}:`, error)
      }
    }

    const addDocument = async (newDoc: T) => {
      try {
        const doc = await frappeDB.createDoc(options.doctype, newDoc)
        documents.value.push(doc)
        router.push(`/${options.doctype.toLowerCase()}/${doc.name}`)
        return { success: true, data: doc }
      } catch (error) {
        console.error(`Error adding ${options.doctype}:`, error)
        return { success: false, error }
      }
    }

    const updateDocument = async (docID: string, updatedData: Partial<T>) => {
      try {
        const updatedDoc = await frappeDB.updateDoc<T>(
          options.doctype,
          docID,
          updatedData,
        )
        const index = documents.value.findIndex((d) => d.name === docID)
        if (index !== -1) {
          documents.value[index] = updatedDoc
        }
        return { success: true, data: updatedDoc }
      } catch (error) {
        console.error(`Error updating ${options.doctype}:`, error)
        return { success: false, error }
      }
    }

    const deleteDocument = async (docName: string) => {
      try {
        await frappeDB.deleteDoc(options.doctype, docName)
        documents.value = documents.value.filter((d) => d.name !== docName)
        return { success: true }
      } catch (error: any) {
        console.error(`Error deleting ${options.doctype}:`, error)
        return { success: false, error: error.message }
      }
    }

    const documentOptions = computed(() =>
      documents.value.map((doc) => ({
        label: options.formatLabel ? options.formatLabel(doc) : doc.name,
        value: doc.name,
      })),
    )

    return {
      documents,
      documentOptions,
      fetchDocuments,
      addDocument,
      updateDocument,
      deleteDocument,
    }
  })
}
