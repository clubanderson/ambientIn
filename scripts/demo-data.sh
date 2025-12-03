#!/bin/bash

echo "🎲 Creating demo data for ambientIn..."

API_BASE="http://localhost:3000/api"

# Get demo user ID
USER_ID=$(curl -s "${API_BASE}/users/username/demo" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
    echo "❌ Demo user not found. Please run setup first."
    exit 1
fi

echo "👤 Using demo user: $USER_ID"

# Get first agent
AGENT_ID=$(curl -s "${API_BASE}/agents?limit=1" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$AGENT_ID" ]; then
    echo "❌ No agents found. Please import agents first."
    exit 1
fi

echo "🤖 Using agent: $AGENT_ID"

# Record some metrics
echo "📊 Recording sample metrics..."

for i in {1..5}; do
    COMPLETION_TIME=$((RANDOM % 20 + 1))
    METRIC_TYPE=$([ $((RANDOM % 2)) -eq 0 ] && echo "issue" || echo "pr")

    curl -s -X POST "${API_BASE}/agents/${AGENT_ID}/metrics" \
        -H "Content-Type: application/json" \
        -d "{
            \"metricType\": \"${METRIC_TYPE}\",
            \"completionTime\": ${COMPLETION_TIME},
            \"difficulty\": $((RANDOM % 10 + 1)),
            \"success\": true
        }" > /dev/null

    echo "  ✓ Recorded ${METRIC_TYPE} completion (${COMPLETION_TIME}h)"
done

# Create a team
echo "👥 Creating demo team..."

TEAM_ID=$(curl -s -X POST "${API_BASE}/teams" \
    -H "Content-Type: application/json" \
    -d "{
        \"userId\": \"${USER_ID}\",
        \"name\": \"My First Team\",
        \"description\": \"A sample fantasy engineering team\"
    }" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$TEAM_ID" ]; then
    echo "  ✓ Team created: $TEAM_ID"

    # Add agent to team
    echo "  ✓ Adding agent to team..."
    curl -s -X POST "${API_BASE}/teams/${TEAM_ID}/members" \
        -H "Content-Type: application/json" \
        -d "{
            \"agentId\": \"${AGENT_ID}\",
            \"position\": \"Lead Engineer\"
        }" > /dev/null
fi

echo ""
echo "✅ Demo data created!"
echo "🌐 Visit http://localhost:3000 to see your data"
