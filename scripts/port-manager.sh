#!/bin/bash

# Enterprise Port Management System for Dulce de Saigon F&B Platform
# This script provides comprehensive port management, monitoring, and optimization

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${PROJECT_ROOT}/config/port-registry.json"
LOG_FILE="${PROJECT_ROOT}/logs/port-manager.log"
BACKUP_DIR="${PROJECT_ROOT}/backups/port-registry"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    echo -e "${BLUE}[$timestamp]${NC} [$level] $message"
}

# Error handling
error_exit() {
    local message="$1"
    log "ERROR" "$message"
    echo -e "${RED}ERROR: $message${NC}" >&2
    exit 1
}

# Initialize configuration
init_config() {
    mkdir -p "$(dirname "$CONFIG_FILE")"
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$BACKUP_DIR"

    if [[ ! -f "$CONFIG_FILE" ]]; then
        cat > "$CONFIG_FILE" << EOF
{
  "version": "1.0",
  "last_updated": "$(date -Iseconds)",
  "port_ranges": {
    "development": {
      "start": 3000,
      "end": 3999,
      "description": "Development services and applications"
    },
    "production": {
      "start": 8000,
      "end": 8999,
      "description": "Production services"
    },
    "system": {
      "start": 9000,
      "end": 9999,
      "description": "System and monitoring services"
    },
    "ai_services": {
      "start": 11434,
      "end": 11434,
      "description": "Ollama AI service"
    }
  },
  "reserved_ports": {
    "22": {
      "service": "ssh",
      "description": "Secure Shell",
      "owner": "system",
      "critical": true
    },
    "80": {
      "service": "http",
      "description": "HTTP web server",
      "owner": "web-server",
      "critical": true
    },
    "443": {
      "service": "https",
      "description": "HTTPS web server",
      "owner": "web-server",
      "critical": true
    },
    "5432": {
      "service": "postgresql",
      "description": "PostgreSQL database",
      "owner": "database",
      "critical": true
    },
    "6379": {
      "service": "redis",
      "description": "Redis cache",
      "owner": "cache",
      "critical": true
    },
    "11434": {
      "service": "ollama",
      "description": "Ollama AI service",
      "owner": "ai-service",
      "critical": false
    }
  },
  "allocated_ports": {},
  "monitoring": {
    "scan_interval": 300,
    "alert_threshold": 80,
    "auto_cleanup": true,
    "cleanup_age_days": 7
  }
}
EOF
        log "INFO" "Initialized port registry configuration"
    fi
}

