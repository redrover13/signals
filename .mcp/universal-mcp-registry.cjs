#!/usr/bin/env node

/**
 * Universal MCP Registry for AI Tools
 * Provides standardized MCP server access for Kilocode, Qodo Gen, GitHub Copilot, and all compatible AI platforms
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class UniversalMCPRegistry {
  constructor() {
    this.baseConfigPath = '/home/g_nelson/signals-1/.mcp/config/enhanced-mcp.json';
    this.platforms = {
      'github-copilot': {
        configPaths: [
          path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'mcp.json'),
          path.join(os.homedir(), '.config', 'Code', 'User', 'mcp.json'),
          path.join(os.homedir(), '.vscode', 'mcp.json')
        ],
        format: 'copilot-standard'
      },
      'kilocode': {
        configPaths: [
          path.join(os.homedir(), '.vscode-server', 'data', 'User', 'globalStorage', 'kilocode.kilo-code', 'settings', 'mcp_settings.json'),
          path.join(os.homedir(), '.kilocode', 'mcp.json'),
          '/home/g_nelson/signals-1/.kilocode/mcp.json'
        ],
        format: 'kilocode-native'
      },
      'qodo-gen': {
        configPaths: [
          path.join(os.homedir(), '.qodo', 'mcp.json'),
          path.join(os.homedir(), '.codegpt', 'mcp_config.json'),
          '/home/g_nelson/signals-1/.qodo/mcp.json'
        ],
        format: 'qodo-standard'
      },
      'vscode-extensions': {
        configPaths: [
          path.join(os.homedir(), '.vscode', 'extensions', 'mcp.json'),
          '/home/g_nelson/signals-1/.vscode', 'mcp.json'
        ],
        format: 'vscode-standard'
      }
    };
  }

  /**
   * Deploy MCP configuration to all AI platforms
   */
  async deployToAllPlatforms() {
    console.log('🚀 Deploying MCP configuration to all AI platforms...');
    
    // Load master configuration
    const masterConfig = await this.loadMasterConfig();
    
    const deploymentResults = {};
    
    for (const [platform, settings] of Object.entries(this.platforms)) {
      try {
        const platformConfig = await this.adaptConfigForPlatform(masterConfig, platform, settings.format);
        const deployedPaths = await this.deployToPlatform(platform, platformConfig, settings.configPaths);
        
        deploymentResults[platform] = {
          status: 'success',
          deployedPaths,
          serverCount: Object.keys(platformConfig.servers || {}).length
        };
        
        console.log(`✅ ${platform}: Deployed to ${deployedPaths.length} locations`);
      } catch (error) {
        deploymentResults[platform] = {
          status: 'error',
          error: error.message
        };
        console.error(`❌ ${platform}: ${error.message}`);
      }
    }
    
    return deploymentResults;
  }

  /**
   * Load master MCP configuration
   */
  async loadMasterConfig() {
    try {
      const content = await fs.readFile(this.baseConfigPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load master config: ${error.message}`);
    }
  }

  /**
   * Adapt configuration for specific AI platform
   */
  async adaptConfigForPlatform(masterConfig, platform, format) {
    const adapted = JSON.parse(JSON.stringify(masterConfig)); // Deep clone
    
    switch (format) {
      case 'copilot-standard':
        // GitHub Copilot format (standard MCP)
        adapted.metadata.platform = 'github-copilot';
        break;
        
      case 'kilocode-native':
        // Kilocode specific format
        adapted.metadata.platform = 'kilocode';
        adapted.kilocode = {
          integration: true,
          features: ['code-analysis', 'suggestions', 'mcp-tools']
        };
        break;
        
      case 'qodo-standard':
        // Qodo Gen specific format
        adapted.metadata.platform = 'qodo-gen';
        adapted.qodo = {
          enableGenerative: true,
          mcpIntegration: true,
          testGeneration: true
        };
        break;
        
      case 'vscode-standard':
        // VS Code extensions format
        adapted.metadata.platform = 'vscode-extensions';
        break;
    }
    
    return adapted;
  }

  /**
   * Deploy configuration to specific platform
   */
  async deployToPlatform(platform, config, configPaths) {
    const deployedPaths = [];
    
    for (const configPath of configPaths) {
      try {
        // Ensure directory exists
        await fs.mkdir(path.dirname(configPath), { recursive: true });
        
        // Write configuration
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        deployedPaths.push(configPath);
        
        console.log(`📋 ${platform}: Config deployed to ${configPath}`);
      } catch (error) {
        console.warn(`⚠️  ${platform}: Failed to deploy to ${configPath}: ${error.message}`);
      }
    }
    
    if (deployedPaths.length === 0) {
      throw new Error(`No successful deployments for ${platform}`);
    }
    
    return deployedPaths;
  }

  /**
   * Create platform-specific integration scripts
   */
  async createIntegrationScripts() {
    const scriptsDir = '/home/g_nelson/signals-1/.mcp/integrations';
    await fs.mkdir(scriptsDir, { recursive: true });
    
    // Kilocode integration script
    const kilocodeScript = `#!/bin/bash
# Kilocode MCP Integration Script
echo "🔧 Configuring Kilocode for MCP access..."

# Ensure Kilocode settings directory exists
mkdir -p "$HOME/.vscode-server/data/User/globalStorage/kilocode.kilo-code/settings"

# Copy MCP configuration
cp "/home/g_nelson/signals-1/.mcp/config/mcp.json" "$HOME/.vscode-server/data/User/globalStorage/kilocode.kilo-code/settings/mcp_settings.json"

# Set permissions
chmod 644 "$HOME/.vscode-server/data/User/globalStorage/kilocode.kilo-code/settings/mcp_settings.json"

echo "✅ Kilocode MCP integration configured"
`;

    // Qodo Gen integration script
    const qodoScript = `#!/bin/bash
# Qodo Gen MCP Integration Script
echo "🔧 Configuring Qodo Gen for MCP access..."

# Ensure Qodo settings directory exists
mkdir -p "$HOME/.qodo"
mkdir -p "$HOME/.codegpt"

# Copy MCP configuration with Qodo-specific adaptations
cp "/home/g_nelson/signals-1/.mcp/config/mcp.json" "$HOME/.qodo/mcp.json"
cp "/home/g_nelson/signals-1/.mcp/config/mcp.json" "$HOME/.codegpt/mcp_config.json"

# Set permissions
chmod 644 "$HOME/.qodo/mcp.json"
chmod 644 "$HOME/.codegpt/mcp_config.json"

echo "✅ Qodo Gen MCP integration configured"
`;

    await fs.writeFile(path.join(scriptsDir, 'setup-kilocode.sh'), kilocodeScript);
    await fs.writeFile(path.join(scriptsDir, 'setup-qodo.sh'), qodoScript);
    
    // Make scripts executable
    const { exec } = require('child_process');
    await new Promise((resolve) => {
      exec(`chmod +x ${scriptsDir}/*.sh`, resolve);
    });
    
    console.log(`📜 Integration scripts created in ${scriptsDir}`);
    return scriptsDir;
  }

  /**
   * Verify platform access to MCP servers
   */
  async verifyPlatformAccess() {
    console.log('🔍 Verifying platform access to MCP servers...');
    
    const verification = {};
    
    for (const [platform, settings] of Object.entries(this.platforms)) {
      verification[platform] = {
        configFiles: [],
        accessibility: 'unknown'
      };
      
      for (const configPath of settings.configPaths) {
        try {
          await fs.access(configPath);
          const content = await fs.readFile(configPath, 'utf8');
          const config = JSON.parse(content);
          
          verification[platform].configFiles.push({
            path: configPath,
            valid: true,
            serverCount: Object.keys(config.servers || {}).length
          });
        } catch (error) {
          verification[platform].configFiles.push({
            path: configPath,
            valid: false,
            error: error.message
          });
        }
      }
      
      // Determine accessibility
      const validConfigs = verification[platform].configFiles.filter(f => f.valid);
      verification[platform].accessibility = validConfigs.length > 0 ? 'accessible' : 'not-accessible';
    }
    
    return verification;
  }

  /**
   * Generate compatibility report
   */
  async generateCompatibilityReport() {
    const verification = await this.verifyPlatformAccess();
    const masterConfig = await this.loadMasterConfig();
    
    const report = {
      timestamp: new Date().toISOString(),
      masterConfig: {
        path: this.baseConfigPath,
        serverCount: Object.keys(masterConfig.servers || {}).length,
        servers: Object.keys(masterConfig.servers || {})
      },
      platforms: verification,
      summary: {
        totalPlatforms: Object.keys(this.platforms).length,
        accessiblePlatforms: Object.values(verification).filter(p => p.accessibility === 'accessible').length,
        universalAccess: Object.values(verification).every(p => p.accessibility === 'accessible')
      }
    };
    
    const reportPath = '/home/g_nelson/signals-1/.mcp/compatibility-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Compatibility report generated: ${reportPath}`);
    return report;
  }
}

// CLI Interface
async function main() {
  const registry = new UniversalMCPRegistry();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'deploy':
        const deploymentResults = await registry.deployToAllPlatforms();
        console.log('\n📋 Deployment Summary:');
        console.log(JSON.stringify(deploymentResults, null, 2));
        break;
        
      case 'verify':
        const verification = await registry.verifyPlatformAccess();
        console.log('\n🔍 Platform Access Verification:');
        console.log(JSON.stringify(verification, null, 2));
        break;
        
      case 'integrate':
        await registry.createIntegrationScripts();
        break;
        
      case 'report':
        await registry.generateCompatibilityReport();
        break;
        
      default:
        console.log(`
Universal MCP Registry for AI Tools

Usage:
  node universal-mcp-registry.cjs deploy     - Deploy MCP config to all AI platforms
  node universal-mcp-registry.cjs verify     - Verify platform access to MCP servers
  node universal-mcp-registry.cjs integrate  - Create platform integration scripts
  node universal-mcp-registry.cjs report     - Generate compatibility report

Supported Platforms:
  - GitHub Copilot
  - Kilocode
  - Qodo Gen  
  - VS Code Extensions
        `);
    }
  } catch (error) {
    console.error('❌ Registry error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = UniversalMCPRegistry;
