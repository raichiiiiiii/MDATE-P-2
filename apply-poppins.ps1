$ErrorActionPreference = "Stop"

$repoRoot = $PSScriptRoot
$expoRoot = Join-Path $repoRoot "src\expo-test"
$packageJson = Join-Path $expoRoot "package.json"
$shimPath = Join-Path $expoRoot "src\shared\ui\native.tsx"

if (-not (Test-Path -LiteralPath $packageJson)) {
    throw "Could not find src\expo-test\package.json. Extract this overlay into the MDATE repository root."
}

if (-not (Test-Path -LiteralPath $shimPath)) {
    throw "Could not find the Poppins React Native wrapper at src\expo-test\src\shared\ui\native.tsx."
}

Write-Host "Installing the Expo Poppins font package..." -ForegroundColor Cyan
Push-Location $expoRoot
try {
    npm install --save-exact @expo-google-fonts/poppins@0.4.1
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed. Check your network connection and try again."
    }
}
finally {
    Pop-Location
}

# Route every Expo app import through the shared native shim. It re-exports
# React Native APIs unchanged except Text/TextInput, which apply Poppins.
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -LiteralPath $expoRoot -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx |
    Where-Object {
        $_.FullName -notlike "*\node_modules\*" -and
        $_.FullName -notlike "*\.expo\*" -and
        $_.FullName -ne $shimPath
    }

$changedFiles = 0
$changedImports = 0
$pattern = '(from\s+)(["''])react-native\2'

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $sourceDirectory = $file.DirectoryName.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar

    $sourceUri = New-Object System.Uri($sourceDirectory)
    $shimUri = New-Object System.Uri($shimPath)
    $relativePath = [System.Uri]::UnescapeDataString($sourceUri.MakeRelativeUri($shimUri).ToString())
    $relativePath = $relativePath -replace '\.tsx?$', ''
    $relativePath = $relativePath -replace '\\', '/'

    if (-not $relativePath.StartsWith(".")) {
        $relativePath = "./$relativePath"
    }

    $modulePath = $relativePath
    $fileImportCount = 0

    $updated = [System.Text.RegularExpressions.Regex]::Replace(
        $content,
        $pattern,
        [System.Text.RegularExpressions.MatchEvaluator]{
            param($match)
            $fileImportCount++
            $quote = $match.Groups[2].Value
            return $match.Groups[1].Value + $quote + $modulePath + $quote
        }
    )

    if ($fileImportCount -gt 0) {
        [System.IO.File]::WriteAllText($file.FullName, $updated, $utf8NoBom)
        $changedFiles++
        $changedImports += $fileImportCount
        Write-Host ("Updated {0} ({1} import(s))" -f $file.FullName.Substring($expoRoot.Length + 1), $fileImportCount)
    }
}

Write-Host ""
Write-Host "Poppins integration applied." -ForegroundColor Green
Write-Host ("Files updated: {0}" -f $changedFiles)
Write-Host ("React Native imports redirected: {0}" -f $changedImports)
Write-Host ""
Write-Host "Next: cd src\expo-test ; npx expo start -c"
