export const won = (amount: number) => amount.toLocaleString('ko-KR')
export const signedWon = (amount: number) => `${amount > 0 ? '+' : amount < 0 ? '-' : ''}${won(Math.abs(amount))}원`
