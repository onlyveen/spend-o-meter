export const CATEGORIES = [
  'Groceries',
  'Eating Out',
  'Shopping',
  'Cabs',
  'Baby',
  'Subscriptions',
  'Medical',
  'Misc',
  // Family
  'Home',
  'Medicine',
  'Spouse',
  // Housing
  'Rent',
  'Electricity',
  // Transport
  'Two-Wheeler',
  'Fuel',
  'Parking',
  // Investments (tracking only)
  'SIP',
  'Chit Fund',
  'RD',
  'Gold',
  // Personal
  'Clothing',
  'Haircut/Grooming',
  'Health/Gym',
  'Church/Tithe',
  // Travel
  'Trips',
  'Local Travel',
  'Hotel/Stay',
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
  Home: 0,
  Medicine: 0,
  Spouse: 0,
  Rent: 0,
  Electricity: 0,
  'Two-Wheeler': 0,
  Fuel: 0,
  Parking: 0,
  SIP: 0,
  'Chit Fund': 0,
  RD: 0,
  Gold: 0,
  Clothing: 0,
  'Haircut/Grooming': 0,
  'Health/Gym': 0,
  'Church/Tithe': 0,
  Trips: 0,
  'Local Travel': 0,
  'Hotel/Stay': 0,
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
  Home: '#E0C53D',
  Medicine: '#D9714B',
  Spouse: '#3D4836',
  Rent: '#9CA283',
  Electricity: '#D9714B',
  'Two-Wheeler': '#E0C53D',
  Fuel: '#D9714B',
  Parking: '#6E7460',
  SIP: '#3D4836',
  'Chit Fund': '#9CA283',
  RD: '#E0C53D',
  Gold: '#D9714B',
  Clothing: '#3D4836',
  'Haircut/Grooming': '#9CA283',
  'Health/Gym': '#E0C53D',
  'Church/Tithe': '#6E7460',
  Trips: '#D9714B',
  'Local Travel': '#3D4836',
  'Hotel/Stay': '#9CA283',
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
  Home: '🏠',
  Medicine: '🩺',
  Spouse: '💍',
  Rent: '🏢',
  Electricity: '💡',
  'Two-Wheeler': '🛵',
  Fuel: '⛽',
  Parking: '🅿️',
  SIP: '📈',
  'Chit Fund': '🤝',
  RD: '🏦',
  Gold: '🪙',
  Clothing: '👕',
  'Haircut/Grooming': '💇',
  'Health/Gym': '💪',
  'Church/Tithe': '🙏',
  Trips: '✈️',
  'Local Travel': '🚗',
  'Hotel/Stay': '🏨',
}

export const PAYMENT_MODE_COLORS = {
  cash: '#9CA283',
  credit_card: '#3D4836',
  upi: '#E0C53D',
  debit_card: '#D9714B',
}
