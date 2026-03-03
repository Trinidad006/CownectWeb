import Link from 'next/link'

interface ButtonProps {
  variant: 'primary' | 'secondary'
  href: string
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  className?: string
}

export default function Button({ variant, href, children, type, onClick, className = '' }: ButtonProps) {
  const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center min-w-[180px]'
  
  const variantClasses = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-white text-black border-2 border-black hover:bg-gray-50'
  }

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`

  // Si es un botón sin href, renderizar como button
  if (!href || type) {
    return (
      <button
        type={type || 'button'}
        onClick={onClick}
        className={combinedClasses}
      >
        {children}
      </button>
    )
  }

  return (
    <Link href={href} className={combinedClasses}>
      {children}
    </Link>
  )
}

