import { diffDays, type GameDate } from '../lib/date'
import type { Task } from '../types/task'

/**
 * 하루가 지나 목록에서 내려도 되는 완료된 할 일인가.
 *
 * - 오늘 끝낸 할 일은 남겨둔다. 방금 한 일이 바로 사라지면 뭘 했는지 확인할 수 없다.
 * - 어제 이전에 끝낸 할 일은 목록에서 내린다. 기록 화면에는 그대로 남는다.
 * - 반복 과제는 날짜마다 다시 뜨는 것이라 대상이 아니다.
 */
export function isStaleCompletedTodo(task: Task, today: GameDate): boolean {
  if (task.type !== 'todo') return false
  if (task.archivedAt) return false
  if (!task.completedOn) return false
  return diffDays(task.completedOn, today) > 0
}

/** 목록에서 내릴 할 일들 */
export function staleCompletedTodos(tasks: Task[], today: GameDate): Task[] {
  return tasks.filter((task) => isStaleCompletedTodo(task, today))
}
