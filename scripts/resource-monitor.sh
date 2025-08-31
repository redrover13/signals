#!/bin/bash

# Enterprise Resource Monitoring System for Dulce de Saigon F&B Platform
# Monitors Ollama AI service and development services resource usage

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${PROJECT_ROOT}/config/resource-monitor.json"
LOG_FILE="${PROJECT_ROOT}/logs/resource-monitor.log"
METRICS_DIR="${PROJECT_ROOT}/metrics"
ALERTS_DIR="${PROJECT_ROOT}/alerts"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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
    mkdir -p "$METRICS_DIR"
    mkdir -p "$ALERTS_DIR"

    if [[ ! -f "$CONFIG_FILE" ]]; then
        cat > "$CONFIG_FILE" << EOF
{
  "version": "1.0",
  "last_updated": "$(date -Iseconds)",
  "monitoring": {
    "enabled": true,
    "interval_seconds": 30,
    "retention_days": 7,
    "alert_thresholds": {
      "cpu_percent": 80,
      "memory_percent": 85,
      "disk_percent": 90,
      "network_connections": 1000
    }
  },
  "services": {
    "ollama": {
      "name": "Ollama AI Service",
      "port": 11434,
      "process_pattern": "ollama",
      "critical": true,
      "expected_models": ["llama2", "codellama", "mistral"],
      "resource_limits": {
        "cpu_cores": 4,
        "memory_gb": 8,
        "gpu_memory_gb": 4
      }
    },
    "development": {
      "name": "Development Services",
      "ports": [3000, 3001, 3002, 4000, 5000, 8000, 9000],
      "process_patterns": ["node", "npm", "yarn", "next", "react"],
      "critical": false
    },
    "databases": {
      "name": "Database Services",
      "ports": [5432, 6379, 27017],
      "process_patterns": ["postgres", "redis", "mongodb"],
      "critical": true,
      "resource_limits": {
        "cpu_cores": 2,
        "memory_gb": 4
      }
    }
  },
  "alerts": {
    "email_enabled": false,
    "slack_enabled": false,
    "webhook_enabled": false,
    "alert_cooldown_minutes": 5
  },
  "optimization": {
    "auto_restart": true,
    "memory_cleanup": true,
    "cache_optimization": true
  }
}
EOF
        log "INFO" "Initialized resource monitoring configuration"
    fi
}

# Get system resource usage
get_system_resources() {
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')

    # Memory usage
    local mem_info=$(free | grep Mem)
    local mem_total=$(echo "$mem_info" | awk '{print $2}')
    local mem_used=$(echo "$mem_info" | awk '{print $3}')
    local mem_percent=$((mem_used * 100 / mem_total))

    # Disk usage
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

    # Network connections
    local network_connections=$(netstat -tun | wc -l)

    # GPU usage (if available)
    local gpu_usage="N/A"
    if command -v nvidia-smi &> /dev/null; then
        gpu_usage=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits | head -1)
    fi

    cat << EOF
{
  "timestamp": "$(date -Iseconds)",
  "cpu_percent": $cpu_usage,
  "memory": {
    "total_kb": $mem_total,
    "used_kb": $mem_used,
    "percent": $mem_percent
  },
  "disk_percent": $disk_usage,
  "network_connections": $network_connections,
  "gpu_percent": "$gpu_usage"
}
EOF
}

# Get process resource usage
get_process_resources() {
    local pid="$1"
    local process_name="$2"

    if [[ ! -d "/proc/$pid" ]]; then
        echo "{}"
        return
    fi

    # CPU usage
    local cpu_percent=$(ps -p "$pid" -o %cpu --no-headers | tr -d ' ')

    # Memory usage
    local mem_percent=$(ps -p "$pid" -o %mem --no-headers | tr -d ' ')
    local mem_kb=$(ps -p "$pid" -o rss --no-headers | tr -d ' ')

    # Threads
    local threads=$(ps -p "$pid" -o nlwp --no-headers | tr -d ' ')

    # Open files
    local open_files=$(lsof -p "$pid" 2>/dev/null | wc -l)

    # Network connections
    local net_connections=$(netstat -tunp 2>/dev/null | grep "$pid/" | wc -l)

    cat << EOF
{
  "pid": $pid,
  "name": "$process_name",
  "cpu_percent": ${cpu_percent:-0},
  "memory_percent": ${mem_percent:-0},
  "memory_kb": ${mem_kb:-0},
  "threads": ${threads:-0},
  "open_files": ${open_files:-0},
  "network_connections": ${net_connections:-0}
}
EOF
}

