-- ============================================================
-- SYNQRA CREATIVE ENGINE - CONTENT RECIPES TABLE
-- ============================================================
-- Stores creative recipes for dynamic loading in Synqra UI
-- Run this migration to enable recipe management

-- Create content_recipes table
CREATE TABLE IF NOT EXISTS content_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  prompt TEXT NOT NULL,
  fields JSONB DEFAULT '[]'::jsonb,
  preset_paths JSONB DEFAULT '[]'::jsonb,
  industries JSONB DEFAULT '[]'::jsonb,
  complexity DECIMAL(3, 2) DEFAULT 0.5,
  estimated_cost DECIMAL(10, 6) DEFAULT 0.001,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_recipes_slug 
  ON content_recipes(slug);

CREATE INDEX IF NOT EXISTS idx_content_recipes_category 
  ON content_recipes(category);

CREATE INDEX IF NOT EXISTS idx_content_recipes_is_active 
  ON content_recipes(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_content_recipes_industries 
  ON content_recipes USING GIN (industries);

-- Enable Row Level Security
ALTER TABLE content_recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to active recipes
CREATE POLICY IF NOT EXISTS "Allow public to view active recipes" 
  ON content_recipes
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policy: Allow service role full access
CREATE POLICY IF NOT EXISTS "Allow service role full access to recipes" 
  ON content_recipes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to view all recipes
CREATE POLICY IF NOT EXISTS "Allow authenticated users to view recipes" 
  ON content_recipes
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_content_recipes_updated_at_trigger
  BEFORE UPDATE ON content_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_content_recipes_updated_at();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_recipe_usage(recipe_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE content_recipes
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE slug = recipe_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on function
GRANT EXECUTE ON FUNCTION increment_recipe_usage(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION increment_recipe_usage(TEXT) TO authenticated;

-- Insert default recipes
INSERT INTO content_recipes (slug, title, description, category, prompt, fields, industries, complexity, estimated_cost, version)
VALUES 
(
  'try_on_react_campaign',
  'Try-On & React Campaign',
  'Universal cinematic campaign recipe for product launches, collabs, and drops. Generates 45-second hero script, shot list, captions, and cross-platform variants.',
  'campaigns',
  'See /synqra-mvp/recipes/try_on_react_campaign.md for full prompt',
  '[
    {"key": "BRAND_NAME", "label": "Brand Name", "type": "text", "required": true},
    {"key": "COLLAB_OR_PRODUCT", "label": "Collab Partner / Product", "type": "text", "required": true},
    {"key": "TALENT_TYPE", "label": "Talent", "type": "text", "required": true},
    {"key": "PRIMARY_PLATFORM", "label": "Primary Platform", "type": "select", "required": true, "options": ["TikTok", "Instagram Reels", "YouTube Shorts", "X", "LinkedIn"]},
    {"key": "VIBE", "label": "Vibe / Aesthetic", "type": "textarea", "required": true},
    {"key": "GOAL", "label": "Campaign Goal", "type": "select", "required": true, "options": ["Waitlist signups", "Product drop announcement", "Brand awareness", "Community building"]}
  ]'::jsonb,
  '["automotive", "wellness", "salon", "fashion", "fitness", "hospitality", "real-estate", "creator-economy", "finance", "retail"]'::jsonb,
  0.85,
  0.018,
  '1.0'
),
(
  'voai_lifestyle_model_generator',
  'VO-AI Lifestyle Model Generator',
  'Generate cinematic, aspirational lifestyle visuals for luxury brands. Produces 10-shot packages with AI generation prompts, lighting specs, and color grading.',
  'visuals',
  'See /synqra-mvp/recipes/voai_lifestyle_model_generator.md for full prompt',
  '[
    {"key": "BRAND_NAME", "label": "Brand Name", "type": "text", "required": true},
    {"key": "INDUSTRY", "label": "Industry", "type": "select", "required": true, "options": ["Automotive luxury", "Wellness / Spa", "Salon / Beauty", "Street-lux fashion", "Fitness", "Hospitality", "Real estate", "Tech / Finance"]},
    {"key": "PRODUCT_OR_EXPERIENCE", "label": "Product or Experience", "type": "text", "required": true},
    {"key": "VIBE", "label": "Target Vibe", "type": "textarea", "required": true},
    {"key": "AUDIENCE", "label": "Target Audience", "type": "text", "required": true},
    {"key": "MODEL_ARCHETYPE", "label": "Model Archetype", "type": "select", "required": true, "options": ["The Modern CEO", "The Quiet Luxury Professional", "The Street-Lux Creator", "The Urban Stylist", "The Wellness Athlete"]}
  ]'::jsonb,
  '["automotive", "wellness", "salon", "fashion", "fitness", "hospitality", "real-estate", "tech", "finance"]'::jsonb,
  0.92,
  0.023,
  '2.0'
);

-- Comments for documentation
COMMENT ON TABLE content_recipes IS 'Stores creative recipes for Synqra Creative Engine';
COMMENT ON COLUMN content_recipes.slug IS 'Unique identifier for recipe loading';
COMMENT ON COLUMN content_recipes.prompt IS 'Full prompt template or path to markdown file';
COMMENT ON COLUMN content_recipes.fields IS 'JSON schema of input fields';
COMMENT ON COLUMN content_recipes.preset_paths IS 'Array of paths to preset JSON files';
COMMENT ON COLUMN content_recipes.industries IS 'Array of applicable industries';
COMMENT ON COLUMN content_recipes.complexity IS 'Task complexity score (0-1) for AI Router';
COMMENT ON COLUMN content_recipes.estimated_cost IS 'Estimated cost per generation (USD)';
COMMENT ON COLUMN content_recipes.usage_count IS 'Number of times recipe has been used';

-- Example queries

-- Get all active recipes
-- SELECT slug, title, category, complexity, estimated_cost 
-- FROM content_recipes 
-- WHERE is_active = true 
-- ORDER BY usage_count DESC;

-- Get recipes by industry
-- SELECT slug, title, industries 
-- FROM content_recipes 
-- WHERE industries @> '["automotive"]'::jsonb;

-- Get most used recipes
-- SELECT slug, title, usage_count, last_used_at 
-- FROM content_recipes 
-- WHERE usage_count > 0 
-- ORDER BY usage_count DESC 
-- LIMIT 10;

-- Increment usage for a recipe
-- SELECT increment_recipe_usage('try_on_react_campaign');
