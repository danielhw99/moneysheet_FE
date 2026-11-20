import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import { ApiError } from '../../api/httpClient'
import CategoryManagementScreen from './CategoryManagementScreen'
beforeEach(()=>{
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')}
 HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}
})

it('keeps fixed categories separate and provides expense/income tabs only for transactions', async () => {
 const api=createMockDataAccess()
 const fixed=await api.createCategory({name:'Fixed only',scope:'fixedBudget'})
 await api.createCategory({name:'Expense only',scope:'mainTransaction',direction:'expense'})
 await api.createCategory({name:'Income only',scope:'mainTransaction',direction:'income'})
 const ui=(scope:'fixedBudget'|'mainTransaction')=><DataProvider implementation={api}><CategoryManagementScreen scope={scope} go={()=>{}} /></DataProvider>
 const view=render(ui('fixedBudget'))
 await screen.findByText(fixed.name)
 expect(screen.queryByRole('tab')).not.toBeInTheDocument()
 expect(screen.queryByText('Expense only')).not.toBeInTheDocument()
 view.rerender(ui('mainTransaction'))
 await screen.findByText('Expense only')
 fireEvent.click(screen.getByRole('tab',{name:'입금'}))
 await screen.findByText('Income only')
 expect(screen.queryByText('Expense only')).not.toBeInTheDocument()
})

it('keeps failed rename input, supports cancel, then refreshes the saved name', async () => {
 const api=createMockDataAccess()
 await api.createCategory({name:'Original',scope:'fixedBudget'})
 const update=vi.spyOn(api,'updateCategory').mockRejectedValueOnce(new ApiError(409,'CONFLICT','충돌',[{field:'name',message:'이미 사용 중인 이름입니다.'}]))
 render(<DataProvider implementation={api}><CategoryManagementScreen scope="fixedBudget" go={()=>{}} /></DataProvider>)
 fireEvent.click(await screen.findByRole('button',{name:'Original 수정'}))
 const field=screen.getByLabelText('카테고리 이름 수정')
 fireEvent.change(field,{target:{value:'Duplicate'}})
 fireEvent.click(screen.getByRole('button',{name:'저장'}))
 await screen.findByText('이미 사용 중인 이름입니다.')
 expect(field).toHaveValue('Duplicate')
 fireEvent.click(screen.getByRole('button',{name:'목록 새로고침'}))
 await waitFor(()=>expect(field).not.toBeDisabled())
 expect(screen.getByLabelText('카테고리 이름 수정')).toHaveValue('Duplicate')
 expect(screen.queryByRole('button',{name:'카테고리 추가'})).not.toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'취소'}))
 expect(await screen.findByText('Original')).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'Original 수정'}))
 fireEvent.change(screen.getByLabelText('카테고리 이름 수정'),{target:{value:'Renamed'}})
 fireEvent.click(screen.getByRole('button',{name:'저장'}))
 await screen.findByText('Renamed')
 expect(update).toHaveBeenCalledTimes(2)
})

it('clears editing after a successful refresh no longer contains the category', async () => {
 const api=createMockDataAccess()
 const category=await api.createCategory({name:'Removed elsewhere',scope:'fixedBudget'})
 vi.spyOn(api,'updateCategory').mockRejectedValueOnce(new ApiError(404,'NOT_FOUND','카테고리를 찾을 수 없어요.'))
 render(<DataProvider implementation={api}><CategoryManagementScreen scope="fixedBudget" go={()=>{}} /></DataProvider>)
 fireEvent.click(await screen.findByRole('button',{name:'Removed elsewhere 수정'}))
 fireEvent.change(screen.getByLabelText('카테고리 이름 수정'),{target:{value:'Unsaved'}})
 await api.deleteCategory(category.id)
 fireEvent.click(screen.getByRole('button',{name:'저장'}))
 await screen.findByRole('alert')
 fireEvent.click(screen.getByRole('button',{name:'목록 새로고침'}))
 await waitFor(()=>expect(screen.queryByLabelText('카테고리 이름 수정')).not.toBeInTheDocument())
 const add=await screen.findByRole('button',{name:'카테고리 추가'})
 await waitFor(()=>expect(add).toBeEnabled())
 fireEvent.click(add)
 expect(screen.getByLabelText('새 카테고리 이름')).toHaveValue('')
})

