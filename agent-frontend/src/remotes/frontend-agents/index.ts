/**
 * @fileoverview Mock remote entry for frontend-agents
 *
 * This file serves as a mock entry point for the frontend-agents federated module.
 * It exports a mock AgentInterface component that can be used during development
 * and building when the actual federated module is not available.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Re-export the mock component
export { default as AgentInterface } from '../../app/mocks/AgentInterface';
