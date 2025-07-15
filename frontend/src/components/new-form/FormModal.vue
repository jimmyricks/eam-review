<template>
  <n-modal
    :show="show"
    :mask-closable="false"
    preset="card"
    :title="title"
    style="width: 80%; max-width: 1200px"
    @update:show="handleUpdateShow"
  >
    <FormPage
      :doctype="doctype"
      :name="name"
      :is-modal="true"
      @close="handleClose"
    />
  </n-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NModal } from 'naive-ui'
import FormPage from '@/components/core/FormPage.vue'

interface Props {
  show: boolean
  doctype: string
  name: string
}

const props = defineProps<Props>()

const emit = defineEmits(['update:show'])

const title = computed(() => {
  return `${props.doctype} - ${props.name}`
})

const handleClose = () => {
  emit('update:show', false)
}

const handleUpdateShow = (value: boolean) => {
  emit('update:show', value)
}
</script>
