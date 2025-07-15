<template>
  <div></div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  DayPilotCalendar,
  DayPilotNavigator,
  DayPilotMonth,
  DayPilot,
} from '@daypilot/daypilot-lite-vue'
import {
  NModal,
  NSpace,
  NIcon,
  NText,
  NButton,
  NButtonGroup,
  NForm,
  NFormItem,
  NSelect,
  NDatePicker,
  NResult,
  useMessage,
} from 'naive-ui'
import { ChevronLeft, ChevronRight, Refresh } from '@vicons/tabler'
import { useRouter } from 'vue-router'

const message = useMessage()
const router = useRouter()

// Use the standalone calendar data composable
const {
  loading,
  records,
  error,
  fetchRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  fetchLaborOptions,
} = useLaborAvailabilityData()

// State
const calendarRef = ref(null)
const monthRef = ref(null)
const formRef = ref<any>(null)
const showCreateDialog = ref(false)
const laborOptions = ref<any[]>([])
const loadingLaborOptions = ref(false)
const saving = ref(false)
const currentView = ref('Week')

// Form data
const formData = ref({
  labor: null as string | null,
  date: null as number | null,
})

// Form rules
const formRules = {
  labor: { required: true, message: 'Please select a labor' },
  date: { required: true, message: 'Please select a date' },
}

// Navigator configuration
const navigatorConfig = reactive({
  selectMode: 'Day',
  showMonths: 2,
  skipMonths: 2,
  startDate: DayPilot.Date.today().toString(),
  selectionDay: DayPilot.Date.today().toString(),
  onTimeRangeSelected: (args: any) => {
    try {
      if (args && args.day) {
        updateCalendarDate(args.day)
      }
    } catch (error) {
      console.error('Error in navigator time range selected:', error)
    }
  },
})

// Calendar configuration for Day/Week views
const calendarConfig = reactive({
  viewType: 'Week',
  startDate: DayPilot.Date.today().toString(),
  days: 7,
  durationBarVisible: false,
  navigationBarVisible: false,
  timeRangeSelectedHandling: 'Enabled',
  eventMoveHandling: 'Update',
  eventResizeHandling: 'Disabled',
  businessBeginsHour: 4,
  businessEndsHour: 18,
  dayBeginsHour: 4,
  dayEndsHour: 18,
  hourWidth: 40,
  eventHeight: 25,
  events: [] as any[],

  // Event handlers
  onTimeRangeSelected: (args: any) => {
    try {
      if (args && args.start) {
        const selectedDate = new DayPilot.Date(args.start)
        formData.value.date = selectedDate.getTime()
        showCreateDialog.value = true
        if (args.control && args.control.clearSelection) {
          args.control.clearSelection()
        }
      }
    } catch (error) {
      console.error('Error in time range selected:', error)
    }
  },

  onEventMoved: (args: any) => {
    try {
      if (args && args.e) {
        handleEventMoved(args)
      }
    } catch (error) {
      console.error('Error in event moved callback:', error)
    }
  },

  onBeforeEventRender: (args: any) => {
    try {
      if (args && args.data && args.e) {
        // Color coding for different labor
        const colors = [
          '#4ade80',
          '#60a5fa',
          '#f472b6',
          '#fb7185',
          '#fbbf24',
          '#a78bfa',
          '#34d399',
          '#fcd34d',
        ]
        const colorIndex = (args.e.data.laborName?.length || 0) % colors.length

        args.data.backColor = colors[colorIndex]
        args.data.borderColor = colors[colorIndex]
        args.data.fontColor = '#ffffff'
        args.data.fontWeight = '500'
      }
    } catch (error) {
      console.error('Error in before event render:', error)
    }
  },

  onEventClicked: (args: any) => {
    try {
      if (args && args.e && args.e.data) {
        const event = args.e.data
        if (event.originalData && event.originalData.name) {
          router.push(`/labor-availability/${event.originalData.name}`)
        }
      }
    } catch (error) {
      console.error('Error in event clicked:', error)
    }
  },
})

