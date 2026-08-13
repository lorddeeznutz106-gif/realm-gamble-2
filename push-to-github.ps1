# Push Realm Gamble to GitHub (run after: gh auth login)
$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Set-Location $PSScriptRoot

Write-Host "Checking GitHub login..." -ForegroundColor Cyan
gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Not logged in. Run this first:" -ForegroundColor Yellow
    Write-Host "  gh auth login" -ForegroundColor White
    Write-Host ""
    Write-Host "Choose: GitHub.com -> HTTPS -> Login with browser" -ForegroundColor Gray
    exit 1
}

Write-Host "Creating GitHub repo and pushing..." -ForegroundColor Cyan
gh repo create realm-gamble --public --source=. --remote=origin --push --description "Pixel multiplayer RPG - gamble, fight monsters, sell loot"

if ($LASTEXITCODE -eq 0) {
    $url = gh repo view --json url -q .url
    Write-Host ""
    Write-Host "Done! Repo URL: $url" -ForegroundColor Green
} else {
    Write-Host "Repo may already exist. Trying push to origin..." -ForegroundColor Yellow
    git remote add origin 2>$null
    gh repo create realm-gamble --public 2>$null
    git remote set-url origin (gh repo view realm-gamble --json url -q .url) 2>$null
    git push -u origin main
}
