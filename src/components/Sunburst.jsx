export default function Sunburst({ size = 320, spokes = 56, color = '#3D4836', opacity = 0.18, className = '' }) {
  const center = size / 2
  const innerR = size * 0.26
  const outerR = size * 0.48

  const lines = Array.from({ length: spokes }, (_, i) => {
    const angle = (i / spokes) * 2 * Math.PI
    const variableOuter = outerR - (i % 5) * (outerR - innerR) * 0.1
    return {
      x1: center + innerR * Math.cos(angle),
      y1: center + innerR * Math.sin(angle),
      x2: center + variableOuter * Math.cos(angle),
      y2: center + variableOuter * Math.sin(angle),
    }
  })

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={color} strokeWidth={2} strokeLinecap="round" />
      ))}
    </svg>
  )
}
