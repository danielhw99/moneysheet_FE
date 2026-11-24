import { fireEvent,render,screen,waitFor } from '@testing-library/react'
import { it,expect,vi } from 'vitest'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import { currentMonth,localDateValue } from '../../utils/date'
import BudgetSetupScreen from './BudgetSetupScreen'
function start(editable=true){
 const api=createMockDataAccess(),month=currentMonth(),date=month+'-01'
 api.prepareBudget=vi.fn().mockResolvedValue({month,status:'draft',copiedFromMonth:null,items:[],foodStartDate:date,foodStartDateEditable:editable,food:{paymentMode:'threeInstallments',weekday:11000,saturday:11000,sunday:11000}})
 api.setupBudget=vi.fn().mockRejectedValue(new Error('저장 실패'))
 render(<DataProvider implementation={api}><BudgetSetupScreen month={month} onDone={vi.fn()} onCancel={vi.fn()}/></DataProvider>);return {api,month,date}
}
it('preserves selected start through previous navigation and failed save',async()=>{
 const {api,month,date}=start();fireEvent.click(await screen.findByRole('button',{name:'다음: 식비 설정'}))
 const chosen=localDateValue(new Date());expect(screen.getByLabelText('식비 시작일')).toHaveValue(date)
 fireEvent.change(screen.getByLabelText('식비 시작일'),{target:{value:chosen}})
 fireEvent.click(screen.getByRole('button',{name:'이전: 고정비 설정'}));fireEvent.click(screen.getByRole('button',{name:'다음: 식비 설정'}))
 expect(screen.getByLabelText('식비 시작일')).toHaveValue(chosen)
 fireEvent.click(screen.getByRole('button',{name:'예산 저장'}));expect(await screen.findByRole('alert')).toHaveTextContent('저장 실패')
 expect(screen.getByLabelText('식비 시작일')).toHaveValue(chosen)
 expect(api.setupBudget).toHaveBeenCalledWith(month,expect.objectContaining({foodStartDate:chosen,items:[]}))
})
it('keeps a server-fixed start read only and sends that date',async()=>{
 const {api,month,date}=start(false);fireEvent.click(await screen.findByRole('button',{name:'다음: 식비 설정'}))
 expect(screen.getByLabelText('식비 시작일')).toBeDisabled();fireEvent.click(screen.getByRole('button',{name:'예산 저장'}))
 await waitFor(()=>expect(api.setupBudget).toHaveBeenCalledWith(month,expect.objectContaining({foodStartDate:date})))
})
it('rejects an out-of-month date without submitting',async()=>{
 const {api}=start();fireEvent.click(await screen.findByRole('button',{name:'다음: 식비 설정'}))
 fireEvent.change(screen.getByLabelText('식비 시작일'),{target:{value:'2999-12-01'}});fireEvent.click(screen.getByRole('button',{name:'예산 저장'}))
 expect(await screen.findByRole('alert')).toHaveTextContent('식비 시작일');expect(api.setupBudget).not.toHaveBeenCalled()
})
