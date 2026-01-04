#!/bin/bash

echo "🚀 Setting up Backend..."

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/render_db?schema=public"
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Start PostgreSQL with Docker Compose
echo "🐘 Starting PostgreSQL with Docker Compose..."
docker compose up -d

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
bun prisma:generate

# Run database migrations
echo "🗄️  Running database migrations..."
bun prisma:migrate --name init

echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  bun dev"
echo ""
echo "To open Prisma Studio, run:"
echo "  bun prisma:studio"
echo ""
echo "To stop PostgreSQL, run:"
echo "  docker compose down"

