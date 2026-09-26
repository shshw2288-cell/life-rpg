import { describe, expect, it } from 'vitest'
import { SKILLS, SKILL_SLOTS } from '../data/skillConfig'
import { createBattle, deriveCombatStats } from './combat'
import {
  defaultLoadout,
  initSkillStates,
  isSkillUnlocked,
  normalizeLoadout,
  skillAvailability,
  unlockedSkillIds,
} from './skills'
import { monsterForFloor } from './tower'

describe('스킬 해금', () => {
  it('처음에는 기본 스킬 3개를 쓸 수 있다', () => {
    const unlocked = unlockedSkillIds(0)
    expect(unlocked).toHaveLength(3)
    expect(unlocked).toContain('starlight_arrow')
    expect(unlocked).toContain('sprout_heal')
    expect(unlocked).toContain('light_shield')
  })

  it('지역을 깨면 새 스킬이 열린다', () => {
    expect(isSkillUnlocked('vine_bind', 9)).toBe(false)
    expect(isSkillUnlocked('vine_bind', 10)).toBe(true)
    expect(isSkillUnlocked('focus_mind', 19)).toBe(false)
    expect(isSkillUnlocked('focus_mind', 20)).toBe(true)
  })

  it('처음부터 선택을 경험할 수 있도록 기본 스킬 수가 슬롯 수와 같다', () => {
    expect(defaultLoadout()).toHaveLength(SKILL_SLOTS)
  })

  it('스킬 id가 중복되지 않는다', () => {
    expect(new Set(SKILLS.map((skill) => skill.id)).size).toBe(SKILLS.length)
  })
})

describe('장착 규칙', () => {
  it('같은 스킬을 두 번 넣을 수 없다', () => {
    expect(normalizeLoadout(['starlight_arrow', 'starlight_arrow'], 0)).toEqual([
      'starlight_arrow',
    ])
  })

  it('슬롯 수를 넘길 수 없다', () => {
    const loadout = normalizeLoadout(
      ['starlight_arrow', 'sprout_heal', 'light_shield', 'vine_bind', 'focus_mind'],
      40,
    )
    expect(loadout).toHaveLength(SKILL_SLOTS)
  })

  it('해금되지 않은 스킬은 빠진다', () => {
    expect(normalizeLoadout(['starlight_arrow', 'vine_bind'], 0)).toEqual(['starlight_arrow'])
  })

  it('없는 스킬 id는 무시된다', () => {
    expect(normalizeLoadout(['없음', 'sprout_heal'], 0)).toEqual(['sprout_heal'])
  })
})

describe('전투 중 사용 가능 여부', () => {
  function battle(skills: string[], patch: Partial<{ mp: number }> = {}) {
    const base = createBattle({
      id: 'b',
      monster: monsterForFloor(1),
      stats: deriveCombatStats(5),
      startedOn: '2025-09-25',
      skillIds: skills,
    })
    return patch.mp === undefined
      ? base
      : { ...base, player: { ...base.player, mp: patch.mp } }
  }

  it('장착한 스킬만 목록에 나온다', () => {
    const list = skillAvailability(battle(['starlight_arrow', 'light_shield']))
    expect(list.map((entry) => entry.skill.id)).toEqual(['starlight_arrow', 'light_shield'])
  })

  it('MP가 모자라면 이유를 알려준다', () => {
    const [entry] = skillAvailability(battle(['starlight_arrow'], { mp: 0 }))
    expect(entry.usable).toBe(false)
    expect(entry.reason).toContain('MP')
  })

  it('대기 중이면 남은 턴을 알려준다', () => {
    const base = battle(['light_shield'])
    const cooling = { ...base, skills: base.skills.map((slot) => ({ ...slot, cooldown: 2 })) }
    const [entry] = skillAvailability(cooling)
    expect(entry.reason).toContain('2턴')
  })

  it('사용 횟수를 다 쓰면 이유를 알려준다', () => {
    const base = battle(['sprout_heal'])
    const spent = { ...base, skills: base.skills.map((slot) => ({ ...slot, usesLeft: 0 })) }
    const [entry] = skillAvailability(spent)
    expect(entry.usable).toBe(false)
    expect(entry.reason).toContain('횟수')
  })

  it('전투 시작 시 대기시간과 횟수가 초기화된다', () => {
    const states = initSkillStates(['sprout_heal', 'light_shield'])
    expect(states.every((state) => state.cooldown === 0)).toBe(true)
    expect(states.find((state) => state.id === 'sprout_heal')!.usesLeft).toBe(3)
    expect(states.find((state) => state.id === 'light_shield')!.usesLeft).toBeNull()
  })
})
