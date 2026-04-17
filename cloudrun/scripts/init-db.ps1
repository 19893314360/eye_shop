$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cloudrunDir = Split-Path -Parent $scriptDir
$sqlPath = Join-Path $cloudrunDir 'sql\init.mysql.sql'

$dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { '127.0.0.1' }
$dbPort = if ($env:DB_PORT) { $env:DB_PORT } else { '3306' }
$dbUser = if ($env:DB_USER) { $env:DB_USER } else { 'root' }
$dbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { '123456' }

$mysqlCommand = Get-Command mysql -ErrorAction SilentlyContinue
if ($mysqlCommand) {
  $mysqlExe = $mysqlCommand.Source
} else {
  $defaultMysqlExe = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
  if (-not (Test-Path $defaultMysqlExe)) {
    throw '未找到 mysql.exe，请先安装 MySQL Client 或把 mysql 加到 PATH'
  }
  $mysqlExe = $defaultMysqlExe
}

$sqlContent = Get-Content -Path $sqlPath -Raw
$sqlContent | & $mysqlExe -h $dbHost -P $dbPort -u $dbUser --password=$dbPassword --default-character-set=utf8mb4
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "MySQL schema initialized from $sqlPath"
