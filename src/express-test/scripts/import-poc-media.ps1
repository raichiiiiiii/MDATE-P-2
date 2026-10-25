param(
    [string]$PocRoot = 'C:\Users\User\Downloads\M-DATE\M-DATE',
    [string]$TargetRoot = (Join-Path $PSScriptRoot '..\storage\media')
)

$ErrorActionPreference = 'Stop'
$sourceImages = Join-Path $PocRoot 'images'
$targetImages = Join-Path $TargetRoot 'images'
$files = @('kereta.jpg', 'action-membaca.jpg', 'bookbw.png', 'bookclr.png')

if (-not (Test-Path -LiteralPath $sourceImages -PathType Container)) {
    throw "POC images folder was not found: $sourceImages. Pass -PocRoot if your POC is elsewhere."
}
New-Item -ItemType Directory -Path $targetImages -Force | Out-Null

$missing = @()
foreach ($name in $files) {
    $source = Join-Path $sourceImages $name
    if (Test-Path -LiteralPath $source -PathType Leaf) {
        Copy-Item -LiteralPath $source -Destination (Join-Path $targetImages $name) -Force
        Write-Host "Copied $name"
    } else {
        $missing += $name
        Write-Warning "Missing POC asset: $source"
    }
}

if ($missing.Count -gt 0) {
    Write-Warning "Import completed with missing assets: $($missing -join ', ')"
    exit 1
}
Write-Host "Imported $($files.Count) starter media files into $targetImages"
