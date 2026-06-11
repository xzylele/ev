@echo off
rem Mock unzip command for Windows using PowerShell Expand-Archive
rem Arguments expected: -qo <zip-path> -d <dest-path>
powershell -NoProfile -Command "Expand-Archive -Path '%~2' -DestinationPath '%~4' -Force"
