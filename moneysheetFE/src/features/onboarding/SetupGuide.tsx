import { useOnboarding } from './OnboardingProvider'
export default function SetupGuide() {
  const guide = useOnboarding()
  if (guide?.stage !== 'setup') return null
  return <aside className="setup-guide" aria-label="첫 예산 설정 안내">
    <div><b>첫 예산을 함께 준비해 볼까요?</b><p>고정비는 선택이에요. 식비 설명을 읽고 사용 여부를 정해 주세요. 식비를 사용할 때만 하루 예산을 입력하고 예산 저장을 누르면 준비가 끝나요.</p></div>
    <button className="text-button" type="button" onClick={guide.skip}>안내 건너뛰기</button>
  </aside>
}