# Monitor Ollama service specifically
monitor_ollama() {
    local ollama_port=$(jq -r '.services.ollama.port' "$CONFIG_FILE")
    local ollama_process=$(jq -r '.services.ollama.process_pattern' "$CONFIG_FILE")

    # Check if Ollama is running
    local ollama_pid=$(pgrep -f "$ollama_process" | head -1)

    if [[ -z "$ollama_pid" ]]; then
        log "WARNING" "Ollama service is not running"
        echo -e "${RED}WARNING: Ollama service is not running${NC}"

        # Auto-restart if enabled
        if jq -r '.optimization.auto_restart' "$CONFIG_FILE" | grep -q "true"; then
            log "INFO" "Attempting to restart Ollama service"
            echo -e "${YELLOW}Attempting to restart Ollama service...${NC}"

            # Try to start Ollama
            if command -v ollama &> /dev/null; then
                nohup ollama serve > /dev/null 2>&1 &
                sleep 5

                local new_pid=$(pgrep -f "$ollama_process" | head -1)
                if [[ -n "$new_pid" ]]; then
                    log "INFO" "Ollama service restarted successfully (PID: $new_pid)"
                    echo -e "${GREEN}Ollama service restarted successfully${NC}"
                else
                    log "ERROR" "Failed to restart Ollama service"
                    echo -e "${RED}Failed to restart Ollama service${NC}"
                fi
            fi
        fi
        return
    fi

    # Get Ollama resource usage
    local ollama_resources=$(get_process_resources "$ollama_pid" "ollama")

    # Check port availability
    if ! nc -z localhost "$ollama_port" 2>/dev/null; then
        log "WARNING" "Ollama port $ollama_port is not accessible"
        echo -e "${RED}WARNING: Ollama port $ollama_port is not accessible${NC}"
    fi

    # Check loaded models
    local models_info=""
    if command -v ollama &> /dev/null; then
        models_info=$(ollama list 2>/dev/null | tail -n +2 | wc -l)
    fi

    # Get resource limits
    local cpu_limit=$(jq -r '.services.ollama.resource_limits.cpu_cores' "$CONFIG_FILE")
    local mem_limit=$(jq -r '.services.ollama.resource_limits.memory_gb' "$CONFIG_FILE")

    # Check resource usage against limits
    local current_cpu=$(echo "$ollama_resources" | jq -r '.cpu_percent')
    local current_mem_percent=$(echo "$ollama_resources" | jq -r '.memory_percent')

    if (( $(echo "$current_cpu > $cpu_limit * 25" | bc -l) )); then
        log "WARNING" "Ollama CPU usage ($current_cpu%) exceeds recommended limit"
        echo -e "${YELLOW}WARNING: Ollama CPU usage high ($current_cpu%)${NC}"
    fi

    if (( $(echo "$current_mem_percent > 80" | bc -l) )); then
        log "WARNING" "Ollama memory usage ($current_mem_percent%) is high"
        echo -e "${YELLOW}WARNING: Ollama memory usage high ($current_mem_percent%)${NC}"
    fi

    # Log Ollama status
    cat << EOF
{
  "service": "ollama",
  "status": "running",
  "pid": $ollama_pid,
  "port": $ollama_port,
  "models_loaded": ${models_info:-0},
  "resources": $ollama_resources,
  "timestamp": "$(date -Iseconds)"
}
EOF
}

# Monitor development services
monitor_development_services() {
    local dev_ports=$(jq -r '.services.development.ports[]' "$CONFIG_FILE")
    local dev_patterns=$(jq -r '.services.development.process_patterns[]' "$CONFIG_FILE")

    echo -e "${CYAN}=== Development Services Status ===${NC}"

    # Check each development port
    for port in $dev_ports; do
        if nc -z localhost "$port" 2>/dev/null; then
            local process_info=$(lsof -i :"$port" 2>/dev/null | tail -n +2 | head -1)
            if [[ -n "$process_info" ]]; then
                local pid=$(echo "$process_info" | awk '{print $2}')
                local process_name=$(echo "$process_info" | awk '{print $1}')
                local resources=$(get_process_resources "$pid" "$process_name")

                echo -e "${GREEN}Port $port:${NC} $process_name (PID: $pid)"
                echo "  CPU: $(echo "$resources" | jq -r '.cpu_percent')%"
                echo "  Memory: $(echo "$resources" | jq -r '.memory_percent')%"
            else
                echo -e "${YELLOW}Port $port:${NC} Open but no process found"
            fi
        else
            echo -e "${BLUE}Port $port:${NC} Not in use"
        fi
    done

    # Check for common development processes
    echo -e "\n${CYAN}Development Processes:${NC}"
    for pattern in $dev_patterns; do
        local processes=$(pgrep -f "$pattern" 2>/dev/null)
        if [[ -n "$processes" ]]; then
            local count=$(echo "$processes" | wc -l)
            echo -e "${GREEN}$pattern:${NC} $count process(es) running"
        fi
    done
}

