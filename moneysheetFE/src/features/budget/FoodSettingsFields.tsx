import MoneyInput from '../../components/MoneyInput'
import type { FoodPaymentMode } from '../../data/models'

export type FoodAmounts = { weekday: string; saturday: string; sunday: string }
type Props = { enabled: boolean | null; setEnabled: (value: boolean) => void; mode: FoodPaymentMode; setMode: (value: FoodPaymentMode) => void; amounts: FoodAmounts; setAmounts: (value: FoodAmounts) => void; disabled?: boolean }
export default function FoodSettingsFields({enabled,setEnabled,mode,setMode,amounts,setAmounts,disabled=false}:Props) {
 return <section className="food-settings-fields">
  <h2>식비 관리</h2>
  <p className="form-help">하루 식비 예산을 정하면 당일 식비만 여유비에 더해지고, 실제 내역 지출만큼 차감돼요. 아낀 금액은 그날 여유비에 남아요.</p>
  <p className="form-help">Main에는 월 식비를 1일에 한 번 또는 1·12·22일에 나누어 계산해요. 실제 은행 이체는 직접 해야 하며, 같은 금액을 일반 입금으로 다시 기록하지 마세요.</p>
  <p className="form-help">사용하지 않으면 계산에 반영하는 식비는 0원이며, 다른 내역과 메모는 그대로 관리할 수 있어요. 나중에 앱 설정에서 변경할 수 있어요.</p>
  <label className="food-use-toggle"><span>식비 사용</span><input type="checkbox" role="switch" aria-label="식비 사용" checked={enabled===true} disabled={disabled} onChange={e=>setEnabled(e.target.checked)}/></label>
  {enabled===null && <p className="form-help">식비 사용 여부를 선택해 주세요.</p>}
  {enabled===null && <button type="button" className="secondary-button" disabled={disabled} onClick={()=>setEnabled(false)}>식비 사용하지 않기</button>}
  <fieldset className="food-settings-options" disabled={disabled||enabled!==true}>
   <label className="field"><span>지급 방식</span><select aria-label="지급 방식" value={mode} onChange={e=>setMode(e.target.value as FoodPaymentMode)}><option value="threeInstallments">1·12·22일에 3회 분할</option><option value="monthStart">월 1일에 전액 반영</option></select></label>
   {([['주중 식비','weekday'],['토요일 식비','saturday'],['일요일 식비','sunday']] as const).map(([label,key])=><label className="field" key={key}><span>{label}{enabled===true && <small> (필수)</small>}</span><MoneyInput aria-label={label} required={enabled===true} aria-required={enabled===true} value={amounts[key]} onValueChange={value=>setAmounts({...amounts,[key]:value})}/></label>)}
  </fieldset>
 </section>
}
