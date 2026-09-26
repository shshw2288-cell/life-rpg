import type { SkillDef } from '../types/skill'

/**
 * 액티브 스킬 설정.
 *
 * 기본 공격과 방어는 슬롯을 쓰지 않고 언제나 쓸 수 있다.
 * 여기 있는 스킬만 슬롯에 장착해서 쓴다.
 *
 * 밸런스 기준
 *  - 별빛 화살은 개편 전 '별빛 파동'(MP 6 · 배율 1.8 · 방어 50% 관통)과 같은 수치라
 *    기존 세이브의 체감 난이도가 변하지 않는다.
 *  - 새싹 회복은 대기시간 3턴 + 전투당 3회로 막아 무한 회복이 나오지 않는다.
 *  - 덩굴 묶기는 대기시간 2턴 + 지속 1턴이라 적을 영구히 묶어둘 수 없다.
 *  - 빛의 보호막은 대기시간 3턴 + 지속 2턴이라 항상 켜 둘 수 없다.
 */

/** 장착할 수 있는 스킬 칸 수 */
export const SKILL_SLOTS = 3

export const SKILLS: SkillDef[] = [
  {
    id: 'starlight_arrow',
    name: '별빛 화살',
    description: 'MP를 모아 별빛을 쏜다. 적 방어력의 절반만 적용된다.',
    icon: 'arrow',
    kind: 'damage',
    mpCost: 6,
    cooldown: 0,
    power: 1.8,
    defensePierce: 0.5,
    unlock: { kind: 'start' },
    tip: '평소 주력기. 집중을 먼저 쓰면 한 방이 훨씬 커진다.',
  },
  {
    id: 'sprout_heal',
    name: '새싹 회복',
    description: '한 턴을 들여 전투 HP를 30% 회복한다.',
    icon: 'sprout',
    kind: 'heal',
    mpCost: 8,
    cooldown: 3,
    maxUses: 3,
    healRatio: 0.3,
    unlock: { kind: 'start' },
    tip: '강공격을 맞은 다음 턴에. 전투당 3번까지만 쓸 수 있다.',
  },
  {
    id: 'light_shield',
    name: '빛의 보호막',
    description: '2턴 동안 받는 피해를 50% 줄인다.',
    icon: 'shield',
    kind: 'buff',
    mpCost: 7,
    cooldown: 3,
    selfStatus: { id: 'shield', turns: 2, value: 0.5 },
    unlock: { kind: 'start' },
    tip: '강공격 예고가 뜬 턴에 미리 켜 두면 두 번을 버틴다.',
  },
  {
    id: 'vine_bind',
    name: '덩굴 묶기',
    description: '적을 덩굴로 묶어 다음 공격을 55% 약하게 만든다. 적이 공격하면 풀린다.',
    icon: 'vine',
    kind: 'debuff',
    mpCost: 6,
    cooldown: 2,
    // 2턴을 주는 이유: 적이 예고·회복 준비처럼 공격하지 않는 턴이 있어서다.
    // 적이 한 번 공격하면 그 자리에서 풀리므로 계속 묶어둘 수는 없다.
    enemyStatus: { id: 'weaken', turns: 2, value: 0.55 },
    unlock: { kind: 'region', regionId: 'forest' },
    tip: '강공격 예고와 회복 준비를 동시에 막는다. 버섯 동굴 보스의 회복 저지 조건.',
  },
  {
    id: 'focus_mind',
    name: '집중',
    description: '이번 턴을 투자해 2턴 안에 쓰는 다음 공격 피해를 80% 올린다.',
    icon: 'focus',
    kind: 'buff',
    mpCost: 4,
    cooldown: 2,
    selfStatus: { id: 'focus', turns: 2, value: 0.8 },
    unlock: { kind: 'region', regionId: 'cave' },
    tip: '적이 방어 자세일 때 모아 두었다가 보호막이 풀리는 턴에 터뜨린다.',
  },
]

export function findSkill(id: string): SkillDef | undefined {
  return SKILLS.find((skill) => skill.id === id)
}

/** 처음부터 쓸 수 있는 스킬 */
export const STARTER_SKILL_IDS = SKILLS.filter((skill) => skill.unlock.kind === 'start').map(
  (skill) => skill.id,
)
