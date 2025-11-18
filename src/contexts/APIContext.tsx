import React, { createContext, useContext, useEffect, useState } from 'react';
import type { APIConfig } from '../types/api';
import { initializeAPIClient } from '../lib/api-client';
import {
  clearAPIConfig,
  hasAPIConfig,
  loadAPIConfig,
  saveAPIConfig,
} from '../lib/storage';

interface APIContextType {
  isConfigured: boolean;
  configure: (config: APIConfig) => void;
  clearConfig: () => void;
  config: APIConfig | null;
}

const APIContext = createContext<APIContextType | undefined>(undefined);

interface APIProviderProps {
  children: React.ReactNode;
}

/**
 * Provider for API configuration management
 * Handles loading, saving, and clearing API credentials
 */
export function APIProvider({ children }: APIProviderProps) {
  const [config, setConfig] = useState<APIConfig | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Load API config from storage on mount
  useEffect(() => {
    const loadConfig = () => {
      if (hasAPIConfig()) {
        const savedConfig = loadAPIConfig();
        if (savedConfig) {
          setConfig(savedConfig);
          initializeAPIClient(savedConfig);
          setIsConfigured(true);
        }
      }
    };

    loadConfig();
  }, []);

  const configure = (newConfig: APIConfig) => {
    saveAPIConfig(newConfig);
    setConfig(newConfig);
    initializeAPIClient(newConfig);
    setIsConfigured(true);
  };

  const clearConfig = () => {
    clearAPIConfig();
    setConfig(null);
    setIsConfigured(false);
  };

  return (
    <APIContext.Provider value={{ isConfigured, configure, clearConfig, config }}>
      {children}
    </APIContext.Provider>
  );
}

/**
 * Hook to access API configuration context
 */
export function useAPI() {
  const context = useContext(APIContext);
  if (context === undefined) {
    throw new Error('useAPI must be used within an APIProvider');
  }
  return context;
}

/**
 * Hook to ensure API is configured before using
 */
export function useRequireAPI() {
  const context = useAPI();

  if (!context.isConfigured) {
    throw new Error('API is not configured');
  }

  return context;
}
