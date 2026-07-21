// One-time seed used to populate a new user's `categories` table on first
// login. After that, categories are fully user-managed (see useCategories).
export const DEFAULT_CATEGORIES = [
  { name: 'Groceries', icon: '🛒', period: 'monthly', is_savings: false, default_limit: 8000 },
  { name: 'Eating Out', icon: '🍔', period: 'monthly', is_savings: false, default_limit: 5000 },
  { name: 'Shopping', icon: '🛍️', period: 'monthly', is_savings: false, default_limit: 10000 },
  { name: 'Cabs', icon: '🚕', period: 'monthly', is_savings: false, default_limit: 2500 },
  { name: 'Baby', icon: '🍼', period: 'monthly', is_savings: false, default_limit: 5000 },
  { name: 'Subscriptions', icon: '🔁', period: 'yearly', is_savings: false, default_limit: 55896 },
  { name: 'Medical', icon: '⚕️', period: 'monthly', is_savings: false, default_limit: 2000 },
  { name: 'Misc', icon: '✦', period: 'monthly', is_savings: false, default_limit: 5000 },
  { name: 'Home', icon: '🏠', period: 'monthly', is_savings: false, default_limit: 0 },
  { name: 'Medicine', icon: '🩺', period: 'monthly', is_savings: false, default_limit: 0 },
  { name: 'Spouse', icon: '💍', period: 'monthly', is_savings: false, default_limit: 0 },
  { name: 'Rent', icon: '🏢', period: 'monthly', is_savings: false, default_limit: 0 },
  { name: 'Electricity', icon: '💡', period: 'monthly', is_savings: false, default_limit: 0 },
  { name: 'Two-Wheeler', icon: '🛵', period: 'monthly', is_savings: false, default_limit: 0 },
  { name: 'Fuel', icon: '⛽', period: 'monthly', is_savings: false, default_limit: 0 },
  { name: 'Parking', icon: '🅿️', period: 'monthly', is_savings: false, default_limit: 0 },
  { name: 'SIP', icon: '📈', period: 'monthly', is_savings: true, default_limit: 0 },
  { name: 'Chit Fund', icon: '🤝', period: 'monthly', is_savings: true, default_limit: 0 },
  { name: 'RD', icon: '🏦', period: 'monthly', is_savings: true, default_limit: 0 },
  { name: 'Gold', icon: '🪙', period: 'monthly', is_savings: true, default_limit: 0 },
  { name: 'Clothing', icon: '👕', period: 'monthly', is_savings: false, default_limit: 0 },
  { name: 'Haircut/Grooming', icon: '💇', period: 'monthly', is_savings: false, default_limit: 0 },
  { name: 'Health/Gym', icon: '💪', period: 'yearly', is_savings: false, default_limit: 0 },
  { name: 'Church/Tithe', icon: '🙏', period: 'monthly', is_savings: false, default_limit: 0 },
  { name: 'Trips', icon: '✈️', period: 'yearly', is_savings: false, default_limit: 0 },
  { name: 'Local Travel', icon: '🚗', period: 'monthly', is_savings: false, default_limit: 0 },
  { name: 'Hotel/Stay', icon: '🏨', period: 'monthly', is_savings: false, default_limit: 0 },
]

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

export const PAYMENT_MODE_ICONS = {
  cash: '💵',
  credit_card: '💳',
  upi: '📱',
  debit_card: '🏧',
}

export const PAYMENT_MODE_COLORS = {
  cash: '#9CA283',
  credit_card: '#3D4836',
  upi: '#E0C53D',
  debit_card: '#D9714B',
}
