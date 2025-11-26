#!/bin/bash

# Pre-commit hook untuk validasi sebelum commit
# Install: cp scripts/pre-commit.sh .git/hooks/pre-commit

echo "🔍 Running pre-commit checks..."

# Check for sensitive data in staged files
echo "Checking for sensitive data..."
if git diff --cached --name-only | xargs grep -l "SUPABASE_SERVICE_ROLE_KEY\|SERVICE_ROLE" 2>/dev/null; then
    echo "⚠️  WARNING: Possible sensitive key detected in staged files"
    echo "Please review your changes and remove any secrets"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if .env files are being committed
if git diff --cached --name-only | grep -E "\.env$|\.env\.production$|\.env\.local$" 2>/dev/null; then
    echo "❌ ERROR: .env files should not be committed"
    echo "Detected files:"
    git diff --cached --name-only | grep -E "\.env$|\.env\.production$|\.env\.local$"
    exit 1
fi

echo "✅ Pre-commit checks passed!"
