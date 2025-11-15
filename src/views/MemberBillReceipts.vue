<script setup lang="ts">
const receipts = [
  { id: 'INV-0012', date: '2025-01-04', amount: '$120.00', status: 'Paid' },
  { id: 'INV-0013', date: '2025-02-04', amount: '$120.00', status: 'Paid' },
  { id: 'INV-0014', date: '2025-03-04', amount: '$120.00', status: 'Due' },
]
</script>

<template>
  <section class="receipt-page">
    <header class="page-header">
      <h2>Bill Receipts</h2>
      <p>Download or review your historical gym membership receipts all in one place.</p>
    </header>

    <table class="table">
      <thead>
        <tr>
          <th>Receipt ID</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="receipt in receipts" :key="receipt.id">
          <td>{{ receipt.id }}</td>
          <td>{{ receipt.date }}</td>
          <td>{{ receipt.amount }}</td>
          <td>
            <span class="status" :class="receipt.status.toLowerCase()">{{ receipt.status }}</span>
          </td>
          <td>
            <button type="button" class="link-btn">Download</button>
          </td>
        </tr>
      </tbody>
    </table>
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
@media (max-width: 700px) {
  .table {
    display: block;
    overflow-x: auto;
  }
}
</style>

