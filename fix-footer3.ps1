$filePath = "c:\Users\Girish Lade\OneDrive\Desktop\LS PDF Tool\src\app\page.tsx"

# Read the file
$content = [System.IO.File]::ReadAllText($filePath)

# Add Link import after useFileStore import
$oldImport = "import { useFileStore } from '@/store/file-store';"
$newImport = "import Link from 'next/link';`r`nimport { useFileStore } from '@/store/file-store';"

if ($content.Contains($oldImport) -and -not $content.Contains("import Link from 'next/link';")) {
    $content = $content.Replace($oldImport, $newImport)
    Write-Host "Added Link import"
}

# Replace the footer copyright section
$oldFooter = '<div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PDF Tools. All processing runs locally in your browser.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" /> Fast & Free
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" /> Private
            </span>
          </div>
        </div>'

$newFooter = '<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PDF Tools. All processing runs locally in your browser.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-4">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <span className="text-border/50">|</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <span className="text-border/50">|</span>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <span className="text-border/50">|</span>
            <Link href="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
            <span className="text-border/50">|</span>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>'

if ($content.Contains($oldFooter)) {
    $content = $content.Replace($oldFooter, $newFooter)
    Write-Host "Replaced footer section"
}
else {
    Write-Host "ERROR: Old footer section not found"
    # Try a simpler match
    if ($content.Contains('Fast & Free')) {
        Write-Host "Found 'Fast & Free' but not the full block"
    }
}

[System.IO.File]::WriteAllText($filePath, $content)
Write-Host "Done"
