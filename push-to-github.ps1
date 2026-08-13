# Auto-commit and push Realm Gamble changes to GitHub
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCmd) {
    $gitCmd = "C:\Program Files\Git\cmd\git.exe"
    if (-not (Test-Path $gitCmd)) {
        Write-Host "Git was not found in PATH or the default install location." -ForegroundColor Red
        exit 1
    }
} else {
    $gitCmd = $gitCmd.Source
}

$gitEmail = & $gitCmd config --global --get user.email 2>$null
if (-not $gitEmail) {
    & $gitCmd config --global user.email "lorddeeznutz106@gmail.com"
}

$gitName = & $gitCmd config --global --get user.name 2>$null
if (-not $gitName) {
    & $gitCmd config --global user.name "lord"
}

Write-Host "Checking git status..." -ForegroundColor Cyan
& $gitCmd status --short

$changes = & $gitCmd status --porcelain
if ($changes) {
    $message = "Auto update " + (Get-Date -Format "yyyy-MM-dd HH:mm")
    Write-Host "Staging all changes..." -ForegroundColor Cyan
    & $gitCmd add -A

    Write-Host "Committing changes..." -ForegroundColor Cyan
    & $gitCmd commit -m $message
} else {
    Write-Host "No file changes to commit." -ForegroundColor Yellow
}

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
& $gitCmd push origin main

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "" 
Write-Host "Push complete." -ForegroundColor Green
