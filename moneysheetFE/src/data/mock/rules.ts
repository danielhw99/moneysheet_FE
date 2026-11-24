export { validDate, daysInMonth } from '../../utils/date'
export { recordValue } from '../values'
export { validateRecord } from '../validation'
import type { MoneyRecord, FoodBudget } from '../models'

// Prototype defaults; actual budget configuration is supplied by the service.
export const defaultFoodBudget: FoodBudget = { paymentMode:'threeInstallments',weekday: 11000, saturday: 18000, sunday: 15000 }
export const memoActive = (memo: MoneyRecord, date: string) => memo.date.slice(0, 7) === date.slice(0, 7) && memo.date <= date && (!memo.completedOn || memo.completedOn > date)
export const foodForDate = (date: string, food: FoodBudget = defaultFoodBudget, start?:string) => {
  if(start && date<start)return 0
  const day = new Date(date + 'T12:00:00').getDay()
  return (day === 0 ? food.sunday : day === 6 ? food.saturday : food.weekday) ?? 0
}
export const foodThrough = (month: string, through: number, food: FoodBudget = defaultFoodBudget, start?:string) => Array.from({ length: through }, (_, i) => foodForDate(month + '-' + String(i + 1).padStart(2, '0'), food,start)).reduce((sum, value) => sum + value, 0)
