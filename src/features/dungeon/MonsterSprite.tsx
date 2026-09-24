/** 층 몬스터든 보스든 그리는 데 필요한 최소 정보만 받는다 */
export interface SpriteMonster {
  id: string
  name: string
  color: string
  accent: string
  isBoss?: boolean
}

interface MonsterSpriteProps {
  monster: SpriteMonster
  size?: number
  /** 다음 턴에 강공격을 준비 중이면 표정이 바뀐다 */
  charging?: boolean
  defeated?: boolean
}

/** 몬스터 외형. 외부 이미지 없이 SVG로 직접 그린다. */
export function MonsterSprite({
  monster,
  size = 150,
  charging = false,
  defeated = false,
}: MonsterSpriteProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      role="img"
      aria-label={`${monster.name}${charging ? ' (기운을 모으는 중)' : ''}${defeated ? ' (쓰러짐)' : ''}`}
      style={{ opacity: defeated ? 0.35 : 1 }}
    >
      <defs>
        <radialGradient id={`slime-${monster.id}`} cx="40%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="55%" stopColor={monster.color} />
          <stop offset="100%" stopColor={monster.accent} />
        </radialGradient>
      </defs>

      {charging && <circle cx="80" cy="92" r="66" fill="#f97316" opacity="0.18" />}
      {monster.isBoss && !defeated && (
        <>
          <circle cx="80" cy="92" r="72" fill={monster.accent} opacity="0.18" />
          {/* 보스는 뿔을 단다 */}
          <path d="M 34 66 L 22 34 L 50 56 Z" fill={monster.accent} />
          <path d="M 126 66 L 138 34 L 110 56 Z" fill={monster.accent} />
        </>
      )}

      {/* 몸통 */}
      <path
        d="M 20 118 Q 18 58 80 52 Q 142 58 140 118 Q 140 132 120 132 L 40 132 Q 20 132 20 118 Z"
        fill={`url(#slime-${monster.id})`}
      />
      {/* 흘러내리는 방울 */}
      <circle cx="46" cy="126" r="8" fill={monster.color} />
      <circle cx="112" cy="128" r="6" fill={monster.color} />

      {defeated ? (
        <>
          <path d="M 56 88 l 14 14 M 70 88 l -14 14" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
          <path d="M 92 88 l 14 14 M 106 88 l -14 14" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="62" cy="92" rx="7" ry={charging ? 5 : 9} fill="#0f172a" />
          <ellipse cx="99" cy="92" rx="7" ry={charging ? 5 : 9} fill="#0f172a" />
          <circle cx="64" cy="89" r="2.4" fill="#ffffff" />
          <circle cx="101" cy="89" r="2.4" fill="#ffffff" />
          <path
            d={charging ? 'M 68 112 q 12 -8 24 0' : 'M 68 110 q 12 8 24 0'}
            stroke="#0f172a"
            strokeWidth="3.4"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}
