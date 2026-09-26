/** 내 방(거점)에 놓은 가구 한 개 */
export interface FurniturePlacement {
  furnitureId: string
  /** 격자 왼쪽 위 칸 좌표 (0부터) */
  x: number
  y: number
}

export interface RoomState {
  /** 해금해서 가지고 있는 가구. 배치를 초기화해도 이 목록은 그대로다. */
  owned: string[]
  placements: FurniturePlacement[]
}
