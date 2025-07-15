<template>
  <div class="form-content">
    <n-tabs
      v-model:value="activeTab"
      type="line"
      size="medium"
      animated
      placement="top"
    >
      <!-- Details Tab -->
      <n-tab-pane v-if="canAccessFormPage" name="details" tab="Details">
        <div class="pt-2">
          <FormFields
            ref="formFieldsRef"
            :doctype="doctype"
            :document-name="documentName"
            :mode="mode"
            :metadata="metadata"
            :document-data="documentData"
            @update:field="handleFieldUpdate"
            @update:document="handleDocumentUpdate"
          />
        </div>
      </n-tab-pane>

      <!-- Linked Document Tabs -->
      <n-tab-pane
        v-if="!isNewDocument"
        v-for="linkTab in accessibleLinkTabs"
        :key="linkTab.link_doctype"
        :name="`link_${linkTab.link_doctype}`"
        :tab="getLinkTabLabel(linkTab)"
      >
        <FormTable
          :doctype="doctype"
          :document-name="documentName"
          :link-info="linkTab"
          :mode="mode"
          :disable-add-button="
            getTabConfig(linkTab.link_doctype)?.disableAddButton || false
          "
        />
      </n-tab-pane>

      <!-- Attachments Tab -->
      <n-tab-pane
        v-if="hasAttachments && !isNewDocument && canAccessFormPage"
        name="attachments"
        :tab="getAttachmentsTabLabel()"
      >
        <AttachmentsTab
          :doctype="doctype"
          :document-name="documentName"
          :mode="mode"
        />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NTabs, NTabPane, NBadge } from 'naive-ui'
import FormFields from './FormFields.vue'
import type { FormFieldsInstance } from './FormFields.vue'
import AttachmentsTab from './tabs/AttachmentsTab.vue'
import FormTable from './tabs/FormTable.vue'
import type { DoctypeMetadata, FormField } from '@/types/metadata'
import type { Document } from '@/types/document'
import { frappeCall } from '@/composables/useFrappeSDK'
import {
  useAttachmentService,
  useClientScriptService,
} from '@/composables/services'
import { useFormTabPermissions } from '@/composables/useGlobalPermissions'
import { usePermissionsStore } from '@/stores/permissions'

interface Props {
  doctype: string
  documentName: string
  mode: 'view' | 'edit'
  metadata: DoctypeMetadata
  documentData: Document
  originalData: Document
  attachmentCount?: number
}

interface Emits {
  (e: 'update:field', fieldname: string, value: any): void
  (e: 'update:document-data', data: Partial<Document>): void
}

const props = withDefaults(defineProps<Props>(), {
  attachmentCount: 0,
})
const emit = defineEmits<Emits>()

const formFieldsRef = ref<FormFieldsInstance | null>(null)

// Router
const route = useRoute()
const router = useRouter()

// Global permissions
const permissionsStore = usePermissionsStore()

// Client script service
const { getTabConfig } = useClientScriptService(props.doctype)

// Tab permissions
const { loadTabPermissions, filterLinkedTabs } = useFormTabPermissions(
  props.doctype,
)

// Active tab state
const activeTab = ref('details')

// Permission-based computed properties
const canRead = computed(() => {
  return permissionsStore.canRead(props.doctype)
})

const canWrite = computed(() => {
  return permissionsStore.canWrite(props.doctype)
})

const canCreate = computed(() => {
  return permissionsStore.canCreate(props.doctype)
})

const canDelete = computed(() => {
  return permissionsStore.canDelete(props.doctype)
})

const canSelect = computed(() => {
  return permissionsStore.canSearch(props.doctype)
})

const isNewDocument = computed(() => {
  return props.documentName === 'new'
})

// Proper Permission Logic using FrappePermissions logic
// Only can_read grants form access

// FORM ACCESS: Only can_read grants form access
const canAccessFormPage = computed(() => {
  return canRead.value
})

// EDITING: read + write = Edit capabilities
const canEditForm = computed(() => {
  return canRead.value && canWrite.value
})

// CREATING: create = Show "Add" buttons + /new Form access
const canCreateRecord = computed(() => {
  return canCreate.value
})

// For new documents: create permission is required
const canAccessNewRoute = computed(() => {
  return canCreate.value && canRead.value
})

// DELETING: delete + read = Delete from Form
const canDeleteFromForm = computed(() => {
  if (isNewDocument.value) {
    return false // Can't delete a new document
  }
  return canRead.value && canDelete.value
})

// SELECT: select = Enable search/link in forms (hide redirect button)
const canSearchLink = computed(() => {
  return canSelect.value
})

// Sync tab with URL hash
onMounted(() => {
  if (route.hash) {
    // Remove '#' from hash
    const tabName = route.hash.substring(1)
    // Check if a tab with this name exists
    const allTabs = [
      'details',
      'attachments',
      ...accessibleLinkTabs.value.map((l) => `link_${l.link_doctype}`),
    ]
    if (allTabs.includes(tabName)) {
      activeTab.value = tabName
    }
  }
})

