param(
  [string]$Message = ""
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path ".git")) {
  git init
}

$status = git status --porcelain
if (-not $status) {
  Write-Host "Geen wijzigingen om te bewaren."
  exit 0
}

git add .

if (-not $Message) {
  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
  $Message = "Bewaar versie $stamp"
}

git commit -m $Message

$remote = git remote
if ($remote) {
  git push
} else {
  Write-Host "Commit gemaakt. Geen remote ingesteld, dus er is niets gepusht."
  Write-Host "Stel later een remote in met: git remote add origin <url>"
}
