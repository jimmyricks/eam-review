<template>
  <div class="trade-availability-calendar">
    <!-- Navigation Header -->
    <div class="calendar-header">
      <n-space justify="space-between" align="center" class="mb-3">
        <n-space align="center">
          <n-button-group>
            <n-button @click="navigateDay(-1)" size="medium">
              <template #icon>
                <n-icon><chevron-left /></n-icon>
              </template>
            </n-button>
            <n-button @click="navigateDay(1)" size="medium">
              <template #icon>
                <n-icon><chevron-right /></n-icon>
              </template>
            </n-button>
          </n-button-group>
          <n-button @click="goToToday" size="medium" type="primary" ghost>
            Today
          </n-button>
        </n-space>

        <n-text strong style="font-size: 1.2rem">
          Trade Availability - {{ currentDateDisplay }}
        </n-text>

        <n-space align="center">
          <n-button @click="refreshData" size="medium" secondary>
            <template #icon>
              <n-icon><refresh /></n-icon>
            </template>
            Refresh
          </n-button>
        </n-space>
      </n-space>
    </div>

    <!-- Calendar Layout -->
    <div class="wrap">
      <div class="left">
        <DayPilotNavigator
          :selectMode="'Day'"
          :showMonths="2"
          :skipMonths="2"
          :startDate="startDate"
          :selectionDay="startDate"
          @timeRangeSelected="onNavigatorSelection"
          :events="events"
        />
      </div>
      <div class="content">
        <DayPilotCalendar
          :viewType="'Resources'"
          :startDate="startDate"
          :columns="tradeColumns"
          :events="events"
          :eventHeight="30"
          :eventBorderRadius="5"
          :durationBarVisible="false"
          :navigationBarVisible="false"
          :timeRangeSelectedHandling="'Enabled'"
          :eventMoveHandling="'Update'"
          :eventResizeHandling="'Update'"
          @beforeEventRender="onBeforeEventRender"
          @timeRangeSelected="onTimeRangeSelected"
          @eventClicked="onEventClicked"
          @eventMoved="onEventMoved"
          @eventResized="onEventResized"
          ref="calendarRef"
        />
      </div>
    </div>

    <!-- Event Details Modal -->
    <n-modal
      v-model:show="showDialog"
      preset="card"
      :title="dialogTitle"
      style="width: 500px"
    >
      <div v-if="selectedEvent" class="event-dialog-content">
        <n-space direction="vertical" size="medium">
          <!-- Trade Information -->
          <n-card size="small">
            <template #header>
              <n-space align="center">
                <n-icon><person /></n-icon>
                <span>Trade Information</span>
              </n-space>
            </template>
            <n-descriptions :column="1" size="small">
              <n-descriptions-item label="Trade">
                {{ selectedEvent.tradeName }}
              </n-descriptions-item>
              <n-descriptions-item label="Specialization">
                {{ selectedEvent.specialization || 'N/A' }}
              </n-descriptions-item>
              <n-descriptions-item label="Status">
                <n-tag :type="getStatusType(selectedEvent.status)" size="small">
                  {{ selectedEvent.status }}
                </n-tag>
              </n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- Time Information -->
          <n-card size="small">
            <template #header>
              <n-space align="center">
                <n-icon><time-outline /></n-icon>
                <span>Schedule</span>
              </n-space>
            </template>
            <n-descriptions :column="1" size="small">
              <n-descriptions-item label="Date">
                {{ formatEventDate(selectedEvent.start) }}
              </n-descriptions-item>
              <n-descriptions-item label="Time">
                {{ formatEventTime(selectedEvent.start) }} -
                {{ formatEventTime(selectedEvent.end) }}
              </n-descriptions-item>
              <n-descriptions-item label="Duration">
                {{ calculateDuration(selectedEvent.start, selectedEvent.end) }}
              </n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- Additional Information -->
          <n-card
            v-if="selectedEvent.notes || selectedEvent.project"
            size="small"
          >
            <template #header>
              <n-space align="center">
                <n-icon><information-circle /></n-icon>
                <span>Details</span>
              </n-space>
            </template>
            <n-descriptions :column="1" size="small">
              <n-descriptions-item v-if="selectedEvent.project" label="Project">
                {{ selectedEvent.project }}
              </n-descriptions-item>
              <n-descriptions-item v-if="selectedEvent.notes" label="Notes">
                {{ selectedEvent.notes }}
              </n-descriptions-item>
            </n-descriptions>
          </n-card>
        </n-space>

        <!-- Action Buttons -->
        <div class="mt-4">
          <n-space justify="end">
            <n-button @click="showDialog = false">Close</n-button>
            <n-button
              v-if="canEditEvent(selectedEvent)"
              type="primary"
              @click="editEvent(selectedEvent)"
            >
              <template #icon>
                <n-icon><create /></n-icon>
              </template>
              Edit
            </n-button>
          </n-space>
        </div>
      </div>
    </n-modal>

    <!-- Create/Edit Event Modal -->
    <n-modal
      v-model:show="showCreateDialog"
      preset="card"
      :title="editingEvent ? 'Edit Availability' : 'Create Availability'"
      style="width: 500px"
    >
      <n-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-placement="top"
      >
        <n-form-item label="Trade" path="trade">
          <n-select
            v-model:value="formData.trade"
            :options="tradeOptions"
            placeholder="Select Trade"
            :disabled="!!editingEvent"
          />
        </n-form-item>

        <n-grid :cols="2" :x-gap="12">
          <n-form-item label="Start Time" path="startTime">
            <n-time-picker
              v-model:value="formData.startTime"
              format="HH:mm"
              placeholder="Start Time"
            />
          </n-form-item>
          <n-form-item label="End Time" path="endTime">
            <n-time-picker
              v-model:value="formData.endTime"
              format="HH:mm"
              placeholder="End Time"
            />
          </n-form-item>
        </n-grid>

        <n-form-item label="Status" path="status">
          <n-select
            v-model:value="formData.status"
            :options="statusOptions"
            placeholder="Select Status"
          />
        </n-form-item>

        <n-form-item label="Project (Optional)" path="project">
          <n-input
            v-model:value="formData.project"
            placeholder="Project name"
          />
        </n-form-item>

        <n-form-item label="Notes (Optional)" path="notes">
          <n-input
            v-model:value="formData.notes"
            type="textarea"
            placeholder="Additional notes"
            :rows="3"
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-space justify="end">
          <n-button @click="cancelEdit">Cancel</n-button>
          <n-button type="primary" @click="saveEvent">
            {{ editingEvent ? 'Update' : 'Create' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import {
  DayPilotCalendar,
  DayPilotNavigator,
  DayPilot,
} from '@daypilot/daypilot-lite-vue'
import {
  NModal,
  NSpace,
  NIcon,
  NText,
  NButton,
  NButtonGroup,
  NTag,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NForm,
  NFormItem,
  NSelect,
  NTimePicker,
  NInput,
  NGrid,
  useMessage,
} from 'naive-ui'
import {
  ChevronLeft,
  ChevronRight,
  Refresh,
  Person,
  TimeOutline,
  InformationCircle,
  Create,
} from '@vicons/tabler'

type Props = {
  trades?: any[]
  onLoadTrades?: () => Promise<any[]>
  onLoadAvailability?: (tradeId: string, date: string) => Promise<any[]>
  onCreateAvailability?: (data: any) => Promise<any>
  onUpdateAvailability?: (id: string, data: any) => Promise<any>
  onDeleteAvailability?: (id: string) => Promise<void>
}

const props = defineProps<Props>()
const message = useMessage()

// State
const startDate = ref(DayPilot.Date.today().toString())
const tradeColumns = ref<any[]>([])
const events = ref<any[]>([])
const showDialog = ref(false)
const showCreateDialog = ref(false)
const selectedEvent = ref<any>(null)
const editingEvent = ref<any>(null)
const calendarRef = ref<any>(null)
const formRef = ref<any>(null)

// Form data
const formData = ref({
  trade: null,
  startTime: null,
  endTime: null,
  status: 'available',
  project: '',
  notes: '',
})

// Constants
const statusOptions = [
  { label: 'Available', value: 'available' },
  { label: 'Busy', value: 'busy' },
  { label: 'Break', value: 'break' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Training', value: 'training' },
  { label: 'Off Duty', value: 'off' },
]

const statusColors = {
  available: '#059669',
  busy: '#dc2626',
  break: '#f59e0b',
  lunch: '#3b82f6',
  training: '#8b5cf6',
  off: '#6b7280',
}

// Form rules
const formRules = {
  trade: { required: true, message: 'Please select a trade' },
  startTime: { required: true, message: 'Please select start time' },
  endTime: { required: true, message: 'Please select end time' },
  status: { required: true, message: 'Please select status' },
}

// Computed
const currentDateDisplay = computed(() =>
  new DayPilot.Date(startDate.value).toString('dddd, MMMM d, yyyy'),
)

const dialogTitle = computed(() =>
  selectedEvent.value
    ? `${selectedEvent.value.tradeName} - Availability`
    : 'Availability Details',
)

const tradeOptions = computed(() =>
  tradeColumns.value.map((trade) => ({
    label: trade.name,
    value: trade.id,
  })),
)

// Navigation
const navigateDay = (direction: number) => {
  const current = new DayPilot.Date(startDate.value)
  startDate.value = current.addDays(direction).toString()
}

const goToToday = () => {
  startDate.value = DayPilot.Date.today().toString()
}

const onNavigatorSelection = (args: any) => {
  startDate.value = args.day
}

// Data loading
const loadTrades = async () => {
  try {
    let tradesData = props.trades || []

    if (props.onLoadTrades) {
      tradesData = await props.onLoadTrades()
    }

    tradeColumns.value = tradesData.map((trade) => ({
      id: trade.name || trade.id,
      name: trade.trade_name || trade.name || `Trade ${trade.id}`,
      specialization: trade.specialization,
    }))
  } catch (error) {
    console.error('Error loading trades:', error)
    message.error('Failed to load trades')
  }
}

const loadAvailability = async () => {
  try {
    events.value = []

    if (!tradeColumns.value.length) return

    const currentDate = new DayPilot.Date(startDate.value).toString(
      'yyyy-MM-dd',
    )

    // Load availability for each trade
    for (const trade of tradeColumns.value) {
      if (props.onLoadAvailability) {
        const availability = await props.onLoadAvailability(
          trade.id,
          currentDate,
        )

        const tradeEvents = availability.map((item) => ({
          id: item.name || item.id,
          text: `${trade.name} - ${item.status}`,
          start: `${currentDate}T${item.start_time || '09:00:00'}`,
          end: `${currentDate}T${item.end_time || '17:00:00'}`,
          resource: trade.id,
          status: item.status || 'available',
          tradeName: trade.name,
          specialization: trade.specialization,
          project: item.project,
          notes: item.notes,
          originalData: item,
        }))

        events.value.push(...tradeEvents)
      }
    }
  } catch (error) {
    console.error('Error loading availability:', error)
    message.error('Failed to load availability data')
  }
}

const refreshData = async () => {
  await loadTrades()
  await loadAvailability()
}

// Event handlers
const onBeforeEventRender = (args: any) => {
  const status = args.data.status || 'available'
  const color =
    statusColors[status as keyof typeof statusColors] || statusColors.available

  Object.assign(args.data, {
    backColor: color + 'E6',
    borderColor: color,
    fontColor: 'white',
    borderRadius: 4,
  })
}

const onTimeRangeSelected = async (args: any) => {
  args.control.clearSelection()

  // Prepare form for new event
  formData.value = {
    trade: args.resource,
    startTime: new Date(
      `1970-01-01T${new DayPilot.Date(args.start).toString('HH:mm:ss')}`,
    ),
    endTime: new Date(
      `1970-01-01T${new DayPilot.Date(args.end).toString('HH:mm:ss')}`,
    ),
    status: 'available',
    project: '',
    notes: '',
  }

  editingEvent.value = null
  showCreateDialog.value = true
}

const onEventClicked = (args: any) => {
  selectedEvent.value = args.e.data
  showDialog.value = true
}

const onEventMoved = async (args: any) => {
  // Handle event move
  console.log('Event moved:', args.e.data)
  message.info('Event moved successfully')
}

const onEventResized = async (args: any) => {
  // Handle event resize
  console.log('Event resized:', args.e.data)
  message.info('Event duration updated')
}

// Event management
const canEditEvent = (event: any) => {
  return !!event.originalData
}

const editEvent = (event: any) => {
  const startTime = new DayPilot.Date(event.start)
  const endTime = new DayPilot.Date(event.end)

  formData.value = {
    trade: event.resource,
    startTime: new Date(`1970-01-01T${startTime.toString('HH:mm:ss')}`),
    endTime: new Date(`1970-01-01T${endTime.toString('HH:mm:ss')}`),
    status: event.status,
    project: event.project || '',
    notes: event.notes || '',
  }

  editingEvent.value = event
  showDialog.value = false
  showCreateDialog.value = true
}

const saveEvent = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    const currentDate = new DayPilot.Date(startDate.value).toString(
      'yyyy-MM-dd',
    )
    const startTime = new Date(formData.value.startTime!)
    const endTime = new Date(formData.value.endTime!)

    const eventData = {
      trade: formData.value.trade,
      date: currentDate,
      start_time: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}:00`,
      end_time: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}:00`,
      status: formData.value.status,
      project: formData.value.project,
      notes: formData.value.notes,
    }

    if (editingEvent.value && props.onUpdateAvailability) {
      await props.onUpdateAvailability(editingEvent.value.id, eventData)
      message.success('Availability updated successfully')
    } else if (props.onCreateAvailability) {
      await props.onCreateAvailability(eventData)
      message.success('Availability created successfully')
    }

    showCreateDialog.value = false
    await refreshData()
  } catch (error) {
    console.error('Error saving event:', error)
    message.error('Failed to save availability')
  }
}

