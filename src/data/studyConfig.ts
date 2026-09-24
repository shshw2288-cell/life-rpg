/** 공부(회독) 설정 */

export const STUDY = {
  /**
   * 같은 과목을 하루에 여러 번 회독할 때의 보상 체감.
   * 습관과 같은 취지로, +버튼 연타로 보상을 무한히 얻지 못하게 한다.
   */
  diminishing: { enabled: true, factor: 0.85, floorRatio: 0.25 },
  /** 회독 보상은 같은 난이도 과제의 이 비율만큼 준다 */
  rewardRatio: 1,
  /** 목표 회독을 채웠을 때 주는 추가 Gold */
  targetBonusGold: 50,
}

/** 과목 카드 색상 후보 */
export const SUBJECT_COLORS = [
  '#f59e0b',
  '#22d3ee',
  '#a78bfa',
  '#4ade80',
  '#f472b6',
  '#fb923c',
  '#60a5fa',
  '#facc15',
]
