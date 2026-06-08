$filePath = "c:\Users\Girish Lade\OneDrive\Desktop\LS PDF Tool\src\app\page.tsx"
$content = Get-Content $filePath -Raw

$oldText = @"
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PDF Tools. All processing runs locally in your browser.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" /> Fast & Free
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" /> Private
            </span>
          </div>
        </div>
"@

$newText = @"
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PDF Tools. All processing runs locally in your browser.</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
"@

if ($content.Contains($oldText)) {
    $content = $content.Replace($oldText, $newText)
    Set-Content -Path $filePath -Value $content -NoNewline
    Write-Host "SUCCESS: Footer updated with legal links"
} else {
    Write-Host "ERROR: Old text not found in file"
}