// Month calendar configuration
const monthConfig = reactive({
  startDate: DayPilot.Date.today().firstDayOfMonth().toString(),
  navigationBarVisible: false,
  eventHeight: 25,
  events: [] as any[],

  // Event handlers
  onTimeRangeSelected: (args: any) => {
    try {
      if (args && args.start) {
        const selectedDate = new DayPilot.Date(args.start)
        formData.value.date = selectedDate.getTime()
        showCreateDialog.value = true
        if (args.control && args.control.clearSelection) {
          args.control.clearSelection()
        }
      }
    } catch (error) {
      console.error('Error in time range selected (month view):', error)
    }
  },

  onEventClicked: (args: any) => {
    try {
      if (args && args.e && args.e.data) {
        const event = args.e.data
        if (event.originalData && event.originalData.name) {
          router.push(`/labor-availability/${event.originalData.name}`)
        }
      }
    } catch (error) {
      console.error('Error in event clicked (month view):', error)
    }
  },
})

// Computed
const currentDateDisplay = computed(() => {
  const activeStart =
    currentView.value === 'Month'
      ? monthConfig.startDate
      : calendarConfig.startDate
  const date = new DayPilot.Date(activeStart)

  switch (currentView.value) {
    case 'Day':
      return date.toString('dddd, MMMM d, yyyy')
    case 'Week':
      const weekEnd = date.addDays(6)
      return `${date.toString('MMM d')} - ${weekEnd.toString('MMM d, yyyy')}`
    case 'Month':
      return date.toString('MMMM yyyy')
    default:
      return date.toString('MMMM yyyy')
  }
})

// View switching
const switchView = (view: string) => {
  try {
    currentView.value = view

    // Update navigator select mode and calendar properties
    switch (view) {
      case 'Day':
        calendarConfig.viewType = 'Day'
        navigatorConfig.selectMode = 'Day'
        calendarConfig.days = 1
        break
      case 'Week':
        calendarConfig.viewType = 'Week'
        navigatorConfig.selectMode = 'Week'
        calendarConfig.days = 7
        // Ensure we start from beginning of week
        calendarConfig.startDate = new DayPilot.Date(calendarConfig.startDate)
          .firstDayOfWeek()
          .toString()
        break
      case 'Month':
        navigatorConfig.selectMode = 'Month'
        // Set to first day of month for monthConfig
        monthConfig.startDate = new DayPilot.Date(monthConfig.startDate)
          .firstDayOfMonth()
          .toString()
        break
    }

    // Use setTimeout to prevent watcher callback issues
    setTimeout(() => {
      loadEvents()
    }, 0)
  } catch (error) {
    console.error('Error switching view:', error)
    message.error('Failed to switch calendar view')
  }
}

// Date navigation helpers
const updateCalendarDate = (date: string) => {
  try {
    const newDate = new DayPilot.Date(date)

    switch (currentView.value) {
      case 'Day':
        calendarConfig.startDate = newDate.toString()
        break
      case 'Week':
        calendarConfig.startDate = newDate.firstDayOfWeek().toString()
        break
      case 'Month':
        monthConfig.startDate = newDate.firstDayOfMonth().toString()
        break
    }

    navigatorConfig.selectionDay = date

    // Use nextTick to ensure DOM updates before loading events
    setTimeout(() => {
      loadEvents()
    }, 0)
  } catch (error) {
    console.error('Error updating calendar date:', error)
    message.error('Failed to update calendar date')
  }
}

// Navigation
const navigateDate = (direction: number) => {
  const current = new DayPilot.Date(
    currentView.value === 'Month'
      ? monthConfig.startDate
      : calendarConfig.startDate,
  )
  let newDate: DayPilot.Date

  switch (currentView.value) {
    case 'Day':
      newDate = current.addDays(direction)
      break
    case 'Week':
      newDate = current.addDays(direction * 7)
      break
    case 'Month':
      newDate = current.addMonths(direction)
      break
    default:
      newDate = current.addDays(direction * 7)
  }

  updateCalendarDate(newDate.toString())
}

