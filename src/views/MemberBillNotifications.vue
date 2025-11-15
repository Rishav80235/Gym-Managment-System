<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { billService, type Bill } from '../firebase/services'

const bills = ref<Bill[]>([])
const readBills = ref<Set<string>>(new Set())
const isLoading = ref(true)

// Load bills for the current member
const loadBills = async () => {
  try {
    isLoading.value = true
    // Get all bills and filter by member (in a real app, you'd get memberId from auth)
    const allBills = await billService.getAllBills()
    
    // For now, we'll show all bills. In production, filter by memberId from auth
    bills.value = allBills
    
    // Load read status from localStorage
    const savedReadBills = localStorage.getItem('readBills')
    if (savedReadBills) {
      readBills.value = new Set(JSON.parse(savedReadBills))
    }
  } catch (error) {
    console.error('Error loading bills:', error)
    alert('Failed to load notifications. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadBills()
})

// Mark bill as read
const markAsRead = (billId: string) => {
  if (!billId) return
  
  readBills.value.add(billId)
  // Save to localStorage
  localStorage.setItem('readBills', JSON.stringify(Array.from(readBills.value)))
}

// Convert bill to notification format
const notifications = computed(() => {
  return bills.value.map((bill) => {
    const isRead = readBills.value.has(bill.id || '')
    const dueDate = new Date(bill.dueDate)
    const today = new Date()
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    let type: 'reminder' | 'success' | 'info' = 'info'
    let title = ''
    let detail = ''
    let time = ''
    
    if (bill.status === 'Paid') {
      type = 'success'
      title = 'Payment Received'
      detail = `We received your payment of ₹${bill.amount.toLocaleString('en-IN')} for ${bill.description || 'membership fee'}.`
      const paidDate = bill.paymentDate ? new Date(bill.paymentDate) : new Date()
      const daysAgo = Math.floor((today.getTime() - paidDate.getTime()) / (1000 * 60 * 60 * 24))
      time = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`
    } else if (bill.status === 'Overdue') {
      type = 'reminder'
      title = 'Payment Overdue'
      detail = `Your payment of ₹${bill.amount.toLocaleString('en-IN')} for ${bill.description || 'membership fee'} is overdue. Please pay immediately.`
      time = `Overdue by ${Math.abs(daysDiff)} ${Math.abs(daysDiff) === 1 ? 'day' : 'days'}`
    } else {
      type = 'reminder'
      title = 'Upcoming Payment Due'
      detail = `Your payment of ₹${bill.amount.toLocaleString('en-IN')} for ${bill.description || 'membership fee'} is due on ${dueDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}.`
      if (daysDiff === 0) {
        time = 'Due today'
      } else if (daysDiff === 1) {
        time = 'Due tomorrow'
      } else if (daysDiff > 0) {
        time = `Due in ${daysDiff} days`
      } else {
        time = 'Overdue'
      }
    }
    
    return {
      id: bill.id || '',
      billId: bill.id,
      title,
      detail,
      type,
      time,
      isRead,
    }
  })
})
</script>

<template>
  <section class="notification-page">
    <header class="page-header">
      <h2>Bill Notifications</h2>
      <p>Stay informed about payment reminders, confirmations, and special offers.</p>
    </header>

    <div v-if="isLoading" class="loading-state">
      <p>Loading notifications...</p>
    </div>
    <div v-else-if="notifications.length === 0" class="empty-state">
      <p>No notifications found</p>
    </div>
    <div v-else class="list">
      <article
        v-for="note in notifications"
        :key="note.id"
        class="item"
        :class="[note.type, { read: note.isRead }]"
      >
        <div class="indicator" />
        <div>
          <div class="title">{{ note.title }}</div>
          <div class="detail">{{ note.detail }}</div>
          <div class="time">{{ note.time }}</div>
        </div>
        <button
          v-if="!note.isRead"
          class="mark-btn"
          type="button"
          @click="markAsRead(note.billId || '')"
        >
          Mark as read
        </button>
        <span v-else class="read-badge">Read</span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.notification-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.page-header h2 {
  margin: 0 0 8px;
  font-size: 24px;
}
.page-header p {
  margin: 0;
  color: #64748b;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.item {
  position: relative;
  display: flex;
  gap: 16px;
  align-items: center;
  background: #ffffff;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}
.indicator {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #38bdf8;
  flex-shrink: 0;
}
.item.reminder .indicator {
  background: #f59e0b;
}
.item.success .indicator {
  background: #22c55e;
}
.item.info .indicator {
  background: #38bdf8;
}
.title {
  font-weight: 700;
  margin-bottom: 4px;
  color: #0f172a;
}
.detail {
  color: #475569;
  margin-bottom: 6px;
}
.time {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.mark-btn {
  margin-left: auto;
  border: none;
  background: transparent;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
}
.mark-btn:hover {
  text-decoration: underline;
}
.item.read {
  opacity: 0.7;
}
.read-badge {
  margin-left: auto;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}
.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}
@media (max-width: 720px) {
  .item {
    flex-direction: column;
    align-items: flex-start;
  }
  .mark-btn,
  .read-badge {
    margin-left: 0;
    margin-top: 8px;
  }
}
</style>
