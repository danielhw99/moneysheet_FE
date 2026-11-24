import { useEffect, useState } from 'react'
import type { FoodBudget, FoodPaymentMode } from '../../data/models'
import type { Screen } from '../../types/navigation'
import { useDataQuery } from '../../data/useDataQuery'
import { errorMessage, useDataAccess } from '../../data/DataProvider'
import { currentMonth } from '../../utils/date'
import Header from '../../components/Header'
import QueryStatus from '../../components/QueryStatus'
import FoodSettingsFields, { type FoodAmounts } from './FoodSettingsFields'
import { budgetAmount } from './budgetInput'

export default function FoodSettingsScreen({month,go}:{month:string;go:(screen:Screen)=>void}) {
 const query=useDataQuery(`food-settings:${month}`,api=>api.getBudget(month))
 return <main className="detail-shell budget-detail"><Header title="식비 설정" onBack={()=>go('monthly')}/><p className="notice">{month} 식비 설정</p>
  <QueryStatus {...query}/>
  {query.data&&!query.loading&&!query.error&&<p className="notice">식비 시작일: {query.data.foodStartDate} · 시작일은 변경할 수 없어요.</p>}
  {query.data && <FoodSettingsForm key={month} month={month} food={query.data.food} blocked={query.loading||!!query.error}/>}
  {query.errorCode==='BUDGET_NOT_READY'&&<button className="primary-button" onClick={()=>go('basic')}>월 예산 준비</button>}
 </main>
}
function FoodSettingsForm({month,food,blocked:queryBlocked}:{month:string;food:Readonly<FoodBudget>;blocked:boolean}) {
 const {mutate,pending}=useDataAccess()
 const [mode,setMode]=useState<FoodPaymentMode>(food.paymentMode)
 const [amounts,setAmounts]=useState<FoodAmounts>({weekday:food.weekday===null?'':String(food.weekday),saturday:food.saturday===null?'':String(food.saturday),sunday:food.sunday===null?'':String(food.sunday)})
 const [dirty,setDirty]=useState(false)
 useEffect(()=>{
  if(dirty||queryBlocked||pending)return
  setMode(food.paymentMode)
  setAmounts({weekday:food.weekday===null?'':String(food.weekday),saturday:food.saturday===null?'':String(food.saturday),sunday:food.sunday===null?'':String(food.sunday)})
 },[food,dirty,queryBlocked,pending])
 const [error,setError]=useState(''),[saved,setSaved]=useState(false),[saving,setSaving]=useState(false)
 const blocked=queryBlocked||pending||saving||month!==currentMonth()
 const save=async(event:React.FormEvent)=>{
  event.preventDefault();if(blocked)return
  setError('');setSaved(false)
  try {
   const input:FoodBudget={paymentMode:mode,weekday:budgetAmount(amounts.weekday),saturday:budgetAmount(amounts.saturday),sunday:budgetAmount(amounts.sunday)}
   setSaving(true)
   const result=await mutate(api=>api.updateFoodBudget(month,input))
   setMode(result.food.paymentMode)
   setAmounts({weekday:result.food.weekday===null?'':String(result.food.weekday),saturday:result.food.saturday===null?'':String(result.food.saturday),sunday:result.food.sunday===null?'':String(result.food.sunday)})
   setDirty(false);setSaved(true)
  }catch(e){setError(errorMessage(e))}finally{setSaving(false)}
 }
 return <form className="record-form food-settings-form" onSubmit={save} noValidate>
  <FoodSettingsFields mode={mode} setMode={value=>{setError('');setDirty(true);setMode(value);setSaved(false)}} amounts={amounts} setAmounts={value=>{setError('');setDirty(true);setAmounts(value);setSaved(false)}} disabled={blocked}/>
  <p className="notice">저장하면 이번 달 전체에 적용됩니다. 지난 날짜를 포함한 여유비·Main·월 현황이 다시 계산되며 지난달에는 영향을 주지 않습니다. 저장 없이 나가면 변경은 적용되지 않습니다.</p>
  {month!==currentMonth()&&<p className="form-help">지난달 식비 설정은 변경할 수 없어요.</p>}
  {error&&<p role="alert" className="field-error">{error}</p>}{saved&&<p role="status">식비 설정을 저장했어요.</p>}
  <button className="primary-button" disabled={blocked} aria-busy={saving}>{saving?'저장 중…':'저장'}</button>
 </form>
}
