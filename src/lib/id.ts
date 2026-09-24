/** 저장 데이터의 모든 id는 UUID로 만든다. 나중에 서버 동기화를 붙일 때를 대비한다. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
