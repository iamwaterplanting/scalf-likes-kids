# Script to add admin.js script to all game HTML files
$gameFiles = Get-ChildItem -Path "games" -Filter "*.html"

foreach ($file in $gameFiles) {
    Write-Host "Processing $($file.Name)..."
    
    $content = Get-Content -Path $file.FullName
    
    # Check if admin.js is already included
    $hasAdminScript = $false
    foreach ($line in $content) {
        if ($line -match "admin\.js") {
            $hasAdminScript = $true
            break
        }
    }
    
    if (-not $hasAdminScript) {
        # Find the line with the last script before </body>
        $lastScriptIndex = -1
        for ($i = 0; $i -lt $content.Length; $i++) {
            if ($content[$i] -match "<script.*\.js") {
                $lastScriptIndex = $i
            }
        }
        
        if ($lastScriptIndex -ge 0) {
            # Insert our script after the last script
            $newContent = @()
            for ($i = 0; $i -lt $content.Length; $i++) {
                $newContent += $content[$i]
                if ($i -eq $lastScriptIndex) {
                    $newContent += '    <script src="../js/admin.js"></script>'
                }
            }
            
            # Write the modified content back to the file
            Set-Content -Path $file.FullName -Value $newContent
            
            Write-Host "Added admin.js to $($file.Name)"
        } else {
            Write-Host "Could not find a script tag in $($file.Name)"
        }
    } else {
        Write-Host "$($file.Name) already has admin.js"
    }
}

Write-Host "Done!" 