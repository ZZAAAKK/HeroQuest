param()

Set-StrictMode -Version Latest

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root

$dist = Join-Path $root '..\dist'
$unpacked = Join-Path $dist 'win-unpacked'
$zip = Join-Path $dist 'heroquest-win-unpacked.zip'
$outExe = Join-Path $dist 'heroquest-installer.exe'

if (-not (Test-Path $unpacked)) {
    Write-Error "Unpacked folder not found: $unpacked"
    exit 2
}

Write-Host "Creating zip $zip from $unpacked"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $unpacked '*') -DestinationPath $zip -Force

# If Zip2Exe is available, use it
$zip2exe = (& where.exe Zip2Exe.exe 2>$null) -join ''
if ($zip2exe) {
    Write-Host "Found Zip2Exe at $zip2exe, creating installer via Zip2Exe"
    & $zip2exe $zip $outExe
    if ($LASTEXITCODE -ne 0) { Write-Error "Zip2Exe failed with exit $LASTEXITCODE"; exit $LASTEXITCODE }
    Write-Host "Created installer: $outExe"
    exit 0
}

Write-Host "Zip2Exe not found. Falling back to creating NSIS script and calling makensis."

$nsi = @"
; Auto-generated NSIS script to create installer from win-unpacked
Name "HeroQuest"
OutFile "{OUT_EXE}"
InstallDir "$PROGRAMFILES64\\HeroQuest"
RequestExecutionLevel user

Section "Install"
  SetOutPath "$INSTDIR"
  ; Recursively include all files from win-unpacked
  File /r "{UNPACKED}\*"
SectionEnd

Section "Shortcuts"
  CreateDirectory "$SMPROGRAMS\\HeroQuest"
  CreateShortCut "$SMPROGRAMS\\HeroQuest\\HeroQuest.lnk" "$INSTDIR\\heroquest.exe"
SectionEnd
"@

$nsi = $nsi -replace '\{UNPACKED\}', ($unpacked -replace '\\','\\\\')
$nsi = $nsi -replace '\{OUT_EXE\}', ($outExe -replace '\\','\\\\')

$nsiPath = Join-Path $dist 'install_from_unpacked.nsi'
Set-Content -Path $nsiPath -Value $nsi -Encoding UTF8

# find makensis
$makensis = (& where.exe makensis.exe 2>$null) -join ''
if (-not $makensis) {
    Write-Error "makensis not found in PATH. Please install NSIS or add makensis.exe to PATH."
    exit 3
}

Write-Host "Running makensis with script: $nsiPath"
& $makensis $nsiPath
if ($LASTEXITCODE -ne 0) { Write-Error "makensis failed with exit $LASTEXITCODE"; exit $LASTEXITCODE }

if (Test-Path $outExe) { Write-Host "Created installer: $outExe" } else { Write-Error "Installer was not created."; exit 4 }
