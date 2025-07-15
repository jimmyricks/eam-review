<template>
  <div class="service-test-page">
    <div class="test-controls">
      <h2>Boot Info Test</h2>
      <n-button
        type="primary"
        :loading="loading"
        @click="getBootInfo"
        :disabled="loading"
      >
        {{ loading ? 'Loading...' : 'Get Boot Info' }}
      </n-button>
    </div>

    <div class="test-results">
      <div v-if="error" class="error-message">
        <n-alert type="error" :title="'Error'" :show-icon="true">
          {{ error }}
        </n-alert>
      </div>

      <div v-if="bootInfo" class="success-message">
        <n-alert type="success" :title="'Success'" :show-icon="true">
          Boot info retrieved successfully!
        </n-alert>

        <div class="results-display">
          <h3>Boot Info JSON Response:</h3>

          <n-card title="Raw Boot Info" class="result-card">
            <div class="json-display">
              <pre>{{ JSON.stringify(bootInfo, null, 2) }}</pre>
            </div>
          </n-card>

          <!-- Permission Test Section -->
          <div v-if="bootInfo" class="permission-test-section">
            <h3>Permission Test Results:</h3>

            <n-card title="Permission Matrix Test" class="result-card">
              <div class="permission-test-controls">
                <n-input
                  v-model:value="testDoctype"
                  placeholder="Enter doctype to test (e.g., Asset)"
                  class="mb-4"
                />
                <n-button @click="runPermissionTest" type="primary">
                  Test Permissions
                </n-button>
              </div>

              <div v-if="permissionResults" class="permission-results">
                <h4>Permission Summary for "{{ testDoctype }}":</h4>

                <n-descriptions title="Direct Boot Info Permissions" bordered>
                  <n-descriptions-item label="Can Read">
                    <n-tag
                      :type="permissionResults.canRead ? 'success' : 'error'"
                    >
                      {{ permissionResults.canRead ? '✅ Yes' : '❌ No' }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="Can Write">
                    <n-tag
                      :type="permissionResults.canWrite ? 'success' : 'error'"
                    >
                      {{ permissionResults.canWrite ? '✅ Yes' : '❌ No' }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="Can Create">
                    <n-tag
                      :type="permissionResults.canCreate ? 'success' : 'error'"
                    >
                      {{ permissionResults.canCreate ? '✅ Yes' : '❌ No' }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="Can Delete">
                    <n-tag
                      :type="permissionResults.canDelete ? 'success' : 'error'"
                    >
                      {{ permissionResults.canDelete ? '✅ Yes' : '❌ No' }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="Can Select">
                    <n-tag
                      :type="permissionResults.canSelect ? 'success' : 'error'"
                    >
                      {{ permissionResults.canSelect ? '✅ Yes' : '❌ No' }}
                    </n-tag>
                  </n-descriptions-item>
                </n-descriptions>

                <n-descriptions
                  title="Access Permissions"
                  bordered
                  class="mt-4"
                >
                  <n-descriptions-item label="List Access">
                    <n-tag
                      :type="permissionResults.listAccess ? 'success' : 'error'"
                    >
                      {{ permissionResults.listAccess ? '✅ Yes' : '❌ No' }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="Form Access (existing)">
                    <n-tag
                      :type="permissionResults.formAccess ? 'success' : 'error'"
                    >
                      {{ permissionResults.formAccess ? '✅ Yes' : '❌ No' }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="New Form Access (/new)">
                    <n-tag
                      :type="
                        permissionResults.newFormAccess ? 'success' : 'error'
                      "
                    >
                      {{ permissionResults.newFormAccess ? '✅ Yes' : '❌ No' }}
                    </n-tag>
                  </n-descriptions-item>
                </n-descriptions>

                <n-descriptions
                  title="Action Permissions"
                  bordered
                  class="mt-4"
                >
                  <n-descriptions-item label="Can Edit">
                    <n-tag
                      :type="permissionResults.canEdit ? 'success' : 'error'"
                    >
                      {{ permissionResults.canEdit ? '✅ Yes' : '❌ No' }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="Can Create">
                    <n-tag
                      :type="permissionResults.canCreate ? 'success' : 'error'"
                    >
                      {{ permissionResults.canCreate ? '✅ Yes' : '❌ No' }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="Can Delete">
                    <n-tag
                      :type="permissionResults.canDelete ? 'success' : 'error'"
                    >
                      {{ permissionResults.canDelete ? '✅ Yes' : '❌ No' }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="Can Search Link">
                    <n-tag
                      :type="
                        permissionResults.canSearchLink ? 'success' : 'error'
                      "
                    >
                      {{ permissionResults.canSearchLink ? '✅ Yes' : '❌ No' }}
                    </n-tag>
                  </n-descriptions-item>
                </n-descriptions>

                <n-descriptions
                  title="Delete Permissions"
                  bordered
                  class="mt-4"
                >
                  <n-descriptions-item label="Can Delete from List">
                    <n-tag
                      :type="
                        permissionResults.canDeleteFromList
                          ? 'success'
                          : 'error'
                      "
                    >
                      {{
                        permissionResults.canDeleteFromList ? '✅ Yes' : '❌ No'
                      }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="Can Delete from Form">
                    <n-tag
                      :type="
                        permissionResults.canDeleteFromForm
                          ? 'success'
                          : 'error'
                      "
                    >
                      {{
                        permissionResults.canDeleteFromForm ? '✅ Yes' : '❌ No'
                      }}
                    </n-tag>
                  </n-descriptions-item>
                </n-descriptions>

                <n-descriptions title="UI Control Flags" bordered class="mt-4">
                  <n-descriptions-item label="Hide Edit Buttons">
                    <n-tag
                      :type="
                        permissionResults.hideEditButtons
                          ? 'warning'
                          : 'success'
                      "
                    >
                      {{
                        permissionResults.hideEditButtons
                          ? '🔒 Hidden'
                          : '👁️ Visible'
                      }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="Hide Add Buttons">
                    <n-tag
                      :type="
                        permissionResults.hideAddButtons ? 'warning' : 'success'
                      "
                    >
                      {{
                        permissionResults.hideAddButtons
                          ? '🔒 Hidden'
                          : '👁️ Visible'
                      }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="Hide Delete Buttons">
                    <n-tag
                      :type="
                        permissionResults.hideDeleteButtons
                          ? 'warning'
                          : 'success'
                      "
                    >
                      {{
                        permissionResults.hideDeleteButtons
                          ? '🔒 Hidden'
                          : '👁️ Visible'
                      }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="Hide Redirect Button">
                    <n-tag
                      :type="
                        permissionResults.hideRedirectButton
                          ? 'warning'
                          : 'success'
                      "
                    >
                      {{
                        permissionResults.hideRedirectButton
                          ? '🔒 Hidden'
                          : '👁️ Visible'
                      }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="Show Search Link Error">
                    <n-tag
                      :type="
                        permissionResults.showSearchLinkError
                          ? 'error'
                          : 'success'
                      "
                    >
                      {{
                        permissionResults.showSearchLinkError
                          ? '⚠️ Show Error'
                          : '✅ No Error'
                      }}
                    </n-tag>
                  </n-descriptions-item>
                </n-descriptions>

                <!-- UI Controls Test -->
                <div class="mt-6">
                  <h4>UI Controls Test:</h4>

                  <n-tabs type="line" animated>
                    <n-tab-pane name="list" tab="List Page Controls">
                      <n-descriptions bordered>
                        <n-descriptions-item label="Show Edit Button">
                          <n-tag
                            :type="
                              listControls.showEditButton ? 'success' : 'error'
                            "
                          >
                            {{
                              listControls.showEditButton ? '✅ Yes' : '❌ No'
                            }}
                          </n-tag>
                        </n-descriptions-item>
                        <n-descriptions-item label="Show Add Button">
                          <n-tag
                            :type="
                              listControls.showAddButton ? 'success' : 'error'
                            "
                          >
                            {{
                              listControls.showAddButton ? '✅ Yes' : '❌ No'
                            }}
                          </n-tag>
                        </n-descriptions-item>
                        <n-descriptions-item label="Show Delete Button">
                          <n-tag
                            :type="
                              listControls.showDeleteButton
                                ? 'success'
                                : 'error'
                            "
                          >
                            {{
                              listControls.showDeleteButton ? '✅ Yes' : '❌ No'
                            }}
                          </n-tag>
                        </n-descriptions-item>
                        <n-descriptions-item label="Show View Button">
                          <n-tag
                            :type="
                              listControls.showViewButton ? 'success' : 'error'
                            "
                          >
                            {{
                              listControls.showViewButton ? '✅ Yes' : '❌ No'
                            }}
                          </n-tag>
                        </n-descriptions-item>
                        <n-descriptions-item label="Allow Row Click">
                          <n-tag
                            :type="
                              listControls.allowRowClick ? 'success' : 'error'
                            "
                          >
                            {{
                              listControls.allowRowClick ? '✅ Yes' : '❌ No'
                            }}
                          </n-tag>
                        </n-descriptions-item>
                      </n-descriptions>
                    </n-tab-pane>

                    <n-tab-pane name="form" tab="Form Page Controls">
                      <n-descriptions bordered>
                        <n-descriptions-item label="Show Edit Button">
                          <n-tag
                            :type="
                              formControls.showEditButton ? 'success' : 'error'
                            "
                          >
                            {{
                              formControls.showEditButton ? '✅ Yes' : '❌ No'
                            }}
                          </n-tag>
                        </n-descriptions-item>
                        <n-descriptions-item label="Show Delete Button">
                          <n-tag
                            :type="
                              formControls.showDeleteButton
                                ? 'success'
                                : 'error'
                            "
                          >
                            {{
                              formControls.showDeleteButton ? '✅ Yes' : '❌ No'
                            }}
                          </n-tag>
                        </n-descriptions-item>
                        <n-descriptions-item label="Show Save Button">
                          <n-tag
                            :type="
                              formControls.showSaveButton ? 'success' : 'error'
                            "
                          >
                            {{
                              formControls.showSaveButton ? '✅ Yes' : '❌ No'
                            }}
                          </n-tag>
                        </n-descriptions-item>
                        <n-descriptions-item label="Make Read Only">
                          <n-tag
                            :type="
                              formControls.makeReadOnly ? 'warning' : 'success'
                            "
                          >
                            {{
                              formControls.makeReadOnly
                                ? '🔒 Read Only'
                                : '✏️ Editable'
                            }}
                          </n-tag>
                        </n-descriptions-item>
                      </n-descriptions>
                    </n-tab-pane>
                  </n-tabs>
                </div>
              </div>
            </n-card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NButton,
  NAlert,
  NCard,
  NInput,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NTabs,
  NTabPane,
} from 'naive-ui'
import { frappeCall } from '@/composables/useFrappeSDK'
import {
  FrappePermissions,
  type PermissionsSummary,
  type UIControls,
} from './permission-test'

// Reactive state
const loading = ref(false)
const error = ref<string | null>(null)
const bootInfo = ref<any>(null)
const testDoctype = ref('Asset Class')
const permissionResults = ref<PermissionsSummary | null>(null)
const listControls = ref<UIControls>({})
const formControls = ref<UIControls>({})

/**
 * Get boot info from the custom API
 */
const getBootInfo = async () => {
  loading.value = true
  error.value = null
  bootInfo.value = null
  permissionResults.value = null

  try {
    console.log('Calling boot info API...')

    // Call the boot info endpoint
    const response = await frappeCall.post(
      'ci_eam.custom_apis.boot_info.get_filtered_bootinfo',
    )

    // Extract the message from the response
    const result =
      response && (response as any).message !== undefined
        ? (response as any).message
        : response

    bootInfo.value = result

    console.log('Boot info retrieved:', bootInfo.value)
  } catch (err: any) {
    console.error('Error getting boot info:', err)
    error.value = err?.message || err?.toString() || 'Unknown error occurred'
  } finally {
    loading.value = false
  }
}

/**
 * Run permission test using the FrappePermissions class
 */
const runPermissionTest = () => {
  if (!bootInfo.value) {
    error.value = 'Please fetch boot info first'
    return
  }

  try {
    console.log('Running permission test for doctype:', testDoctype.value)

    // Create FrappePermissions instance
    const permissions = new FrappePermissions(bootInfo.value)

    // Get permission summary
    permissionResults.value = permissions.getPermissionsSummary(
      testDoctype.value,
    )

    // Get UI controls for different pages
    listControls.value = permissions.getUIControls(testDoctype.value, 'list')
    formControls.value = permissions.getUIControls(testDoctype.value, 'form')

    console.log('Permission test results:', {
      doctype: testDoctype.value,
      summary: permissionResults.value,
      listControls: listControls.value,
      formControls: formControls.value,
    })
  } catch (err: any) {
    console.error('Error running permission test:', err)
    error.value =
      err?.message || err?.toString() || 'Error running permission test'
  }
}
</script>

<style scoped>
.service-test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-controls {
  margin-bottom: 20px;
  text-align: center;
}

.test-controls h2 {
  margin-bottom: 16px;
  color: #333;
}

.test-results {
  margin-top: 20px;
}

.error-message,
.success-message {
  margin-bottom: 20px;
}

.results-display {
  margin-top: 20px;
}

.results-display h3 {
  margin-bottom: 16px;
  color: #333;
}

.result-card {
  margin-bottom: 20px;
}

.json-display {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
}

.json-display pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.permission-test-section {
  margin-top: 30px;
}

.permission-test-controls {
  margin-bottom: 20px;
}

.permission-results h4 {
  margin-bottom: 16px;
  color: #333;
}

.mt-4 {
  margin-top: 16px;
}

.mt-6 {
  margin-top: 24px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
