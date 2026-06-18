export default function RadialSpoke({ pct = 0, size = 220, spokes = 60, filledColor = '#3D4836', baseColor = '#3D483622' }) {
  const center = size / 2
  const innerR = size * 0.22
  const outerR = size * 0.46
  const filledCount = Math.round((Math.min(pct, 100) / 100) * spokes)

  const lines = Array.from({ length: spokes }, (_, i) => {
    const angle = (i / spokes) * 2 * Math.PI
    const variableOuter = outerR - (i % 5) * (outerR - innerR) * 0.08
    const x1 = center + innerR * Math.cos(angle)
    const y1 = center + innerR * Math.sin(angle)
    const x2 = center + variableOuter * Math.cos(angle)
    const y2 = center + variableOuter * Math.sin(angle)
    return { x1, y1, x2, y2, filled: i < filledCount }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={l.filled ? filledColor : baseColor}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
      <circle cx={center} cy={center} r={innerR - 6} fill="#DBDCC9" />
    </svg>
  )
}
