interface SelectProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  required?: boolean
  placeholder?: string
}

export default function Select({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  placeholder = 'Seleccione...'
}: SelectProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-base font-bold text-black mb-2">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green transition-colors duration-200 bg-white text-black"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
