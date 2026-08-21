@echo off
setlocal

cd /d "%~dp0\.."

if not exist ".git" (
  git init
)

git status

echo.
echo Optioneel, koppel later een GitHub/GitLab remote:
echo git remote add origin ^<url^>
echo git branch -M main
echo git push -u origin main

endlocal
