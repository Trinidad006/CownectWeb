/**
 * Convierte una URL de Google Drive al formato thumbnail que sí se puede usar
 * como src de <img>. El formato /uc?export=view a veces no carga en el navegador.
 * Ver: https://drive.google.com/thumbnail?id=FILE_ID&sz=w800
 */
export function getDriveImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null

  // Extraer file ID: ?id=XXX o &id=XXX o /d/XXX/
  const idFromQuery = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  const idFromPath = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/)
  const fileId = idFromQuery?.[1] ?? idFromPath?.[1]
  if (!fileId) return trimmed

  if (trimmed.includes('drive.google.com')) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`
  }
  return trimmed
}
