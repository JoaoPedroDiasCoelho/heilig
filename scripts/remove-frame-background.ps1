param(
  [int]$Count = 240
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$inputDirectory = Join-Path $projectRoot "public\frames"
$outputDirectory = Join-Path $projectRoot "public\frames-transparent"

Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class FormaFrameCutoutV2 {
    static int Luma(byte r, byte g, byte b) {
        return (77 * r + 150 * g + 29 * b) >> 8;
    }

    static void AddBackground(int index, byte[] source, int stride, int width,
        int height, bool[] background, int[] queue, ref int tail) {
        if (index < 0 || index >= width * height || background[index]) return;
        int x = index % width, y = index / width, offset = y * stride + x * 3;
        if (Luma(source[offset + 2], source[offset + 1], source[offset]) > 82) return;
        background[index] = true;
        queue[tail++] = index;
    }

    public static string Process(string inputPath, string outputPath) {
        using (Bitmap input = new Bitmap(inputPath)) {
            int width = input.Width, height = input.Height, count = width * height;
            Rectangle rect = new Rectangle(0, 0, width, height);
            BitmapData data = input.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
            int stride = Math.Abs(data.Stride);
            byte[] source = new byte[stride * height];
            Marshal.Copy(data.Scan0, source, 0, source.Length);
            input.UnlockBits(data);

            double referenceR = 0, referenceG = 0, referenceB = 0;
            int referenceCount = 0;
            for (int y = 0; y < 16; y++) for (int x = 0; x < 16; x++) {
                int[] positions = {
                    y * stride + x * 3,
                    y * stride + (width - 1 - x) * 3,
                    (height - 1 - y) * stride + x * 3,
                    (height - 1 - y) * stride + (width - 1 - x) * 3
                };
                for (int p = 0; p < positions.Length; p++) {
                    int offset = positions[p];
                    referenceB += source[offset];
                    referenceG += source[offset + 1];
                    referenceR += source[offset + 2];
                    referenceCount++;
                }
            }
            referenceR /= referenceCount;
            referenceG /= referenceCount;
            referenceB /= referenceCount;

            bool[] background = new bool[count];
            int[] queue = new int[count];
            int tail = 0;
            for (int x = 0; x < width; x++) {
                AddBackground(x, source, stride, width, height, background, queue, ref tail);
                AddBackground((height - 1) * width + x, source, stride, width, height, background, queue, ref tail);
            }
            for (int y = 0; y < height; y++) {
                AddBackground(y * width, source, stride, width, height, background, queue, ref tail);
                AddBackground(y * width + width - 1, source, stride, width, height, background, queue, ref tail);
            }
            int head = 0;
            while (head < tail) {
                int index = queue[head++], x = index % width, y = index / width;
                if (x > 0) AddBackground(index - 1, source, stride, width, height, background, queue, ref tail);
                if (x + 1 < width) AddBackground(index + 1, source, stride, width, height, background, queue, ref tail);
                if (y > 0) AddBackground(index - width, source, stride, width, height, background, queue, ref tail);
                if (y + 1 < height) AddBackground(index + width, source, stride, width, height, background, queue, ref tail);
            }

            int collarLeft = width * 36 / 100, collarRight = width * 64 / 100;
            int collarTop = height * 7 / 100, collarBottom = height * 17 / 100;
            for (int y = collarTop; y < collarBottom; y++) for (int x = collarLeft; x < collarRight; x++) {
                int index = y * width + x, offset = y * stride + x * 3;
                int luma = Luma(source[offset + 2], source[offset + 1], source[offset]);
                if (!background[index] && luma >= 45 && luma <= 90) background[index] = true;
            }

            bool[] edge = new bool[count];
            for (int y = 1; y < height - 1; y++) for (int x = 1; x < width - 1; x++) {
                int index = y * width + x;
                if (background[index]) continue;
                for (int dy = -1; dy <= 1 && !edge[index]; dy++)
                    for (int dx = -1; dx <= 1; dx++)
                        if (background[(y + dy) * width + x + dx]) { edge[index] = true; break; }
            }

            byte[] rgba = new byte[count * 4];
            int transparent = 0, softened = 0;
            for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
                int index = y * width + x, src = y * stride + x * 3, dst = index * 4;
                if (background[index]) { transparent++; continue; }

                double alpha = 1, bgR = referenceR, bgG = referenceG, bgB = referenceB;
                if (edge[index]) {
                    double sumBgR = 0, sumBgG = 0, sumBgB = 0, bgCount = 0;
                    double sumFgR = 0, sumFgG = 0, sumFgB = 0, fgCount = 0;
                    for (int dy = -3; dy <= 3; dy++) for (int dx = -3; dx <= 3; dx++) {
                        int nx = x + dx, ny = y + dy;
                        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                        int neighbor = ny * width + nx, offset = ny * stride + nx * 3;
                        if (background[neighbor]) {
                            sumBgR += source[offset + 2]; sumBgG += source[offset + 1]; sumBgB += source[offset]; bgCount++;
                        } else if (!edge[neighbor]) {
                            sumFgR += source[offset + 2]; sumFgG += source[offset + 1]; sumFgB += source[offset]; fgCount++;
                        }
                    }
                    if (bgCount > 0) { bgR = sumBgR / bgCount; bgG = sumBgG / bgCount; bgB = sumBgB / bgCount; }
                    if (fgCount > 0) {
                        double pixelLuma = Luma(source[src + 2], source[src + 1], source[src]);
                        double bgLuma = Luma((byte)bgR, (byte)bgG, (byte)bgB);
                        double fgLuma = Luma((byte)(sumFgR / fgCount), (byte)(sumFgG / fgCount), (byte)(sumFgB / fgCount));
                        if (Math.Abs(fgLuma - bgLuma) > 1) alpha = (pixelLuma - bgLuma) / (fgLuma - bgLuma);
                        alpha = Math.Max(0.08, Math.Min(1, alpha));
                    }
                    softened++;
                }

                double red = source[src + 2], green = source[src + 1], blue = source[src];
                if (alpha < 0.999) {
                    red = Math.Max(0, Math.Min(255, (red - (1 - alpha) * bgR) / alpha));
                    green = Math.Max(0, Math.Min(255, (green - (1 - alpha) * bgG) / alpha));
                    blue = Math.Max(0, Math.Min(255, (blue - (1 - alpha) * bgB) / alpha));
                }
                rgba[dst] = (byte)blue; rgba[dst + 1] = (byte)green;
                rgba[dst + 2] = (byte)red; rgba[dst + 3] = (byte)Math.Round(alpha * 255);
            }

            using (Bitmap output = new Bitmap(width, height, PixelFormat.Format32bppArgb)) {
                BitmapData outData = output.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
                byte[] outputBytes = new byte[Math.Abs(outData.Stride) * height];
                for (int y = 0; y < height; y++)
                    Buffer.BlockCopy(rgba, y * width * 4, outputBytes, y * Math.Abs(outData.Stride), width * 4);
                Marshal.Copy(outputBytes, 0, outData.Scan0, outputBytes.Length);
                output.UnlockBits(outData);
                output.Save(outputPath, ImageFormat.Png);
            }
            return width + "x" + height + ", transparent=" + transparent + ", softened edges=" + softened;
        }
    }
}
'@ -ReferencedAssemblies System.Drawing

New-Item -ItemType Directory -Force $outputDirectory | Out-Null
for ($index = 1; $index -le $Count; $index++) {
  $frameName = "frame_{0:D3}" -f $index
  $inputPath = Join-Path $inputDirectory "$frameName.jpg"
  $outputPath = Join-Path $outputDirectory "$frameName.png"
  if (-not (Test-Path $inputPath)) { throw "Frame not found: $inputPath" }
    $result = [FormaFrameCutoutV2]::Process($inputPath, $outputPath)
  Write-Output "$frameName $result"
}