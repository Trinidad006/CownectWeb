'use client'

interface StarRatingProps {
  promedio: number
  total?: number
  editable?: boolean
  value?: number
  onChange?: (estrellas: number) => void
}

export default function StarRating({ promedio, total = 0, editable = false, value = 0, onChange }: StarRatingProps) {
  const estrellas = [1, 2, 3, 4, 5]
  const mostrar = editable ? value : promedio

  if (editable) {
    return (
      <div className="flex items-center gap-1">
        {estrellas.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange?.(i)}
            className="focus:outline-none transition-transform hover:scale-110 text-xl"
          >
            <span className={i <= mostrar ? 'text-cownect-green' : 'text-gray-300'}>
              {i <= mostrar ? '★' : '☆'}
            </span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {estrellas.map((i) => (
        <span
          key={i}
          className={`text-lg ${i <= Math.round(promedio) ? 'text-cownect-green' : 'text-gray-300'}`}
        >
          {i <= Math.round(promedio) ? '★' : '☆'}
        </span>
      ))}
      {total > 0 ? (
        <span className="text-sm text-gray-600 ml-2">
          ({promedio.toFixed(1)} · {total} {total === 1 ? 'calificación' : 'calificaciones'})
        </span>
      ) : (
        <span className="text-sm text-gray-500 ml-2">Sin calificaciones</span>
      )}
    </div>
  )
}
