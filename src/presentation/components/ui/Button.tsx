import Link from 'next/link'

interface ButtonProps {
  variant: 'primary' | 'secondary'
  href: string
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
}

export default function Button({ variant, href, children, type, onClick }: ButtonProps) {
  const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center min-w-[180px]'
  
  const variantClasses = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-white text-black border-2 border-black hover:bg-gray-50'
  }

  // Si es un botón sin href, renderizar como button
  if (!href || type) {
    return (
      <button
        type={type || 'button'}
        onClick={onClick}
        className={`${baseClasses} ${variantClasses[variant]}`}
      >
        {children}
      </button>
    )
  }

  return (
    <Link href={href} className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </Link>
  )
}