const cancelEdit = () => {
  showCreateDialog.value = false
  editingEvent.value = null
  formData.value = {
    trade: null,
    startTime: null,
    endTime: null,
    status: 'available',
    project: '',
    notes: '',
  }
}

// Utility functions
const formatEventDate = (date: any) =>
  new DayPilot.Date(date).toString('ddd, MMM d, yyyy')

const formatEventTime = (date: any) =>
  new DayPilot.Date(date).toString('h:mm tt')

const calculateDuration = (start: any, end: any) => {
  const startTime = new DayPilot.Date(start)
  const endTime = new DayPilot.Date(end)
  const diffMinutes = (endTime.value - startTime.value) / (1000 * 60)
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  return `${hours}h ${minutes}m`
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    available: 'success',
    busy: 'error',
    break: 'warning',
    lunch: 'info',
    training: 'info',
    off: 'default',
  }
  return typeMap[status] || 'default'
}

// Watchers
watch(() => startDate.value, loadAvailability)
watch(() => props.trades, loadTrades, { deep: true, immediate: true })

// Lifecycle
onMounted(async () => {
  await loadTrades()
  await loadAvailability()
})
</script>

<style scoped>
.trade-availability-calendar {
  width: 100%;
  height: 100%;
  font-family: 'Figtree', sans-serif;
}

.calendar-header {
  margin-bottom: 1rem;
}

.wrap {
  display: flex;
  height: calc(100vh - 200px);
  min-height: 600px;
  gap: 1rem;
}

.left {
  width: 280px;
  flex-shrink: 0;
}

.content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.mb-3 {
  margin-bottom: 0.75rem;
}

.mt-4 {
  margin-top: 1rem;
}

.event-dialog-content {
  max-height: 60vh;
  overflow-y: auto;
}

/* Resource Calendar Styling */
:deep(.calendar_default_matrix_horizontal_line) {
  border-color: #e5e7eb;
}

:deep(.calendar_default_rowheader_inner) {
  background: #f9fafb;
  border-color: #e5e7eb;
  font-weight: 500;
  color: #374151;
}

:deep(.calendar_default_event_inner) {
  font-size: 0.875rem;
  line-height: 1.25rem;
  padding: 0.25rem 0.5rem;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .left {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .wrap {
    flex-direction: column;
    height: auto;
  }

  .left {
    width: 100%;
  }
}
</style>
