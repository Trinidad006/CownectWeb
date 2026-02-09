import { NextResponse } from 'next/server'

/**
 * Descarga del APK de Android (versión snapshot/experimental).
 * Configura DOWNLOAD_ANDROID_SNAPSHOT_URL en .env.local para habilitar la descarga.
 */
export async function GET() {
  const downloadUrl = process.env.DOWNLOAD_ANDROID_SNAPSHOT_URL
  if (!downloadUrl) {
    return NextResponse.json(
      {
        message:
          'Snapshot no configurado. Añade DOWNLOAD_ANDROID_SNAPSHOT_URL en .env.local o las snapshots no están disponibles.',
      },
      { status: 501 }
    )
  }
  try {
    const res = await fetch(downloadUrl)
    if (!res.ok) {
      return NextResponse.json(
        { message: 'No se pudo obtener el archivo de descarga' },
        { status: 502 }
      )
    }
    const blob = await res.blob()
    const buffer = Buffer.from(await blob.arrayBuffer())
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="Cownect-Snapshot.apk"',
      },
    })
  } catch (err) {
    console.error('Error descarga Android snapshot:', err)
    return NextResponse.json(
      { message: 'Error al obtener la aplicación' },
      { status: 500 }
    )
  }
}