# Validate port number
validate_port() {
    local port="$1"
    if ! [[ "$port" =~ ^[0-9]+$ ]] || [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
        error_exit "Invalid port number: $port"
    fi
}

# Check if port is in use
check_port_usage() {
    local port="$1"
    if lsof -i :"$port" &>/dev/null; then
        echo "in_use"
    else
        echo "free"
    fi
}

# Get process using port
get_port_process() {
    local port="$1"
    local process_info=$(lsof -i :"$port" 2>/dev/null | tail -n +2)
    if [[ -n "$process_info" ]]; then
        echo "$process_info"
    else
        echo "No process found"
    fi
}

# Allocate port
allocate_port() {
    local port="$1"
    local service="$2"
    local owner="${3:-$(whoami)}"
    local description="${4:-}"

    validate_port "$port"

    # Check if port is already reserved
    if jq -e ".reserved_ports.\"$port\"" "$CONFIG_FILE" &>/dev/null; then
        error_exit "Port $port is reserved and cannot be allocated"
    fi

    # Check if port is already allocated
    if jq -e ".allocated_ports.\"$port\"" "$CONFIG_FILE" &>/dev/null; then
        error_exit "Port $port is already allocated"
    fi

    # Check if port is in use
    if [[ "$(check_port_usage "$port")" == "in_use" ]]; then
        log "WARNING" "Port $port is currently in use by: $(get_port_process "$port")"
    fi

    # Allocate port
    local allocation_data=$(cat << EOF
{
  "service": "$service",
  "owner": "$owner",
  "description": "$description",
  "allocated_at": "$(date -Iseconds)",
  "status": "allocated"
}
EOF
)

    # Update configuration
    jq ".allocated_ports.\"$port\" = $allocation_data" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
    mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"

    log "INFO" "Allocated port $port for service '$service' (owner: $owner)"
    echo -e "${GREEN}Successfully allocated port $port${NC}"
}

# Deallocate port
deallocate_port() {
    local port="$1"

    validate_port "$port"

    # Check if port is allocated
    if ! jq -e ".allocated_ports.\"$port\"" "$CONFIG_FILE" &>/dev/null; then
        error_exit "Port $port is not allocated"
    fi

    # Remove allocation
    jq "del(.allocated_ports.\"$port\")" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
    mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"

    log "INFO" "Deallocated port $port"
    echo -e "${GREEN}Successfully deallocated port $port${NC}"
}

# List allocated ports
list_ports() {
    local filter="${1:-}"

    echo -e "${BLUE}=== Port Registry Status ===${NC}"
    echo

    echo -e "${YELLOW}Reserved Ports:${NC}"
    jq -r '.reserved_ports | to_entries[] | "\(.key): \(.value.service) - \(.value.description) (Owner: \(.value.owner))"' "$CONFIG_FILE" 2>/dev/null || echo "None"

    echo
    echo -e "${YELLOW}Allocated Ports:${NC}"
    if [[ -n "$filter" ]]; then
        jq -r ".allocated_ports | to_entries[] | select(.value.service | contains(\"$filter\")) | \"\(.key): \(.value.service) - \(.value.description) (Owner: \(.value.owner), Status: \(.value.status))\"" "$CONFIG_FILE" 2>/dev/null || echo "None found matching '$filter'"
    else
        jq -r '.allocated_ports | to_entries[] | "\(.key): \(.value.service) - \(.value.description) (Owner: \(.value.owner), Status: \(.value.status))"' "$CONFIG_FILE" 2>/dev/null || echo "None"
    fi
}

# Scan active ports
scan_ports() {
    echo -e "${BLUE}=== Active Port Scan ===${NC}"
    echo

    local active_ports=$(netstat -tlnp 2>/dev/null | grep LISTEN | awk '{print $4}' | sed 's/.*://' | sort -n | uniq)

    echo -e "${YELLOW}Currently listening ports:${NC}"
    printf "%-8s %-15s %-20s %-s\n" "PORT" "SERVICE" "PROCESS" "STATUS"
    printf "%-8s %-15s %-20s %-s\n" "----" "-------" "-------" "------"

    for port in $active_ports; do
        local service="unknown"
        local status="unknown"
        local process="unknown"

        # Check if port is reserved
        if jq -e ".reserved_ports.\"$port\"" "$CONFIG_FILE" &>/dev/null; then
            service=$(jq -r ".reserved_ports.\"$port\".service" "$CONFIG_FILE")
            status="reserved"
        elif jq -e ".allocated_ports.\"$port\"" "$CONFIG_FILE" &>/dev/null; then
            service=$(jq -r ".allocated_ports.\"$port\".service" "$CONFIG_FILE")
            status="allocated"
        fi

        # Get process information
        local process_info=$(get_port_process "$port")
        if [[ "$process_info" != "No process found" ]]; then
            process=$(echo "$process_info" | awk '{print $1}')
        fi

        printf "%-8s %-15s %-20s %-s\n" "$port" "$service" "$process" "$status"
    done
}

# Monitor ports
monitor_ports() {
    log "INFO" "Starting port monitoring"

    while true; do
        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

        # Check for unauthorized port usage
        local active_ports=$(netstat -tlnp 2>/dev/null | grep LISTEN | awk '{print $4}' | sed 's/.*://' | sort -n)

        for port in $active_ports; do
            # Skip reserved ports
            if jq -e ".reserved_ports.\"$port\"" "$CONFIG_FILE" &>/dev/null; then
                continue
            fi

            # Check if port is allocated
            if ! jq -e ".allocated_ports.\"$port\"" "$CONFIG_FILE" &>/dev/null; then
                local process_info=$(get_port_process "$port")
                log "WARNING" "Unauthorized port usage detected: $port (Process: $process_info)"
                echo -e "${RED}WARNING: Unauthorized port $port is in use${NC}"
            fi
        done

        # Check for stale allocations
        local stale_ports=$(jq -r '.allocated_ports | to_entries[] | select(.value.allocated_at < "'$(date -d '7 days ago' -Iseconds)'") | .key' "$CONFIG_FILE" 2>/dev/null)

        for port in $stale_ports; do
            if [[ "$(check_port_usage "$port")" == "free" ]]; then
                log "INFO" "Cleaning up stale allocation for port $port"
                deallocate_port "$port"
            fi
        done

        sleep "$(jq -r '.monitoring.scan_interval' "$CONFIG_FILE")"
    done
}

# Backup configuration
backup_config() {
    local backup_file="$BACKUP_DIR/port-registry-$(date +%Y%m%d-%H%M%S).json"
    cp "$CONFIG_FILE" "$backup_file"
    log "INFO" "Configuration backed up to $backup_file"
    echo -e "${GREEN}Configuration backed up to $backup_file${NC}"
}

# Show usage
usage() {
    cat << EOF
Enterprise Port Management System for Dulce de Saigon F&B Platform

USAGE:
    $0 [COMMAND] [OPTIONS]

COMMANDS:
    init                    Initialize port registry
    allocate PORT SERVICE [OWNER] [DESCRIPTION]
                            Allocate a port for a service
    deallocate PORT         Deallocate a port
    list [FILTER]           List allocated ports (optional filter)
    scan                    Scan active ports
    monitor                 Start port monitoring (background)
    backup                  Backup configuration
    help                    Show this help

EXAMPLES:
    $0 init
    $0 allocate 3000 web-app development "Next.js development server"
    $0 deallocate 3000
    $0 list web
    $0 scan
    $0 monitor &
    $0 backup

CONFIGURATION:
    Config file: $CONFIG_FILE
    Log file: $LOG_FILE
    Backup dir: $BACKUP_DIR

EOF
}

# Main function
main() {
    local command="${1:-help}"

    case "$command" in
        init)
            init_config
            ;;
        allocate)
            if [[ $# -lt 3 ]]; then
                error_exit "Usage: $0 allocate PORT SERVICE [OWNER] [DESCRIPTION]"
            fi
            allocate_port "$2" "$3" "${4:-}" "${5:-}"
            ;;
        deallocate)
            if [[ $# -lt 2 ]]; then
                error_exit "Usage: $0 deallocate PORT"
            fi
            deallocate_port "$2"
            ;;
        list)
            list_ports "${2:-}"
            ;;
        scan)
            scan_ports
            ;;
        monitor)
            monitor_ports
            ;;
        backup)
            backup_config
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            error_exit "Unknown command: $command"
            ;;
    esac
}

# Run main function
main "$@"