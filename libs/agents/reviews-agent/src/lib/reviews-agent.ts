/**
 * @fileoverview reviews-agent module for Review Processing and Sentiment Analysis
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for review analysis, sentiment processing, and customer feedback management.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ReviewsConfig {
  geminiApiKey?: string;
  sentimentApiUrl?: string;
  timeout?: number;
}

export interface Review {
  id: string;
  restaurantId: string;
  customerId: string;
  rating: number; // 1-5 stars
  title?: string;
  content: string;
  language: string;
  createdAt: string;
  platform: 'google' | 'yelp' | 'facebook' | 'internal' | 'tripadvisor';
  verified: boolean;
  helpfulVotes?: number;
  response?: RestaurantResponse;
}

export interface RestaurantResponse {
  content: string;
  createdAt: string;
  respondedBy: string;
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: {
    joy: number;
    anger: number;
    sadness: number;
    fear: number;
    surprise: number;
  };
  topics: string[];
}

export interface ReviewInsights {
  totalReviews: number;
  averageRating: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  commonTopics: Array<{
    topic: string;
    count: number;
    sentiment: number;
  }>;
  trendingIssues: string[];
  recommendations: string[];
}

export interface ReviewsResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Reviews Agent for processing customer reviews and sentiment analysis
 */
export class ReviewsAgent {
  private _config: ReviewsConfig;
  private genAI?: GoogleGenerativeAI;

  constructor(config: ReviewsConfig = {}) {
    this._config = {
      timeout: 30000,
      ...config
    };
    
    // Initialize the Gemini AI client if API key is provided
    if (config.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    }
  }

  /**
   * Analyze sentiment of a single review
   */
  async analyzeSentiment(review: Review): Promise<ReviewsResult<SentimentAnalysis>> {
    try {
      if (!this.genAI) {
        // Fallback to simple sentiment analysis
        return this.simpleSentimentAnalysis(review.content);
      }

      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { maxOutputTokens: 1024 },
        safetySettings: [],
      });
      
