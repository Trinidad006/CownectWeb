import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

const APK_FILENAME = 'Cownect-Android.apk'

/**
 * Descarga del APK de Android (versión estable).
 * Orden de búsqueda:
 * 1. DOWNLOAD_ANDROID_URL en .env.local (URL externa)
 * 2. Archivo en public/apk/Cownect-Android.apk (genera con: flutter build apk, luego copia)
 */
export async function GET() {
  const downloadUrl = process.env.DOWNLOAD_ANDROID_URL

  if (downloadUrl) {
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
          'Content-Disposition': `attachment; filename="${APK_FILENAME}"`,
        },
      })
    } catch (err) {
      console.error('Error descarga Android (URL):', err)
      return NextResponse.json(
        { message: 'Error al obtener la aplicación' },
        { status: 500 }
      )
    }
  }

  const apkPath = path.join(process.cwd(), 'public', 'apk', APK_FILENAME)
  if (existsSync(apkPath)) {
    try {
      const buffer = readFileSync(apkPath)
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': `attachment; filename="${APK_FILENAME}"`,
        },
      })
    } catch (err) {
      console.error('Error leyendo APK local:', err)
      return NextResponse.json(
        { message: 'Error al leer la aplicación' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    {
      message:
        'Descarga no configurada. Opciones: 1) Añade DOWNLOAD_ANDROID_URL en .env.local, o 2) Ejecuta "flutter build apk" en CownectMobile y copia el APK a public/apk/Cownect-Android.apk',
    },
    { status: 501 }
  )
}
