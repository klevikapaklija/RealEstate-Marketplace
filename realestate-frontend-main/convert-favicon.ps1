# PowerShell script to create a high-quality multi-resolution ICO file
Add-Type -AssemblyName System.Drawing

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$input192Path = Join-Path $scriptPath "public\favicon-192x192.png"
$outputPath = Join-Path $scriptPath "public\favicon.ico"

# Load the highest quality PNG available (192x192)
$pngSource = [System.Drawing.Image]::FromFile((Resolve-Path $input192Path))

# Create bitmaps at multiple sizes for maximum quality
$sizes = @(16, 24, 32, 48, 64, 128, 256)
$icons = @()

foreach ($size in $sizes) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Maximum quality rendering settings
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Clear with transparency
    $graphics.Clear([System.Drawing.Color]::Transparent)
    
    # Draw the resized image with high quality
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $graphics.DrawImage($pngSource, $destRect, 0, 0, $pngSource.Width, $pngSource.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.Dispose()
    
    $icons += $bitmap
}

# Save as multi-resolution ICO
$fileStream = [System.IO.FileStream]::new($outputPath, [System.IO.FileMode]::Create)
$writer = [System.IO.BinaryWriter]::new($fileStream)

# ICO header
$writer.Write([UInt16]0)        # Reserved
$writer.Write([UInt16]1)        # Type (1 = ICO)
$writer.Write([UInt16]$icons.Count)  # Number of images

$offset = 6 + ($icons.Count * 16)  # Header + directory entries

# Write directory entries
foreach ($icon in $icons) {
    $ms = New-Object System.IO.MemoryStream
    $icon.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $imageData = $ms.ToArray()
    $ms.Dispose()
    
    $width = if ($icon.Width -eq 256) { 0 } else { $icon.Width }
    $height = if ($icon.Height -eq 256) { 0 } else { $icon.Height }
    
    $writer.Write([byte]$width)    # Width (0 = 256)
    $writer.Write([byte]$height)   # Height (0 = 256)
    $writer.Write([byte]0)         # Color palette
    $writer.Write([byte]0)         # Reserved
    $writer.Write([UInt16]1)       # Color planes
    $writer.Write([UInt16]32)      # Bits per pixel (32-bit ARGB)
    $writer.Write([UInt32]$imageData.Length)  # Size of image data
    $writer.Write([UInt32]$offset)     # Offset to image data
    
    $offset += $imageData.Length
}

# Write image data
foreach ($icon in $icons) {
    $ms = New-Object System.IO.MemoryStream
    $icon.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $imageData = $ms.ToArray()
    $writer.Write($imageData)
    $ms.Dispose()
}

$writer.Close()
$fileStream.Close()

# Cleanup
foreach ($icon in $icons) {
    $icon.Dispose()
}
$pngSource.Dispose()

Write-Host "✅ Successfully created ULTRA HIGH-QUALITY multi-resolution favicon.ico" -ForegroundColor Green
Write-Host "Location: $outputPath" -ForegroundColor Cyan
Write-Host "Resolutions included: 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256" -ForegroundColor Yellow
Write-Host "Format: 32-bit PNG with transparency and anti-aliasing" -ForegroundColor Magenta
