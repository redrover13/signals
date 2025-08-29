#!/bin/bash

# RAG Pipeline Demo Script
# This script demonstrates how to use the RAG data ingestion pipeline

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-asia-southeast1}"
ENVIRONMENT="${ENVIRONMENT:-prod}"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if gcloud is installed and configured
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Get project ID if not set
    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
        if [ -z "$PROJECT_ID" ]; then
            print_error "PROJECT_ID is not set and no default project found."
            print_error "Please set PROJECT_ID environment variable or run 'gcloud config set project YOUR_PROJECT_ID'"
            exit 1
        fi
    fi
    
    print_success "Prerequisites check passed"
    print_status "Using project: $PROJECT_ID"
    print_status "Using region: $REGION"
}

# Deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying RAG pipeline infrastructure..."
    
    cd infra/terraform/rag-pipeline
    
    # Create terraform.tfvars if it doesn't exist
    if [ ! -f terraform.tfvars ]; then
        print_status "Creating terraform.tfvars from example..."
        cp terraform.tfvars.example terraform.tfvars
        
        # Update with actual values
        sed -i "s/your-gcp-project-id/$PROJECT_ID/g" terraform.tfvars
        sed -i "s/asia-southeast1/$REGION/g" terraform.tfvars
        sed -i "s/prod/$ENVIRONMENT/g" terraform.tfvars
        
        print_warning "Please review and update terraform.tfvars if needed"
    fi
    
    # Initialize Terraform
    print_status "Initializing Terraform..."
    terraform init
    
    # Plan deployment
    print_status "Planning deployment..."
    terraform plan -out=tfplan
    
    # Apply deployment
    print_status "Applying deployment..."
    terraform apply tfplan
    
    print_success "Infrastructure deployed successfully"
    
    cd ../../..
}

# Build and deploy Cloud Function
deploy_function() {
    print_status "Building and deploying Cloud Function..."
    
    cd apps/cloud-functions/rag-processor
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm install
    
    # Build the function
    print_status "Building function..."
    npm run build
    
    # Create deployment package
    print_status "Creating deployment package..."
    zip -r rag-processor-source.zip . -x "node_modules/*" "*.git*" "src/*"
    
    # Upload to source bucket
    print_status "Uploading to source bucket..."
    gsutil cp rag-processor-source.zip gs://$PROJECT_ID-rag-function-source/
    
    print_success "Cloud Function deployed successfully"
    
    cd ../../..
}

# Create sample documents
create_sample_documents() {
    print_status "Creating sample documents..."
    
    mkdir -p /tmp/rag-demo-docs
    
    # Vietnamese F&B sample document
    cat > /tmp/rag-demo-docs/vietnamese-food-preferences.txt << 'EOF'
Vietnamese Food Preferences and Dining Culture

Vietnamese cuisine is characterized by its fresh ingredients, aromatic herbs, and balanced flavors. The Vietnamese dining culture emphasizes communal eating, with shared dishes placed at the center of the table.

Key Preferences:
- Fresh herbs like cilantro, mint, and basil are essential
- Rice is the staple food and accompanies most meals
- Pho (noodle soup) is the most internationally recognized dish
- Fish sauce (nuoc mam) is a fundamental ingredient
- Vietnamese prefer light, fresh flavors over heavy, oily foods

Regional Variations:
- Northern Vietnam: Subtle flavors, black pepper, less spicy
- Central Vietnam: Complex, spicy flavors, royal cuisine influence
- Southern Vietnam: Sweet flavors, coconut milk, tropical fruits

Dining Etiquette:
- Use chopsticks and soup spoons
- Wait for elders to start eating
- Finish your rice bowl to show respect
- Tea is commonly served with meals
EOF

    # Restaurant operations document
    cat > /tmp/rag-demo-docs/restaurant-operations.md << 'EOF'
# Restaurant Operations Best Practices

## Service Standards

### Customer Service
- Greet customers within 30 seconds of arrival
- Maintain eye contact and smile
- Use proper Vietnamese greetings: "Xin chào" (Hello)
- Be knowledgeable about ingredients and preparation methods

### Order Management
- Peak hours: 11:30 AM - 1:30 PM and 6:00 PM - 8:30 PM
- Average meal duration: 45-60 minutes
- Recommended table turnover: 2-3 times per day

### Quality Control
- Fresh ingredients delivered daily
- Temperature monitoring for food safety
- Regular taste testing of signature dishes
- Customer feedback collection and analysis

## Vietnamese Market Specifics

### Payment Preferences
- Cash is still widely used
- Mobile payments growing rapidly (Momo, ZaloPay)
- Credit cards accepted but not primary
- Digital wallets preferred by younger customers

### Cultural Considerations
- Family-style dining is preferred
- Respect for elderly customers
- Seasonal menu adjustments
- Local festival and holiday considerations
EOF

    # Business analytics document
    cat > /tmp/rag-demo-docs/business-analytics.json << 'EOF'
{
  "title": "Vietnamese F&B Market Analytics",
  "data": {
    "market_size": {
      "total_value": "15.2 billion USD",
      "growth_rate": "8.5% annually",
      "segments": {
        "restaurants": "60%",
        "street_food": "25%",
        "delivery": "15%"
      }
    },
    "customer_demographics": {
      "age_groups": {
        "18-25": "35%",
        "26-35": "30%",
        "36-50": "25%",
        "50+": "10%"
      },
      "income_levels": {
        "low": "40%",
        "middle": "45%",
        "high": "15%"
      }
    },
    "popular_cuisines": [
      "Vietnamese traditional",
      "Korean BBQ",
      "Japanese sushi",
      "Western fast food",
      "Chinese dim sum"
    ],
    "dining_trends": {
      "health_conscious": "increasing",
      "organic_foods": "growing_slowly",
      "food_delivery": "rapidly_expanding",
      "social_media_influence": "very_high"
    }
  }
}
EOF

    print_success "Sample documents created in /tmp/rag-demo-docs/"
}

