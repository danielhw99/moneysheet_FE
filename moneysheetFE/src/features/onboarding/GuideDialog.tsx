import { useEffect, useRef, useState } from 'react'
import { useOnboarding } from './OnboardingProvider'
import { tutorialPages } from './tutorialPages'
export default function GuideDialog({onFinish}:{onFinish?:()=>void}) {
 const guide=useOnboarding(),dialog=useRef<HTMLDialogElement>(null)
 const [index,setIndex]=useState(0),body=useRef<HTMLDivElement>(null),heading=useRef<HTMLHeadingElement>(null)
 const open=!!guide?.guideOpen
 useEffect(()=>{if(!open||!dialog.current)return;setIndex(0);dialog.current.showModal();return()=>{if(dialog.current?.open)dialog.current.close()}},[open])
 useEffect(()=>{if(open){if(body.current)body.current.scrollTop=0;heading.current?.focus({preventScroll:true})}},[index,open])
 if(!open||!guide)return null
 const page=tutorialPages[index],last=index===tutorialPages.length-1
 const finish=(completed:boolean)=>{guide.closeGuide(completed);onFinish?.()}
 return <dialog ref={dialog} className="guide-dialog tutorial-dialog" aria-labelledby="guide-title" onCancel={e=>{e.preventDefault();finish(false)}}>
  <header className="tutorial-header"><span>사용 가이드</span>{!last&&<button className="text-button" onClick={()=>finish(false)}>건너뛰기</button>}<span className="tutorial-progress" aria-label="진행 상황">{index+1} / {tutorialPages.length}</span></header>
  <div className="tutorial-body" ref={body}><h2 id="guide-title" ref={heading} tabIndex={-1}>{page.title}</h2><p className="tutorial-lead">{page.lead}</p>
   {page.example&&<section className="tutorial-example" aria-label="설명용 예시"><small>설명용 예시 · 실제 저장되지 않아요</small><dl>{page.example.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>}
   {page.paragraphs.map(text=><p key={text}>{text}</p>)}
   {page.tip&&<aside className="tutorial-tip"><b>💡 개발자 꿀팁</b><p>{page.tip}</p></aside>}
   {page.warning&&<aside className="tutorial-warning"><b>⚠ 주의</b><p>{page.warning}</p></aside>}
  </div>
  <footer className="tutorial-actions">{index>0&&<button className="secondary-button" onClick={()=>setIndex(n=>Math.max(0,n-1))}>이전</button>}
   <button className="primary-button" onClick={()=>last?finish(true):setIndex(n=>Math.min(tutorialPages.length-1,n+1))}>{last?'시작하기':`다음: ${tutorialPages[index+1].title}`}</button>
  </footer>
 </dialog>
}
