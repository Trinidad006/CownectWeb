import { NextResponse } from 'next/server'

/**
 * Descarga del APK de Android (versión estable).
 * Configura DOWNLOAD_ANDROID_URL en .env.local con la URL del APK para habilitar la descarga.
 */
export async function GET() {
  const downloadUrl = process.env.DOWNLOAD_ANDROID_URL
  if (!downloadUrl) {
    return NextResponse.json(
      {
        message:
          'Descarga no configurada. Añade DOWNLOAD_ANDROID_URL en .env.local con la URL del APK.',
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
        'Content-Disposition': 'attachment; filename="Cownect-Android.apk"',
      },
    })
  } catch (err) {
    console.error('Error descarga Android:', err)
    return NextResponse.json(
      { message: 'Error al obtener la aplicación' },
      { status: 500 }
    )
  }
}
