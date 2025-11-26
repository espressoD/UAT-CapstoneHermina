#!/bin/bash

# Install git hooks script

echo "🔧 Installing Git Hooks..."
echo ""

HOOKS_DIR=".git/hooks"
SCRIPTS_DIR="scripts"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository"
    echo "Please run this script from the root of your git repository"
    exit 1
fi

# Install pre-commit hook
if [ -f "$SCRIPTS_DIR/pre-commit.sh" ]; then
    cp "$SCRIPTS_DIR/pre-commit.sh" "$HOOKS_DIR/pre-commit"
    chmod +x "$HOOKS_DIR/pre-commit"
    echo "✅ Installed pre-commit hook"
else
    echo "⚠️  pre-commit.sh not found in scripts directory"
fi

echo ""
echo "================================"
echo "✨ Git hooks installed successfully!"
echo ""
echo "The following hooks are now active:"
echo "  - pre-commit: Validates commits for sensitive data"
echo ""
echo "To bypass hooks (not recommended):"
echo "  git commit --no-verify"
