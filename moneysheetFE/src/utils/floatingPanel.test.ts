import { afterEach, expect, it, vi } from 'vitest'
import { placeFloatingPanel, visibleViewportBounds } from './floatingPanel'

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals()})

it('intersects visual viewport and padded frame without double-counting safe area',()=>{
 const frame=document.createElement('div');frame.style.padding='44px 12px 34px 10px';document.body.append(frame)
 vi.spyOn(frame,'getBoundingClientRect').mockReturnValue({x:0,y:0,top:0,left:0,right:390,bottom:844,width:390,height:844,toJSON(){}})
 vi.stubGlobal('visualViewport',{offsetLeft:0,offsetTop:100,width:390,height:300})
 expect(visibleViewportBounds(frame)).toEqual({left:18,top:108,right:370,bottom:392})
 vi.stubGlobal('visualViewport',{offsetLeft:0,offsetTop:44,width:390,height:766})
 expect(visibleViewportBounds(frame)).toEqual({left:18,top:52,right:370,bottom:802})
 frame.remove()
})

it('limits a popup to the available space below a trigger in a short screen',()=>{
 const result=placeFloatingPanel({top:163,bottom:211,right:302},{left:8,top:8,right:312,bottom:402})
 expect(result.side).toBe('below');expect(result.top).toBe(217)
 expect(result.maxHeight).toBe(185);expect(result.left).toBeGreaterThanOrEqual(8)
 expect(result.left+result.width).toBeLessThanOrEqual(312)
})
it('opens above a low trigger when the top has more room',()=>{
 const result=placeFloatingPanel({top:360,bottom:404,right:300},{left:8,top:52,right:312,bottom:430})
 expect(result.side).toBe('above');expect(result.top).toBe(354)
 expect(result.top-result.maxHeight).toBe(52)
})
it('respects horizontal safe areas and a narrow visible viewport',()=>{
 const result=placeFloatingPanel({top:90,bottom:134,right:230},{left:50,top:20,right:250,bottom:350})
 expect(result.width).toBe(200);expect(result.left).toBe(50)
 expect(result.top+result.maxHeight).toBeLessThanOrEqual(350)
})
it('keeps a scrolled-off trigger popup within the remaining visual viewport',()=>{
 for(const anchor of [{top:-50,bottom:-6,right:320},{top:700,bottom:744,right:320}]){
  const result=placeFloatingPanel(anchor,{left:12,top:100,right:308,bottom:400})
  const top=result.side==='above'?result.top-result.maxHeight:result.top
  const bottom=result.side==='above'?result.top:result.top+result.maxHeight
  expect(top).toBeGreaterThanOrEqual(100);expect(bottom).toBeLessThanOrEqual(400)
 }
})
