@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo =====================================================
echo   Конвертация: короткая сторона → 720 + ОРИГИНАЛЬНОЕ ПРЕВЬЮ
echo =====================================================
echo.

cd /d "%~dp0downloads" 2>nul || (
    echo Ошибка: Папка "downloads" не найдена!
    pause
    exit /b
)

mkdir ..\ffmpeg 2>nul

for %%i in (*.mp4 *.mov *.mkv *.avi *.webm) do (

    echo.
    echo Обрабатываю: %%i

    set "temp=..\ffmpeg\temp_%%~ni.mp4"
    set "thumb=..\ffmpeg\thumb_%%~ni.jpg"
    set "out=..\ffmpeg\%%~ni.mp4"

    REM === 1. извлекаем превью ===
    ffmpeg -y -i "%%i" -map 0:v:1 -c copy "!thumb!" >nul 2>&1

    REM === 2. конвертация ===
    ffmpeg -y -i "%%i" ^
        -vf "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)':flags=lanczos,format=yuv420p" ^
        -map 0:v:0 -map 0:a? ^
        -c:v libx264 ^
        -preset slow ^
        -crf 25 ^
        -profile:v high ^
        -level 4.1 ^
        -pix_fmt yuv420p ^
        -movflags +faststart ^
        -x264-params "ref=4:bframes=3:me=umh:subme=7:aq-mode=2:aq-strength=1.0:deblock=1,1" ^
        -c:a aac -b:a 128k ^
        "!temp!"

    REM === 3. возврат превью ===
    if exist "!thumb!" (
        echo   → добавляю оригинальное превью
        ffmpeg -y -i "!temp!" -i "!thumb!" ^
               -map 0 -map 1 ^
               -c copy ^
               -disposition:v:1 attached_pic ^
               "!out!"
    ) else (
        echo   → превью нет
        copy "!temp!" "!out!" >nul
    )

    REM === очистка ===
    del "!temp!" >nul 2>&1
    del "!thumb!" >nul 2>&1
)

echo.
echo Готово! Результаты в папке "ffmpeg"
pause