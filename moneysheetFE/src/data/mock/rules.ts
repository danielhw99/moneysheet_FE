export { validDate, daysInMonth } from '../../utils/date'
export { recordValue } from '../values'
export { validateRecord } from '../validation'
import type { MoneyRecord, FoodBudget } from '../models'

export const allowanceId = 'free-allowance'
// Prototype defaults; actual budget configuration is supplied by the service.
export const defaultFoodBudget: FoodBudget = { weekday: 11000, saturday: 18000, sunday: 15000 }
export const memoActive = (memo: MoneyRecord, date: string) => memo.date.slice(0, 7) === date.slice(0, 7) && memo.date <= date && (!memo.completedOn || memo.completedOn > date)
export const foodForDate = (date: string, food: FoodBudget = defaultFoodBudget) => {
  const day = new Date(date + 'T12:00:00').getDay()
  return day === 0 ? food.sunday : day === 6 ? food.saturday : food.weekday
}
export const foodThrough = (month: string, through: number, food: FoodBudget = defaultFoodBudget) => Array.from({ length: through }, (_, i) => foodForDate(month + '-' + String(i + 1).padStart(2, '0'), food)).reduce((sum, value) => sum + value, 0)