const goToToday = () => {
  updateCalendarDate(DayPilot.Date.today().toString())
}

// Event handlers
const handleEventMoved = async (args: any) => {
  try {
    const eventData = args.e.data
    if (!eventData || !eventData.originalData) {
      console.warn('Invalid event data for move operation')
      return
    }

    const newDate = new DayPilot.Date(args.newStart).toString('yyyy-MM-dd')

    await updateRecord(eventData.originalData.name, {
      date: newDate,
    })

    message.success('Event moved successfully')
    loadEvents()
  } catch (error: any) {
    console.error('Error moving event:', error)
    message.error('Failed to move event: ' + (error.message || 'Unknown error'))
    loadEvents() // Refresh to revert
  }
}

// Load events from records
const loadEvents = () => {
  try {
    const activeStartDate =
      currentView.value === 'Month'
        ? monthConfig.startDate
        : calendarConfig.startDate
    if (!activeStartDate) {
      console.warn('Calendar startDate not initialized')
      return
    }

    const startDate = new DayPilot.Date(activeStartDate)
    let endDate: DayPilot.Date

    // Calculate date range based on view
    switch (currentView.value) {
      case 'Day':
        endDate = startDate
        break
      case 'Week':
        endDate = startDate.addDays(6)
        break
      case 'Month':
        endDate = startDate.addMonths(1).addDays(-1)
        break
      default:
        endDate = startDate.addDays(6)
    }

    // Filter records for current view with safety checks
    const viewEvents = (records.value || [])
      .filter((record) => {
        if (!record || !record.date) return false
        try {
          const recordDate = new DayPilot.Date(record.date)
          return recordDate >= startDate && recordDate <= endDate
        } catch (err) {
          console.warn('Invalid date in record:', record.date)
          return false
        }
      })
      .map((record) => {
        try {
          return {
            id: record.name || `temp-${Math.random()}`,
            text: record.labor || 'Unknown Labor',
            start:
              new DayPilot.Date(record.date).toString('yyyy-MM-dd') +
              'T08:00:00',
            end:
              new DayPilot.Date(record.date).toString('yyyy-MM-dd') +
              'T09:00:00',
            laborName: record.labor || 'Unknown',
            originalData: record,
          }
        } catch (err) {
          console.warn('Error processing record:', record, err)
          return null
        }
      })
      .filter(Boolean) // Remove null entries

    // Update calendar events safely
    if (currentView.value === 'Month') {
      monthConfig.events = viewEvents
    } else if (calendarConfig) {
      calendarConfig.events = viewEvents
    }
  } catch (error) {
    console.error('Error loading events:', error)
    // Set empty events on error to prevent crash
    if (currentView.value === 'Month') {
      monthConfig.events = []
    } else if (calendarConfig) {
      calendarConfig.events = []
    }
  }
}

// Refresh data
const refreshData = async () => {
  try {
    const startDate = new DayPilot.Date(
      currentView.value === 'Month'
        ? monthConfig.startDate
        : calendarConfig.startDate,
    )
    let dateRange: { start: string; end: string }

    // Expand date range based on view
    switch (currentView.value) {
      case 'Day':
        dateRange = {
          start: startDate.addDays(-7).toString('yyyy-MM-dd'),
          end: startDate.addDays(7).toString('yyyy-MM-dd'),
        }
        break
      case 'Week':
        dateRange = {
          start: startDate.addDays(-14).toString('yyyy-MM-dd'),
          end: startDate.addDays(20).toString('yyyy-MM-dd'),
        }
        break
      case 'Month':
        dateRange = {
          start: startDate.addMonths(-1).toString('yyyy-MM-dd'),
          end: startDate.addMonths(2).toString('yyyy-MM-dd'),
        }
        break
      default:
        dateRange = {
          start: startDate.addDays(-14).toString('yyyy-MM-dd'),
          end: startDate.addDays(20).toString('yyyy-MM-dd'),
        }
    }

    await fetchRecords({ dateRange })
    loadEvents()
    message.success('Data refreshed successfully')
  } catch (err: any) {
    console.error('Error refreshing data:', err)
    message.error('Failed to refresh data: ' + (err.message || 'Unknown error'))
  }
}

