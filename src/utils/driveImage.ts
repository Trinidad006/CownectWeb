export function extractGoogleDriveFileId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return null
  }
  let fileId: string | null = null

  const idFromQuery = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idFromQuery && idFromQuery[1]) {
    fileId = idFromQuery[1]
  }

  if (!fileId) {
    const idFromPath = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/)
    if (idFromPath && idFromPath[1]) {
      fileId = idFromPath[1]
    }
  }

  if (!fileId && /^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    fileId = trimmed
  }

  return fileId
}

/**
 * Convierte una URL de Google Drive a un proxy interno para evitar problemas
 * de permisos/cookies de Google en el navegador.
 */
export function getDriveImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') {
    return ''
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return ''
  }

  const fileId = extractGoogleDriveFileId(trimmed)
  if (fileId) {
    return `/api/drive-image/${fileId}`
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn(`[getDriveImageUrl] URL no reconocida de Drive, se usa original: "${trimmed}"`)
  }
  return trimmed
}
