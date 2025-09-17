@echo off
echo.
echo ==================================
echo   Prompt Studio AI - Git Commit
echo ==================================
echo.

REM Check if Git repository exists
git rev-parse --is-inside-work-tree >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Este nao e um repositorio Git.
    echo Execute primeiro: git init
    echo.
    pause
    exit /b 1
)

REM Check for uncommitted changes
git status --porcelain >nul 2>&1
if %errorlevel% neq 0 (
    echo Nenhuma mudanca para commitar.
    echo.
    pause
    exit /b 0
)

echo Adicionando arquivos...
git add .

REM Get current date and time for commit message
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (
    set "currentDate=%%a-%%b-%%c"
)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (
    set "currentTime=%%a:%%b"
)
set "commitMessage=Update %currentDate% %currentTime% - Prompt Studio AI"

echo.
echo Realizando commit com a mensagem:
echo "%commitMessage%"
echo.

git commit -m "%commitMessage%"

if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha no commit. Verifique se ha arquivos para commitar.
    echo.
    pause
    exit /b 1
)

echo.
echo Verificando repositorio remoto...
git remote -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo AVISO: Nenhum repositorio remoto configurado.
    echo Para conectar ao GitHub:
    echo 1. Crie um repositorio no GitHub chamado "prompt-studio-ai"
    echo 2. Execute: git remote add origin https://github.com/SEU_USERNAME/prompt-studio-ai.git
    echo 3. Execute: git push -u origin master
    echo.
) else (
    echo Enviando para o repositorio remoto...
    git push
    if %errorlevel% neq 0 (
        echo.
        echo AVISO: Falha no push. Talvez precise configurar o branch upstream.
        echo Execute: git push -u origin master
        echo.
    )
)

echo.
echo ==================================
echo   Commit realizado com sucesso!
echo ==================================
echo.
pause
