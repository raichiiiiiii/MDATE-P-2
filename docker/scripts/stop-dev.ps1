$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Push-Location $repoRoot
try {
    & docker compose --env-file .env -f docker/compose/compose.yaml down --remove-orphans
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose stop failed.' }
} finally {
    Pop-Location
}
