/**
 * @fileoverview index.d module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

export declare function ensureTopic(name: string): Promise<boolean>;
export declare function getPubSub(): {
  topic: (name: string) => {
    publishMessage: (msg: any) => Promise<{ messageId: string; name: string }>;
  };
};
