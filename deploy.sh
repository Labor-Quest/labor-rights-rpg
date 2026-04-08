#!/bin/bash
# =============================================================================
# Deploy Labor Rights RPG to GCP (Cloud Run + Firebase Hosting)
# =============================================================================
#
# Prerequisites:
#   - gcloud CLI installed and authenticated (gcloud auth login)
#   - firebase CLI installed (npm i -g firebase-tools) and logged in
#   - Docker installed and running
#   - A GCP billing account linked (check: gcloud billing accounts list)
#
# Usage:
#   bash deploy.sh                          # Full deploy (setup + build + deploy)
#   bash deploy.sh --skip-setup             # Skip project creation (already done)
#   bash deploy.sh --skip-setup --skip-build # Deploy existing image
#
# Cost target: $0/month at low traffic (<1000 users/month)
#   - Cloud Run: scale-to-zero, cpu-throttling, 2M free requests/month
#   - Firebase Hosting: 10GB free transfer/month
#   - Artifact Registry: 500MB free storage
# =============================================================================

set -euo pipefail

# --- Configuration ---
PROJECT_ID="${GCP_PROJECT_ID:-labor-rights-rpg}"
REGION="asia-southeast1"
SERVICE_NAME="labor-rights-rpg"
AR_REPO="cloud-run-builds"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE_NAME}"
BILLING_BUDGET_AMOUNT=5  # USD — alert threshold

SKIP_SETUP=false
SKIP_BUILD=false
for arg in "$@"; do
  case $arg in
    --skip-setup) SKIP_SETUP=true ;;
    --skip-build) SKIP_BUILD=true ;;
  esac
done

echo "==========================================="
echo "  Labor Rights RPG — GCP Deployment"
echo "==========================================="
echo "Project:  $PROJECT_ID"
echo "Region:   $REGION"
echo "Image:    $IMAGE"
echo ""

# =============================================================================
# PHASE 1: GCP Project Setup (run once)
# =============================================================================
if [ "$SKIP_SETUP" = false ]; then
  echo "--- Phase 1: GCP Project Setup ---"
  echo ""

  # Step 1: Create the GCP project
  echo "[1/7] Creating GCP project '$PROJECT_ID'..."
  if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
    echo "  Project already exists, skipping."
  else
    gcloud projects create "$PROJECT_ID" --name="Labor Rights RPG"
    echo "  Project created."
  fi

  # Set as active project
  gcloud config set project "$PROJECT_ID"

  # Step 2: Link billing account
  echo ""
  echo "[2/7] Linking billing account..."
  BILLING_ACCOUNT=$(gcloud billing accounts list --filter="open=true" --format="value(ACCOUNT_ID)" --limit=1)
  if [ -z "$BILLING_ACCOUNT" ]; then
    echo "  ERROR: No active billing account found."
    echo "  Create one at https://console.cloud.google.com/billing"
    exit 1
  fi
  CURRENT_BILLING=$(gcloud billing projects describe "$PROJECT_ID" --format="value(billingAccountName)" 2>/dev/null || echo "")
  if [ -z "$CURRENT_BILLING" ] || [ "$CURRENT_BILLING" = "billingAccountName: ''" ]; then
    gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
    echo "  Linked to billing account: $BILLING_ACCOUNT"
  else
    echo "  Billing already linked, skipping."
  fi

  # Step 3: Enable ONLY the APIs we need (nothing extra)
  echo ""
  echo "[3/7] Enabling required APIs (and ONLY these)..."
  gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    --project="$PROJECT_ID"
  echo "  Enabled: Cloud Run, Artifact Registry, Cloud Build"

  # Step 4: Create Artifact Registry repository
  echo ""
  echo "[4/7] Creating Artifact Registry repo '$AR_REPO'..."
  if gcloud artifacts repositories describe "$AR_REPO" --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    echo "  Repository already exists, skipping."
  else
    gcloud artifacts repositories create "$AR_REPO" \
      --repository-format=docker \
      --location="$REGION" \
      --description="Docker images for Labor Rights RPG" \
      --project="$PROJECT_ID"
    echo "  Repository created."
  fi

  # Step 5: Configure Docker auth for Artifact Registry
  echo ""
  echo "[5/7] Configuring Docker auth for Artifact Registry..."
  gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

  # Step 6: Set up billing budget alert
  echo ""
  echo "[6/7] Setting up billing budget alert (\$${BILLING_BUDGET_AMOUNT}/month)..."
  echo "  NOTE: Budget alerts must be created in the Cloud Console:"
  echo "  https://console.cloud.google.com/billing/${BILLING_ACCOUNT}/budgets?project=${PROJECT_ID}"
  echo ""
  echo "  Create a budget with:"
  echo "    - Scope: Project '${PROJECT_ID}'"
  echo "    - Amount: \$${BILLING_BUDGET_AMOUNT}/month"
  echo "    - Alerts at: 50%, 90%, 100%"
  echo "    - Email notifications: enabled"
  echo ""

  # Step 7: Initialize Firebase project
  echo "[7/7] Setting up Firebase..."
  echo "  If prompted, select '${PROJECT_ID}' as the Firebase project."
  echo "  Run: firebase use ${PROJECT_ID}"
  echo ""
  # Create .firebaserc if it doesn't exist
  if [ ! -f .firebaserc ]; then
    cat > .firebaserc <<FBRC
{
  "projects": {
    "default": "${PROJECT_ID}"
  }
}
FBRC
    echo "  Created .firebaserc"
  fi

  echo ""
  echo "--- Phase 1 Complete ---"
  echo ""
