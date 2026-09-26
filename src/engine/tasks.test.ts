import { describe, expect, it } from 'vitest'
import type { Task } from '../types/task'
import { isStaleCompletedTodo, staleCompletedTodos } from './tasks'

function todo(overrides: Partial<Task> & { id: string }): Task {
  return {
    type: 'todo',
    title: overrides.id,
    difficulty: 2,
    createdOn: '2025-09-20',
    createdAt: '2025-09-20T08:00:00.000Z',
    updatedAt: '2025-09-20T08:00:00.000Z',
    ...overrides,
  } as Task
}

const today = '2025-09-25'

describe('완료한 할 일 정리', () => {
  it('오늘 끝낸 할 일은 남긴다', () => {
    expect(isStaleCompletedTodo(todo({ id: 'a', completedOn: today }), today)).toBe(false)
  })

  it('어제 끝낸 할 일은 목록에서 내린다', () => {
    expect(isStaleCompletedTodo(todo({ id: 'a', completedOn: '2025-09-24' }), today)).toBe(true)
  })

  it('오래전에 끝낸 할 일도 내린다', () => {
    expect(isStaleCompletedTodo(todo({ id: 'a', completedOn: '2025-08-01' }), today)).toBe(true)
  })

  it('아직 안 끝낸 할 일은 그대로 둔다', () => {
    expect(isStaleCompletedTodo(todo({ id: 'a' }), today)).toBe(false)
  })

  it('반복 과제와 습관은 대상이 아니다', () => {
    const daily = { ...todo({ id: 'd' }), type: 'daily', repeatDays: [] } as unknown as Task
    const habit = { ...todo({ id: 'h' }), type: 'habit', polarity: 'positive' } as unknown as Task
    expect(isStaleCompletedTodo(daily, today)).toBe(false)
    expect(isStaleCompletedTodo(habit, today)).toBe(false)
  })

  it('이미 정리된 할 일은 다시 고르지 않는다', () => {
    const archived = todo({ id: 'a', completedOn: '2025-09-24', archivedAt: '2025-09-25T00:00:00.000Z' })
    expect(isStaleCompletedTodo(archived, today)).toBe(false)
  })

  it('정리 대상만 골라낸다', () => {
    const tasks = [
      todo({ id: 'old', completedOn: '2025-09-23' }),
      todo({ id: 'today', completedOn: today }),
      todo({ id: 'open' }),
    ]
    expect(staleCompletedTodos(tasks, today).map((task) => task.id)).toEqual(['old'])
  })
})
