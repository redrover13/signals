/**
 * @fileoverview Frontend Agents Fallback Component
 *
 * This component serves as a fallback when the remote frontend-agents module
 * cannot be loaded. It provides a graceful degradation experience.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import React from 'react';
import styles from './fallbacks.module.css';

interface FrontendAgentsFallbackProps {
  error?: Error;
}

/**
 * Fallback component for frontend-agents remote module
 */
const FrontendAgentsFallback: React.FC<FrontendAgentsFallbackProps> = ({ error }) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    // Force reload of the remote module
    window.location.reload();
  };

  return (
    <div className={styles['fallbackContainer']}>
      <div className={styles['fallbackContent']}>
        <h2 className={styles['fallbackTitle']}>Agent Module Unavailable</h2>
        <p className={styles['fallbackMessage']}>
          The agent module could not be loaded. This might be due to network issues or the service
          being temporarily unavailable.
        </p>
        {error && (
          <div className={styles['errorDetails']}>
            <p className={styles['errorMessage']}>{error.message}</p>
          </div>
        )}
        <button
          className={styles['retryButton']}
          onClick={handleRetry}
          disabled={isRetrying}
          aria-label="Retry loading the agent module"
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    </div>
  );
};

export default FrontendAgentsFallback;
