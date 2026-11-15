import { useEffect, useRef, useState } from 'react'
import { useDataAccess, errorMessage } from '../../data/DataProvider'
import type { RecordQuery, RecordsSummary } from '../../data/MoneySheetDataAccess'
import type { MoneyRecord } from '../../data/models'

type PageState = { key:string; first:RecordsSummary; rows:readonly Readonly<MoneyRecord>[]; cursor:string|null; loading:boolean; error:string }
export function useRecordPages(query:RecordQuery,first:RecordsSummary|undefined,blocked:boolean) {
 const {api,revision}=useDataAccess(), key=JSON.stringify([query,revision])
 const [state,setState]=useState<PageState|null>(null)
 const sequence=useRef(0),busy=useRef(false),latest=useRef({key,first})
 latest.current={key,first}
 useEffect(()=>{sequence.current++;busy.current=false;return()=>{sequence.current++}},[key,first])
 const current=state?.key===key && state.first===first?state:null
 const rows=current?.rows??first?.rows??[],cursor=current?current.cursor:first?.nextCursor??null
 const loadMore=async()=>{
  if(blocked || busy.current || !first || !cursor) return
  const token=++sequence.current;busy.current=true
  const same=()=>sequence.current===token && latest.current.key===key && latest.current.first===first
  setState({key,first,rows,cursor,loading:true,error:''})
  try {
   const page=await api.getRecords({...query,cursor})
   if(!same()) return
   if(page.nextCursor===cursor) throw new Error('목록이 변경됐어요. 처음부터 다시 불러와 주세요.')
   const combined=new Map(rows.map(row=>[row.id,row]));for(const row of page.rows) combined.set(row.id,row)
   // Header totals remain the first page's full-filter server totals, never sums of loaded rows.
   setState({key,first,rows:[...combined.values()],cursor:page.nextCursor,loading:false,error:''})
  } catch(error) { if(same()) setState({key,first,rows,cursor,loading:false,error:errorMessage(error)}) }
  finally { if(same()) busy.current=false }
 }
 return {rows,nextCursor:cursor,loading:current?.loading??false,error:current?.error??'',loadMore}
}
