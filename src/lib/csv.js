import { PAYMENT_MODE_LABELS } from './constants'

export function expensesToCSV(expenses) {
  const header = ['Date', 'Category', 'Amount', 'Payment Mode', 'Description']
  const rows = expenses.map((e) => [
    e.date,
    e.category,
    e.amount,
    PAYMENT_MODE_LABELS[e.payment_mode] ?? e.payment_mode,
    (e.description ?? '').replace(/"/g, '""'),
  ])

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n')

  return csv
}

export function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
