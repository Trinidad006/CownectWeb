'use client'

import Image from 'next/image'

export default function Logo() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden bg-white flex items-center justify-center p-1.5">
      <Image
        src="/images/logo_blanco.jpeg"
        alt="Cownect Logo"
        width={64}
        height={64}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  )
}

