$ErrorActionPreference = 'Stop'
$endpoint = 'http://localhost:9000/minio/health/ready'
Write-Host "Checking MinIO readiness at $endpoint"
try {
    $response = Invoke-WebRequest -Uri $endpoint -Method Get -TimeoutSec 5
    Write-Host "MinIO readiness: HTTP $([int]$response.StatusCode)"
} catch {
    Write-Error "MinIO is not responding at $endpoint. Start the MinIO service and inspect Docker logs. $($_.Exception.Message)"
    exit 1
}
Write-Host 'MinIO health check passed.'
