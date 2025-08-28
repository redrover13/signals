#!/bin/bash

# Agent Maestro Management Script
# Usage: ./scripts/maestro.sh [start|stop|restart|status|check]

MAESTRO_PROXY_PORT=${AGENT_MAESTRO_PROXY_PORT:-23335}
MAESTRO_MCP_PORT=${AGENT_MAESTRO_MCP_PORT:-23336}

echo "Agent Maestro Management Script"
echo "Proxy Port: $MAESTRO_PROXY_PORT"
echo "MCP Port: $MAESTRO_MCP_PORT"
echo "================================"

check_ports() {
    echo "Checking port availability..."
    if netstat -tlnp 2>/dev/null | grep -q ":$MAESTRO_PROXY_PORT "; then
        echo "✅ Proxy port $MAESTRO_PROXY_PORT is in use"
    else
        echo "❌ Proxy port $MAESTRO_PROXY_PORT is not in use"
    fi

    if netstat -tlnp 2>/dev/null | grep -q ":$MAESTRO_MCP_PORT "; then
        echo "✅ MCP port $MAESTRO_MCP_PORT is in use"
    else
        echo "❌ MCP port $MAESTRO_MCP_PORT is not in use"
    fi
}

check_endpoints() {
    echo "Checking API endpoints..."
    if curl -s http://localhost:$MAESTRO_PROXY_PORT/api/v1 > /dev/null; then
        echo "✅ REST API: http://localhost:$MAESTRO_PROXY_PORT/api/v1"
    else
        echo "❌ REST API not accessible"
    fi

    if curl -s http://localhost:$MAESTRO_PROXY_PORT/openapi.json > /dev/null; then
        echo "✅ OpenAPI Docs: http://localhost:$MAESTRO_PROXY_PORT/openapi.json"
    else
        echo "❌ OpenAPI Docs not accessible"
    fi
}

case "$1" in
    "start")
        echo "Starting Agent Maestro..."
        echo "Note: Use VS Code Command Palette (Ctrl+Shift+P) and run:"
        echo "  - 'Agent Maestro: Start API Server'"
        echo "  - 'Agent Maestro: Get Extensions Status'"
        ;;
    "stop")
        echo "Stopping Agent Maestro..."
        echo "Note: Use VS Code Command Palette (Ctrl+Shift+P) and run:"
        echo "  - 'Agent Maestro: Stop API Server'"
        ;;
    "restart")
        echo "Restarting Agent Maestro..."
        echo "Note: Use VS Code Command Palette (Ctrl+Shift+P) and run:"
        echo "  - 'Agent Maestro: Restart API Server'"
        ;;
    "status"|"check")
        check_ports
        echo ""
        check_endpoints
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|check}"
        echo ""
        echo "Available commands:"
        echo "  start   - Start Agent Maestro servers"
        echo "  stop    - Stop Agent Maestro servers"
        echo "  restart - Restart Agent Maestro servers"
        echo "  status  - Check server status and endpoints"
        echo "  check   - Same as status"
        echo ""
        echo "Note: Agent Maestro is controlled through VS Code commands."
        ;;
esac
