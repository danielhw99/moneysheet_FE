import type { FoodPaymentMode } from '../../data/models'
import type { FoodAmounts } from './FoodSettingsFields'
import { validDate,daysInMonth } from '../../utils/date'
import { budgetAmount } from './budgetInput'
export function foodStartPreview(month:string,start:string,amounts:FoodAmounts,mode:FoodPaymentMode){
 if(!validDate(start)||start.slice(0,7)!==month)return null
 try{
  const food={weekday:budgetAmount(amounts.weekday),saturday:budgetAmount(amounts.saturday),sunday:budgetAmount(amounts.sunday)}
  const totals=[0,0,0],firstDay=Number(start.slice(8))
  for(let day=firstDay;day<=daysInMonth(month);day++){
   const dow=new Date(`${month}-${String(day).padStart(2,'0')}T12:00:00`).getDay()
   totals[day<=10?0:day<=20?1:2]+=dow===0?food.sunday:dow===6?food.saturday:food.weekday
  }
  const total=totals.reduce((a,b)=>a+b,0)
  return {total,first:mode==='monthStart'?total:totals[firstDay<=10?0:firstDay<=20?1:2]}
 }catch{return null}
}