// Labor options loading
const searchLaborOptions = async (query: string) => {
  if (loadingLaborOptions.value) return

  try {
    loadingLaborOptions.value = true
    laborOptions.value = await fetchLaborOptions(query)
  } catch (error) {
    console.error('Error loading labor options:', error)
    message.error('Failed to load labor options')
  } finally {
    loadingLaborOptions.value = false
  }
}

// Create/Save event
const saveEvent = async () => {
  if (!formRef.value) return

  try {
    saving.value = true

    await formRef.value.validate()

    if (!formData.value.labor || !formData.value.date) {
      message.error('Please fill in all required fields')
      return
    }

    const dateValue = new Date(formData.value.date).toISOString().split('T')[0]

    await createRecord({
      labor: formData.value.labor,
      date: dateValue,
    })

    message.success('Labor availability created successfully')
    showCreateDialog.value = false
    resetForm()
    loadEvents() // Refresh events
  } catch (error: any) {
    console.error('Error creating event:', error)
    message.error(
      'Failed to create availability: ' + (error.message || 'Unknown error'),
    )
  } finally {
    saving.value = false
  }
}

const cancelCreate = () => {
  showCreateDialog.value = false
  resetForm()
}

const resetForm = () => {
  formData.value = {
    labor: null,
    date: null,
  }
}

// Initialize on mount
onMounted(async () => {
  try {
    // Load initial labor options
    await searchLaborOptions('')

    // Load data for current view range
    await refreshData()
  } catch (err: any) {
    console.error('Error initializing calendar:', err)
    message.error(
      'Failed to initialize calendar: ' + (err.message || 'Unknown error'),
    )
  }
})
</script>

<style scoped>
.wrap {
  display: flex;
  height: calc(100vh - 200px);
}

.left {
  margin-right: 1rem;
  flex-shrink: 0;
}

.content {
  flex: 1;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* DayPilot Calendar Styles */
:deep(.daypilot_calendar_main) {
  border: none !important;
  font-family: inherit !important;
}

:deep(.daypilot_calendar_header_cell) {
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  font-weight: 600 !important;
  color: #374151 !important;
  text-align: center !important;
}

:deep(.daypilot_calendar_cell) {
  border-color: #e2e8f0 !important;
}

:deep(.daypilot_event) {
  border-radius: 3px !important;
  font-weight: 500 !important;
  font-size: 0.875rem !important;
  padding: 2px 4px !important;
}

:deep(.daypilot_calendar_cell_business) {
  background: #fefefe !important;
}

:deep(.daypilot_calendar_cell_nonbusiness) {
  background: #f8fafc !important;
}

/* Month view specific styling */
:deep(.calendar_default_month_cell_header) {
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  font-weight: 600 !important;
  padding: 4px !important;
}

:deep(.calendar_default_month_cell) {
  border-color: #e2e8f0 !important;
  min-height: 100px !important;
}

:deep(.calendar_default_month_cell_other) {
  background: #f9fafb !important;
  color: #9ca3af !important;
}

/* Navigator Styles */
:deep(.daypilot_navigator) {
  border: 1px solid #e2e8f0 !important;
  border-radius: 0.5rem !important;
  background: white !important;
}

:deep(.daypilot_navigator_day) {
  border: 1px solid transparent !important;
}

:deep(.daypilot_navigator_day:hover) {
  background: #f1f5f9 !important;
}

:deep(.daypilot_navigator_dayother) {
  color: #9ca3af !important;
}

:deep(.daypilot_navigator_weekend) {
  background: #fef2f2 !important;
}

:deep(.daypilot_navigator_weeknumber) {
  background: #f1f5f9 !important;
  color: #6b7280 !important;
  font-weight: 500 !important;
}
</style>
