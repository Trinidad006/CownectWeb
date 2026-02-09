/**
 * Convierte una URL de Google Drive al formato thumbnail que sí se puede usar
 * como src de <img>. El formato /uc?export=view a veces no carga en el navegador.
 * Ver: https://drive.google.com/thumbnail?id=FILE_ID&sz=w800
 */
export function getDriveImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getDriveImageUrl] URL inválida:', url)
    }
    return ''
  }
  
  const trimmed = url.trim()
  if (!trimmed) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getDriveImageUrl] URL vacía después de trim')
    }
    return ''
  }

  // Si ya es una URL thumbnail, devolverla tal cual
  if (trimmed.includes('/thumbnail?id=')) {
    return trimmed
  }

  // Extraer file ID de varios formatos posibles:
  // - https://drive.google.com/uc?export=view&id=FILE_ID
  // - https://drive.google.com/file/d/FILE_ID/view
  // - https://drive.google.com/open?id=FILE_ID
  // - FILE_ID directo (sin URL)
  let fileId: string | null = null
  
  // Buscar en query params: ?id= o &id=
  const idFromQuery = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idFromQuery && idFromQuery[1]) {
    fileId = idFromQuery[1]
  }
  
  // Buscar en path: /d/FILE_ID/ o /file/d/FILE_ID/
  if (!fileId) {
    const idFromPath = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/)
    if (idFromPath && idFromPath[1]) {
      fileId = idFromPath[1]
    }
  }
  
  // Si parece ser solo un ID (sin URL completa)
  if (!fileId && /^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    fileId = trimmed
  }
  
  // Si encontramos fileId, convertir a thumbnail
  if (fileId) {
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`
    if (process.env.NODE_ENV === 'development') {
      console.log(`[getDriveImageUrl] Convertido: "${trimmed}" -> "${thumbnailUrl}"`)
    }
    return thumbnailUrl
  }
  
  // Si no podemos convertir, devolver la URL original (puede ser otra URL válida)
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[getDriveImageUrl] No se pudo extraer fileId de: "${trimmed}"`)
  }
  return trimmed
}
