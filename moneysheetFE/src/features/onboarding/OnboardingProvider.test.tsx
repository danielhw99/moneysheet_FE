import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OnboardingProvider, useOnboarding } from './OnboardingProvider'
function Probe() {
  const guide = useOnboarding()!
  return <><span data-testid="stage">{guide.stage}</span><span data-testid="open">{String(guide.guideOpen)}</span><button onClick={() => guide.beginSetup(false)}>begin</button><button onClick={() => guide.beginSetup(true)}>copy</button><button onClick={guide.finishSetup}>save</button><button onClick={guide.skip}>skip</button><button onClick={guide.openGuide}>help</button><button onClick={() => guide.closeGuide(true)}>done</button><button onClick={() => guide.closeGuide(false)}>close</button></>
}
const view = (id = '1') => <OnboardingProvider userId={id}><Probe /></OnboardingProvider>
beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })
describe('onboarding is separate from monthly budget readiness', () => {
  it('keeps setup pending until save, persists overview and completes it once', () => {
    const rendered = render(view())
    fireEvent.click(screen.getByText('begin'))
    expect(screen.getByTestId('stage')).toHaveTextContent('setup')
    fireEvent.click(screen.getByText('save'))
    expect(screen.getByTestId('open')).toHaveTextContent('true')
    rendered.unmount(); render(view())
    expect(screen.getByTestId('stage')).toHaveTextContent('overview')
    fireEvent.click(screen.getByText('done'))
    expect(screen.getByTestId('stage')).toHaveTextContent('done')
    fireEvent.click(screen.getByText('begin'))
    expect(screen.getByTestId('open')).toHaveTextContent('false')
  })
  it('persists skipping across mounts and months, with a separate replay action', () => {
    const rendered = render(view())
    fireEvent.click(screen.getByText('begin')); fireEvent.click(screen.getByText('skip'))
    rendered.unmount(); render(view())
    fireEvent.click(screen.getByText('begin')); fireEvent.click(screen.getByText('save'))
    expect(screen.getByTestId('stage')).toHaveTextContent('skipped')
    expect(screen.getByTestId('open')).toHaveTextContent('false')
    fireEvent.click(screen.getByText('help'))
    expect(screen.getByTestId('open')).toHaveTextContent('true')
    fireEvent.click(screen.getByText('close'))
    expect(screen.getByTestId('stage')).toHaveTextContent('skipped')
  })
  it('isolates accounts even when the provider user changes without unmounting', () => {
    const rendered = render(view('1'))
    fireEvent.click(screen.getByText('begin')); fireEvent.click(screen.getByText('skip'))
    rendered.rerender(view('2'))
    expect(screen.getByTestId('stage')).toHaveTextContent('unseen')
    rendered.rerender(view('1'))
    expect(screen.getByTestId('stage')).toHaveTextContent('skipped')
  })
  it('does not force a first-time tutorial for a copied monthly budget', () => {
    render(view()); fireEvent.click(screen.getByText('copy')); fireEvent.click(screen.getByText('save'))
    expect(screen.getByTestId('stage')).toHaveTextContent('done')
    expect(screen.getByTestId('open')).toHaveTextContent('false')
  })
  it('ignores corrupted storage and survives blocked browser storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('blocked') })
    render(view()); fireEvent.click(screen.getByText('begin')); fireEvent.click(screen.getByText('skip'))
    expect(screen.getByTestId('stage')).toHaveTextContent('skipped')
  })
  it('rejects unknown stored states instead of treating them as completion', () => {
    localStorage.setItem('moneysheet:onboarding:v1:1', 'READY')
    render(view()); expect(screen.getByTestId('stage')).toHaveTextContent('unseen')
  })
})
