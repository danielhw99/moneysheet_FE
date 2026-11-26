import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import AppSettings from '../components/AppSettings'

beforeEach(() => {
 HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
 HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
it('opens installation instructions and restores settings focus when dismissed', async () => {
 render(<AppSettings openGuide={() => {}} />)
 const trigger = screen.getByRole('button', { name: '앱 설정' })
 await userEvent.click(trigger)
 await userEvent.click(screen.getByRole('button', { name: '앱 설치 안내' }))
 const dialog = screen.getByRole('alertdialog', { name: '홈 화면에 MoneySheet 추가' })
 expect(dialog).toHaveTextContent('Android')
 expect(dialog).toHaveTextContent('iPhone')
 expect(dialog).toHaveTextContent('온라인 연결')
 expect(screen.queryByRole('navigation', { name: '앱 설정 항목' })).not.toBeInTheDocument()
 await userEvent.click(screen.getByRole('button', { name: '확인' }))
 expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
 expect(trigger).toHaveFocus()
})
it('does not launch installation help if saving starts with the menu open', async () => {
 const view = render(<AppSettings openGuide={() => {}} />)
 await userEvent.click(screen.getByRole('button', { name: '앱 설정' }))
 view.rerender(<AppSettings openGuide={() => {}} disabled />)
 const button = screen.getByRole('button', { name: '앱 설치 안내' })
 expect(button).toBeDisabled()
 fireEvent.click(button)
 expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
})
