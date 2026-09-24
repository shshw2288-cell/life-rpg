import { describe, expect, it } from 'vitest'
import { addDays, diffDays, eachDay, getGameDate, startOfGameDate, weekdayOf } from './date'

describe('getGameDate (하루 시작 오전 8시)', () => {
  it('오전 7:59는 전날로 친다', () => {
    expect(getGameDate(new Date(2025, 8, 25, 7, 59))).toBe('2025-09-24')
  })

  it('오전 8:00부터 새 날짜가 된다', () => {
    expect(getGameDate(new Date(2025, 8, 25, 8, 0))).toBe('2025-09-25')
  })

  it('자정 직후는 전날에 속한다', () => {
    expect(getGameDate(new Date(2025, 8, 25, 0, 0))).toBe('2025-09-24')
  })

  it('낮과 밤은 같은 날짜다', () => {
    expect(getGameDate(new Date(2025, 8, 25, 12, 0))).toBe('2025-09-25')
    expect(getGameDate(new Date(2025, 8, 25, 23, 59))).toBe('2025-09-25')
  })

  it('월이 바뀌는 경계에서도 맞다', () => {
    expect(getGameDate(new Date(2025, 9, 1, 3, 0))).toBe('2025-09-30')
    expect(getGameDate(new Date(2025, 9, 1, 8, 0))).toBe('2025-10-01')
  })

  it('해가 바뀌는 경계에서도 맞다', () => {
    expect(getGameDate(new Date(2026, 0, 1, 2, 0))).toBe('2025-12-31')
  })

  it('게임 날짜의 시작 시각은 그날 오전 8시다', () => {
    const start = startOfGameDate('2025-09-25')
    expect(start.getHours()).toBe(8)
    expect(getGameDate(start)).toBe('2025-09-25')
    expect(getGameDate(new Date(start.getTime() - 1))).toBe('2025-09-24')
  })
})

describe('날짜 계산 도우미', () => {
  it('addDays는 월 경계를 넘는다', () => {
    expect(addDays('2025-09-30', 1)).toBe('2025-10-01')
    expect(addDays('2025-10-01', -1)).toBe('2025-09-30')
  })

  it('diffDays는 일수 차이를 낸다', () => {
    expect(diffDays('2025-09-24', '2025-09-27')).toBe(3)
    expect(diffDays('2025-09-27', '2025-09-24')).toBe(-3)
    expect(diffDays('2025-09-24', '2025-09-24')).toBe(0)
  })

  it('eachDay는 양끝을 포함한다', () => {
    expect(eachDay('2025-09-24', '2025-09-26')).toEqual([
      '2025-09-24',
      '2025-09-25',
      '2025-09-26',
    ])
    expect(eachDay('2025-09-26', '2025-09-24')).toEqual([])
  })

  it('weekdayOf는 0=일요일이다', () => {
    expect(weekdayOf('2025-09-28')).toBe(0)
    expect(weekdayOf('2025-09-25')).toBe(4)
  })
})
