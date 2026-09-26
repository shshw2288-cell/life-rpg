import {
  GATED_REGIONS,
  REGIONS,
  findRegion,
  type RegionDef,
} from '../data/regionConfig'

/**
 * 지역 진행 계산.
 *
 * 지역은 탑의 층을 묶어 보여주는 껍데기다.
 * 어디까지 갔는지는 오직 tower.highestCleared 로 판단하므로
 * 지역 기능이 없던 시절의 저장 데이터도 자동으로 인정된다.
 */

/** 이 층이 속한 지역 */
export function regionForFloor(floor: number): RegionDef {
  const found = REGIONS.find(
    (region) => floor >= region.floors.from && (region.floors.to === null || floor <= region.floors.to),
  )
  return found ?? REGIONS[REGIONS.length - 1]
}

/** 보스를 잡아 완료한 지역 id 목록 */
export function clearedRegionIds(highestCleared: number): string[] {
  return GATED_REGIONS.filter((region) => highestCleared >= (region.bossFloor ?? Infinity)).map(
    (region) => region.id,
  )
}

export function isRegionCleared(regionId: string, highestCleared: number): boolean {
  const region = findRegion(regionId)
  if (!region || region.bossFloor === null) return false
  return highestCleared >= region.bossFloor
}

export interface RegionStatus {
  region: RegionDef
  /** 들어갈 수 있는가 */
  unlocked: boolean
  /** 잠겨 있다면 그 이유 */
  lockReason: string | null
  /** 보스까지 잡았는가 */
  cleared: boolean
  /** 이 지역에서 다음에 도전할 층 */
  nextFloor: number
  /** 이 지역에서 깬 층 수 */
  clearedFloors: number
  /** 이 지역의 총 층 수 (무한의 탑은 null) */
  totalFloors: number | null
}

export function regionStatus(region: RegionDef, highestCleared: number): RegionStatus {
  const required = region.requires ? findRegion(region.requires) : undefined
  const unlocked = !required || highestCleared >= (required.bossFloor ?? Infinity)

  const total = region.floors.to === null ? null : region.floors.to - region.floors.from + 1
  const clearedFloors = Math.max(
    0,
    Math.min(total ?? Infinity, highestCleared - region.floors.from + 1),
  )
  const nextFloor = Math.max(
    region.floors.from,
    Math.min(highestCleared + 1, region.floors.to ?? Infinity),
  )

  return {
    region,
    unlocked,
    lockReason: unlocked ? null : `${required?.name}의 보스를 먼저 쓰러뜨려야 합니다`,
    cleared: region.bossFloor !== null && highestCleared >= region.bossFloor,
    nextFloor,
    clearedFloors: Number.isFinite(clearedFloors) ? clearedFloors : 0,
    totalFloors: total,
  }
}

export function allRegionStatuses(highestCleared: number): RegionStatus[] {
  return REGIONS.map((region) => regionStatus(region, highestCleared))
}

/** 지역 안에서 고를 수 있는 층 목록. 무한의 탑은 다음 층까지만 보여준다. */
export function regionFloors(region: RegionDef, highestCleared: number): number[] {
  const last =
    region.floors.to === null
      ? Math.max(region.floors.from, highestCleared + 1)
      : region.floors.to
  const reachable = Math.min(last, highestCleared + 1)
  const floors: number[] = []
  for (let floor = region.floors.from; floor <= reachable; floor += 1) floors.push(floor)
  return floors
}

/**
 * 이번 승리로 처음 깬 지역이 있으면 그 지역을 돌려준다.
 * 첫 클리어 보상을 한 번만 주기 위한 판정이며, 이미 지급한 지역은 granted로 걸러진다.
 */
export function newlyClearedRegion(
  floor: number,
  granted: string[],
): RegionDef | undefined {
  return GATED_REGIONS.find((region) => region.bossFloor === floor && !granted.includes(region.id))
}
