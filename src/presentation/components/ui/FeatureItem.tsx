import Image from 'next/image'
import Icon from './Icon'

interface FeatureItemProps {
  icon: string
  title: string
  description: string
}

export default function FeatureItem({ icon, title, description }: FeatureItemProps) {
  const isLogoIcon = icon === 'cow'
  
  return (
    <div className="flex gap-4 p-4 rounded-lg transition-all duration-300 hover:bg-gray-50 hover:shadow-md hover:scale-[1.02] cursor-pointer">
      <div className="flex-shrink-0">
        <div className={`w-12 h-12 ${isLogoIcon ? 'bg-cownect-green' : 'bg-black'} rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-lg`}>
          {isLogoIcon ? (
            <Image
              src="/images/logo_verde.jpeg"
              alt="Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain p-1 transition-transform duration-300 hover:scale-110"
            />
          ) : (
            <div className="transition-transform duration-300 hover:scale-110">
              <Icon name={icon} />
            </div>
          )}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-black mb-1 transition-colors duration-300 hover:text-cownect-green">{title}</h3>
        <p className="text-sm text-gray-700">{description}</p>
      </div>
    </div>
  )
}

