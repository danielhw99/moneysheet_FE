import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import RecordList from './RecordList'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import type { MoneySheetDataAccess, RecordsSummary } from '../../data/MoneySheetDataAccess'
import type { MoneyRecord, ListKind } from '../../data/models'
const date='2026-11-02'
const row=(id:string,title:string,day=date):MoneyRecord=>({id,date:day,time:'12:30',title,amount:100,direction:'expense',categoryId:null,completedOn:null})
const page=(rows:MoneyRecord[],nextCursor:string|null=null):RecordsSummary=>({rows,nextCursor,expenseTotal:9000,incomeTotal:5000,total:-4000,pendingMemoTotal:-123})
function api() { return {...createMockDataAccess(),getCategories:vi.fn().mockResolvedValue([]),getRecords:vi.fn<MoneySheetDataAccess['getRecords']>()} }
function View({service,selected=date,kind='transactions',refreshToken=0}:{service:MoneySheetDataAccess;selected?:string;kind?:ListKind;refreshToken?:number}) {
 return <DataProvider implementation={service} refreshToken={refreshToken}><RecordList kind={kind} go={vi.fn()} date={selected} changeDate={vi.fn()}/></DataProvider>
}
it.each([
 ['transactions','expense'],['transactions','income'],['memos','expense'],['memos','income'],['fixed-pay','expense'],['income','income'],['extra','expense'],
] as const)('keeps retry keys but separates changed input and new forms for %s/%s',async(kind,direction)=>{
 const service=api();service.getRecords.mockResolvedValue({...page([]),pendingMemoTotal:0})
 service.getBudget=vi.fn().mockResolvedValue({month:'2026-11',items:[{id:'51',name:'Rent',categoryId:null,amount:100000,paid:0,remaining:100000,complete:false}],food:{enabled: true, paymentMode: 'threeInstallments', weekday:1,saturday:1,sunday:1},fixedTotal:100000,foodSummary:{total:30,installments:[11,10,9]}})
 const create=vi.spyOn(service,'createRecord').mockResolvedValue(row('8','Lunch')).mockRejectedValueOnce(new Error('response lost')).mockRejectedValueOnce(new Error('response lost'))
 render(<View service={service} kind={kind}/>);
 const add={transactions:'거래 추가',memos:'메모 추가','fixed-pay':'지급 기록 추가',income:'수입 추가',extra:'지출 추가'}[kind]
 const label=kind==='fixed-pay'?'이번 지급액':kind==='memos'?direction==='income'?'임시 입금 금액':'임시 출금 금액':kind==='transactions'?direction==='income'?'입금 금액':'지출 금액':'금액'
 async function open(amount:string) {
  const button=await screen.findByRole('button',{name:add});await waitFor(()=>expect(button).toBeEnabled());await userEvent.click(button)
  if(direction==='income'&&(kind==='transactions'||kind==='memos'))await userEvent.click(screen.getByRole('button',{name:kind==='memos'?'임시 입금':'입금'}))
  if(kind==='fixed-pay')await userEvent.selectOptions(screen.getByLabelText('고정지출 예산 항목'),'51')
  else await userEvent.type(screen.getByLabelText('내용'),'Lunch')
  await userEvent.type(screen.getByLabelText(label),amount)
 }
 await open('9000');await userEvent.click(screen.getByRole('button',{name:'저장'}));await screen.findByRole('alert')
 await userEvent.clear(screen.getByLabelText(label));await userEvent.type(screen.getByLabelText(label),'9,000');await userEvent.click(screen.getByRole('button',{name:'저장'}));await waitFor(()=>expect(create).toHaveBeenCalledTimes(2))
 const first=create.mock.calls[0][1]?.idempotencyKey
 expect(first).toEqual(expect.any(String));expect(create.mock.calls[1][1]?.idempotencyKey).toBe(first)
 await userEvent.clear(screen.getByLabelText(label));await userEvent.type(screen.getByLabelText(label),'9001');await userEvent.click(screen.getByRole('button',{name:'저장'}));await screen.findByRole('button',{name:add})
 expect(create.mock.calls[2][1]?.idempotencyKey).not.toBe(first)
 await open('9001');await userEvent.click(screen.getByRole('button',{name:'저장'}));await waitFor(()=>expect(create).toHaveBeenCalledTimes(4))
 expect(create.mock.calls[3][1]?.idempotencyKey).not.toBe(create.mock.calls[2][1]?.idempotencyKey)
})
it('shows a visible loading status until the initial records query completes',async()=>{
 let resolve!:(summary:RecordsSummary)=>void
 const service=api();service.getRecords.mockImplementation(()=>new Promise(done=>{resolve=done}))
 render(<View service={service}/>)
 expect(await screen.findByRole('status')).toHaveTextContent('불러오는 중')
 expect(screen.getByRole('status')).not.toHaveClass('query-status-loading')
 await act(async()=>resolve(page([])))
 expect(await screen.findByText('해당 기간의 기록이 없습니다.')).toBeInTheDocument()
 expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
it('keeps records visible and the loading status inside the list during refresh',async()=>{
 let resolve!:(summary:RecordsSummary)=>void
 const service=api();service.getRecords.mockResolvedValueOnce(page([row('1','Current')])).mockImplementationOnce(()=>new Promise(done=>{resolve=done}))
 const view=render(<View service={service}/>)
 expect(await screen.findByText('Current')).toBeInTheDocument()
 view.rerender(<View service={service} refreshToken={1}/>)
 await waitFor(()=>expect(service.getRecords).toHaveBeenCalledTimes(2))
 expect(screen.getByRole('status')).not.toHaveClass('query-status-loading')
 expect(screen.getByRole('region',{name:'기록 목록'})).toContainElement(screen.getByRole('status'))
 expect(screen.getByText('Current')).toBeInTheDocument()
 await act(async()=>resolve(page([row('1','Refreshed')])))
 expect(await screen.findByText('Refreshed')).toBeInTheDocument()
 expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
it('loads another cursor page without duplicate IDs or page-derived totals',async()=>{
 const service=api();service.getRecords.mockResolvedValueOnce(page([row('1','First')],'cursor-1')).mockResolvedValueOnce(page([row('1','First updated'),row('2','Second')]))
 render(<View service={service}/>);await screen.findByText('First');await userEvent.click(screen.getByRole('button',{name:'더 보기'}))
 expect(await screen.findByText('Second')).toBeInTheDocument();expect(screen.getAllByText('First updated')).toHaveLength(1)
 expect(service.getRecords).toHaveBeenLastCalledWith({kind:'transactions',date,cursor:'cursor-1'})
 expect(screen.getByText('9,000원')).toBeInTheDocument();expect(screen.queryByRole('button',{name:'더 보기'})).not.toBeInTheDocument()
})
it('ignores a delayed page after date changes and permits a first-page retry',async()=>{
 let resolve!:(p:RecordsSummary)=>void
 const service=api();service.getRecords.mockImplementation(q=>q.cursor?new Promise(r=>{resolve=r}):Promise.resolve(page([row(q.date==='2026-11-03'?'3':'1',q.date==='2026-11-03'?'New date':'Old date',q.date??date)],q.date===date?'cursor-1':null)))
 const view=render(<View service={service}/>);await screen.findByText('Old date');await userEvent.click(screen.getByRole('button',{name:'더 보기'}))
 view.rerender(<View service={service} selected="2026-11-03"/>);await screen.findByText('New date');await act(async()=>resolve(page([row('9','Stale page')])))
 expect(screen.queryByText('Stale page')).not.toBeInTheDocument();expect(screen.queryByText('Old date')).not.toBeInTheDocument()
})
it('resets cursor state between pending/completed memo tabs including empty completed history',async()=>{
 const service=api();service.getRecords.mockImplementation(q=>Promise.resolve(page(q.memoStatus==='completed'?[]:[row('1','Pending')],q.memoStatus==='pending'?'memo-cursor':null)))
 render(<View service={service} kind="memos"/>);await screen.findByText('Pending');await userEvent.click(screen.getByRole('button',{name:'완료 이력'}))
 await waitFor(()=>expect(service.getRecords).toHaveBeenLastCalledWith({kind:'memos',date,memoStatus:'completed'}))
 expect(screen.queryByText('Pending')).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'더 보기'})).not.toBeInTheDocument()
})
it('retains the editor input after a rejected save and refreshes summaries only after success',async()=>{
 const service=api();service.getRecords.mockResolvedValue(page([]));const create=vi.spyOn(service,'createRecord').mockRejectedValueOnce(new Error('Save failed')).mockResolvedValueOnce(row('2','Lunch'))
 render(<View service={service}/>);await screen.findByRole('button',{name:'거래 추가'});await userEvent.click(screen.getByRole('button',{name:'거래 추가'}))
 await userEvent.type(screen.getByLabelText('지출 금액'),'9000');await userEvent.type(screen.getByLabelText('내용'),'Lunch');await userEvent.click(screen.getByRole('button',{name:'저장'}))
 expect(await screen.findByRole('alert')).toHaveTextContent('Save failed');expect(screen.getByLabelText('내용')).toHaveValue('Lunch');expect(service.getRecords).toHaveBeenCalledTimes(1)
 await userEvent.click(screen.getByRole('button',{name:'저장'}));await screen.findByRole('button',{name:'거래 추가'});expect(create).toHaveBeenCalledTimes(2);await waitFor(()=>expect(service.getRecords).toHaveBeenCalledTimes(2))
})
it('passes the management month for memo completion and cancellation and refreshes the current tab',async()=>{
 const service=api();service.getRecords.mockImplementation(q=>Promise.resolve(page(q.memoStatus==='completed'?[{...row('2','Completed'),completedOn:date}]:[row('1','Pending')])));
 const complete=vi.spyOn(service,'completeMemo').mockResolvedValue({...row('1','Pending'),completedOn:date});const cancel=vi.spyOn(service,'cancelMemoCompletion').mockResolvedValue(row('2','Completed'))
 render(<View service={service} kind="memos"/>);await screen.findByText('Pending');await userEvent.click(screen.getByRole('checkbox',{name:'Pending 완료'}));expect(complete).toHaveBeenCalledWith('2026-11','1',date)
 await userEvent.click(screen.getByRole('button',{name:'완료 이력'}));await screen.findByText('Completed');await userEvent.click(screen.getByRole('checkbox',{name:'Completed 완료 취소'}));expect(cancel).toHaveBeenCalledWith('2026-11','2')
})

it('retains loaded rows after a page failure and retries a read without sending a write',async()=>{
 const service=api();service.getRecords.mockResolvedValueOnce(page([row('1','First')],'cursor-1')).mockRejectedValueOnce(new Error('Page failed')).mockResolvedValueOnce(page([row('2','Second')]))
 render(<View service={service}/>);await screen.findByText('First');await userEvent.click(screen.getByRole('button',{name:'더 보기'}))
 expect(await screen.findByRole('alert')).toHaveTextContent('Page failed');expect(screen.getByText('First')).toBeInTheDocument()
 await userEvent.click(screen.getByRole('button',{name:'더 보기 다시 시도'}));expect(await screen.findByText('Second')).toBeInTheDocument();expect(screen.getByText('First')).toBeInTheDocument();expect(service.getRecords).toHaveBeenCalledTimes(3)
})

it('names the fixed-item selector explicitly and blocks amounts above the remaining monthly budget',async()=>{
 const service=api();service.getRecords.mockResolvedValue({...page([]),total:0,expenseTotal:0,incomeTotal:0})
 vi.spyOn(service,'getBudget').mockResolvedValue({month:'2026-11',items:[{id:'51',name:'Rent',categoryId:'9',amount:10000,paid:6000,remaining:4000,complete:false}],food:{enabled: true, paymentMode: 'threeInstallments', weekday:11000,saturday:11000,sunday:11000},fixedTotal:10000,foodSummary:{total:330000,installments:[121000,110000,99000]}})
 const create=vi.spyOn(service,'createRecord');render(<View service={service} kind="fixed-pay"/>);await screen.findByText('해당 기간의 기록이 없습니다.')
 await userEvent.click(screen.getByRole('button',{name:'지급 기록 추가'}));await userEvent.selectOptions(screen.getByRole('combobox',{name:'고정지출 예산 항목'}),'51')
 await userEvent.type(screen.getByLabelText('이번 지급액'),'4001');await userEvent.click(screen.getByRole('button',{name:'저장'}))
 expect(await screen.findByRole('alert')).toHaveTextContent('지급 가능한 금액은 4,000원');expect(create).not.toHaveBeenCalled()
})
