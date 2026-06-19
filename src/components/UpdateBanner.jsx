export default function UpdateBanner({ show }) {
  if (!show) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between gap-3 bg-forest-dark px-4 py-3 text-sm text-cream shadow-md">
      <span>A new version of Expend is available.</span>
      <button
        onClick={() => window.location.reload()}
        className="shrink-0 rounded-full bg-cream px-3 py-1 text-xs font-semibold text-forest-dark"
      >
        Refresh
      </button>
    </div>
  )
}
