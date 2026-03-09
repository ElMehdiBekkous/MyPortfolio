---
description: Process AI Green Screen Video into Optimized Avatar Frames (WebP)
---

# Avatar Video Processing Workflow

This workflow documents the exact steps use to process AI-generated (e.g., Veo 3) green screen videos of the 3D avatar into optimized, transparent, web-ready WebP frame sequences for scroll-driven animations in Next.js.

## Prerequisites
1. Ensure FFmpeg is installed (`winget install ffmpeg` on Windows if missing).
2. Prepare the input `.mp4` video with a consistent green screen background (hex color `#00b140`).

## The Processing Steps

### 1. Extract Frames & Remove Green Screen
The first step is to extract all frames from the video as PNG images while simultaneously using the `colorkey` filter to remove the green background. We also resize the frames to a height of `500px` to optimize file sizes.

Run this PowerShell command (adjust paths as necessary):
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$inputVideo = "src\assets\Video\input.mp4"
$outputDir = "public\avatar\sequence_name"

# Create output directory if it doesn't exist
New-Item -ItemType Directory -Force -Path $outputDir

# 1. Extract to PNG with Alpha Channel (Green Screen removal)
# Parameters: colorkey=color:similarity:blend
ffmpeg -i $inputVideo -vf "colorkey=0x00b140:0.25:0.05,format=rgba,scale=-1:500" -fps_mode vfr "$outputDir\frame_%03d.png"
```

### 2. Optimize to WebP
WebP format handles transparency perfectly and offers vastly superior compression to PNGs. We convert all generated PNGs to WebP and delete the intermediate PNG files.

```powershell
# 2. Convert to WebP and delete PNGs
Get-ChildItem "$outputDir\*.png" | ForEach-Object { 
    $out = $_.FullName -replace '\.png$','.webp';
    ffmpeg -i $_.FullName -quality 75 -lossless 0 $out 2>$null 
}
Remove-Item "$outputDir\*.png" -Force

# Verify success
$c = (Get-ChildItem "$outputDir\*.webp").Count
$s = [math]::Round((Get-ChildItem "$outputDir\*.webp" | Measure-Object -Property Length -Sum).Sum/1MB,2)
Write-Host "Success: $c frames generated, Total size: $s MB"
```

## Tips for Implementation in React/Next.js
- Keep framerates reasonable (e.g. 10 to 24 FPS depending on motion) using JS logic.
- Preload the frames using standard Javascript `Image` objects to prevent flashing during scroll transitions.
- Use `GSAP ScrollTrigger` to map scroll progress (`self.progress`) directly to the frame array index.
