$ErrorActionPreference = 'Stop'
$confirmation = Read-Host 'This permanently deletes the MDATE development PostgreSQL, MinIO, and dependency-cache volumes. Type RESET MDATE DEV to continue'
if ($confirmation -cne 'RESET MDATE DEV') {
    Write-Host 'Reset cancelled. No volumes were removed.'
    exit 0
}
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Push-Location $repoRoot
try {
    & docker compose --env-file .env -f docker/compose/compose.yaml down --volumes --remove-orphans
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose volume reset failed.' }
    Write-Host 'MDATE development volumes removed. The next start will initialize an empty database and MinIO store.'
} finally {
    Pop-Location
}
