import { useOnboarding } from './OnboardingProvider'
export default function SetupGuide() {
  const guide = useOnboarding()
  if (guide?.stage !== 'setup') return null
  return <aside className="setup-guide" aria-label="첫 예산 설정 안내">
    <div><b>첫 예산을 함께 준비해 볼까요?</b><p>고정비는 선택, 하루 식비는 필수예요. 실제 금액을 입력하고 예산 저장을 누르면 준비가 끝나요.</p></div>
    <button className="text-button" type="button" onClick={guide.skip}>안내 건너뛰기</button>
  </aside>
}
