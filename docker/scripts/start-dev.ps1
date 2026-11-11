[CmdletBinding()]
param(
    [switch]$WithTunnel
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Push-Location $repoRoot
try {
    if (-not (Test-Path '.env')) {
        throw "Root .env is missing. Copy .env.example to .env and edit the required values first."
    }

    if ($WithTunnel) {
        $tokenLine = Get-Content '.env' | Where-Object { $_ -match '^\s*CLOUDFLARE_TUNNEL_TOKEN\s*=' } | Select-Object -First 1
        $token = if ($tokenLine) { ($tokenLine -split '=', 2)[1].Trim().Trim('"').Trim("'") } else { '' }
        if ([string]::IsNullOrWhiteSpace($token) -or $token -match 'REPLACE|YOUR_TOKEN') {
            throw 'CLOUDFLARE_TUNNEL_TOKEN is empty. Set the token in the root .env before using -WithTunnel.'
        }
    }

    & docker info *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Docker Desktop is not running or the Docker Engine is unavailable.' }

    $baseArgs = @('--env-file', '.env', '-f', 'docker/compose/compose.yaml')
    if ($WithTunnel) { $baseArgs += @('--profile', 'tunnel') }

    Write-Host 'Validating the Compose configuration...'
    & docker compose @baseArgs config --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Compose validation failed. Review the messages above.' }

    $modelConfig = 'src/express-test/models/whisper-aphasia/config.json'
    if (-not (Test-Path $modelConfig)) {
        Write-Warning "Whisper checkpoint not detected at src/express-test/models/whisper-aphasia. The API can start, but speech transcription will fail until the complete local checkpoint is present."
    }

    Write-Host 'Starting MDATE development services...'
    & docker compose @baseArgs up --build -d
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose failed to start the stack.' }

    Write-Host ''
    Write-Host 'MDATE services are starting.'
    Write-Host 'Web app:      http://localhost:8080'
    Write-Host 'Expo Metro:   http://localhost:8081'
    Write-Host 'API health:   http://localhost:8080/health'
    Write-Host 'MinIO UI:     http://localhost:9001'
    if ($WithTunnel) { Write-Host 'Cloudflare Tunnel profile enabled.' }
    Write-Host 'Logs:         docker compose --env-file .env -f docker/compose/compose.yaml logs -f'
} finally {
    Pop-Location
}