# Monitor database services
monitor_database_services() {
    local db_ports=$(jq -r '.services.databases.ports[]' "$CONFIG_FILE")
    local db_patterns=$(jq -r '.services.databases.process_patterns[]' "$CONFIG_FILE")

    echo -e "${CYAN}=== Database Services Status ===${NC}"

    # Check each database port
    for port in $db_ports; do
        if nc -z localhost "$port" 2>/dev/null; then
            local process_info=$(lsof -i :"$port" 2>/dev/null | tail -n +2 | head -1)
            if [[ -n "$process_info" ]]; then
                local pid=$(echo "$process_info" | awk '{print $2}')
                local process_name=$(echo "$process_info" | awk '{print $1}')
                local resources=$(get_process_resources "$pid" "$process_name")

                echo -e "${GREEN}Port $port:${NC} $process_name (PID: $pid)"
                echo "  CPU: $(echo "$resources" | jq -r '.cpu_percent')%"
                echo "  Memory: $(echo "$resources" | jq -r '.memory_percent')%"
                echo "  Connections: $(echo "$resources" | jq -r '.network_connections')"
            else
                echo -e "${RED}Port $port:${NC} Open but no process found"
            fi
        else
            echo -e "${RED}Port $port:${NC} Database service not accessible"
        fi
    done
}