      const prompt = `
        Analyze the sentiment of this restaurant review and provide a detailed analysis:
        
        Review: "${review.content}"
        Rating: ${review.rating}/5 stars
        
        Please provide:
        1. Overall sentiment score (-1 to 1)
        2. Sentiment magnitude (0 to 1)
        3. Sentiment label (positive/negative/neutral)
        4. Confidence score (0 to 1)
        5. Emotion breakdown (joy, anger, sadness, fear, surprise) as percentages
        6. Key topics mentioned
        
        Respond in JSON format only.
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      try {
        const analysis = JSON.parse(response);
        return {
          success: true,
          data: {
            score: analysis.sentiment_score || 0,
            magnitude: analysis.magnitude || 0,
            label: analysis.label || 'neutral',
            confidence: analysis.confidence || 0,
            emotions: analysis.emotions || {
              joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0
            },
            topics: analysis.topics || []
          }
        };
      } catch (parseError) {
        return this.simpleSentimentAnalysis(review.content);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Simple sentiment analysis fallback
   */
  private simpleSentimentAnalysis(content: string): Promise<ReviewsResult<SentimentAnalysis>> {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'delicious', 'wonderful', 'fantastic', 'love', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'worst', 'disappointing'];
    
    const words = content.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    const totalSentimentWords = positiveCount + negativeCount;
    let score = 0;
    let label: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    if (totalSentimentWords > 0) {
      score = (positiveCount - negativeCount) / totalSentimentWords;
      label = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral';
    }
    
    return {
      data: {
        score,
        label,
        magnitude: Math.abs(score)
      }
    };

    return {
      success: true,
      data: {
        score,
        magnitude: Math.abs(score),
        label,
        confidence: Math.min(totalSentimentWords / 10, 1),
        emotions: {
          joy: label === 'positive' ? 0.7 : 0.2,
          anger: label === 'negative' ? 0.6 : 0.1,
          sadness: label === 'negative' ? 0.4 : 0.1,
          fear: 0.1,
          surprise: 0.2
        },
        topics: this.extractTopics(content)
      }
    };
  }

  /**
   * Extract topics from review content
   */
  private extractTopics(content: string): string[] {
    const foodTerms = ['food', 'dish', 'meal', 'taste', 'flavor', 'spicy', 'sweet', 'pho', 'banh mi', 'spring rolls'];
    const serviceTerms = ['service', 'staff', 'waiter', 'waitress', 'server', 'manager', 'friendly', 'rude'];
    const atmosphereTerms = ['atmosphere', 'ambiance', 'music', 'noisy', 'quiet', 'decoration', 'seating'];
    const valueTerms = ['price', 'expensive', 'cheap', 'value', 'worth', 'overpriced'];
    
    const topics: string[] = [];
    const lowerContent = content.toLowerCase();
    
    if (foodTerms.some(term => lowerContent.includes(term))) topics.push('food');
    if (serviceTerms.some(term => lowerContent.includes(term))) topics.push('service');
    if (atmosphereTerms.some(term => lowerContent.includes(term))) topics.push('atmosphere');
    if (valueTerms.some(term => lowerContent.includes(term))) topics.push('value');
    
    return topics;
  }

  /**
   * Process reviews in batch
   */
  async processReviewsBatch(reviews: Review[]): Promise<ReviewsResult<Array<{ review: Review; sentiment: SentimentAnalysis }>>> {
    try {
      const results = await Promise.all(
        reviews.map(async (review) => {
          const sentimentResult = await this.analyzeSentiment(review);
          return {
            review,
            sentiment: sentimentResult.data!
          };
        })
      );

      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate insights from multiple reviews
   */
  async generateInsights(reviews: Review[]): Promise<ReviewsResult<ReviewInsights>> {
    try {
      const processedResults = await this.processReviewsBatch(reviews);
      if (!processedResults.success || !processedResults.data) {
        return {
          success: false,
          error: processedResults.error || 'Failed to process reviews'
        };
      }

      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
      
      // Sentiment distribution
      const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
      const topicCounts: Record<string, { count: number; totalSentiment: number }> = {};
      
      processedResults.data.forEach(({ sentiment }) => {
        sentimentCounts[sentiment.label]++;
        
        sentiment.topics.forEach(topic => {
          if (!topicCounts[topic]) {
            topicCounts[topic] = { count: 0, totalSentiment: 0 };
          }
          topicCounts[topic].count++;
          topicCounts[topic].totalSentiment += sentiment.score;
        });
      });

      const commonTopics = Object.entries(topicCounts)
        .map(([topic, data]) => ({
          topic,
          count: data.count,
          sentiment: data.totalSentiment / data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const trendingIssues = commonTopics
        .filter(topic => topic.sentiment < -0.2 && topic.count >= 3)
        .map(topic => topic.topic);

      const recommendations = this.generateRecommendations(commonTopics, averageRating);

      const insights: ReviewInsights = {
        totalReviews,
        averageRating,
        sentimentDistribution: {
          positive: (sentimentCounts.positive / totalReviews) * 100,
          neutral: (sentimentCounts.neutral / totalReviews) * 100,
          negative: (sentimentCounts.negative / totalReviews) * 100
        },
        commonTopics,
        trendingIssues,
        recommendations
      };

      return {
        success: true,
        data: insights
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate recommendations based on review analysis
   */
  private generateRecommendations(topics: Array<{ topic: string; sentiment: number; count: number }>, averageRating: number): string[] {
    const recommendations: string[] = [];

    if (averageRating < 3.5) {
      recommendations.push('Overall rating is below average. Focus on improving key areas identified in reviews.');
    }

    topics.forEach(topic => {
      if (topic.sentiment < -0.3 && topic.count >= 3) {
        switch (topic.topic) {
          case 'food':
            recommendations.push('Food quality needs improvement. Consider menu review and chef training.');
            break;
          case 'service':
            recommendations.push('Service issues detected. Staff training and customer service protocols needed.');
            break;
          case 'atmosphere':
            recommendations.push('Atmosphere concerns noted. Consider interior improvements and noise level management.');
            break;
          case 'value':
            recommendations.push('Price concerns raised. Review pricing strategy and value proposition.');
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Reviews are generally positive. Continue maintaining current standards.');
    }

    return recommendations;
  }

  /**
   * Generate Vietnamese-specific review analysis
   */
  async analyzeVietnameseReviews(reviews: Review[]): Promise<ReviewsResult<{
    vietnameseTermAnalysis: Record<string, number>;
    authenticityScore: number;
    recommendedDishes: string[];
  }>> {
    try {
      const vietnameseTerms = [
        'phở', 'bánh mì', 'chả cá', 'bún bò huế', 'cơm tấm', 'gỏi cuốn', 'bánh xèo',
        'authentic', 'traditional', 'homemade', 'fresh', 'herbs', 'fish sauce', 'nuoc mam'
      ];

      const termCounts: Record<string, number> = {};
      let authenticityMentions = 0;
      const dishMentions: Record<string, number> = {};

      reviews.forEach(review => {
        const content = review.content.toLowerCase();
        
        vietnameseTerms.forEach(term => {
          const count = (content.match(new RegExp(term.toLowerCase(), 'g')) || []).length;
          if (count > 0) {
            termCounts[term] = (termCounts[term] || 0) + count;
            
            if (['authentic', 'traditional', 'homemade'].includes(term)) {
              authenticityMentions += count;
            }
            
            if (['phở', 'bánh mì', 'chả cá', 'bún bò huế', 'cơm tấm', 'gỏi cuốn', 'bánh xèo'].includes(term)) {
              dishMentions[term] = (dishMentions[term] || 0) + count;
            }
          }
        });
      });

      const authenticityScore = Math.min(authenticityMentions / reviews.length, 1);
      const recommendedDishes = Object.entries(dishMentions)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([dish]) => dish);

      return {
        success: true,
        data: {
          vietnameseTermAnalysis: termCounts,
          authenticityScore,
          recommendedDishes
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate automated response suggestions
   */
  async generateResponseSuggestion(review: Review): Promise<ReviewsResult<{ suggestion: string; tone: string }>> {
    try {
      const sentimentResult = await this.analyzeSentiment(review);
      if (!sentimentResult.success) {
        return {
          success: false,
          error: sentimentResult.error || 'Failed to analyze sentiment'
        };
      }

      const sentiment = sentimentResult.data!;
      let suggestion = '';
      let tone = '';

      if (sentiment.label === 'positive') {
        tone = 'grateful';
        suggestion = `Thank you so much for your wonderful review! We're delighted to hear you enjoyed your experience with us. Your kind words mean a lot to our team, and we look forward to welcoming you back soon.`;
      } else if (sentiment.label === 'negative') {
        tone = 'apologetic';
        suggestion = `We sincerely apologize for not meeting your expectations during your visit. Your feedback is valuable to us, and we would like the opportunity to make things right. Please contact us directly so we can address your concerns and improve your experience.`;
      } else {
        tone = 'friendly';
        suggestion = `Thank you for taking the time to share your feedback. We appreciate all reviews as they help us continue to improve our service and offerings. We hope to see you again soon!`;
      }

      return {
        success: true,
        data: {
          suggestion,
          tone
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Monitor review trends over time
   */
  async trackReviewTrends(reviews: Review[], timeframe: 'daily' | 'weekly' | 'monthly'): Promise<ReviewsResult<{
    trends: Array<{
      period: string;
      averageRating: number;
      reviewCount: number;
      sentimentScore: number;
    }>;
    insights: string[];
  }>> {
    try {
      const groupedReviews: Record<string, Review[]> = {};
      
      reviews.forEach(review => {
        const date = new Date(review.createdAt);
        let period = '';
        
        switch (timeframe) {
          case 'daily':
            period = date.toISOString().split('T')[0] || '';
            break;
          case 'weekly':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            period = weekStart.toISOString().split('T')[0] || '';
            break;
          case 'monthly':
            period = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            break;
        }
        
        if (!period) {
          period = 'unknown';
        }
        
        if (!groupedReviews[period]) {
          groupedReviews[period] = [];
        }
        groupedReviews[period]?.push(review);
      });

      const trends = await Promise.all(
        Object.entries(groupedReviews).map(async ([period, periodReviews]) => {
          const averageRating = periodReviews.reduce((sum, r) => sum + r.rating, 0) / periodReviews.length;
          
          const sentimentResults = await Promise.all(
            periodReviews.map(r => this.analyzeSentiment(r))
          );
          
          const avgSentiment = sentimentResults
            .filter(r => r.success)
            .reduce((sum, r) => sum + r.data!.score, 0) / sentimentResults.length;

          return {
            period,
            averageRating,
            reviewCount: periodReviews.length,
            sentimentScore: avgSentiment
          };
        })
      );

      trends.sort((a, b) => a.period.localeCompare(b.period));

      const insights = this.generateTrendInsights(trends);

      return {
        success: true,
        data: {
          trends,
          insights
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate insights from trend data
   */
  private generateTrendInsights(trends: Array<{ period: string; averageRating: number; reviewCount: number; sentimentScore: number }>): string[] {
    const insights: string[] = [];
    
    if (trends.length < 2) {
      return ['Insufficient data for trend analysis'];
    }

    const latest = trends[trends.length - 1];
    const previous = trends[trends.length - 2];
    
    if (!latest || !previous) {
      return ['Incomplete trend data available'];
    }

    // Rating trend
    const ratingChange = latest.averageRating - previous.averageRating;
    if (Math.abs(ratingChange) > 0.2) {
      insights.push(
        ratingChange > 0 
          ? `Average rating improved by ${ratingChange.toFixed(1)} stars`
          : `Average rating declined by ${Math.abs(ratingChange).toFixed(1)} stars`
      );
    }

    // Volume trend
    const volumeChange = ((latest.reviewCount - previous.reviewCount) / previous.reviewCount) * 100;
    if (Math.abs(volumeChange) > 20) {
      insights.push(
        volumeChange > 0
          ? `Review volume increased by ${volumeChange.toFixed(0)}%`
          : `Review volume decreased by ${Math.abs(volumeChange).toFixed(0)}%`
      );
    }

    // Sentiment trend
    const sentimentChange = latest.sentimentScore - previous.sentimentScore;
    if (Math.abs(sentimentChange) > 0.1) {
      insights.push(
        sentimentChange > 0
          ? 'Customer sentiment is improving'
          : 'Customer sentiment is declining'
      );
    }

    return insights.length > 0 ? insights : ['No significant trends detected'];
  }
}

// Export legacy function for backwards compatibility
export function reviewsAgent(): string {
  return 'reviews-agent';
}
