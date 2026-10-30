param(
    [string]$Root = 'E:\WakeupHelper-final',
    [string]$Stamp = (Get-Date -Format 'yyyyMMdd-HHmmss')
)

$ErrorActionPreference = 'Stop'
$release = Join-Path $Root 'bin\Release'
$dist = Join-Path $Root 'dist'
$name = "WakeupHelper-v3.3-public-core-$Stamp"
$packageDir = Join-Path $dist $name
$zipPath = Join-Path $dist ($name + '.zip')
$reportDir = 'C:\Users\willi\OneDrive\Documents\New project\outputs\hypnosis_debug'
$reportPath = Join-Path $reportDir ("wakeuphelper_public_package_$Stamp.json")

if (Test-Path -LiteralPath $packageDir) { throw "Package directory already exists: $packageDir" }
if (Test-Path -LiteralPath $zipPath) { throw "Package ZIP already exists: $zipPath" }
if (!(Test-Path -LiteralPath (Join-Path $release 'WakeupHelper.exe'))) { throw 'Release EXE is missing.' }

New-Item -ItemType Directory -Force -Path $packageDir | Out-Null
foreach ($subdir in @('config\incorrect', 'config\setting', 'config\template')) {
    New-Item -ItemType Directory -Force -Path (Join-Path $packageDir $subdir) | Out-Null
}

Copy-Item -LiteralPath (Join-Path $release 'WakeupHelper.exe') -Destination $packageDir
Copy-Item -LiteralPath (Join-Path $release 'WakeupHelper.exe.config') -Destination $packageDir
Get-ChildItem -LiteralPath $release -Filter '*.dll' -File | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $packageDir
}

foreach ($subdir in @('incorrect', 'setting', 'template')) {
    $source = Join-Path $release ("config\$subdir")
    Get-ChildItem -LiteralPath $source -Filter '*.json' -File | Where-Object {
        $_.Name -notmatch '\.bak'
    } | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $packageDir ("config\$subdir"))
    }
}

Copy-Item -LiteralPath (Join-Path $Root 'RELEASE-README.md') -Destination (Join-Path $packageDir 'README.md')
Copy-Item -LiteralPath (Join-Path $Root 'NOTICE.md') -Destination $packageDir
Copy-Item -LiteralPath (Join-Path $Root 'V3.3-CASE-ORGANIZER.md') -Destination $packageDir
Copy-Item -LiteralPath (Join-Path $Root 'V3.3-WILL-OBSERVER-ASR.md') -Destination $packageDir

$bannedPattern = '(?i)(^|[\\/])consciousness([\\/]|$)|references\.json$|\.bak(?:\.|$)|\.pdb$'
$bannedFiles = @(Get-ChildItem -LiteralPath $packageDir -Recurse -File | Where-Object {
    $_.FullName -match $bannedPattern
})
if ($bannedFiles.Count -ne 0) {
    throw ('Banned public assets found: ' + (($bannedFiles | ForEach-Object FullName) -join '; '))
}

Compress-Archive -Path $packageDir -DestinationPath $zipPath -CompressionLevel Optimal

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead($zipPath)
try {
    $bannedEntries = @($archive.Entries | Where-Object { $_.FullName -match $bannedPattern })
    if ($bannedEntries.Count -ne 0) {
        throw ('Banned ZIP entries found: ' + (($bannedEntries | ForEach-Object FullName) -join '; '))
    }
    $zipEntryCount = @($archive.Entries | Where-Object { -not [string]::IsNullOrEmpty($_.Name) }).Count
}
finally {
    $archive.Dispose()
}

$verifyRoot = Join-Path $env:TEMP ("wakeuphelper-package-verify-$Stamp")
if (Test-Path -LiteralPath $verifyRoot) { Remove-Item -LiteralPath $verifyRoot -Recurse -Force }
New-Item -ItemType Directory -Force -Path $verifyRoot | Out-Null
try {
    Expand-Archive -LiteralPath $zipPath -DestinationPath $verifyRoot
    $expandedRoot = Join-Path $verifyRoot $name
    if (!(Test-Path -LiteralPath $expandedRoot)) { throw 'ZIP root directory is missing.' }
    $sourceFiles = @(Get-ChildItem -LiteralPath $packageDir -Recurse -File)
    $expandedFiles = @(Get-ChildItem -LiteralPath $expandedRoot -Recurse -File)
    if ($sourceFiles.Count -ne $expandedFiles.Count) {
        throw "ZIP file count mismatch: source=$($sourceFiles.Count), expanded=$($expandedFiles.Count)"
    }
    foreach ($sourceFile in $sourceFiles) {
        $relative = $sourceFile.FullName.Substring($packageDir.Length).TrimStart('\')
        $expanded = Join-Path $expandedRoot $relative
        if (!(Test-Path -LiteralPath $expanded)) { throw "ZIP missing file: $relative" }
        $sourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $sourceFile.FullName).Hash
        $expandedHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $expanded).Hash
        if ($sourceHash -ne $expandedHash) { throw "ZIP hash mismatch: $relative" }
    }
}
finally {
    if (Test-Path -LiteralPath $verifyRoot) { Remove-Item -LiteralPath $verifyRoot -Recurse -Force }
}

New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
$exePath = Join-Path $packageDir 'WakeupHelper.exe'
$result = [ordered]@{
    status = 'PASS'
    package_name = $name
    package_dir = $packageDir
    zip_path = $zipPath
    zip_size = (Get-Item -LiteralPath $zipPath).Length
    zip_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath).Hash
    exe_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $exePath).Hash
    release_exe_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $release 'WakeupHelper.exe')).Hash
    file_count = @(Get-ChildItem -LiteralPath $packageDir -Recurse -File).Count
    zip_file_entries = $zipEntryCount
    banned_assets = 0
    report_path = $reportPath
}
$result | ConvertTo-Json | Set-Content -LiteralPath $reportPath -Encoding UTF8
$result | ConvertTo-Json
