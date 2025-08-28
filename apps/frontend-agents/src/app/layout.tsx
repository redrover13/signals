/**
 * @fileoverview layout module for the app component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import type { Metadata } from 'next';
import './global.css';

// Temporarily removed metadata due to Next.js 15 compatibility issue
// export const metadata: Metadata = {
//   title: 'Dulce de Saigon Agent Platform',
//   description: 'AI-Powered F&B Data Platform Agents',
//   keywords: ['AI', 'agents', 'F&B', 'data platform', 'BigQuery', 'Gemini'],
//   authors: [{ name: 'Dulce de Saigon Engineering' }],
//   viewport: 'width=device-width, initial-scale=1',
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
