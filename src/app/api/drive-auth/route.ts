import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/drive.file']

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Configura GOOGLE_DRIVE_CLIENT_ID y GOOGLE_DRIVE_CLIENT_SECRET en .env.local' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : request.nextUrl.origin
  const redirectUri = `${baseUrl}/api/drive-auth`

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

  if (!code) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    })
    return NextResponse.redirect(authUrl)
  }

  const { tokens } = await oauth2Client.getToken(code)
  const refreshToken = tokens.refresh_token

  if (!refreshToken) {
    return new NextResponse(
      '<html><body><h1>No se obtuvo refresh_token</h1><p>Vuelve a intentar y asegúrate de aceptar todos los permisos.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Token de Drive</title></head>
<body style="font-family:sans-serif; max-width:600px; margin:2rem auto; padding:1rem;">
  <h1>Configuración de Google Drive (OAuth)</h1>
  <p>Copia el valor de abajo y pégalo en tu archivo <strong>.env.local</strong> como:</p>
  <pre style="background:#f0f0f0; padding:0.5rem;">GOOGLE_DRIVE_REFRESH_TOKEN=...</pre>
  <p><strong>Refresh token (cópialo):</strong></p>
  <textarea id="token" readonly style="width:100%; height:80px; font-size:12px;">${refreshToken}</textarea>
  <p><button onclick="navigator.clipboard.writeText(document.getElementById('token').value)">Copiar al portapapeles</button></p>
  <p>Luego añade también en .env.local:</p>
  <pre style="background:#f0f0f0; padding:0.5rem;">GOOGLE_DRIVE_CLIENT_ID=tu-client-id
GOOGLE_DRIVE_CLIENT_SECRET=tu-client-secret
GOOGLE_DRIVE_FOLDER_ID=id-de-tu-carpeta-en-mi-unidad</pre>
  <p>Reinicia la app (npm run dev) y ya podrás subir a tu carpeta en Mi unidad.</p>
</body>
</html>
  `
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