it('confirms deletion briefly and preserves fixed budget rows as uncategorized', async () => {
 const api=createMockDataAccess({today:()=> '2026-11-19'})
 const category=await api.createCategory({name:'Delete me',scope:'fixedBudget'})
 const item=await api.createBudgetItem('2026-11',{name:'Keep budget',categoryId:category.id,amount:100})
 const confirm=vi.spyOn(window,'confirm').mockReturnValue(false)
 render(<DataProvider implementation={api}><CategoryManagementScreen scope="fixedBudget" go={()=>{}} /></DataProvider>)
 fireEvent.click(await screen.findByRole('button',{name:'Delete me 삭제'}))
 fireEvent.click(within(screen.getByRole('dialog',{name:'카테고리 삭제'})).getByRole('button',{name:'취소'}))
 expect(screen.getByText('Delete me')).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'Delete me 삭제'}))
 fireEvent.click(within(screen.getByRole('dialog',{name:'카테고리 삭제'})).getByRole('button',{name:'삭제'}))
 await waitFor(()=>expect(screen.queryByText('Delete me')).not.toBeInTheDocument())
 expect(confirm).not.toHaveBeenCalled()
 expect((await api.getBudget('2026-11')).items.find(value=>value.id===item.id)?.categoryId).toBeNull()
})

it.each(['fixedBudget','mainTransaction'] as const)('keeps failed %s deletion in the dialog and retries the same target',async scope=>{
 const api=createMockDataAccess(),category=await api.createCategory({name:'Retry target',scope,...(scope==='mainTransaction'?{direction:'expense' as const}:{})})
 const actual=api.deleteCategory.bind(api),remove=vi.spyOn(api,'deleteCategory').mockImplementation(actual).mockRejectedValueOnce(new Error('remove failed'))
 render(<DataProvider implementation={api}><CategoryManagementScreen scope={scope} go={()=>{}}/></DataProvider>)
 fireEvent.click(await screen.findByRole('button',{name:'Retry target 삭제'}))
 const dialog=screen.getByRole('dialog',{name:'카테고리 삭제'})
 expect(remove).not.toHaveBeenCalled()
 fireEvent.click(within(dialog).getByRole('button',{name:'삭제'}))
 expect(await within(dialog).findByRole('alert')).toHaveTextContent('remove failed')
 expect(screen.getByText('Retry target')).toBeInTheDocument()
 fireEvent.click(within(dialog).getByRole('button',{name:'삭제'}))
 await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
 expect(remove.mock.calls.map(([id])=>id)).toEqual([category.id,category.id])
 await waitFor(()=>expect(screen.queryByText('Retry target')).not.toBeInTheDocument())
})

it('does not duplicate an in-flight category deletion',async()=>{
 const api=createMockDataAccess(),category=await api.createCategory({name:'Once',scope:'fixedBudget'})
 let done!:()=>void;const delay=new Promise<void>(resolve=>{done=resolve}),actual=api.deleteCategory.bind(api)
 const remove=vi.spyOn(api,'deleteCategory').mockImplementation(async id=>{await delay;return actual(id)})
 render(<DataProvider implementation={api}><CategoryManagementScreen scope="fixedBudget" go={()=>{}}/></DataProvider>)
 fireEvent.click(await screen.findByRole('button',{name:'Once 삭제'}))
 const dialog=screen.getByRole('dialog'),button=within(dialog).getByRole('button',{name:'삭제'})
 fireEvent.click(button);fireEvent.click(button)
 expect(remove).toHaveBeenCalledTimes(1);expect(button).toBeDisabled()
 fireEvent(dialog,new Event('cancel',{cancelable:true}))
 expect(dialog).toBeInTheDocument()
 await act(async()=>done())
 await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
 expect(remove).toHaveBeenCalledWith(category.id)
})

it('does not reintroduce a deleted category when a mock month loads later', async () => {
 const api=createMockDataAccess({today:()=> '2026-11-19'})
 const category=(await api.getCategories({scope:'fixedBudget'}))[0]
 await api.deleteCategory(category.id)
 expect((await api.getBudget('2026-11')).items.some(item=>item.categoryId===category.id)).toBe(false)
})

it('does not let an old expense response replace the income tab', async () => {
 const api=createMockDataAccess()
 let resolve!:(value: readonly never[])=>void
 const expense=new Promise<readonly never[]>(done=>{resolve=done})
 vi.spyOn(api,'getCategories').mockImplementation(async query=>query?.direction==='expense'?expense:[{id:'income',name:'Salary',scope:'mainTransaction',direction:'income'}])
 render(<DataProvider implementation={api}><CategoryManagementScreen scope="mainTransaction" go={()=>{}} /></DataProvider>)
 fireEvent.click(screen.getByRole('tab',{name:'입금'}))
 await screen.findByText('Salary')
 resolve([])
 await waitFor(()=>expect(screen.getByText('Salary')).toBeInTheDocument())
})
