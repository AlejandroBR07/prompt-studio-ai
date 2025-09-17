@echo off
echo.
echo ==================================
echo   Assistente de Commit
echo ==================================
echo.

REM Check if Git repository exists, if not, initialize it
git rev-parse --is-inside-work-tree >nul 2>&1
if %errorlevel% neq 0 (
    echo Git repository not found. Initializing...
    git init
    echo Git repository initialized.
)

git add .

REM Get current date for commit message
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (
    set "currentDate=%%a-%%b-%%c"
)
set "commitMessage=Commit on %currentDate%"

echo.
echo "Realizando commit com a mensagem: %commitMessage%"
git commit -m "%commitMessage%"

echo.
echo "Verificando e enviando para o repositorio remoto (push)..."
git remote -v >nul 2>&1
if %errorlevel% neq 0 (
    echo No remote repository found. Please create a GitHub repository and add it as a remote.
    echo Example: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
) else (
    git push
)

echo.
echo "Processo finalizado!"
echo.
pause