import { EVOLUTION_STAGES, type EvolutionStage } from '../data/evolutionConfig'

/** 현재 레벨의 진화 단계 */
export function stageForLevel(level: number): EvolutionStage {
  let current = EVOLUTION_STAGES[0]
  for (const stage of EVOLUTION_STAGES) {
    if (level >= stage.minLevel) current = stage
  }
  return current
}

/** 다음 진화 단계. 최종 형태면 null. */
export function nextStage(level: number): EvolutionStage | null {
  return EVOLUTION_STAGES.find((stage) => stage.minLevel > level) ?? null
}

/** 레벨이 올라가며 진화가 일어났는지 */
export function didEvolve(fromLevel: number, toLevel: number): boolean {
  return stageForLevel(fromLevel).id !== stageForLevel(toLevel).id
}

/** 다음 진화까지 남은 레벨 수. 최종 형태면 0. */
export function levelsUntilNextStage(level: number): number {
  const next = nextStage(level)
  return next ? next.minLevel - level : 0
}
