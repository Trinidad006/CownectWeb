interface InputProps {
  label: string
  name: string
  type: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  placeholder?: string
}

export default function Input({
  label,
  name,
  type,
  value,
  onChange,
  required = false,
  placeholder
}: InputProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-base font-bold text-black mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green transition-colors duration-200 bg-white text-black"
      />
    </div>
  )
}

