@echo off
setlocal enabledelayedexpansion
title Voto Real - Compartir en Linea

echo ========================================================
echo        VOTO REAL - COMPARTIR PAGINA EN LINEA
echo ========================================================
echo.

:: 1. Verificar Cloudflare
if not exist "%~dp0cloudflared.exe" (
    if exist "%~dp0_backup_original\cloudflared.exe" (
        echo [INFO] Copiando cloudflared.exe desde _backup_original...
        copy "%~dp0_backup_original\cloudflared.exe" "%~dp0cloudflared.exe" >nul
    ) else (
        echo [ERROR] No se encontro cloudflared.exe en el directorio raiz ni en _backup_original.
        pause
        exit /b 1
    )
)

:: 2. Verificar compilacion del Frontend
if not exist "%~dp0frontend\dist\index.html" (
    echo [1/3] Compilando aplicacion web frontend...
    cd /d "%~dp0frontend"
    call npm run build
    cd /d "%~dp0"
    echo.
)

:: 3. Iniciar Servidor Backend (Puerto 5180)
echo [2/3] Iniciando servidor backend en puerto 5180...
start "VotoReal - Servidor Backend" /min cmd /c "cd /d "%~dp0backend" && npm start"

:: Esperar un momento a que el servidor inicialice
timeout /t 2 /nobreak >nul

:: 4. Generar tunel publico con Cloudflare
echo.
echo [3/3] Generando enlace publico con Cloudflare...
echo.
echo ========================================================
echo   INSTRUCCIONES:
echo   1. Copia el enlace HTTPS que aparece abajo.
echo      Formato: https://xxxx.trycloudflare.com
echo.
echo   2. Pasale ese enlace a cualquier persona o personero.
echo      Podran abrirlo en su PC o Celular (4G/5G/Wi-Fi).
echo.
echo   3. El enlace se mantendra ACTIVO hasta que cierres
echo      esta ventana o apagues tu laptop.
echo ========================================================
echo.

"%~dp0cloudflared.exe" tunnel --url http://127.0.0.1:5180

pause
