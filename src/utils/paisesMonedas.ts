export interface PaisMoneda {
  codigo: string
  nombre: string
  moneda: string
  simbolo: string
}

export const PAISES_MONEDAS: PaisMoneda[] = [
  { codigo: 'CO', nombre: 'Colombia', moneda: 'COP', simbolo: '$' },
  { codigo: 'MX', nombre: 'México', moneda: 'MXN', simbolo: '$' },
  { codigo: 'AR', nombre: 'Argentina', moneda: 'ARS', simbolo: '$' },
  { codigo: 'US', nombre: 'Estados Unidos', moneda: 'USD', simbolo: 'US$' },
  { codigo: 'ES', nombre: 'España', moneda: 'EUR', simbolo: '€' },
  { codigo: 'CL', nombre: 'Chile', moneda: 'CLP', simbolo: '$' },
  { codigo: 'PE', nombre: 'Perú', moneda: 'PEN', simbolo: 'S/' },
  { codigo: 'EC', nombre: 'Ecuador', moneda: 'USD', simbolo: 'US$' },
  { codigo: 'VE', nombre: 'Venezuela', moneda: 'VES', simbolo: 'Bs' },
  { codigo: 'UY', nombre: 'Uruguay', moneda: 'UYU', simbolo: '$' },
  { codigo: 'PY', nombre: 'Paraguay', moneda: 'PYG', simbolo: '₲' },
  { codigo: 'BO', nombre: 'Bolivia', moneda: 'BOB', simbolo: 'Bs' },
  { codigo: 'CR', nombre: 'Costa Rica', moneda: 'CRC', simbolo: '₡' },
  { codigo: 'PA', nombre: 'Panamá', moneda: 'PAB', simbolo: 'B/.' },
  { codigo: 'HN', nombre: 'Honduras', moneda: 'HNL', simbolo: 'L' },
  { codigo: 'GT', nombre: 'Guatemala', moneda: 'GTQ', simbolo: 'Q' },
  { codigo: 'NI', nombre: 'Nicaragua', moneda: 'NIO', simbolo: 'C$' },
  { codigo: 'SV', nombre: 'El Salvador', moneda: 'USD', simbolo: 'US$' },
  { codigo: 'DO', nombre: 'Rep. Dominicana', moneda: 'DOP', simbolo: 'RD$' },
  { codigo: 'CU', nombre: 'Cuba', moneda: 'CUP', simbolo: '$' },
  { codigo: 'BR', nombre: 'Brasil', moneda: 'BRL', simbolo: 'R$' },
]

export function getMonedaByPais(codigoPais: string): PaisMoneda | undefined {
  return PAISES_MONEDAS.find((p) => p.codigo === codigoPais)
}

export function formatPrecio(valor: number, codigoPais?: string): string {
  const pais = codigoPais ? getMonedaByPais(codigoPais) : PAISES_MONEDAS[0]
  const simbolo = pais?.simbolo ?? '$'
  return `${simbolo}${valor.toLocaleString('es')}`
}
