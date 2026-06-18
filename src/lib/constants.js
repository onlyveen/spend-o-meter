export const CATEGORIES = [
  'Groceries',
  'Eating Out',
  'Shopping',
  'Cabs',
  'Baby',
  'Subscriptions',
  'Medical',
  'Misc',
]

export const DEFAULT_BUDGETS = {
  Groceries: 8000,
  'Eating Out': 5000,
  Shopping: 10000,
  Cabs: 2500,
  Baby: 5000,
  Subscriptions: 4658,
  Medical: 2000,
  Misc: 5000,
}

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'debit_card', label: 'Debit Card' },
]

export const PAYMENT_MODE_LABELS = PAYMENT_MODES.reduce((acc, p) => {
  acc[p.value] = p.label
  return acc
}, {})

export const CATEGORY_COLORS = {
  Groceries: '#E0C53D',
  'Eating Out': '#D9714B',
  Shopping: '#3D4836',
  Cabs: '#9CA283',
  Baby: '#D9714B',
  Subscriptions: '#3D4836',
  Medical: '#E0C53D',
  Misc: '#6E7460',
}

export const CATEGORY_ICONS = {
  Groceries: '🛒',
  'Eating Out': '🍔',
  Shopping: '🛍️',
  Cabs: '🚕',
  Baby: '🍼',
  Subscriptions: '🔁',
  Medical: '⚕️',
  Misc: '✦',
}

export const PAYMENT_MODE_COLORS = {
  cash: '#9CA283',
  credit_card: '#3D4836',
  upi: '#E0C53D',
  debit_card: '#D9714B',
}
