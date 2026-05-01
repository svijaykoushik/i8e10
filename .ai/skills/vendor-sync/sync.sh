#!/bin/bash

# vendor-sync/sync.sh
# Helper script to create symlinks from .ai/ to vendor-specific directories.

set -e

# Default vendors
VENDORS=(".agents" ".github-copilot" ".chatgpt" ".codex" ".cursor" ".continue" ".claude")

# Use arguments if provided
if [ $# -gt 0 ]; then
    VENDORS=("$@")
fi

# Determine root directory
ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
AI_DIR=".ai"

cd "$ROOT_DIR"

if [ ! -d "$AI_DIR" ]; then
    echo "Error: .ai directory not found in $ROOT_DIR"
    exit 1
fi

echo "🚀 Starting vendor synchronization..."

for VENDOR in "${VENDORS[@]}"; do
    echo "📂 Processing vendor: $VENDOR"
    
    # Create vendor directory if it doesn't exist
    mkdir -p "$VENDOR"
    
    # Items to link from .ai/
    # Note: We use relative paths for symlinks to ensure portability
    ITEMS=("context" "skills" "workflows" "prompts" "index.md")
    
    for ITEM in "${ITEMS[@]}"; do
        if [ ! -e "$AI_DIR/$ITEM" ]; then
            continue
        fi
        
        LINK_PATH="$VENDOR/$ITEM"
        
        # Target path relative to the vendor directory
        # Since the vendor directory is at root and .ai is at root, 
        # the path from inside VENDOR to AI_DIR is ../.ai
        RELATIVE_TARGET="../.ai/$ITEM"
        
        if [ -L "$LINK_PATH" ]; then
            # Verify existing link
            CURRENT_TARGET=$(readlink "$LINK_PATH")
            if [ "$CURRENT_TARGET" != "$RELATIVE_TARGET" ]; then
                echo "  🔗 Updating link: $ITEM"
                rm "$LINK_PATH"
                ln -s "$RELATIVE_TARGET" "$LINK_PATH"
            fi
        elif [ -e "$LINK_PATH" ]; then
            echo "  ⚠️  Skipping $ITEM: File already exists and is not a symlink."
        else
            echo "  🔗 Creating link: $ITEM"
            ln -s "$RELATIVE_TARGET" "$LINK_PATH"
        fi
    done
    
    # Ensure vendor is ignored in .gitignore
    if [ -f ".gitignore" ]; then
        if ! grep -q "^$VENDOR/" ".gitignore"; then
            echo "  📝 Adding $VENDOR/ to .gitignore"
            # Add newline if needed
            [ -n "$(tail -c1 .gitignore)" ] && echo "" >> .gitignore
            echo "# AI Vendor Directories" >> .gitignore
            echo "$VENDOR/" >> .gitignore
        fi
    fi
done

echo "✅ Synchronization complete!"
