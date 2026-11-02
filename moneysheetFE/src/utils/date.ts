export const localDateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const currentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(value + 'T12:00:00')
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day
}

export const daysInMonth = (month: string) => new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate()
