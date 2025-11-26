#!/bin/bash

# Script untuk generate secret key yang aman untuk HASHIDS_SECRET

echo "🔐 Generating secure random secret key..."
echo ""

# Generate 32 character random string
SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

echo "Generated HASHIDS_SECRET:"
echo "========================="
echo "$SECRET"
echo "========================="
echo ""
echo "Copy this value and update your .env files:"
echo "  - backend/.env.production"
echo "  - .env (for docker-compose)"
echo "  - GitHub Secrets (HASHIDS_SECRET)"
echo ""

# Optional: automatically update .env files if they exist
read -p "Do you want to update .env files automatically? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    # Update backend/.env.production
    if [ -f "backend/.env.production" ]; then
        sed -i "s/HASHIDS_SECRET=.*/HASHIDS_SECRET=$SECRET/" backend/.env.production
        echo "✅ Updated backend/.env.production"
    fi
    
    # Update .env if exists
    if [ -f ".env" ]; then
        sed -i "s/HASHIDS_SECRET=.*/HASHIDS_SECRET=$SECRET/" .env
        echo "✅ Updated .env"
    fi
    
    echo ""
    echo "⚠️  Don't forget to update GitHub Secret: HASHIDS_SECRET"
fi
