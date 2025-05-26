#!/bin/bash

# Script to update all game pages with the loading component

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Updating all game pages with loading animation...${NC}"

# List of all game HTML files
GAMES=(
  "games/dice.html"
  "games/roulette.html"
  "games/mines.html"
  "games/plinko.html"
  "games/slots.html"
  "games/blackjack-game.html"
  "games/hilo.html"
  "games/flappybird.html"
  "games/rocketcrash.html"
)

# Update each game file
for game in "${GAMES[@]}"; do
  echo -e "Updating ${GREEN}$game${NC}..."
  
  # 1. Add CSS link in head section
  sed -i '' 's/<link rel="stylesheet" href="https:\/\/cdnjs/<link rel="stylesheet" href="..\/css\/page-loader.css">\n    <link rel="stylesheet" href="https:\/\/cdnjs/' "$game"
  
  # 2. Add script before game-specific JS
  if [[ "$game" == *"hilo.html"* ]]; then
    # Skip hilo.html as we've already updated it manually
    echo "  Skipping script insertion for hilo.html (already updated)"
  else
    # Find game-specific JS filename
    game_js=$(basename "$game" .html)
    
    # Add page loader script
    sed -i '' "s/<script src=\"js\/$game_js.js\">/<script src=\"..\/js\/page-loader.js\"><\/script>\n    <script src=\"js\/$game_js.js\">/" "$game"
  fi
  
  echo "  Done!"
done

echo -e "${YELLOW}All game pages updated successfully!${NC}"
echo "To apply these changes, make the script executable and run it:"
echo "chmod +x update-loading.sh"
echo "./update-loading.sh" 