watch(activeTab, (newTab) => {
  router.replace({ hash: `#${newTab}` })
})

// Computed properties
const formFields = computed(() => {
  if (!props.metadata.fields) return []

  return props.metadata.fields.filter(
    (field) =>
      // Only include fields that should be shown in form
      !field.hidden &&
      field.fieldtype !== 'Column Break' &&
      field.fieldtype !== 'Section Break',
  )
})

const attachmentFields = computed(() => {
  if (!props.metadata.fields) return []

  return props.metadata.fields.filter(
    (field) =>
      (field.fieldtype === 'Attach' || field.fieldtype === 'Attach Image') &&
      !field.hidden,
  )
})

const hasAttachments = computed(() => {
  return attachmentFields.value.length > 0 || props.metadata.max_attachments > 0
})

const linkTabs = computed(() => {
  if (!props.metadata.links) return []

  return props.metadata.links.filter(
    (link) => !link.hidden && link.link_doctype,
  )
})

// Filter linked tabs based on permissions
const accessibleLinkTabs = computed(() => {
  const allTabs = linkTabs.value
  const accessible = filterLinkedTabs(allTabs)
  const accessibleDoctypes = accessible.map((tab) => tab.link_doctype)
  const filteredOut = allTabs.filter(
    (tab) => !accessibleDoctypes.includes(tab.link_doctype),
  )
  if (filteredOut.length > 0) {
    // Debug log: show which tabs are filtered out due to permissions
    // eslint-disable-next-line no-console
    console.debug(
      '[FormContent] Tabs filtered out due to lack of can_read:',
      filteredOut.map((tab) => tab.link_doctype),
    )
  }
  return accessible
})

const linkCounts = ref<Record<string, number>>({})
const attachmentCount = computed(() => props.attachmentCount || 0)

const fetchLinkCounts = async () => {
  if (!props.metadata.links || !props.metadata.links.length) return

  try {
    const items = props.metadata.links
      .filter((link) => !link.hidden && link.link_doctype)
      .map((link) => link.link_doctype)

    const response: any = await frappeCall.get(
      'frappe.desk.notifications.get_open_count',
      {
        doctype: props.doctype,
        name: props.documentName,
        items: JSON.stringify(items),
      },
    )

    const countArr = response.message?.count?.external_links_found || []

    // Reset
    const counts: Record<string, number> = {}

    for (const item of countArr) {
      if (item.doctype) {
        counts[item.doctype] = item.count || 0
      }
    }

    linkCounts.value = counts

    // console.log('linkCounts', linkCounts.value)
  } catch (err) {
    console.error('Failed to fetch link counts:', err)
    linkCounts.value = {}
  }
}

// Load tab permissions when metadata changes
watch(
  () => [props.documentName, props.metadata.links],
  async () => {
    if (props.documentName && props.documentName !== 'new') {
      console.log(
        `Loading tab permissions for ${props.doctype} with ${linkTabs.value.length} linked tabs`,
      )
      await loadTabPermissions(linkTabs.value)
      await fetchLinkCounts()

      // Debug: Log accessible tabs
      console.log('Accessible tabs:', {
        details: canAccessFormPage.value,
        attachments: canAccessFormPage.value,
        linkedTabs: accessibleLinkTabs.value.map((tab) => tab.link_doctype),
      })
    }
  },
  { immediate: true },
)

const getAttachmentsTabLabel = (): any => {
  const count = attachmentCount.value || 0
  const label = 'Attachments'

  return h('span', { class: 'inline-flex items-center gap-2' }, [
    label,
    h(NBadge, {
      value: count,
      max: 99,
      type: count > 0 ? 'info' : 'default',
      size: 'small',
    }),
  ])
}

const getLinkTabLabel = (link: any): any => {
  const count = linkCounts.value[link.link_doctype] || 0
  const label = link.label || link.link_doctype.replace(/_/g, ' ')

  return h('span', { class: 'inline-flex items-center gap-2' }, [
    label,
    h(NBadge, {
      value: count,
      max: 99,
      type: count > 0 ? 'info' : 'default',
      size: 'small',
    }),
  ])
}

// Event handlers
const handleFieldUpdate = (fieldname: string, value: any) => {
  emit('update:field', fieldname, value)
}

const handleDocumentUpdate = (data: Partial<Document>) => {
  emit('update:document-data', data)
}

const validate = (): boolean => {
  if (formFieldsRef.value) {
    return formFieldsRef.value.validate()
  }
  return true
}

defineExpose({
  validate,
})

// Watch for document changes to reset tab if needed
watch(
  () => [props.doctype, props.documentName],
  () => {
    activeTab.value = 'details'
  },
)
</script>

<style scoped></style>
