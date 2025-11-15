<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  memberService,
  notificationService,
  type Member,
  type Notification,
} from '../firebase/services'

const members = ref<Member[]>([])
const notifications = ref<Notification[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)

// Form data
const notificationForm = ref({
  title: '',
  message: '',
  type: 'Payment Reminder' as Notification['type'],
  targetType: 'All Members' as Notification['targetType'],
  memberId: '',
  scheduledDate: '',
  sendTime: '09:00',
  isRecurring: false,
  recurrenceType: 'Monthly' as 'Monthly' | 'Weekly' | 'Daily' | undefined,
})

const searchTerm = ref('')
const statusFilter = ref<'All' | Notification['status']>('All')
const typeFilter = ref<'All' | Notification['type']>('All')

// Load data
const loadMembers = async () => {
  try {
    members.value = await memberService.getAllMembers()
  } catch (error) {
    console.error('Error loading members:', error)
  }
}

const loadNotifications = async () => {
  try {
    isLoading.value = true
    notifications.value = await notificationService.getAllNotifications()
  } catch (error) {
    console.error('Error loading notifications:', error)
    alert('Failed to load notifications. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadMembers()
  await loadNotifications()
})

// Filtered notifications
const filteredNotifications = computed(() => {
  return notifications.value.filter((notif) => {
    const matchesSearch =
      notif.title.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      (notif.memberName && notif.memberName.toLowerCase().includes(searchTerm.value.toLowerCase()))

    const matchesStatus = statusFilter.value === 'All' || notif.status === statusFilter.value

    const matchesType = typeFilter.value === 'All' || notif.type === typeFilter.value

    return matchesSearch && matchesStatus && matchesType
  })
})

// Stats
const stats = computed(() => {
  const total = notifications.value.length
  const scheduled = notifications.value.filter((n) => n.status === 'Scheduled').length
  const sent = notifications.value.filter((n) => n.status === 'Sent').length
  const recurring = notifications.value.filter((n) => n.isRecurring).length

  return {
    total,
    scheduled,
    sent,
    recurring,
  }
})

// Create notification
const createNotification = async () => {
  if (!notificationForm.value.title || !notificationForm.value.message) {
    alert('Please fill in title and message')
    return
  }

  if (!notificationForm.value.scheduledDate) {
    alert('Please select a scheduled date')
    return
  }

  if (notificationForm.value.targetType === 'Specific Member' && !notificationForm.value.memberId) {
    alert('Please select a member')
    return
  }

  isSubmitting.value = true

  try {
    let memberName: string | undefined
    if (notificationForm.value.targetType === 'Specific Member') {
      const selectedMember = members.value.find((m) => m.id === notificationForm.value.memberId)
      if (selectedMember) {
        memberName = `${selectedMember.firstName} ${selectedMember.lastName}`
      }
    }

    await notificationService.createNotification({
      title: notificationForm.value.title,
      message: notificationForm.value.message,
      type: notificationForm.value.type,
      targetType: notificationForm.value.targetType,
      memberId: notificationForm.value.memberId || undefined,
      memberName,
      scheduledDate: notificationForm.value.scheduledDate,
      sendTime: notificationForm.value.sendTime,
      isRecurring: notificationForm.value.isRecurring,
      recurrenceType: notificationForm.value.isRecurring
        ? notificationForm.value.recurrenceType
        : undefined,
    })

    alert('Notification scheduled successfully!')

    // Reset form
    notificationForm.value = {
      title: '',
      message: '',
      type: 'Payment Reminder',
      targetType: 'All Members',
      memberId: '',
      scheduledDate: '',
      sendTime: '09:00',
      isRecurring: false,
      recurrenceType: 'Monthly',
    }

    // Reload notifications
    await loadNotifications()
  } catch (error) {
    console.error('Error creating notification:', error)
    alert('Failed to create notification. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

// Mark as sent
const markAsSent = async (notificationId: string) => {
  try {
    await notificationService.markAsSent(notificationId)
    alert('Notification marked as sent!')
    await loadNotifications()
  } catch (error) {
    console.error('Error marking notification as sent:', error)
    alert('Failed to update notification. Please try again.')
  }
}

// Delete notification
const deleteNotification = async (notificationId: string) => {
  const notif = notifications.value.find((n) => n.id === notificationId)
  if (!notif) return

  const confirmed = window.confirm(
    `Are you sure you want to delete the notification "${notif.title}"?`,
  )

  if (!confirmed) return

  try {
    await notificationService.deleteNotification(notificationId)
    alert('Notification deleted successfully!')
    await loadNotifications()
  } catch (error) {
    console.error('Error deleting notification:', error)
    alert('Failed to delete notification. Please try again.')
  }
}

// Format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Format datetime
const formatDateTime = (dateString: string, timeString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(`${dateString}T${timeString}`)
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Get default message based on type
const getDefaultMessage = (type: Notification['type']) => {
  switch (type) {
    case 'Payment Reminder':
      return 'This is a friendly reminder that your monthly payment is due. Please make the payment at your earliest convenience to continue enjoying our services.'
    case 'Membership Expiry':
      return 'Your membership is expiring soon. Please renew your membership to continue accessing our facilities.'
    case 'General':
      return 'We hope you are enjoying your fitness journey with us!'
    default:
      return ''
  }
}

// Update message when type changes
const onTypeChange = () => {
  if (notificationForm.value.type !== 'Custom') {
    notificationForm.value.message = getDefaultMessage(notificationForm.value.type)
  }
}
</script>

<template>
  <div class="notifications-page">
    <header class="page-header">
      <div>
        <h2>Monthly Notifications</h2>
        <p>Schedule and manage monthly notifications for gym members</p>
      </div>
    </header>

    <!-- Stats -->
    <section class="stats">
      <article class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Total Notifications</div>
      </article>
      <article class="stat-card">
        <div class="stat-value warning">{{ stats.scheduled }}</div>
        <div class="stat-label">Scheduled</div>
      </article>
      <article class="stat-card">
        <div class="stat-value success">{{ stats.sent }}</div>
        <div class="stat-label">Sent</div>
      </article>
      <article class="stat-card">
        <div class="stat-value info">{{ stats.recurring }}</div>
        <div class="stat-label">Recurring</div>
      </article>
    </section>

    <div class="content-grid">
      <!-- Create Notification Form -->
      <section class="create-form-section">
        <h3>Schedule Notification</h3>
        <form @submit.prevent="createNotification" class="notification-form">
          <div class="form-group">
            <label for="title">Title <span class="required">*</span></label>
            <input
              id="title"
              v-model="notificationForm.title"
              type="text"
              required
              placeholder="Enter notification title"
            />
          </div>

          <div class="form-group">
            <label for="type">Notification Type <span class="required">*</span></label>
            <select id="type" v-model="notificationForm.type" required @change="onTypeChange">
              <option value="Payment Reminder">Payment Reminder</option>
              <option value="Membership Expiry">Membership Expiry</option>
              <option value="General">General</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div class="form-group">
            <label for="message">Message <span class="required">*</span></label>
            <textarea
              id="message"
              v-model="notificationForm.message"
              rows="4"
              required
              placeholder="Enter notification message"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="targetType">Target Audience <span class="required">*</span></label>
            <select id="targetType" v-model="notificationForm.targetType" required>
              <option value="All Members">All Members</option>
              <option value="Active Members">Active Members</option>
              <option value="Expired Members">Expired Members</option>
              <option value="Specific Member">Specific Member</option>
            </select>
          </div>

          <div v-if="notificationForm.targetType === 'Specific Member'" class="form-group">
            <label for="memberId">Select Member <span class="required">*</span></label>
            <select id="memberId" v-model="notificationForm.memberId" required>
              <option value="">Choose a member...</option>
              <option v-for="member in members" :key="member.id" :value="member.id">
                {{ member.firstName }} {{ member.lastName }} - {{ member.email }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="scheduledDate">Scheduled Date <span class="required">*</span></label>
            <input
              id="scheduledDate"
              v-model="notificationForm.scheduledDate"
              type="date"
              required
            />
          </div>

          <div class="form-group">
            <label for="sendTime">Send Time <span class="required">*</span></label>
            <input id="sendTime" v-model="notificationForm.sendTime" type="time" required />
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input v-model="notificationForm.isRecurring" type="checkbox" />
              <span>Recurring Notification</span>
            </label>
          </div>

          <div v-if="notificationForm.isRecurring" class="form-group">
            <label for="recurrenceType">Recurrence Type <span class="required">*</span></label>
            <select id="recurrenceType" v-model="notificationForm.recurrenceType" required>
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
              <option value="Daily">Daily</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Scheduling...' : 'Schedule Notification' }}
          </button>
        </form>
      </section>

      <!-- Notifications List -->
      <section class="notifications-list-section">
        <div class="section-header">
          <h3>All Notifications</h3>
          <div class="filters">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Search notifications..."
              class="search-input"
            />
            <select v-model="statusFilter" class="filter-select">
              <option value="All">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Sent">Sent</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select v-model="typeFilter" class="filter-select">
              <option value="All">All Types</option>
              <option value="Payment Reminder">Payment Reminder</option>
              <option value="Membership Expiry">Membership Expiry</option>
              <option value="General">General</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
        </div>

        <div v-if="isLoading" class="loading-state">
          <p>Loading notifications...</p>
        </div>

        <div v-else-if="filteredNotifications.length === 0" class="empty-state">
          <p>No notifications found</p>
        </div>

        <div v-else class="notifications-grid">
          <article v-for="notif in filteredNotifications" :key="notif.id" class="notification-card">
            <div class="notification-header">
              <div>
                <div class="notification-title">{{ notif.title }}</div>
                <div class="notification-type">{{ notif.type }}</div>
              </div>
              <span :class="['status-badge', notif.status.toLowerCase()]">
                {{ notif.status }}
              </span>
            </div>

            <div class="notification-body">
              <div class="notification-message">{{ notif.message }}</div>

              <div class="notification-details">
                <div class="detail-item">
                  <span class="label">Target:</span>
                  <span class="value">
                    {{ notif.targetType }}
                    <span v-if="notif.memberName"> - {{ notif.memberName }}</span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="label">Scheduled:</span>
                  <span class="value">
                    {{ formatDateTime(notif.scheduledDate, notif.sendTime) }}
                  </span>
                </div>
                <div v-if="notif.isRecurring" class="detail-item">
                  <span class="label">Recurring:</span>
                  <span class="value">{{ notif.recurrenceType }}</span>
                </div>
                <div v-if="notif.sentAt" class="detail-item">
                  <span class="label">Sent At:</span>
                  <span class="value">{{ formatDate(notif.sentAt) }}</span>
                </div>
              </div>
            </div>

            <div class="notification-actions">
              <button
                v-if="notif.status === 'Scheduled'"
                type="button"
                class="btn btn-success"
                @click="markAsSent(notif.id!)"
              >
                Mark as Sent
              </button>
              <button type="button" class="btn btn-danger" @click="deleteNotification(notif.id!)">
                Delete
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.notifications-page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.page-header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 14px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.stat-value.success {
  color: #15803d;
}

.stat-value.warning {
  color: #b91c1c;
}

.stat-value.info {
  color: #2563eb;
}

.stat-label {
  margin-top: 6px;
  color: #64748b;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

.create-form-section,
.notifications-list-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.create-form-section h3,
.notifications-list-section h3 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
}

.notification-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 8px;
}

.required {
  color: #dc2626;
}

.checkbox-group label {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-group input[type='checkbox'] {
  width: auto;
  cursor: pointer;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  color: #0f172a;
  background: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-success {
  background: #10b981;
  color: #fff;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-danger:hover {
  background: #dc2626;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.filters {
  display: flex;
  gap: 12px;
}

.search-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
}

.search-input {
  min-width: 200px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.notifications-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.notification-title {
  font-weight: 600;
  color: #0f172a;
  font-size: 16px;
}

.notification-type {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.scheduled {
  background: #fef3c7;
  color: #b45309;
}

.status-badge.sent {
  background: #dcfce7;
  color: #166534;
}

.status-badge.cancelled {
  background: #f1f5f9;
  color: #475569;
}

.notification-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-message {
  color: #1e293b;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
}

.notification-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.detail-item .label {
  color: #64748b;
  font-weight: 500;
}

.detail-item .value {
  color: #0f172a;
  text-align: right;
}

.notification-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.notification-actions .btn {
  flex: 1;
  padding: 8px 16px;
  font-size: 12px;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .notifications-page {
    padding: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filters {
    flex-direction: column;
  }
}
</style>
