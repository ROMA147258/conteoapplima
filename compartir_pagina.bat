@echo off
chcp 65001 >nul
title VOTO REAL - Compartir en Línea
color 0a

:: ============================================================
::   VOTO REAL - SISTEMA ELECTORAL LIMA
::   Script para compartir la aplicacion por internet
:: ============================================================

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║              VOTO REAL - COMPARTIR EN LÍNEA                  ║
echo  ║               Sistema Electoral Lima                         ║
echo  ╠══════════════════════════════════════════════════════════════╣

:: Obtener IPs locales
echo  ║                                                              ║
echo  ║  🌐 ACCESO EN RED LOCAL (Wi-Fi / LAN):                       ║
echo  ║  --------------------------------------------------------------║

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set RAW_IP=%%a
    setlocal enabledelayedexpansion
    set CLEAN_IP=!RAW_IP: =!
    echo  ║    -^> http://!CLEAN_IP!:5180/aplicativo/               ║
    endlocal
)

echo  ║                                                              ║
echo  ║  👤 Usuario:     admin                                        ║
echo  ║  🔐 Contraseña:  admin2024                                    ║
echo  ╠══════════════════════════════════════════════════════════════╣
echo  ║                                                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: ─────────────────────────────────────────────────
:: 1. Verificar que SSH esté disponible
:: ─────────────────────────────────────────────────
where ssh >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] No se encontro el comando "ssh" en tu sistema.
    echo  Activa OpenSSH en: Configuracion ^> Aplicaciones ^> Caracteristicas opcionales ^> OpenSSH
    pause
    exit /b
)

:: ─────────────────────────────────────────────────
:: 2. Verificar / Iniciar servidor local en puerto 5180
:: ─────────────────────────────────────────────────
echo  [+] Verificando si el servidor local (Puerto 5180) esta activo...
powershell -Command "Get-NetTCPConnection -LocalPort 5180 -ErrorAction SilentlyContinue" >nul 2>nul
if %errorlevel% neq 0 (
    echo  [!] El servidor local NO esta iniciado.
    echo  [+] Iniciando servidor en segundo plano...
    start "Servidor Voto Real" cmd /k "node server.js"
    echo  [+] Esperando 4 segundos a que inicie el servidor...
    timeout /t 4 /nobreak >nul
) else (
    echo  [+] Servidor local ya esta activo en el puerto 5180.
)

echo.
echo  --------------------------------------------------------------
echo  🌐 GENERANDO ENLACE PÚBLICO PARA COMPARTIR POR INTERNET...
echo  --------------------------------------------------------------
echo  (Por favor espera mientras se genera el enlace publico)
echo.
echo  Copia el enlace HTTPS que aparecera a continuacion:
echo  (Si la conexion se interrumpe, el script reconectara automaticamente)
echo.

:: ─────────────────────────────────────────────────
:: 3. Loop de túnel SSH con reconexión automática
:: ─────────────────────────────────────────────────
:TUNNEL_LOOP
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -R 80:127.0.0.1:5180 serveo.net

echo.
echo  [!] Conexion interrumpida. Reintentando reconectar en 5 segundos...
timeout /t 5 /nobreak >nul
echo  [+] Reconectando al servidor de tunel...
goto TUNNEL_LOOP