# Check for resource alerts
check_alerts() {
    local system_resources=$(get_system_resources)
    local alerts_file="$ALERTS_DIR/alerts-$(date +%Y%m%d).json"

    # Extract current values
    local cpu_percent=$(echo "$system_resources" | jq -r '.cpu_percent')
    local mem_percent=$(echo "$system_resources" | jq -r '.memory.percent')
    local disk_percent=$(echo "$system_resources" | jq -r '.disk_percent')
    local net_connections=$(echo "$system_resources" | jq -r '.network_connections')

    # Get thresholds
    local cpu_threshold=$(jq -r '.monitoring.alert_thresholds.cpu_percent' "$CONFIG_FILE")
    local mem_threshold=$(jq -r '.monitoring.alert_thresholds.memory_percent' "$CONFIG_FILE")
    local disk_threshold=$(jq -r '.monitoring.alert_thresholds.disk_percent' "$CONFIG_FILE")
    local net_threshold=$(jq -r '.monitoring.alert_thresholds.network_connections' "$CONFIG_FILE")

    local alerts=()

    # Check CPU
    if (( $(echo "$cpu_percent > $cpu_threshold" | bc -l) )); then
        alerts+=("{\"type\":\"cpu\",\"message\":\"CPU usage is ${cpu_percent}% (threshold: ${cpu_threshold}%)\"}")
        echo -e "${RED}ALERT: High CPU usage (${cpu_percent}%)${NC}"
    fi

    # Check Memory
    if (( mem_percent > mem_threshold )); then
        alerts+=("{\"type\":\"memory\",\"message\":\"Memory usage is ${mem_percent}% (threshold: ${mem_threshold}%)\"}")
        echo -e "${RED}ALERT: High memory usage (${mem_percent}%)${NC}"
    fi

    # Check Disk
    if (( disk_percent > disk_threshold )); then
        alerts+=("{\"type\":\"disk\",\"message\":\"Disk usage is ${disk_percent}% (threshold: ${disk_threshold}%)\"}")
        echo -e "${RED}ALERT: High disk usage (${disk_percent}%)${NC}"
    fi

    # Check Network
    if (( net_connections > net_threshold )); then
        alerts+=("{\"type\":\"network\",\"message\":\"Network connections: ${net_connections} (threshold: ${net_threshold})\"}")
        echo -e "${RED}ALERT: High network connections (${net_connections})${NC}"
    fi

    # Save alerts if any
    if [[ ${#alerts[@]} -gt 0 ]]; then
        local alert_data="{\"timestamp\":\"$(date -Iseconds)\",\"alerts\":[$(IFS=,; echo "${alerts[*]}")]}"
        echo "$alert_data" >> "$alerts_file"
        log "WARNING" "Generated ${#alerts[@]} resource alerts"
    fi
}

# Generate metrics report
generate_metrics_report() {
    local report_file="$METRICS_DIR/metrics-$(date +%Y%m%d-%H%M%S).json"

    local system_resources=$(get_system_resources)
    local ollama_status=$(monitor_ollama)

    cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "system": $system_resources,
  "services": {
    "ollama": $ollama_status
  }
}
EOF

    log "INFO" "Generated metrics report: $report_file"
}

# Cleanup old files
cleanup_old_files() {
    local retention_days=$(jq -r '.monitoring.retention_days' "$CONFIG_FILE")

    # Clean up old metrics
    find "$METRICS_DIR" -name "metrics-*.json" -mtime +"$retention_days" -delete 2>/dev/null || true

    # Clean up old alerts
    find "$ALERTS_DIR" -name "alerts-*.json" -mtime +"$retention_days" -delete 2>/dev/null || true

    # Clean up old logs
    find "$(dirname "$LOG_FILE")" -name "*.log" -mtime +"$retention_days" -exec truncate -s 0 {} \; 2>/dev/null || true

    log "INFO" "Cleaned up files older than $retention_days days"
}

# Memory optimization
optimize_memory() {
    if jq -r '.optimization.memory_cleanup' "$CONFIG_FILE" | grep -q "true"; then
        log "INFO" "Running memory optimization"

        # Clear system cache (requires root)
        if [[ $EUID -eq 0 ]]; then
            echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true
            log "INFO" "Cleared system cache"
        fi

        # Clear Ollama cache if available
        if command -v ollama &> /dev/null; then
            ollama list > /dev/null 2>&1
            log "INFO" "Optimized Ollama cache"
        fi
    fi
}

# Main monitoring function
start_monitoring() {
    local interval=$(jq -r '.monitoring.interval_seconds' "$CONFIG_FILE")

    log "INFO" "Starting resource monitoring (interval: ${interval}s)"

    while true; do
        echo -e "\n${PURPLE}=== Resource Monitoring Report ===${NC}"
        echo -e "${BLUE}$(date)${NC}"

        # System resources
        local system_resources=$(get_system_resources)
        echo -e "\n${CYAN}System Resources:${NC}"
        echo "CPU: $(echo "$system_resources" | jq -r '.cpu_percent')%"
        echo "Memory: $(echo "$system_resources" | jq -r '.memory.percent')%"
        echo "Disk: $(echo "$system_resources" | jq -r '.disk_percent')%"
        echo "Network: $(echo "$system_resources" | jq -r '.network_connections') connections"

        # Ollama monitoring
        echo -e "\n${CYAN}Ollama Service:${NC}"
        monitor_ollama

        # Development services
        monitor_development_services

        # Database services
        monitor_database_services

        # Check alerts
        check_alerts

        # Generate metrics
        generate_metrics_report

        # Cleanup
        cleanup_old_files

        # Memory optimization
        optimize_memory

        echo -e "\n${BLUE}Next check in ${interval} seconds...${NC}"
        sleep "$interval"
    done
}

# Show usage
usage() {
    cat << EOF
Enterprise Resource Monitoring System for Dulce de Saigon F&B Platform

USAGE:
    $0 [COMMAND]

COMMANDS:
    init                    Initialize monitoring configuration
    monitor                 Start continuous monitoring
    status                  Show current status
    report                  Generate metrics report
    cleanup                 Clean up old files
    optimize                Run memory optimization
    help                    Show this help

CONFIGURATION:
    Config file: $CONFIG_FILE
    Log file: $LOG_FILE
    Metrics dir: $METRICS_DIR
    Alerts dir: $ALERTS_DIR

MONITORED SERVICES:
    - Ollama AI Service (Port 11434)
    - Development Services (Ports 3000-5000, 8000-9000)
    - Database Services (Ports 5432, 6379, 27017)

EOF
}

# Main function
main() {
    local command="${1:-help}"

    case "$command" in
        init)
            init_config
            ;;
        monitor)
            init_config
            start_monitoring
            ;;
        status)
            echo -e "${CYAN}=== Current Status ===${NC}"
            get_system_resources | jq .
            echo
            monitor_ollama
            ;;
        report)
            generate_metrics_report
            echo -e "${GREEN}Metrics report generated${NC}"
            ;;
        cleanup)
            cleanup_old_files
            echo -e "${GREEN}Cleanup completed${NC}"
            ;;
        optimize)
            optimize_memory
            echo -e "${GREEN}Memory optimization completed${NC}"
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