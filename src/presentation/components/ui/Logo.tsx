import Image from 'next/image'

export default function Logo() {
  return (
    <div className="w-16 h-16 rounded-lg overflow-hidden bg-cownect-green flex items-center justify-center">
      <Image
        src="/images/logo_verde.jpeg"
        alt="Cownect Logo"
        width={64}
        height={64}
        className="w-full h-full object-contain p-2"
        priority
      />
    </div>
  )
}

