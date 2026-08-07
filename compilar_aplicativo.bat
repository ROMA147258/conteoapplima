@echo off
title Compilador VotoReal APK
echo ======================================================
echo 🗳️  COMPILANDO APLICATIVO MOVIL (VotoReal.apk)
echo ======================================================
echo.

:: Configurar JDK 17 y Android SDK explícitamente para Gradle
if exist "C:\Program Files\Java\jdk-17.0.18" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-17.0.18"
    set "PATH=C:\Program Files\Java\jdk-17.0.18\bin;%PATH%"
)
if exist "C:\Users\leonr\AppData\Local\Android\Sdk" (
    set "ANDROID_HOME=C:\Users\leonr\AppData\Local\Android\Sdk"
)

if not exist "%~dp0\aplicativo\android\local.properties" (
    echo sdk.dir=C\:\\Users\\leonr\\AppData\\Local\\Android\\Sdk > "%~dp0\aplicativo\android\local.properties"
)

cd /d "%~dp0\aplicativo"

echo [1/4] Sincronizando recursos web con Capacitor (www)...
if not exist "www" mkdir "www"
copy /y *.html www >nul
copy /y *.js www >nul
copy /y *.css www >nul
copy /y *.svg www >nul
call npx cap sync android

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] La sincronización con Capacitor ha fallado.
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo.
echo [2/4] Compilando APK con Gradle (JDK 17)...
cd android
call .\gradlew assembleDebug

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] La compilacion con Gradle ha fallado.
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo.
echo [3/4] Exportando archivo APK final a la ruta principal...
cd /d "%~dp0"
copy /y "%~dp0\aplicativo\android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0\VotoReal.apk" >nul

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se pudo copiar el archivo APK generado.
    pause
    exit /b 1
)

echo.
echo ======================================================
echo 🚀 ¡COMPILACION COMPLETADA CON EXITO!
echo.
echo El archivo APK actualizado esta listo en:
echo %~dp0VotoReal.apk
echo ======================================================
echo.
pause