fi

# =============================================================================
# PHASE 2: Build & Push via Cloud Build (no local Docker needed)
# =============================================================================
if [ "$SKIP_BUILD" = false ]; then
  echo "--- Phase 2: Cloud Build ---"
  echo ""

  echo "[1/1] Submitting build to Cloud Build..."
  gcloud builds submit \
    --tag "$IMAGE" \
    --region "$REGION" \
    --project "$PROJECT_ID"

  echo ""
  echo "--- Phase 2 Complete ---"
  echo ""
fi

# =============================================================================
# PHASE 3: Deploy to Cloud Run
# =============================================================================
echo "--- Phase 3: Deploy to Cloud Run ---"
echo ""

gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --cpu-throttling \
  --min-instances 0 \
  --max-instances 1 \
  --concurrency 80 \
  --port 8080 \
  --set-env-vars="NODE_ENV=production" \
  --project "$PROJECT_ID"

CLOUD_RUN_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --format "value(status.url)")

echo ""
echo "Cloud Run deployed: $CLOUD_RUN_URL"
echo ""

# =============================================================================
# PHASE 4: Build & Deploy Firebase Hosting
# =============================================================================
echo "--- Phase 4: Deploy Firebase Hosting ---"
echo ""

# Build client (fresh build for Firebase)
echo "Building client for Firebase Hosting..."
cd client && npm run build && cd ..

echo "Deploying to Firebase Hosting..."
firebase deploy --only hosting --project "$PROJECT_ID"

echo ""
echo "==========================================="
echo "  Deployment Complete!"
echo "==========================================="
echo ""
echo "  Live site:            https://laborquest.app"
echo "  Firebase fallback:    https://${PROJECT_ID}.web.app"
echo "  Cloud Run (API only): ${CLOUD_RUN_URL}"
echo ""
echo "  How it works:"
echo "    - Firebase Hosting serves static files (HTML/CSS/JS)"
echo "    - /api/* requests are proxied to Cloud Run"
echo "    - Cloud Run scales to zero when idle (no cost)"
echo ""
echo "  Next steps:"
echo "    1. Create billing budget alert (see Phase 1 output)"
echo "    2. Test: open https://laborquest.app"
echo ""