# Upload sample documents
upload_documents() {
    print_status "Uploading sample documents to trigger processing..."
    
    # Upload documents to the RAG pipeline
    gsutil -m cp /tmp/rag-demo-docs/* gs://$PROJECT_ID-rag-documents/
    
    print_success "Documents uploaded successfully"
    print_status "Processing will begin automatically..."
}

# Monitor processing
monitor_processing() {
    print_status "Monitoring document processing..."
    
    print_status "Checking function logs (this may take a moment)..."
    sleep 10
    
    # Show recent function logs
    gcloud functions logs read rag-document-processor-$ENVIRONMENT \
        --region=$REGION \
        --limit=50 \
        --format="table(timestamp, severity, textPayload)" \
        2>/dev/null || print_warning "Function logs not available yet"
    
    print_status "Checking processed chunks..."
    gsutil ls gs://$PROJECT_ID-rag-chunks/ 2>/dev/null || print_warning "No chunks processed yet"
}

# Test search functionality
test_search() {
    print_status "Testing search functionality..."
    
    # Note: This is a placeholder - actual search testing would require
    # the search engine to be properly configured and documents indexed
    print_warning "Search testing requires manual verification in the Google Cloud Console"
    print_status "To test search:"
    print_status "1. Go to Vertex AI Search in Cloud Console"
    print_status "2. Find your search engine: rag-search-engine-$ENVIRONMENT"
    print_status "3. Use the preview feature to test queries like:"
    print_status "   - 'Vietnamese food preferences'"
    print_status "   - 'restaurant operations'"
    print_status "   - 'customer demographics'"
}

# Cleanup function
cleanup() {
    if [ "$1" = "all" ]; then
        print_status "Cleaning up all resources..."
        
        cd infra/terraform/rag-pipeline
        terraform destroy -auto-approve
        cd ../../..
        
        print_success "All resources cleaned up"
    else
        print_status "Cleaning up temporary files..."
        rm -rf /tmp/rag-demo-docs
        print_success "Temporary files cleaned up"
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup       - Deploy infrastructure and function"
    echo "  demo        - Run complete demo with sample documents"
    echo "  upload      - Upload sample documents"
    echo "  monitor     - Monitor processing logs"
    echo "  test        - Test search functionality"
    echo "  cleanup     - Remove temporary files"
    echo "  cleanup-all - Remove all resources (WARNING: destructive)"
    echo "  help        - Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  PROJECT_ID  - GCP project ID (required)"
    echo "  REGION      - GCP region (default: asia-southeast1)"
    echo "  ENVIRONMENT - Environment name (default: prod)"
}

# Main script logic
main() {
    case "${1:-demo}" in
        "setup")
            check_prerequisites
            deploy_infrastructure
            deploy_function
            print_success "Setup completed successfully!"
            ;;
        "demo")
            check_prerequisites
            deploy_infrastructure
            deploy_function
            create_sample_documents
            upload_documents
            monitor_processing
            test_search
            print_success "Demo completed successfully!"
            print_status "Check the Google Cloud Console to explore the results"
            ;;
        "upload")
            check_prerequisites
            create_sample_documents
            upload_documents
            ;;
        "monitor")
            check_prerequisites
            monitor_processing
            ;;
        "test")
            check_prerequisites
            test_search
            ;;
        "cleanup")
            cleanup
            ;;
        "cleanup-all")
            print_warning "This will destroy ALL RAG pipeline resources!"
            read -p "Are you sure? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cleanup all
            else
                print_status "Cleanup cancelled"
            fi
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run the script
main "$@"