/**
 * @fileoverview content-agent module for Content Management
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for content management, media processing, and content distribution.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { Storage } from '@google-cloud/storage';

export interface ContentConfig {
  bucketName?: string;
  projectId?: string;
  cdnUrl?: string;
}

export interface ContentItem {
  id: string;
  type: 'image' | 'video' | 'document' | 'menu' | 'banner';
  title: string;
  description?: string;
  url: string;
  metadata: Record<string, any>;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  restaurantId?: string;
}

export interface ContentResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  contentUrl?: string;
}

export interface MenuContent {
  restaurantId: string;
  sections: MenuSection[];
  lastUpdated: string;
  version: string;
}

export interface MenuSection {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
  order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  allergens: string[];
  dietaryInfo: string[];
  availability: boolean;
  preparationTime?: number;
}

/**
 * Content Agent for managing restaurant content, menus, and media
 */
export class ContentAgent {
  private storage: Storage;
  private config: ContentConfig;

  constructor(config: ContentConfig = {}) {
    this.config = {
      bucketName: 'dulce-content-bucket',
      ...config
    };
    
    this.storage = new Storage({
      projectId: config.projectId
    });
  }

  /**
   * Upload content to Google Cloud Storage
   */
  async uploadContent(
    fileName: string, 
    content: Buffer | string, 
    metadata: Record<string, any> = {}
  ): Promise<ContentResult<{ url: string; fileId: string }>> {
    try {
      const bucket = this.storage.bucket(this.config.bucketName!);
      const file = bucket.file(fileName);
      
      const stream = file.createWriteStream({
        metadata: {
          contentType: this.getContentType(fileName),
          metadata: metadata
        },
        public: true
      });

      return new Promise((resolve) => {
        stream.on('error', (error) => {
          resolve({
            success: false,
            error: error.message
          });
        });

        stream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${this.config.bucketName}/${fileName}`;
          resolve({
            success: true,
            data: {
              url: publicUrl,
              fileId: fileName
            },
            contentUrl: publicUrl
          });
        });

        if (Buffer.isBuffer(content)) {
          stream.end(content);
        } else {
          stream.end(Buffer.from(content));
        }
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate menu content for a restaurant
   */
  async generateMenu(restaurantId: string, menuData: Omit<MenuContent, 'lastUpdated' | 'version'>): Promise<ContentResult<MenuContent>> {
    try {
      const menu: MenuContent = {
        ...menuData,
        restaurantId,
        lastUpdated: new Date().toISOString(),
        version: `v${Date.now()}`
      };

      // Upload menu as JSON
      const menuJson = JSON.stringify(menu, null, 2);
      const fileName = `menus/${restaurantId}/menu-${menu.version}.json`;
      
      const uploadResult = await this.uploadContent(fileName, menuJson, {
        restaurantId,
        contentType: 'menu',
        version: menu.version
      });

      if (!uploadResult.success) {
        return uploadResult;
      }

      return {
        success: true,
        data: menu,
        contentUrl: uploadResult.contentUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate Vietnamese food content with localization
   */
  async generateVietnameseContent(item: {
    name: string;
    description: string;
    ingredients: string[];
    preparationMethod: string;
  }): Promise<ContentResult<{
    vietnamese: any;
    english: any;
    contentId: string;
  }>> {
    try {
      const contentId = `vn-content-${Date.now()}`;
      
      const vietnameseContent = {
        tên: item.name,
        mô_tả: item.description,
        nguyên_liệu: item.ingredients,
        cách_chế_biến: item.preparationMethod,
        ngôn_ngữ: 'vi-VN'
      };

      const englishContent = {
        name: item.name,
        description: item.description,
        ingredients: item.ingredients,
        preparation_method: item.preparationMethod,
        language: 'en-US'
      };

      const content = {
        id: contentId,
        vietnamese: vietnameseContent,
        english: englishContent,
        createdAt: new Date().toISOString()
      };

      const fileName = `content/vietnamese/${contentId}.json`;
      const uploadResult = await this.uploadContent(fileName, JSON.stringify(content, null, 2), {
        contentType: 'vietnamese-food',
        language: 'vi-VN'
      });

      return {
        success: true,
        data: {
          vietnamese: vietnameseContent,
          english: englishContent,
          contentId
        },
        contentUrl: uploadResult.contentUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process and optimize images
   */
  async processImage(
    imageBuffer: Buffer, 
    fileName: string,
    options: {
      resize?: { width: number; height: number };
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<ContentResult<{ url: string; sizes: Record<string, string> }>> {
    try {
      // Upload original image
      const originalResult = await this.uploadContent(fileName, imageBuffer, {
        contentType: 'image',
        processing: 'original'
      });

      if (!originalResult.success) {
        return originalResult;
      }

      // For demo purposes, we'll just return the original URL
      // In a real implementation, you'd use image processing libraries like Sharp
      const sizes = {
        original: originalResult.contentUrl!,
        thumbnail: originalResult.contentUrl!, // Would be processed
        medium: originalResult.contentUrl!,    // Would be processed
        large: originalResult.contentUrl!      // Would be processed
      };

      return {
        success: true,
        data: {
          url: originalResult.contentUrl!,
          sizes
        },
        contentUrl: originalResult.contentUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create promotional banner content
   */
  async createPromoBanner(promoData: {
    title: string;
    description: string;
    restaurantId: string;
    discount?: number;
    validUntil: string;
    imageUrl?: string;
  }): Promise<ContentResult<ContentItem>> {
    try {
      const bannerId = `promo-${Date.now()}`;
      const banner: ContentItem = {
        id: bannerId,
        type: 'banner',
        title: promoData.title,
        description: promoData.description,
        url: promoData.imageUrl || '',
        metadata: {
          discount: promoData.discount,
          validUntil: promoData.validUntil,
          restaurantId: promoData.restaurantId
        },
        tags: ['promotion', 'banner', 'marketing'],
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        restaurantId: promoData.restaurantId
      };

      // Save banner data
      const fileName = `banners/${promoData.restaurantId}/${bannerId}.json`;
      const uploadResult = await this.uploadContent(fileName, JSON.stringify(banner, null, 2), {
        contentType: 'promotional-banner'
      });

      return {
        success: true,
        data: banner,
        contentUrl: uploadResult.contentUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get content list by type and restaurant
   */
  async getContentList(filters: {
    type?: string;
    restaurantId?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<ContentResult<ContentItem[]>> {
    try {
      // This would typically query a database
      // For demo purposes, we'll return mock data
      const mockContent: ContentItem[] = [
        {
          id: 'content-1',
          type: 'menu',
          title: 'Vietnamese Spring Menu',
          description: 'Fresh spring menu featuring Vietnamese specialties',
          url: `https://storage.googleapis.com/${this.config.bucketName}/menus/restaurant-1/menu-v1.json`,
          metadata: { season: 'spring', year: 2025 },
          tags: ['vietnamese', 'spring', 'menu'],
          status: 'published',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          restaurantId: filters.restaurantId || 'restaurant-1'
        }
      ];

      return {
        success: true,
        data: mockContent
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete content
   */
  async deleteContent(fileName: string): Promise<ContentResult<{ deleted: boolean }>> {
    try {
      const bucket = this.storage.bucket(this.config.bucketName!);
      const file = bucket.file(fileName);
      
      await file.delete();
      
      return {
        success: true,
        data: { deleted: true }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Helper method to determine content type
   */
  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'pdf':
        return 'application/pdf';
      case 'json':
        return 'application/json';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }
}

// Export legacy function for backwards compatibility
export function contentAgent(): string {
  return 'content-agent';
}
