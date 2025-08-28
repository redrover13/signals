#!/bin/bash

# Terraform Setup Script for Saigon Signals
# This script initializes and sets up all Terraform modules

set -e

PROJECT_ID="saigon-signals"
REGION="us-central1"
ENVIRONMENT="prod"

echo "🚀 Setting up Terraform infrastructure for Saigon Signals..."

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Please authenticate with gcloud first:"
    echo "   gcloud auth login"
    echo "   gcloud auth application-default login"
    exit 1
fi

# Set the project
echo "📋 Setting GCP project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Create terraform.tfvars files from examples
echo "📝 Creating terraform.tfvars files..."

for dir in . bigquery functions vertex-agents looker; do
    if [ -f "$dir/terraform.tfvars.example" ]; then
        if [ ! -f "$dir/terraform.tfvars" ]; then
            cp "$dir/terraform.tfvars.example" "$dir/terraform.tfvars"
            echo "   Created $dir/terraform.tfvars"
        else
            echo "   $dir/terraform.tfvars already exists, skipping..."
        fi
    fi
done

# Initialize root Terraform (creates state bucket and enables APIs)
echo "🏗️  Initializing root Terraform configuration..."
terraform init
terraform plan -out=tfplan
echo "   Applying root configuration..."
terraform apply tfplan

# Wait for APIs to be fully enabled
echo "⏳ Waiting for APIs to be fully enabled..."
sleep 30

# Initialize and apply each module
modules=("bigquery" "functions" "vertex-agents" "looker")

for module in "${modules[@]}"; do
    echo "🔧 Setting up $module module..."
    cd "$module"
    
    # Initialize Terraform
    terraform init
    
    # Plan the deployment
    terraform plan -out="tfplan_$module"
    
    # Ask for confirmation
    read -p "Apply $module configuration? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        terraform apply "tfplan_$module"
        echo "✅ $module module applied successfully"
    else
        echo "⏭️  Skipping $module module"
    fi
    
    cd ..
done

echo "🎉 Terraform setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update any terraform.tfvars files with your specific values"
echo "2. Set up your Looker API credentials in Secret Manager:"
echo "   - looker-client-id"
echo "   - looker-client-secret" 
echo "   - looker-base-url"
echo "3. Deploy your application code to trigger the Cloud Functions"
echo "4. Configure your GitHub Actions secrets if not using WIF"
echo ""
echo "🔗 Useful commands:"
echo "   terraform plan    - Preview changes"
echo "   terraform apply   - Apply changes"
echo "   terraform destroy - Destroy infrastructure (be careful!)"
echo "   terraform output  - Show output values"