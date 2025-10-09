# E2E Smoke Test (Hotel + Healthcare)

## 3.1 Test Avoid-Terms Rejection

```sql
-- Manually insert bad caption to test validation
INSERT INTO post_templates (
  brand_id, platform, content_type,
  option_1, option_1_valid,
  option_2, option_2_valid,
  option_3, option_3_valid
) VALUES (
  'test-hotel-smoke-001',
  'instagram',
  'test_negative',
  '{"headline": "Cheap weekend deals!", "body": "Budget rates", "cta": "Book now", "hashtags": []}'::jsonb,
  false,
  '{"headline": "Amazing discount", "body": "Bargain prices", "cta": "Save big", "hashtags": []}'::jsonb,
  false,
  '{"headline": "Basic rooms available", "body": "Affordable luxury", "cta": "Reserve", "hashtags": []}'::jsonb,
  false
);
```

## Cleanup

```sql
DELETE FROM content_queue WHERE brand_id IN ('test-hotel-smoke-001', 'test-health-smoke-002');
DELETE FROM assets WHERE brand_id IN ('test-hotel-smoke-001', 'test-health-smoke-002');
DELETE FROM post_templates WHERE brand_id IN ('test-hotel-smoke-001', 'test-health-smoke-002');
DELETE FROM brand_profiles WHERE id IN ('test-hotel-smoke-001', 'test-health-smoke-002');
```
