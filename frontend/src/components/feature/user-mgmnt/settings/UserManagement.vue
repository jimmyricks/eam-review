<template>
  <n-card size="large">
    <n-thing content-indented>
      <template #header> User Management </template>
      <template #header-extra>
        <n-button type="primary" secondary size="medium" disabled>
          Add New User
        </n-button>
      </template>
      <n-space vertical size="large">
        <n-alert type="info" title="Coming Soon">
          User management functionality for administrators will be available in
          a future update. This will include:
          <ul class="mt-2 pl-4">
            <li>View all registered users</li>
            <li>Edit user permissions and roles</li>
            <li>Enable/disable user accounts</li>
            <li>Create new user accounts</li>
            <li>Bulk user operations</li>
          </ul>
        </n-alert>

        <!-- Placeholder for future user list -->
        <!-- <n-empty
          description="User management interface will be implemented here"
          size="large"
        >
          <template #extra>
            <n-space>
              <n-button secondary disabled> View Users </n-button>
              <n-button secondary disabled> Manage Permissions </n-button>
            </n-space>
          </template>
        </n-empty> -->
      </n-space>
    </n-thing>
  </n-card>
</template>

<script setup lang="ts">
import { NCard, NSpace, NText, NButton, NAlert, NEmpty, NThing } from 'naive-ui'
</script>

<style scoped>
ul {
  /* margin: 0.5rem 0; */
  /* padding-left: 1rem; */
}
</style>
