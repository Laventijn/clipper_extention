$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path ".git")) {
  Write-Host "Geen git-repository gevonden. Voer eerst git-eerste-setup.bat uit."
  exit 1
}

$remote = git remote
if (-not $remote) {
  Write-Host "Geen remote ingesteld. Stel er een in met: git remote add origin <url>"
  exit 1
}

$status = git status --porcelain
if ($status) {
  Write-Host "Er staan nog niet-bewaarde wijzigingen open:"
  git status --short
  Write-Host ""

  $Message = Read-Host "Commitnaam (leeg = automatische naam met datum/tijd)"
  if (-not $Message) {
    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $Message = "Bewaar versie $stamp"
  }

  git add .
  git commit -m $Message
  Write-Host ""
}

$branch = git branch --show-current
git rev-parse --abbrev-ref --symbolic-full-name '@{u}' *> $null

if ($LASTEXITCODE -eq 0) {
  git push
} else {
  git push -u origin $branch
}

Write-Host ""
Write-Host "Gepusht naar $(git remote get-url origin) (branch: $branch)"
