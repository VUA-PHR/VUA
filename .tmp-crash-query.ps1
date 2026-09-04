Get-WinEvent -FilterHashtable @{LogName='Application'; Id=1000} -MaxEvents 3 -ErrorAction SilentlyContinue | ForEach-Object {
  Write-Output ("TIME " + $_.TimeCreated.ToString("HH:mm:ss"))
  $lines = $_.Message -split "`n"
  Write-Output ($lines[0..8] -join " | ")
  Write-Output "----"
}
