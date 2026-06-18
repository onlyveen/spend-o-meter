export default function TickBars({ pct = 0, count = 24, className = '' }) {
  const filledCount = Math.round((pct / 100) * count)

  return (
    <div className={`tick-bars ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={i < filledCount ? 'filled' : ''}
          style={{ height: `${30 + ((i * 37) % 70)}%` }}
        />
      ))}
    </div>
  )
}
