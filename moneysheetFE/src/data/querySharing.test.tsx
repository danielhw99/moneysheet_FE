import {render,screen,waitFor,fireEvent} from '@testing-library/react'
import {describe,it,expect,vi} from 'vitest'
import {DataProvider,useDataAccess} from './DataProvider'
import {useDataQuery} from './useDataQuery'
import {createMockDataAccess} from './mock/createMockDataAccess'
function Consumer(){const q=useDataQuery('budget:2026-11',api=>api.getBudget('2026-11'),true);return <p>{q.loading?'waiting':q.error?'error':'ready'}</p>}
function Pair(){const {mutate}=useDataAccess();return <><Consumer/><Consumer/><button onClick={()=>void mutate(async()=>{})}>refresh</button></>}
describe('shared queries',()=>{
 it('shares the same query and refreshes after a mutation',async()=>{
  const api=createMockDataAccess({today:()=> '2026-11-17'}),load=vi.spyOn(api,'getBudget');
  render(<DataProvider implementation={api}><Pair/></DataProvider>);
  await waitFor(()=>expect(screen.queryAllByText('waiting')).toHaveLength(0));
  expect(load).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText('refresh'));
  await waitFor(()=>expect(load).toHaveBeenCalledTimes(2));
 });
})
