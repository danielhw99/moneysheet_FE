import { expect, it } from 'vitest'
import { createWriteAttempt } from './writeAttempt'

it('reuses a key for the same submitted input after a lost response', () => {
 const attempt=createWriteAttempt(), input={date:'2026-11-01',amount:9000,title:'Lunch'}
 const first=attempt.keyFor(input)
 expect(first).toMatch(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/)
 expect(attempt.keyFor({...input})).toBe(first)
})
it('separates changed input and an explicitly new successful/cancelled attempt', () => {
 const attempt=createWriteAttempt(), input={amount:1}
 const first=attempt.keyFor(input), changed=attempt.keyFor({amount:2})
 expect(changed).not.toBe(first)
 expect(attempt.keyFor({amount:2})).toBe(changed)
 attempt.reset()
 expect(attempt.keyFor({amount:2})).not.toBe(changed)
})
it('does not share request state between forms or accounts', () => {
 expect(createWriteAttempt().keyFor({amount:1})).not.toBe(createWriteAttempt().keyFor({amount:1}))
})
