import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import GuideDialog from './GuideDialog'
import { OnboardingProvider, useOnboarding } from './OnboardingProvider'

function OpenGuide() {
  const guide = useOnboarding()!
  return <button type="button" onClick={guide.openGuide}>open</button>
}

it('explains which income changes free balance without implying duplicate Main addition', () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
  render(<OnboardingProvider userId="guide-user"><OpenGuide /><GuideDialog /></OnboardingProvider>)
  fireEvent.click(screen.getByText('open'))
  expect(screen.getByText(/오늘 식비와 오늘 일반 입금을 더하고/)).toBeInTheDocument()
  expect(screen.getByText(/Monthly 수익과 임시 입금 메모는 여유비에 포함되지 않아요/)).toBeInTheDocument()
})
