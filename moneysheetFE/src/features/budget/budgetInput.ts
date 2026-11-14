export function budgetAmount(value: string): number {
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(value)) throw new Error('금액은 올바른 원 단위 정수로 입력해 주세요.')
  const amount = Number(value.replace(/,/g, ''))
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 9999999999) throw new Error('금액은 1원부터 9,999,999,999원까지 입력해 주세요.')
  return amount
}
