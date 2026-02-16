/**
 * Configuration - Monitoring configuration
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface MonitoringConfig {
  pollingInterval: number;
  errorBackoff: number;
  autoRemediate: boolean;
  targets: string[];
  alertChannels: {
    type: 'slack' | 'email' | 'pagerduty' | 'webhook';
    config: Record<string, any>;
  }[];
  // Additional configuration for K8s pod recovery
interface K8sPodRecoveryConfig {
  kubernetes: {
    kubeconfig?: string;
    inCluster: boolean;
    namespaces: string[];
    labelSelector?: string;
  };
  circuitBreaker: {
    maxRestarts: number;
    timeWindowSeconds: number;
    cooldownMinutes: number;
  };
  healthCheck: {
    intervalSeconds: number;
    startupGracePeriodMinutes: number;
    consecutiveFailuresThreshold: number;
  };
  remediation: {
    gracePeriodSeconds: number;
    recreationTimeoutMinutes: number;
    enableAutoRestart: boolean;
  };
  alerting: {
    slack?: { enabled: boolean; channel: string; webhookUrl: string; };
    pagerduty?: { enabled: boolean; integrationKey: string; };
    datadog?: { enabled: boolean; apiKey: string; };
  };
  resourceAnalysis: {
    enabled: boolean;
    cpuThresholdPercent: number;
    memoryThresholdPercent: number;
  };
}
}

export async function loadConfig(): Promise<MonitoringConfig> {
  const configPath = process.env.CONFIG_PATH || path.join(process.cwd(), 'config.json');

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);

    // Validate configuration
    validateConfig(config);

    return config;
  } catch (error) {
    // Return default configuration
    return getDefaultConfig();
  }
}

function validateConfig(config: any): void {
  if (!config.pollingInterval || config.pollingInterval < 1000) {
    throw new Error('pollingInterval must be at least 1000ms');
  }

  if (!Array.isArray(config.targets) || config.targets.length === 0) {
    throw new Error('targets must be a non-empty array');
  }
}

function getDefaultConfig(): MonitoringConfig {
  return {
    pollingInterval: 30000, // 30 seconds
    errorBackoff: 5000, // 5 seconds
    autoRemediate: true,
    targets: [],
    alertChannels: [],
    // Default configuration values for pod recovery
const DEFAULT_CONFIG = {
  kubernetes: {
    inCluster: true,
    namespaces: ['default'],
    labelSelector: 'auto-recovery=enabled'
  },
  circuitBreaker: {
    maxRestarts: 5,
    timeWindowSeconds: 3600,
    cooldownMinutes: 30
  },
  healthCheck: {
    intervalSeconds: 30,
    startupGracePeriodMinutes: 5,
    consecutiveFailuresThreshold: 3
  },
  remediation: {
    gracePeriodSeconds: 30,
    recreationTimeoutMinutes: 5,
    enableAutoRestart: true
  },
  alerting: {
    slack: { enabled: false, channel: '#ops-alerts', webhookUrl: '' },
    pagerduty: { enabled: false, integrationKey: '' },
    datadog: { enabled: false, apiKey: '' }
  },
  resourceAnalysis: {
    enabled: true,
    cpuThresholdPercent: 90,
    memoryThresholdPercent: 90
  }
};
  };
}
