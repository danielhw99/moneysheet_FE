export type CreateOptions = { idempotencyKey: string }

// One instance belongs to one mounted form. A failed response does not end the attempt.
export function createWriteAttempt() {
 let signature: string | undefined, key: string | undefined
 return {
  keyFor(input: unknown): string {
   const next=JSON.stringify(input)
   if(!key || next!==signature) { key=crypto.randomUUID();signature=next }
   return key
  },
  reset() { signature=undefined;key=undefined },
 }
}
