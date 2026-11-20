export default function BatchAvatar({ year, size = 44 }: { year: number; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: 'var(--primary-color)',
        fontSize: size <= 38 ? 11 : 14,
      }}
      aria-hidden="true"
    >
      {year}
    </div>
  )
}
