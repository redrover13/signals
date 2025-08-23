#!/usr/bin/env node

/**
 * UTF-8 Encoding Validation Script
 * Validates that all source files use proper UTF-8 encoding
 * and Vietnamese characters display correctly
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SUPPORTED_EXTENSIONS = ['.ts', '.js', '.json', '.md', '.txt', '.yml', '.yaml'];
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.nx',
  'dist',
  'coverage',
  '.pnpm-store',
  'tmp'
];

/**
 * Test Vietnamese characters for proper UTF-8 encoding
 */
const VIETNAMESE_TEST_CHARS = [
  'á', 'à', 'ả', 'ã', 'ạ',  // a with tones
  'ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ',  // a with breve
  'â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ',  // a with circumflex
  'đ',  // d with stroke
  'é', 'è', 'ẻ', 'ẽ', 'ẹ',  // e with tones
  'ê', 'ế', 'ề', 'ể', 'ễ', 'ệ',  // e with circumflex
  'í', 'ì', 'ỉ', 'ĩ', 'ị',  // i with tones
  'ó', 'ò', 'ỏ', 'õ', 'ọ',  // o with tones
  'ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ',  // o with circumflex
  'ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ',  // o with horn
  'ú', 'ù', 'ủ', 'ũ', 'ụ',  // u with tones
  'ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự',  // u with horn
  'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ'   // y with tones
];

/**
 * Test emojis for proper UTF-8 encoding
 */
const EMOJI_TEST_CHARS = [
  '✅', '❌', '⚠️', '🚀', '🎉', '📊', '🏥', '💭', '🔀', '🔄'
];

/**
 * Check if a file path should be ignored
 */
function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

/**
 * Check if a file has a supported extension
 */
function hasSupportedExtension(filePath) {
  return SUPPORTED_EXTENSIONS.includes(extname(filePath));
}

/**
 * Validate UTF-8 encoding of file content
 */
function validateFileEncoding(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    
    // Check for UTF-8 replacement characters (\uFFFD)
    const replacementChar = '\uFFFD';
    if (content.includes(replacementChar)) {
      return {
        valid: false,
        error: 'Contains UTF-8 replacement characters (\uFFFD) - possible encoding corruption'
      };
    }

    // Check for proper encoding of Vietnamese characters if present
    for (const char of VIETNAMESE_TEST_CHARS) {
      if (content.includes(char)) {
        // Try to re-encode the character to verify it's valid UTF-8
        try {
          const buffer = Buffer.from(char, 'utf8');
          const decoded = buffer.toString('utf8');
          if (decoded !== char) {
            return {
              valid: false,
              error: `Vietnamese character '${char}' encoding validation failed`
            };
          }
        } catch (e) {
          return {
            valid: false,
            error: `Vietnamese character '${char}' encoding error: ${e.message}`
          };
        }
      }
    }

    // Check for proper encoding of emojis if present
    for (const emoji of EMOJI_TEST_CHARS) {
      if (content.includes(emoji)) {
        try {
          const buffer = Buffer.from(emoji, 'utf8');
          const decoded = buffer.toString('utf8');
          if (decoded !== emoji) {
            return {
              valid: false,
              error: `Emoji '${emoji}' encoding validation failed`
            };
          }
        } catch (e) {
          return {
            valid: false,
            error: `Emoji '${emoji}' encoding error: ${e.message}`
          };
        }
      }
    }

    return { valid: true };
  } catch (error) {
    if (error.code === 'EISDIR') {
      return { valid: true }; // Skip directories
    }
    return {
      valid: false,
      error: `Failed to read file: ${error.message}`
    };
  }
}

/**
 * Recursively walk directory and validate all files
 */
function walkDirectory(dirPath, results = { valid: [], invalid: [] }) {
  try {
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = join(dirPath, item);
      
      if (shouldIgnoreFile(fullPath)) {
        continue;
      }
      
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDirectory(fullPath, results);
      } else if (hasSupportedExtension(fullPath)) {
        const validation = validateFileEncoding(fullPath);
        
        if (validation.valid) {
          results.valid.push(fullPath);
        } else {
          results.invalid.push({
            path: fullPath,
            error: validation.error
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error walking directory ${dirPath}:`, error.message);
  }
  
  return results;
}

/**
 * Main validation function
 */
function validateEncoding(rootPath = '.') {
  console.log('🔍 Starting UTF-8 encoding validation...\n');
  
  // Test Vietnamese character support
  console.log('Testing Vietnamese character support:');
  for (const char of VIETNAMESE_TEST_CHARS.slice(0, 5)) { // Test first 5 characters
    try {
      const buffer = Buffer.from(char, 'utf8');
      const decoded = buffer.toString('utf8');
      console.log(`  ${char} → ${decoded === char ? '✅' : '❌'}`);
    } catch (e) {
      console.log(`  ${char} → ❌ (${e.message})`);
    }
  }
  
  console.log('\nTesting emoji support:');
  for (const emoji of EMOJI_TEST_CHARS.slice(0, 5)) { // Test first 5 emojis
    try {
      const buffer = Buffer.from(emoji, 'utf8');
      const decoded = buffer.toString('utf8');
      console.log(`  ${emoji} → ${decoded === emoji ? '✅' : '❌'}`);
    } catch (e) {
      console.log(`  ${emoji} → ❌ (${e.message})`);
    }
  }
  
  console.log('\n📁 Validating files...');
  const results = walkDirectory(rootPath);
  
  console.log(`\n📊 Validation Results:`);
  console.log(`  ✅ Valid files: ${results.valid.length}`);
  console.log(`  ❌ Invalid files: ${results.invalid.length}`);
  
  if (results.invalid.length > 0) {
    console.log('\n❌ Files with encoding issues:');
    for (const invalid of results.invalid) {
      console.log(`  - ${invalid.path}: ${invalid.error}`);
    }
    
    console.log('\n💡 To fix encoding issues:');
    console.log('  1. Open files in a UTF-8 capable editor');
    console.log('  2. Save with UTF-8 encoding');
    console.log('  3. Ensure .editorconfig specifies charset = utf-8');
    
    process.exit(1);
  } else {
    console.log('\n🎉 All files pass UTF-8 validation!');
    process.exit(0);
  }
}

// Run validation if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateEncoding(process.argv[2] || '.');
}

export { validateEncoding, validateFileEncoding, VIETNAMESE_TEST_CHARS, EMOJI_TEST_CHARS };