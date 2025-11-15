<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { billService, type Bill } from '../firebase/services'
import { getSession } from '../utils/auth'
import type { Timestamp } from 'firebase/firestore'

const bills = ref<Bill[]>([])
const isLoading = ref(true)
const selectedBill = ref<Bill | null>(null)
const showReceiptModal = ref(false)

// Load bills for the current member
const loadBills = async () => {
  try {
    isLoading.value = true
    const session = getSession()
    
    if (session) {
      // Get all bills and filter by member email or get bills by memberId
      // For now, we'll get all bills and filter by member name/email
      const allBills = await billService.getAllBills()
      // Filter bills for the current member (in production, use memberId from session)
      bills.value = allBills.filter((bill) => 
        bill.memberName.toLowerCase().includes(session.firstName.toLowerCase()) ||
        bill.memberName.toLowerCase().includes(session.lastName.toLowerCase())
      )
    } else {
      // If no session, show all paid bills
      const allBills = await billService.getAllBills()
      bills.value = allBills.filter((bill) => bill.status === 'Paid')
    }
  } catch (error) {
    console.error('Error loading bills:', error)
    alert('Failed to load receipts. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadBills()
})

// Filter only paid bills for receipts
const receipts = computed(() => {
  return bills.value.filter((bill) => bill.status === 'Paid')
})

// View receipt
const viewReceipt = (bill: Bill) => {
  selectedBill.value = bill
  showReceiptModal.value = true
}

// Close receipt modal
const closeReceiptModal = () => {
  showReceiptModal.value = false
  selectedBill.value = null
}

// Download receipt as PDF/HTML
const downloadReceipt = (bill: Bill) => {
  if (!bill) return

  // Create receipt HTML content
  const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${bill.billNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #2563eb;
      font-size: 32px;
    }
    .header p {
      margin: 5px 0;
      color: #64748b;
    }
    .receipt-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .info-section {
      flex: 1;
    }
    .info-section h3 {
      margin: 0 0 10px;
      color: #1e293b;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .info-section p {
      margin: 5px 0;
      color: #475569;
    }
    .bill-details {
      background: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #64748b;
    }
    .detail-value {
      color: #1e293b;
      font-weight: 500;
    }
    .total {
      background: #2563eb;
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: right;
      margin-top: 20px;
    }
    .total-label {
      font-size: 14px;
      margin-bottom: 5px;
      opacity: 0.9;
    }
    .total-amount {
      font-size: 32px;
      font-weight: 700;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      background: #dcfce7;
      color: #166534;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
    }
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Gym Management System</h1>
    <p>Payment Receipt</p>
  </div>

  <div class="receipt-info">
    <div class="info-section">
      <h3>Bill Information</h3>
      <p><strong>Receipt Number:</strong> ${bill.billNumber}</p>
      <p><strong>Status:</strong> <span class="status-badge">${bill.status}</span></p>
      <p><strong>Issue Date:</strong> ${formatDate(bill.createdAt)}</p>
    </div>
    <div class="info-section">
      <h3>Member Information</h3>
      <p><strong>Name:</strong> ${bill.memberName}</p>
      <p><strong>Member ID:</strong> ${bill.memberId.slice(0, 8)}</p>
    </div>
  </div>

  <div class="bill-details">
    <div class="detail-row">
      <span class="detail-label">Description:</span>
      <span class="detail-value">${bill.description || 'Membership Fee'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Due Date:</span>
      <span class="detail-value">${formatDate(bill.dueDate)}</span>
    </div>
    ${bill.paymentDate ? `
    <div class="detail-row">
      <span class="detail-label">Payment Date:</span>
      <span class="detail-value">${formatDate(bill.paymentDate)}</span>
    </div>
    ` : ''}
    ${bill.paymentMethod ? `
    <div class="detail-row">
      <span class="detail-label">Payment Method:</span>
      <span class="detail-value">${bill.paymentMethod}</span>
    </div>
    ` : ''}
  </div>

  <div class="total">
    <div class="total-label">Total Amount Paid</div>
    <div class="total-amount">₹${bill.amount.toLocaleString('en-IN')}</div>
  </div>

  <div class="footer">
    <p>This is a computer-generated receipt. No signature required.</p>
    <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
  </div>
</body>
</html>
  `

  // Create blob and download
  const blob = new Blob([receiptHTML], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Receipt-${bill.billNumber}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  // Also try to print if possible
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
    // Auto-print after a short delay
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

// Format date helper
const formatDate = (dateString: string | Timestamp | undefined) => {
  if (!dateString) return 'N/A'
  let date: Date
  if (typeof dateString === 'string') {
    date = new Date(dateString)
  } else if (dateString && typeof dateString === 'object' && 'toDate' in dateString) {
    date = (dateString as Timestamp).toDate()
  } else {
    return 'N/A'
  }
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <section class="receipt-page">
    <header class="page-header">
      <h2>Bill Receipts</h2>
      <p>Download or review your historical gym membership receipts all in one place.</p>
    </header>

    <div v-if="isLoading" class="loading-state">
      <p>Loading receipts...</p>
    </div>

    <div v-else-if="receipts.length === 0" class="empty-state">
      <p>No receipts found. Receipts will appear here once bills are paid.</p>
    </div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>Receipt ID</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Payment Method</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="receipt in receipts" :key="receipt.id">
          <td>{{ receipt.billNumber }}</td>
          <td>{{ formatDate(receipt.paymentDate || receipt.dueDate) }}</td>
          <td>₹{{ receipt.amount.toLocaleString('en-IN') }}</td>
          <td>{{ receipt.paymentMethod || 'N/A' }}</td>
          <td>
            <div class="action-buttons">
              <button type="button" class="link-btn view-btn" @click="viewReceipt(receipt)">
                View
              </button>
              <button type="button" class="link-btn" @click="downloadReceipt(receipt)">
                Download
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Receipt View Modal -->
    <transition name="fade">
      <div v-if="showReceiptModal && selectedBill" class="modal-overlay" @click.self="closeReceiptModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Receipt - {{ selectedBill.billNumber }}</h3>
            <button type="button" class="close-btn" @click="closeReceiptModal">×</button>
          </div>

          <div class="receipt-content">
            <div class="receipt-header">
              <h1>Gym Management System</h1>
              <p>Payment Receipt</p>
            </div>

            <div class="receipt-info-grid">
              <div class="info-section">
                <h4>Bill Information</h4>
                <p><strong>Receipt Number:</strong> {{ selectedBill.billNumber }}</p>
                <p><strong>Status:</strong> <span class="status-badge paid">{{ selectedBill.status }}</span></p>
                <p><strong>Issue Date:</strong> {{ formatDate(selectedBill.createdAt) }}</p>
              </div>
              <div class="info-section">
                <h4>Member Information</h4>
                <p><strong>Name:</strong> {{ selectedBill.memberName }}</p>
                <p><strong>Member ID:</strong> {{ selectedBill.memberId?.slice(0, 8) || 'N/A' }}</p>
              </div>
            </div>

            <div class="bill-details-section">
              <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">{{ selectedBill.description || 'Membership Fee' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Due Date:</span>
                <span class="detail-value">{{ formatDate(selectedBill.dueDate) }}</span>
              </div>
              <div v-if="selectedBill.paymentDate" class="detail-row">
                <span class="detail-label">Payment Date:</span>
                <span class="detail-value">{{ formatDate(selectedBill.paymentDate) }}</span>
              </div>
              <div v-if="selectedBill.paymentMethod" class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">{{ selectedBill.paymentMethod }}</span>
              </div>
            </div>

            <div class="total-section">
              <div class="total-label">Total Amount Paid</div>
              <div class="total-amount">₹{{ selectedBill.amount.toLocaleString('en-IN') }}</div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeReceiptModal">Close</button>
            <button type="button" class="btn btn-primary" @click="downloadReceipt(selectedBill)">
              Download Receipt
            </button>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.receipt-page {
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
.table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}
th,
td {
  text-align: left;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
}
th {
  background: #f8fafc;
  font-weight: 600;
  color: #1e293b;
}
tbody tr:last-child td {
  border-bottom: none;
}
.status {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.status.paid {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
}
.status.due {
  background: rgba(239, 68, 68, 0.15);
  color: #b91c1c;
}
.link-btn {
  border: none;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-weight: 600;
}
.link-btn:hover {
  text-decoration: underline;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.view-btn {
  color: #10b981;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Receipt Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f1f5f9;
}

.receipt-content {
  padding: 30px;
}

.receipt-header {
  text-align: center;
  border-bottom: 3px solid #2563eb;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.receipt-header h1 {
  margin: 0;
  color: #2563eb;
  font-size: 28px;
}

.receipt-header p {
  margin: 5px 0 0;
  color: #64748b;
}

.receipt-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  margin-bottom: 30px;
}

.info-section h4 {
  margin: 0 0 10px;
  color: #1e293b;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info-section p {
  margin: 5px 0;
  color: #475569;
}

.bill-details-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #64748b;
}

.detail-value {
  color: #1e293b;
  font-weight: 500;
}

.total-section {
  background: #2563eb;
  color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: right;
}

.total-label {
  font-size: 14px;
  margin-bottom: 5px;
  opacity: 0.9;
}

.total-amount {
  font-size: 32px;
  font-weight: 700;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.paid {
  background: #dcfce7;
  color: #166534;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 10px 20px;
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

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 700px) {
  .table {
    display: block;
    overflow-x: auto;
  }

  .receipt-info-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
    gap: 6px;
  }
}
</style>

