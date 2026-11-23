import { useOnboarding } from './OnboardingProvider'
export default function SetupGuide() {
  const guide = useOnboarding()
  if (guide?.stage !== 'setup') return null
  return <aside className="setup-guide" aria-label="첫 예산 설정 안내">
    <div><b>첫 예산을 함께 준비해 볼까요?</b><p>고정비는 선택이에요. 주중·토·일 하루 식비와 지급 방식을 설정하고 예산 저장을 누르면 준비가 끝나요.</p></div>
    <button className="text-button" type="button" onClick={guide.skip}>안내 건너뛰기</button>
  </aside>
}
