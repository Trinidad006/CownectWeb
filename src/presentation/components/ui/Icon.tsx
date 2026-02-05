interface IconProps {
  name: string
}

export default function Icon({ name }: IconProps) {
  const iconSize = 24
  
  const icons: Record<string, JSX.Element> = {
    cow: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4C8 4 5 7 5 11C5 13 6 15 8 16C6 17 5 19 5 21C5 23 6 24 8 24C10 24 11 23 11 21C11 19 10 17 8 16C10 15 11 13 11 11C11 7 8 4 12 4ZM12 6C9 6 7 8 7 11C7 12 7 13 8 14C7 13 7 14 7 15C7 16 7 17 8 17C9 17 9 16 9 15C9 14 9 13 8 14C9 13 9 12 9 11C9 8 11 6 12 6Z" fill="white"/>
        <circle cx="9" cy="10" r="1" fill="white"/>
        <circle cx="15" cy="10" r="1" fill="white"/>
      </svg>
    ),
    alert: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none"/>
        <path d="M12 8V12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 16H12.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 11L12 8L15 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    device: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="2" width="16" height="20" rx="2" stroke="white" strokeWidth="2" fill="none"/>
        <line x1="4" y1="6" x2="20" y2="6" stroke="white" strokeWidth="2"/>
      </svg>
    ),
    scale: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9L12 3L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" strokeWidth="2" fill="none"/>
        <path d="M9 22V12H15V22" stroke="white" strokeWidth="2" fill="none"/>
        <line x1="6" y1="12" x2="18" y2="12" stroke="white" strokeWidth="2"/>
        <circle cx="7" cy="7" r="1" fill="white"/>
        <circle cx="17" cy="7" r="1" fill="white"/>
      </svg>
    ),
    syringe: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4L18 6L16 4L4 16L6 18L8 16L10 18L12 16L20 8L18 6L20 4Z" stroke="white" strokeWidth="2" fill="none"/>
        <line x1="4" y1="20" x2="8" y2="16" stroke="white" strokeWidth="2"/>
      </svg>
    ),
    document: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" fill="none"/>
        <path d="M14 2V8H20" stroke="white" strokeWidth="2" fill="none"/>
        <line x1="8" y1="12" x2="16" y2="12" stroke="white" strokeWidth="2"/>
        <line x1="8" y1="16" x2="16" y2="16" stroke="white" strokeWidth="2"/>
      </svg>
    ),
    marketplace: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 18C5.9 18 5.01 18.9 5.01 20C5.01 21.1 5.9 22 7 22C8.1 22 9 21.1 9 20C9 18.9 8.1 18 7 18Z" stroke="white" strokeWidth="2" fill="none"/>
        <path d="M1 2H5L7.68 14.39C7.77 14.96 8.11 15.45 8.58 15.73L19 21H23" stroke="white" strokeWidth="2" fill="none"/>
        <circle cx="7" cy="20" r="1" fill="white"/>
        <circle cx="20" cy="20" r="1" fill="white"/>
        <path d="M17 18C15.9 18 15.01 18.9 15.01 20C15.01 21.1 15.9 22 17 22C18.1 22 19 21.1 19 20C19 18.9 18.1 18 17 18Z" stroke="white" strokeWidth="2" fill="none"/>
      </svg>
    ),
    chart: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="18" width="4" height="4" fill="white"/>
        <rect x="8" y="14" width="4" height="8" fill="white"/>
        <rect x="13" y="10" width="4" height="12" fill="white"/>
        <rect x="18" y="6" width="4" height="16" fill="white"/>
      </svg>
    ),
    shield: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 5V11C4 16.55 7.16 21.74 12 23C16.84 21.74 20 16.55 20 11V5L12 2Z" stroke="white" strokeWidth="2" fill="none"/>
        <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    clock: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none"/>
        <path d="M12 6V12L16 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    users: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="white" strokeWidth="2" fill="none"/>
        <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2" fill="none"/>
        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="white" strokeWidth="2" fill="none"/>
        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="white" strokeWidth="2" fill="none"/>
      </svg>
    )
  }

  return icons[name] || <div className="w-6 h-6 bg-white rounded"></div>
}

