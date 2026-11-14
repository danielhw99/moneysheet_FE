import { useEffect, useRef } from 'react'
import { useOnboarding } from './OnboardingProvider'
export default function GuideDialog() {
  const guide = useOnboarding()
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    if (!guide?.guideOpen || !element) return
    element.showModal()
    return () => { if (element.open) element.close() }
  }, [guide?.guideOpen])
  if (!guide) return null
  return <dialog ref={dialog} className="guide-dialog" aria-labelledby="guide-title" aria-describedby="guide-description" onCancel={event => { event.preventDefault(); guide.closeGuide(false) }}>
    <div className="guide-heading"><h2 id="guide-title">moneysheet 사용 가이드</h2><button type="button" className="text-button" autoFocus onClick={() => guide.closeGuide(false)} aria-label="사용 가이드 닫기">닫기</button></div>
    <p id="guide-description">예산을 준비한 뒤에는 아래 세 가지를 기억해 주세요.</p>
    <section><h3>1. 예산 준비</h3><p>고정비는 필요한 항목만 추가하고 주중·토·일 하루 식비를 입력해요. 예산 저장을 눌러야 설정이 완료돼요. 다음 달에는 전달 목록과 식비를 확인해 다시 저장해요.</p></section>
    <section><h3>2. 오늘 여유비</h3><p>같은 달 전날 여유비에 오늘 식비를 더하고 오늘 본인 지출을 빼요. 월 1일은 오늘 식비에서 시작하며, 오늘 아낀 금액도 오늘 여유비에 포함돼요.</p></section>
    <section><h3>3. Main 잔액과 메모</h3><p>Main은 은행 앱 잔액과 비교할 계산 금액이에요. 아직 받지 못한 정산금처럼 임시 입출금은 메모로 남겨요. 메모는 Main에만 반영되고 여유비에는 영향을 주지 않아요.</p></section>
    <p className="form-help">현재는 예산 관리를 사용할 수 있어요. Daily·기록·자금 현황의 서버 연결은 준비 중이에요. 안내는 이 브라우저의 계정별로 기억하며, 사용 가이드에서 다시 볼 수 있어요.</p>
    <button className="primary-button" type="button" onClick={() => guide.closeGuide(true)}>확인했어요</button>
  </dialog>
}
