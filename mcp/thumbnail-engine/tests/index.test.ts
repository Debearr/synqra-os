/**
 * Tests for Thumbnail Engine MCP
 */

import { ThumbnailEngine } from '../src/index';

describe('Thumbnail Engine MCP', () => {
  let engine: ThumbnailEngine;
  
  beforeAll(() => {
    // Mock environment variables for testing
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-key';
    
    engine = new ThumbnailEngine();
  });
  
  describe('generate()', () => {
    it('should generate YouTube thumbnail blueprint', async () => {
      const response = await engine.generate({
        platform: 'youtube',
        brand: 'synqra',
        title: 'Test Video Title',
        style: 'bold',
      });
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.platform).toBe('youtube');
      expect(response.data?.dimensions.width).toBe(1280);
      expect(response.data?.dimensions.height).toBe(720);
    });
    
    it('should generate Instagram thumbnail blueprint', async () => {
      const response = await engine.generate({
        platform: 'instagram',
        brand: 'noid',
        title: 'Driver Tips',
        style: 'minimal',
      });
      
      expect(response.success).toBe(true);
      expect(response.data?.dimensions.aspectRatio).toBe('1:1');
    });
    
    it('should include brand colors', async () => {
      const response = await engine.generate({
        platform: 'youtube',
        brand: 'aurafx',
        title: 'Trading Signals',
      });
      
      expect(response.success).toBe(true);
      expect(response.data?.colors).toBeDefined();
      expect(response.data?.colors.primary).toBeTruthy();
    });
    
    it('should create proper layout zones', async () => {
      const response = await engine.generate({
        platform: 'youtube',
        brand: 'synqra',
        title: 'Test',
        style: 'split',
      });
      
      expect(response.success).toBe(true);
      expect(response.data?.layout.zones.length).toBeGreaterThan(0);
      expect(response.data?.layout.type).toBe('split');
    });
    
    it('should reject invalid platform', async () => {
      const response = await engine.generate({
        platform: 'invalid' as any,
        brand: 'synqra',
        title: 'Test',
      });
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Unsupported platform');
    });
    
    it('should include metadata', async () => {
      const response = await engine.generate({
        platform: 'youtube',
        brand: 'synqra',
        title: 'Test',
      });
      
      expect(response.success).toBe(true);
      expect(response.data?.metadata.id).toBeTruthy();
      expect(response.data?.metadata.created).toBeTruthy();
      expect(response.metadata?.mcpTool).toBe('thumbnail-engine');
    });
  });
  
  describe('validate()', () => {
    it('should validate file size', async () => {
      const smallFile = Buffer.alloc(1024); // 1KB
      const response = await engine.validate(smallFile, 'youtube');
      
      expect(response.success).toBe(true);
      expect(response.data?.valid).toBe(true);
    });
    
    it('should reject oversized files', async () => {
      const largeFile = Buffer.alloc(5 * 1024 * 1024); // 5MB (too large for YouTube)
      const response = await engine.validate(largeFile, 'youtube');
      
      expect(response.success).toBe(true);
      expect(response.data?.valid).toBe(false);
      expect(response.data?.issues.length).toBeGreaterThan(0);
    });
  });
});
