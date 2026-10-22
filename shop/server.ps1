<#
.SYNOPSIS
  SKYLIX Salon - Built-in Local Development Web Server
  Uses native Windows .NET HttpListener. Requires no Node or Python dependencies.
#>

$port = 3000
$rootPath = $PSScriptRoot

if (-not [System.Net.HttpListener]::IsSupported) {
    Write-Error "HttpListener is not supported on this machine."
    exit 1
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Host "Port $port might be in use, trying port 8080..." -ForegroundColor Yellow
    $port = 8080
    $listener = New-Object System.Net.HttpListener
    $prefix = "http://localhost:$port/"
    $listener.Prefixes.Add($prefix)
    $listener.Start()
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor DarkYellow
Write-Host "  ✨ SKYLIX HAUTE COIFFURE & SALON - LOCAL SERVER RUNNING" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor DarkYellow
Write-Host "  • Public Website:    http://localhost:$port/" -ForegroundColor Cyan
Write-Host "  • Admin Portal:      http://localhost:$port/admin/" -ForegroundColor Cyan
Write-Host "  • Root Directory:    $rootPath" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor DarkYellow
Write-Host "Press Ctrl+C to stop the server.`n" -ForegroundColor DarkGray

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".png"  = "image/png"
    ".webp" = "image/webp"
    ".gif"  = "image/gif"
    ".ico"  = "image/x-icon"
    ".sql"  = "text/plain; charset=utf-8"
    ".md"   = "text/markdown; charset=utf-8"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath

        # Route rewrites
        if ($urlPath -eq "/" -or $urlPath -eq "") {
            $urlPath = "/index.html"
        } elseif ($urlPath -eq "/admin" -or $urlPath -eq "/admin/") {
            $urlPath = "/admin/index.html"
        }

        # Normalize relative file path
        $relativeFilePath = $urlPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $localFilePath = [System.IO.Path]::Combine($rootPath, $relativeFilePath)

        if ([System.IO.File]::Exists($localFilePath)) {
            $ext = [System.IO.Path]::GetExtension($localFilePath).ToLower()
            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }

            $bytes = [System.IO.File]::ReadAllBytes($localFilePath)
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")
            $response.StatusCode = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found</h1><p>The requested file '$urlPath' was not found.</p>")
            $response.StatusCode = 404
            $response.ContentType = "text/html; charset=utf-8"
            $response.ContentLength64 = $notFound.Length
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }

        $response.OutputStream.Close()
    } catch {
        # Listener stopped or client aborted
    }
}
