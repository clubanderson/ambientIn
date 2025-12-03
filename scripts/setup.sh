#!/bin/bash

echo "🤖 Setting up ambientIn..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build and start containers
echo "📦 Building Docker containers..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo "🔄 Running database migrations..."
docker-compose exec -T app npm run db:migrate

# Seed database
echo "🌱 Seeding database with sample data..."
docker-compose exec -T app npm run db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   API: http://localhost:3000/api"
echo ""
echo "📊 Available commands:"
echo "   docker-compose logs -f       # View logs"
echo "   docker-compose down          # Stop containers"
echo "   docker-compose restart       # Restart containers"
echo ""
