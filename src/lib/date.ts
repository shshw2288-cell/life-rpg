import { DAY_START_HOUR } from '../data/gameConfig'

/**
 * 게임 날짜 문자열. 항상 'YYYY-MM-DD' 형식이며 현지 시간 기준이다.
 * 앱 전체에서 날짜를 다룰 때는 이 타입만 사용한다.
 */
export type GameDate = string

/**
 * 현재 시각이 속한 게임 날짜를 구한다.
 *
 * 하루는 현지 시간 오전 8시에 시작하므로, 0:00~7:59는 전날로 친다.
 *   9/25 07:59 -> '2025-09-24'
 *   9/25 08:00 -> '2025-09-25'
 *
 * 앱 어디에서도 날짜를 직접 자르지 않고 반드시 이 함수를 쓴다.
 */
export function getGameDate(now: Date, dayStartHour: number = DAY_START_HOUR): GameDate {
  const shifted = new Date(now.getTime())
  shifted.setHours(shifted.getHours() - dayStartHour)
  return formatLocalDate(shifted)
}

/** 게임 날짜가 시작되는 실제 시각 (그 날짜 오전 8시) */
export function startOfGameDate(date: GameDate, dayStartHour: number = DAY_START_HOUR): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, dayStartHour, 0, 0, 0)
}

/** 로컬 타임존 기준으로 Date를 'YYYY-MM-DD'로 만든다. toISOString은 UTC라 쓰지 않는다. */
export function formatLocalDate(date: Date): GameDate {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 게임 날짜에 일수를 더한다. 음수도 가능하다. */
export function addDays(date: GameDate, amount: number): GameDate {
  const [year, month, day] = date.split('-').map(Number)
  const result = new Date(year, month - 1, day + amount)
  return formatLocalDate(result)
}

/** 두 게임 날짜의 차이(일). b가 a보다 나중이면 양수. */
export function diffDays(a: GameDate, b: GameDate): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const msPerDay = 24 * 60 * 60 * 1000
  const from = Date.UTC(ay, am - 1, ad)
  const to = Date.UTC(by, bm - 1, bd)
  return Math.round((to - from) / msPerDay)
}

/** from(포함)부터 to(포함)까지의 게임 날짜 목록. from > to면 빈 배열. */
export function eachDay(from: GameDate, to: GameDate): GameDate[] {
  const days: GameDate[] = []
  const total = diffDays(from, to)
  for (let i = 0; i <= total; i += 1) {
    days.push(addDays(from, i))
  }
  return days
}

/** 게임 날짜의 요일. 0=일요일 ... 6=토요일 */
export function weekdayOf(date: GameDate): number {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).getDay()
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

/** 화면 표시용 문자열. 예: '9월 25일 (목)' */
export function formatDisplayDate(date: GameDate): string {
  const [, month, day] = date.split('-').map(Number)
  return `${month}월 ${day}일 (${WEEKDAY_LABELS[weekdayOf(date)]})`
}

export { WEEKDAY_LABELS }
