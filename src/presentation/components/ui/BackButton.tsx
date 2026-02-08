import Link from 'next/link'

interface BackButtonProps {
  href?: string
  onClick?: () => void
  /** Si es true, el botón no usa posición absoluta (para usar dentro de modales/flex) */
  inline?: boolean
}

export default function BackButton({ href = '/', onClick, inline }: BackButtonProps) {
  const buttonContent = (
    <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M15 18L9 12L15 6"
          stroke="black"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-black text-base font-semibold">Volver</span>
    </div>
  )

  const wrapperClass = inline ? '' : 'absolute top-4 left-4 z-20'

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={wrapperClass}
        aria-label="Volver"
      >
        {buttonContent}
      </button>
    )
  }

  return (
    <Link
      href={href}
      className={wrapperClass}
      aria-label="Volver"
    >
      {buttonContent}
    </Link>
  )
}

