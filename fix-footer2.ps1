$filePath = "c:\Users\Girish Lade\OneDrive\Desktop\LS PDF Tool\src\app\page.tsx"
$lines = Get-Content $filePath
$newLines = @()
$inTargetBlock = $false
$blockStarted = $false

# Find the line with the copyright and add legal links after it
for ($i = 0; $i -lt $lines.Length; $i++) {
    $newLines += $lines[$i]

    # After the "Fast & Free" span block ends, look for the closing </div>
    if ($lines[$i] -match 'Fast & Free' -or $lines[$i] -match 'Fast & Free') {
        # Mark that we're inside the target block
        $inTargetBlock = $true
        continue
    }

    if ($inTargetBlock -and $lines[$i] -match '^\s*</div>\s*$' -and -not $blockStarted) {
        # We've found the closing div of the inner div
        # Check if this is the inner div (has gap-4)
        # Actually, let's check the previous non-blank line
        $prevIdx = $i - 1
        while ($prevIdx -ge 0 -and $lines[$prevIdx] -match '^\s*$') { $prevIdx-- }

        if ($prevIdx -ge 0 -and $lines[$prevIdx] -match '<Shield className="h-3 w-3" /> Private') {
            # This is the inner </div> closing the gap-4 div
            # Add new content AFTER this line
            $newLines += "          <span className=""flex items-center gap-1"">"
            $newLines += "              <Zap className=""h-3 w-3"" /> Fast & Free"
            $newLines += "            </span>"
            $newLines += "            <span className=""flex items-center gap-1"">"
            $newLines += "              <Shield className=""h-3 w-3"" /> Private"
            $newLines += "            </span>"
            $newLines += "          </div>"
            $newLines += "          <div className=""flex items-center gap-3 sm:gap-4 flex-wrap justify-center"">"
            $newLines += "            <Link href=""/about"" className=""hover:text-foreground transition-colors"">About</Link>"
            $newLines += "            <span className=""text-border"">|</span>"
            $newLines += "            <Link href=""/terms"" className=""hover:text-foreground transition-colors"">Terms</Link>"
            $newLines += "            <span className=""text-border"">|</span>"
            $newLines += "            <Link href=""/privacy"" className=""hover:text-foreground transition-colors"">Privacy</Link>"
            $newLines += "            <span className=""text-border"">|</span>"
            $newLines += "            <Link href=""/disclaimer"" className=""hover:text-foreground transition-colors"">Disclaimer</Link>"
            $newLines += "            <span className=""text-border"">|</span>"
            $newLines += "            <Link href=""/contact"" className=""hover:text-foreground transition-colors"">Contact</Link>"
            $newLines += "          </div>"
            $inTargetBlock = $false
            $blockStarted = $true
        }
    }
}

$newLines | Set-Content -Path $filePath
Write-Host "Done. New file has $($newLines.Count) lines."
