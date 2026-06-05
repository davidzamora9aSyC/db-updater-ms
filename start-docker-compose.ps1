param(
  [string]$ComposeFile = "C:\Users\pc\Documents\Back\db-updater-ms\docker-compose.yml"
)

$ErrorActionPreference = "Stop"

# Try to start Docker Desktop service (works without user session)
$dockerService = Get-Service -Name "com.docker.service" -ErrorAction SilentlyContinue
if ($dockerService -and $dockerService.Status -ne "Running") {
  Start-Service -Name "com.docker.service"
}

# Wait for Docker engine to be ready (max ~120s)
$ready = $false
for ($i = 0; $i -lt 120; $i++) {
  try {
    docker info | Out-Null
    $ready = $true
    break
  } catch {
    Start-Sleep -Seconds 1
  }
}

if (-not $ready) {
  throw "Docker engine not ready after 120s."
}

docker compose -f $ComposeFile up -d
