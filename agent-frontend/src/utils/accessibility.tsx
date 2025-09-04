/**
 * @fileoverview Accessibility utilities
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains utilities for enhancing application accessibility.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { useEffect, useRef } from 'react';

/**
 * Hook to trap focus within a component (for modals, dialogs, etc.)
 * @param active - Whether the focus trap is active
 * @returns Ref to attach to the container element
 */
export const useFocusTrap = (active = true) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        container.dispatchEvent(new CustomEvent('escapeFocusTrap'));
      }
    };

    // Focus the first element when trap becomes active
    firstElement?.focus();

    // Add event listeners
    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [active]);

  return containerRef;
};

/**
 * Hook to announce messages to screen readers
 * @returns A function to announce messages
 */
export const useAnnounce = () => {
  const announceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create the announce element if it doesn't exist
    if (!announceRef.current) {
      const el = document.createElement('div');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      el.style.position = 'absolute';
      el.style.width = '1px';
      el.style.height = '1px';
      el.style.padding = '0';
      el.style.overflow = 'hidden';
      el.style.clip = 'rect(0, 0, 0, 0)';
      el.style.whiteSpace = 'nowrap';
      el.style.border = '0';
      document.body.appendChild(el);
      announceRef.current = el;
    }

    return () => {
      if (announceRef.current) {
        document.body.removeChild(announceRef.current);
        announceRef.current = null;
      }
    };
  }, []);

  return (message: string, assertive = false) => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
      announceRef.current.textContent = message;
    }
  };
};

/**
 * Props for the SkipLink component
 */
interface SkipLinkProps {
  target: string;
  label?: string;
  className?: string;
}

/**
 * Skip link component for keyboard navigation
 * @param props - Component props
 * @returns Skip link component
 */
export const SkipLink = ({ target, label = 'Skip to content', className = '' }: SkipLinkProps) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetElement = document.querySelector(target);
    if (targetElement) {
      (targetElement as HTMLElement).focus();
      (targetElement as HTMLElement).setAttribute('tabindex', '-1');

      // Remove tabindex after blur to maintain DOM cleanliness
      targetElement.addEventListener(
        'blur',
        () => {
          (targetElement as HTMLElement).removeAttribute('tabindex');
        },
        { once: true },
      );
    }
  };

  return (
    <a href={target} className={`skip-link ${className}`} onClick={handleClick}>
      {label}
    </a>
  );
};

/**
 * Check if an element has sufficient color contrast
 * @param foreground - Foreground color in hexadecimal format
 * @param background - Background color in hexadecimal format
 * @param isLargeText - Whether the text is large (14pt bold or 18pt regular)
 * @returns Whether the contrast ratio meets WCAG AA standards
 */
export const hasValidContrast = (
  foreground: string,
  background: string,
  isLargeText = false,
): boolean => {
  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);

    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const calculateLuminance = (rgb: { r: number; g: number; b: number }) => {
    const sRGB = {
      r: rgb.r / 255,
      g: rgb.g / 255,
      b: rgb.b / 255,
    };

    const transformChannel = (channel: number) =>
      channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);

    return (
      0.2126 * transformChannel(sRGB.r) +
      0.7152 * transformChannel(sRGB.g) +
      0.0722 * transformChannel(sRGB.b)
    );
  };

  const fgLuminance = calculateLuminance(hexToRgb(foreground));
  const bgLuminance = calculateLuminance(hexToRgb(background));

  const ratio =
    (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);

  // WCAG AA requires 4.5:1 for normal text and 3:1 for large text
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
};
