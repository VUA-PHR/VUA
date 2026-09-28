param(
    [string]$UnityExecutable = $env:VUA_UNITY_EXECUTABLE,
    [string]$SourceFolder = $env:VUA_REAL_SOURCE_FOLDER
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$checks = [System.Collections.Generic.List[object]]::new()
function Record($Name, $Status, $Detail) {
    $checks.Add([pscustomobject]@{ name = $Name; status = $Status; detail = $Detail })
}
foreach ($name in @('node', 'pnpm', 'cargo')) {
    $command = Get-Command $name -ErrorAction SilentlyContinue
    if ($command) { Record $name 'detected' $command.Source }
    else { Record $name 'missing' 'Not found on PATH' }
}
$steamRoots = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$steamKey = Get-ItemProperty -LiteralPath 'HKCU:/Software/Valve/Steam' -ErrorAction SilentlyContinue
if ($steamKey -and $steamKey.SteamPath) { [void]$steamRoots.Add($steamKey.SteamPath) }
if (${env:ProgramFiles(x86)}) { [void]$steamRoots.Add((Join-Path ${env:ProgramFiles(x86)} 'Steam')) }
foreach ($root in @($steamRoots)) {
    $libraries = Join-Path $root 'steamapps/libraryfolders.vdf'
    if (Test-Path -LiteralPath $libraries -PathType Leaf) {
        $vdf = Get-Content -LiteralPath $libraries -Raw
        foreach ($match in [regex]::Matches($vdf, '"path"\s+"([^"]+)"')) {
            [void]$steamRoots.Add($match.Groups[1].Value.Replace('\\', '\'))
        }
    }
}
foreach ($app in @(@{ id = '438100'; name = 'vrchat' }, @{ id = '250820'; name = 'steamvr' })) {
    $manifests = @($steamRoots | ForEach-Object { Join-Path $_ "steamapps/appmanifest_$($app.id).acf" } | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf })
    Record $app.name $(if ($manifests.Count) { 'installation_record_found' } else { 'not_detected' }) ([pscustomobject]@{
        manifests = $manifests; limitation = 'Steam metadata only; files, updates, launch, login, headset and gameplay are unverified.'
    })
}
if (-not $UnityExecutable) {
    $candidate = Join-Path ${env:ProgramFiles} 'Unity/Hub/Editor/2022.3.22f1/Editor/Unity.exe'
    if (Test-Path -LiteralPath $candidate -PathType Leaf) { $UnityExecutable = $candidate }
}
if ($UnityExecutable -and (Test-Path -LiteralPath $UnityExecutable -PathType Leaf)) {
    $version = (Get-Item -LiteralPath $UnityExecutable).VersionInfo.ProductVersion
    $status = if ($version -match '^2022\.3\.22f1(?:$|[^a-zA-Z0-9])') { 'detected' } else { 'unsupported_or_unverified' }
    Record 'unity' $status ([pscustomobject]@{ path = $UnityExecutable; productVersion = $version })
} else { Record 'unity' 'missing_or_unconfigured' 'Set VUA_UNITY_EXECUTABLE to the global 2022.3.22f1 editor; other install locations were not searched.' }
if ($SourceFolder -and (Test-Path -LiteralPath $SourceFolder -PathType Container)) {
    $count = @(Get-ChildItem -LiteralPath $SourceFolder -Filter '*.unitypackage' -File -Recurse).Count
    Record 'assets' $(if ($count -gt 0) { 'detected' } else { 'missing' }) ([pscustomobject]@{ folder = $SourceFolder; unitypackageCount = $count })
} else { Record 'assets' 'not_configured' 'Provide an authorized local source directory; no assets were searched or opened.' }
Record 'clean_environment' 'not_run' 'This inventory cannot prove a clean Windows environment; use an independently recorded fresh machine or VM baseline.'
Record 'sdk_and_modular_avatar' 'not_run' 'Verify actual package versions in the disposable test project; a stub is not acceptance evidence.'
Record 'production_flows' 'not_run' 'Detection is not installation, launch, Bridge, rendering, or end-to-end acceptance.'
$commit = (& git -C $repo rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Cannot identify source revision' }
$dirty = @(& git -C $repo status --porcelain).Count -gt 0
$runId = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
$output = Join-Path $repo "_local_real_machine/$runId"
New-Item -ItemType Directory -Path $output -Force | Out-Null
$report = [ordered]@{
    reportVersion = 1; runId = $runId; occurredAt = [DateTime]::UtcNow.ToString('o')
    commit = $commit; dirty = $dirty; platform = [Environment]::OSVersion.VersionString
    kind = 'read_only_inventory'; acceptance = 'not_run'; checks = @($checks.ToArray())
}
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $output 'baseline.json') -Encoding UTF8
$checks | Select-Object name,status | Format-Table -AutoSize
Write-Output "Local evidence: $output/baseline.json"
