#!/bin/bash
# Deploy Labor Rights RPG to GCP
# Prerequisites: gcloud CLI, firebase CLI, Docker
# Run: bash deploy.sh

set -e

PROJECT_ID="${GCP_PROJECT_ID:-labor-rights-rpg}"
REGION="asia-southeast1"
SERVICE_NAME="labor-rights-rpg"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "=== Labor Rights RPG Deployment ==="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Step 1: Build and push Docker image to GCR
echo "[1/4] Building Docker image..."
docker build -t "$IMAGE" .

echo "[2/4] Pushing to Container Registry..."
docker push "$IMAGE"

# Step 3: Deploy to Cloud Run (free tier: 2M requests/month, 360K vCPU-seconds)
echo "[3/4] Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2 \
  --concurrency 80 \
  --port 8080 \
  --project "$PROJECT_ID"

# Step 4: Deploy Firebase Hosting (routes static assets + proxies /api to Cloud Run)
echo "[4/4] Deploying Firebase Hosting..."
cd client && npm run build && cd ..
firebase deploy --only hosting --project "$PROJECT_ID"

echo ""
echo "=== Deployment complete! ==="
CLOUD_RUN_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --format "value(status.url)")
echo "Cloud Run: $CLOUD_RUN_URL"
echo "Firebase:  https://$PROJECT_ID.web.app"
