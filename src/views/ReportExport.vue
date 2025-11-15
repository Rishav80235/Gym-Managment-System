<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  memberService,
  billService,
  feePackageService,
  notificationService,
  type Member,
  type Bill,
  type FeePackage,
  type Notification,
} from '../firebase/services'

const isLoading = ref(false)
const isGenerating = ref(false)

// Report configuration
const reportType = ref<
  'Members' | 'Bills' | 'Packages' | 'Financial' | 'Notifications' | 'Attendance'
>('Members')

const dateRange = ref({
  startDate: '',
  endDate: '',
})

const filters = ref({
  status: 'All',
  membershipType: 'All',
  billStatus: 'All',
  packageStatus: 'All',
})

// Data
const members = ref<Member[]>([])
const bills = ref<Bill[]>([])
const packages = ref<FeePackage[]>([])
const notifications = ref<Notification[]>([])

// Load all data
const loadAllData = async () => {
  try {
    isLoading.value = true
    const [membersData, billsData, packagesData, notificationsData] = await Promise.all([
      memberService.getAllMembers(),
      billService.getAllBills(),
      feePackageService.getAllPackages(),
      notificationService.getAllNotifications(),
    ])

    members.value = membersData
    bills.value = billsData
    packages.value = packagesData
    notifications.value = notificationsData
  } catch (error) {
    console.error('Error loading data:', error)
    alert('Failed to load data. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadAllData()
})

// Filtered data based on report type and filters
const filteredData = computed(() => {
  switch (reportType.value) {
    case 'Members':
      return members.value.filter((member) => {
        const matchesStatus =
          filters.value.status === 'All' || member.status === filters.value.status
        const matchesType =
          filters.value.membershipType === 'All' ||
          member.membershipType === filters.value.membershipType
        const matchesDate =
          !dateRange.value.startDate ||
          !dateRange.value.endDate ||
          (member.startDate >= dateRange.value.startDate &&
            member.startDate <= dateRange.value.endDate)
        return matchesStatus && matchesType && matchesDate
      })

    case 'Bills':
      return bills.value.filter((bill) => {
        const matchesStatus =
          filters.value.billStatus === 'All' || bill.status === filters.value.billStatus
        const matchesDate =
          !dateRange.value.startDate ||
          !dateRange.value.endDate ||
          (bill.dueDate >= dateRange.value.startDate && bill.dueDate <= dateRange.value.endDate)
        return matchesStatus && matchesDate
      })

    case 'Packages':
      return packages.value.filter((pkg) => {
        const matchesStatus =
          filters.value.packageStatus === 'All' || pkg.status === filters.value.packageStatus
        const matchesDate =
          !dateRange.value.startDate ||
          !dateRange.value.endDate ||
          (pkg.startDate >= dateRange.value.startDate && pkg.startDate <= dateRange.value.endDate)
        return matchesStatus && matchesDate
      })

    case 'Financial':
      return bills.value.filter((bill) => {
        const matchesDate =
          !dateRange.value.startDate ||
          !dateRange.value.endDate ||
          (bill.dueDate >= dateRange.value.startDate && bill.dueDate <= dateRange.value.endDate)
        return matchesDate
      })

    case 'Notifications':
      return notifications.value.filter((notif) => {
        const matchesDate =
          !dateRange.value.startDate ||
          !dateRange.value.endDate ||
          (notif.scheduledDate >= dateRange.value.startDate &&
            notif.scheduledDate <= dateRange.value.endDate)
        return matchesDate
      })

    case 'Attendance':
      // Placeholder for attendance data
      return []

    default:
      return []
  }
})

// Report statistics
const reportStats = computed(() => {
  switch (reportType.value) {
    case 'Members': {
      const membersData = filteredData.value as Member[]
      return {
        total: membersData.length,
        active: membersData.filter((m) => m.status === 'Active').length,
        expired: membersData.filter((m) => m.status === 'Expired').length,
      }
    }

    case 'Bills': {
      const billsData = filteredData.value as Bill[]
      return {
        total: billsData.length,
        totalAmount: billsData.reduce((sum, b) => sum + b.amount, 0),
        paid: billsData.filter((b) => b.status === 'Paid').length,
        pending: billsData.filter((b) => b.status === 'Pending').length,
      }
    }

    case 'Packages': {
      const packagesData = filteredData.value as FeePackage[]
      return {
        total: packagesData.length,
        totalRevenue: packagesData.reduce((sum, p) => sum + p.amount, 0),
        active: packagesData.filter((p) => p.status === 'Active').length,
      }
    }

    case 'Financial': {
      const financialBills = filteredData.value as Bill[]
      return {
        totalRevenue: financialBills.reduce((sum, b) => sum + b.amount, 0),
        paidAmount: financialBills
          .filter((b) => b.status === 'Paid')
          .reduce((sum, b) => sum + b.amount, 0),
        pendingAmount: financialBills
          .filter((b) => b.status === 'Pending' || b.status === 'Overdue')
          .reduce((sum, b) => sum + b.amount, 0),
      }
    }

    case 'Notifications': {
      const notificationsData = filteredData.value as Notification[]
      return {
        total: notificationsData.length,
        scheduled: notificationsData.filter((n) => n.status === 'Scheduled').length,
        sent: notificationsData.filter((n) => n.status === 'Sent').length,
      }
    }

    default:
      return {}
  }
})

// Export to CSV
const exportToCSV = () => {
  if (filteredData.value.length === 0) {
    alert('No data to export')
    return
  }

  isGenerating.value = true

  try {
    let csvContent = ''
    let headers: string[] = []
    let rows: (string | number)[][] = []

    switch (reportType.value) {
      case 'Members': {
        const membersData = filteredData.value as Member[]
        headers = [
          'ID',
          'Name',
          'Email',
          'Phone',
          'Membership Type',
          'Status',
          'Start Date',
          'End Date',
          'Dues',
        ]
        rows = membersData.map((m) => [
          m.id || '',
          `${m.firstName} ${m.lastName}`,
          m.email,
          m.phone,
          m.membershipType,
          m.status,
          m.startDate,
          m.endDate,
          m.dues || 0,
        ])
        break
      }

      case 'Bills': {
        const billsData = filteredData.value as Bill[]
        headers = [
          'Bill Number',
          'Member Name',
          'Amount',
          'Description',
          'Due Date',
          'Status',
          'Payment Date',
          'Payment Method',
        ]
        rows = billsData.map((b) => [
          b.billNumber,
          b.memberName,
          b.amount,
          b.description,
          b.dueDate,
          b.status,
          b.paymentDate || '',
          b.paymentMethod || '',
        ])
        break
      }

      case 'Packages': {
        const packagesData = filteredData.value as FeePackage[]
        headers = [
          'Package Name',
          'Member Name',
          'Amount',
          'Duration',
          'Start Date',
          'End Date',
          'Status',
        ]
        rows = packagesData.map((p) => [
          p.packageName,
          p.memberName,
          p.amount,
          `${p.duration} months`,
          p.startDate,
          p.endDate,
          p.status,
        ])
        break
      }

      case 'Financial': {
        const financialBills = filteredData.value as Bill[]
        headers = ['Bill Number', 'Member Name', 'Amount', 'Status', 'Due Date', 'Payment Date']
        rows = financialBills.map((b) => [
          b.billNumber,
          b.memberName,
          b.amount,
          b.status,
          b.dueDate,
          b.paymentDate || '',
        ])
        break
      }

      case 'Notifications': {
        const notificationsData = filteredData.value as Notification[]
        headers = [
          'Title',
          'Type',
          'Target',
          'Member',
          'Scheduled Date',
          'Send Time',
          'Status',
          'Recurring',
        ]
        rows = notificationsData.map((n) => [
          n.title,
          n.type,
          n.targetType,
          n.memberName || '',
          n.scheduledDate,
          n.sendTime,
          n.status,
          n.isRecurring ? n.recurrenceType || 'No' : 'No',
        ])
        break
      }
    }

    // Create CSV content
    csvContent = headers.join(',') + '\n'
    rows.forEach((row) => {
      csvContent += row.map((cell: string | number) => `"${cell}"`).join(',') + '\n'
    })

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `${reportType.value}_Report_${new Date().toISOString().split('T')[0]}.csv`,
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    alert('Report exported successfully!')
  } catch (error) {
    console.error('Error exporting report:', error)
    alert('Failed to export report. Please try again.')
  } finally {
    isGenerating.value = false
  }
}

// Export to JSON
const exportToJSON = () => {
  if (filteredData.value.length === 0) {
    alert('No data to export')
    return
  }

  isGenerating.value = true

  try {
    const jsonData = {
      reportType: reportType.value,
      generatedAt: new Date().toISOString(),
      dateRange: dateRange.value,
      filters: filters.value,
      stats: reportStats.value,
      data: filteredData.value,
    }

    const jsonContent = JSON.stringify(jsonData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `${reportType.value}_Report_${new Date().toISOString().split('T')[0]}.json`,
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    alert('Report exported successfully!')
  } catch (error) {
    console.error('Error exporting report:', error)
    alert('Failed to export report. Please try again.')
  } finally {
    isGenerating.value = false
  }
}

// Print report
const printReport = () => {
  if (filteredData.value.length === 0) {
    alert('No data to print')
    return
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const content = `
    <html>
      <head>
        <title>${reportType.value} Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; }
          .stats { margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>${reportType.value} Report</h1>
        <div class="stats">
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Records:</strong> ${filteredData.value.length}</p>
        </div>
        <p>Report data will be displayed here...</p>
      </body>
    </html>
  `

  printWindow.document.write(content)
  printWindow.document.close()
  printWindow.print()
}
</script>

<template>
  <div class="report-export-page">
    <header class="page-header">
      <div>
        <h2>Report Export</h2>
        <p>Generate and export various reports from your gym management system</p>
      </div>
    </header>

    <div class="content-grid">
      <!-- Report Configuration -->
      <section class="config-section">
        <h3>Report Configuration</h3>
        <div class="config-form">
          <div class="form-group">
            <label for="reportType">Report Type <span class="required">*</span></label>
            <select id="reportType" v-model="reportType" required>
              <option value="Members">Members Report</option>
              <option value="Bills">Bills Report</option>
              <option value="Packages">Packages Report</option>
              <option value="Financial">Financial Report</option>
              <option value="Notifications">Notifications Report</option>
              <option value="Attendance">Attendance Report</option>
            </select>
          </div>

          <div class="form-group">
            <label for="startDate">Start Date</label>
            <input id="startDate" v-model="dateRange.startDate" type="date" />
          </div>

          <div class="form-group">
            <label for="endDate">End Date</label>
            <input id="endDate" v-model="dateRange.endDate" type="date" />
          </div>

          <!-- Dynamic filters based on report type -->
          <template v-if="reportType === 'Members'">
            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" v-model="filters.status">
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
            <div class="form-group">
              <label for="membershipType">Membership Type</label>
              <select id="membershipType" v-model="filters.membershipType">
                <option value="All">All</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>
          </template>

          <template v-if="reportType === 'Bills'">
            <div class="form-group">
              <label for="billStatus">Bill Status</label>
              <select id="billStatus" v-model="filters.billStatus">
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </template>

          <template v-if="reportType === 'Packages'">
            <div class="form-group">
              <label for="packageStatus">Package Status</label>
              <select id="packageStatus" v-model="filters.packageStatus">
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </template>

          <div class="export-actions">
            <button
              type="button"
              class="btn btn-primary"
              @click="exportToCSV"
              :disabled="isGenerating || filteredData.length === 0"
            >
              {{ isGenerating ? 'Generating...' : 'Export CSV' }}
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              @click="exportToJSON"
              :disabled="isGenerating || filteredData.length === 0"
            >
              Export JSON
            </button>
            <button
              type="button"
              class="btn btn-info"
              @click="printReport"
              :disabled="filteredData.length === 0"
            >
              Print Report
            </button>
          </div>
        </div>
      </section>

      <!-- Report Preview -->
      <section class="preview-section">
        <div class="section-header">
          <h3>Report Preview</h3>
          <div class="record-count">{{ filteredData.length }} record(s) found</div>
        </div>

        <!-- Statistics -->
        <div v-if="reportStats && Object.keys(reportStats).length > 0" class="stats-cards">
          <div v-for="(value, key) in reportStats" :key="key" class="stat-card">
            <div class="stat-label">{{ key.replace(/([A-Z])/g, ' $1').trim() }}</div>
            <div class="stat-value">
              {{
                typeof value === 'number' && value > 1000
                  ? `₹${value.toLocaleString('en-IN')}`
                  : value
              }}
            </div>
          </div>
        </div>

        <!-- Data Preview -->
        <div v-if="isLoading" class="loading-state">
          <p>Loading data...</p>
        </div>

        <div v-else-if="filteredData.length === 0" class="empty-state">
          <p>No data found for the selected filters</p>
        </div>

        <div v-else class="data-preview">
          <div class="preview-note">
            <small>Showing preview of {{ filteredData.length }} record(s)</small>
          </div>
          <div class="preview-content">
            <p class="preview-text">
              Report data is ready for export. Use the export buttons to download the full report.
            </p>
            <div class="sample-data">
              <strong>Sample Data:</strong>
              <pre>{{ JSON.stringify(filteredData.slice(0, 2), null, 2) }}</pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.report-export-page {
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

.content-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

.config-section,
.preview-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.config-section h3,
.preview-section h3 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
}

.config-form {
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

.form-group input,
.form-group select {
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
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.export-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
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

.btn-secondary {
  background: #64748b;
  color: #fff;
}

.btn-secondary:hover:not(:disabled) {
  background: #475569;
}

.btn-info {
  background: #06b6d4;
  color: #fff;
}

.btn-info:hover:not(:disabled) {
  background: #0891b2;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.record-count {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.data-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-note {
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 12px;
  color: #475569;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-text {
  color: #1e293b;
  font-size: 14px;
  line-height: 1.6;
}

.sample-data {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.sample-data strong {
  display: block;
  margin-bottom: 8px;
  color: #0f172a;
  font-size: 14px;
}

.sample-data pre {
  margin: 0;
  font-size: 12px;
  color: #475569;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .report-export-page {
    padding: 16px;
  }

  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
</style>
