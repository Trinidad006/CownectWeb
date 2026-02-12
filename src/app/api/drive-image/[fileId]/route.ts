import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'

function getDriveClient() {
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET

  if (refreshToken && clientId && clientSecret) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, undefined)
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    return google.drive({ version: 'v3', auth: oauth2Client })
  }

  const jsonVar = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON
  if (!jsonVar) {
    throw new Error(
      'Faltan credenciales de Drive. Configura OAuth (refresh/client id/secret) o GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON'
    )
  }

  const credentials = JSON.parse(jsonVar)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  return google.drive({ version: 'v3', auth })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params
    if (!fileId) {
      return NextResponse.json({ error: 'fileId requerido' }, { status: 400 })
    }

    const drive = getDriveClient()
    const metadata = await drive.files.get({
      fileId,
      fields: 'mimeType,name',
      supportsAllDrives: true,
    })

    const fileRes = await drive.files.get(
      {
        fileId,
        alt: 'media',
        supportsAllDrives: true,
      },
      { responseType: 'arraybuffer' }
    )

    const mimeType = metadata.data.mimeType || 'application/octet-stream'
    const buffer = Buffer.from(fileRes.data as ArrayBuffer)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error: any) {
    console.error('Error sirviendo imagen de Drive:', error?.message || error)
    return NextResponse.json({ error: 'No se pudo cargar la imagen' }, { status: 500 })
  }
}
