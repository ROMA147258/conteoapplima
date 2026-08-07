@echo off
title Conteo de Votos - Ejecutador App
color 0b

echo ========================================================
echo          Verificando Dependencias de Conteo de Votos
echo ========================================================
echo.

if exist package.json (
    if exist node_modules (
        echo [+] Dependencias encontradas. Omitiendo instalacion.
    ) else (
        echo [!] Dependencias NO encontradas. Instalando...
        call npm install
        if %errorlevel% neq 0 (
            echo [ERROR] No se pudieron instalar las dependencias.
            pause
            exit /b
        )
    )
) else (
    echo [+] Modulos nativos de Node.js detectados. No se requieren dependencias externas.
)

echo.
echo ========================================================
echo    Iniciando Servidor Node.js (Puerto 5180)...
echo ========================================================
echo.

node server.js
if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo   [ERROR] El servidor finalizo con codigo de error %errorlevel%
    echo ========================================================
    echo.
    pause
) else (
    echo.
    echo ========================================================
    echo   El servidor ha finalizado. Presiona una tecla para salir.
    echo ========================================================
    pause
)

