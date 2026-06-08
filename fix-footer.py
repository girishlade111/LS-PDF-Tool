import re

file_path = r"c:\Users\Girish Lade\OneDrive\Desktop\LS PDF Tool\src\app\page.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Use regex to match the footer block
# Pattern: find the entire copyright block including "Fast & Free" and "Private"
pattern = re.compile(
    r'<div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">\s*'
    r'<p>&copy; \{new Date\(\)\.getFullYear\(\)\} PDF Tools\. All processing runs locally in your browser\.</p>\s*'
    r'<div className="flex items-center gap-4">\s*'
    r'<span className="flex items-center gap-1">\s*'
    r'<Zap className="h-3 w-3" /> Fast & Free\s*'
    r'</span>\s*'
    r'<span className="flex items-center gap-1">\s*'
    r'<Shield className="h-3 w-3" /> Private\s*'
    r'</span>\s*'
    r'</div>\s*'
    r'</div>',
    re.MULTILINE
)

replacement = '''<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PDF Tools. All processing runs locally in your browser.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-4">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <span className="text-border/50 hidden sm:inline">|</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <span className="text-border/50 hidden sm:inline">|</span>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <span className="text-border/50 hidden sm:inline">|</span>
            <Link href="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
            <span className="text-border/50 hidden sm:inline">|</span>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>'''

new_content, num_replacements = pattern.subn(replacement, content)
print(f"Number of replacements: {num_replacements}")

if num_replacements > 0:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("File updated successfully!")
else:
    print("Pattern not found. Trying simpler match...")
    # Find where the Fast & Free line is
    if "Fast & Free" in content:
        idx = content.find("Fast & Free")
        print(f"Found 'Fast & Free' at index {idx}")
        print(f"Context: {content[max(0,idx-200):idx+200]}")
    else:
        print("'Fast & Free' not found in file")
