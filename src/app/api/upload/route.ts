import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { google } from 'googleapis'

function getDriveClient() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId) return { error: 'Falta GOOGLE_DRIVE_FOLDER_ID en .env.local' }

  // Opción 1: OAuth2 con refresh token (carpeta en "Mi unidad" - cuenta personal)
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET

  if (refreshToken && clientId && clientSecret) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, undefined)
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    return { drive, folderId }
  }

  // Opción 2: Cuenta de servicio (requiere Unidad compartida)
  let credentials: object
  const jsonVar = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON
  const pathVar = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH

  if (jsonVar) {
    credentials = JSON.parse(jsonVar)
  } else if (pathVar) {
    const fs = require('fs')
    const path = require('path')
    const fullPath = path.resolve(process.cwd(), pathVar)
    const raw = fs.readFileSync(fullPath, 'utf8')
    credentials = JSON.parse(raw)
  } else {
    return {
      error:
        'Configura Google Drive con OAuth (GOOGLE_DRIVE_REFRESH_TOKEN, CLIENT_ID, CLIENT_SECRET) o con cuenta de servicio (GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH). Ver GOOGLE_DRIVE_SETUP.md',
    }
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })
  const drive = google.drive({ version: 'v3', auth })
  return { drive, folderId }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'documentos'

    if (!file) {
      return NextResponse.json(
        { error: 'No se envió ningún archivo' },
        { status: 400 }
      )
    }

    const result = getDriveClient()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    const { drive, folderId } = result

    const buffer = Buffer.from(await file.arrayBuffer())
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${folder}/${Date.now()}_${sanitizedName}`

    const res = await drive.files.create({
      ...(!process.env.GOOGLE_DRIVE_REFRESH_TOKEN && { supportsAllDrives: true }),
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: Readable.from(buffer),
      },
    })

    const fileId = res.data.id
    if (!fileId) {
      return NextResponse.json(
        { error: 'No se obtuvo ID del archivo subido' },
        { status: 500 }
      )
    }

    await drive.permissions.create({
      ...(!process.env.GOOGLE_DRIVE_REFRESH_TOKEN && { supportsAllDrives: true }),
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    })

    const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`
    return NextResponse.json({ url, fileId })
  } catch (error: any) {
    console.error('Error subiendo a Drive:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al subir el archivo' },
      { status: 500 }
    )
  }
}
