# Script para solucionar problemas de instalación de dependencias
# Ejecuta este script como Administrador

Write-Host "=== Solucionando problemas de dependencias ===" -ForegroundColor Cyan

# 1. Detener procesos de Node que puedan estar bloqueando archivos
Write-Host "`n1. Deteniendo procesos de Node..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Eliminar node_modules si existe
if (Test-Path "node_modules") {
    Write-Host "`n2. Eliminando node_modules existente..." -ForegroundColor Yellow
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}

# 3. Eliminar package-lock.json para reinstalación limpia
if (Test-Path "package-lock.json") {
    Write-Host "`n3. Eliminando package-lock.json..." -ForegroundColor Yellow
    Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
}

# 4. Limpiar caché de npm
Write-Host "`n4. Limpiando caché de npm..." -ForegroundColor Yellow
npm cache clean --force

# 5. Instalar dependencias
Write-Host "`n5. Instalando dependencias..." -ForegroundColor Green
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== ¡Instalación completada exitosamente! ===" -ForegroundColor Green
    Write-Host "Ahora puedes ejecutar: npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "`n=== Error en la instalación ===" -ForegroundColor Red
    Write-Host "Intenta ejecutar este script como Administrador o mueve el proyecto fuera de OneDrive" -ForegroundColor Yellow
}
