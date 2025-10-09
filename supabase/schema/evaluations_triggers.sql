-- When a Claude report is inserted/updated, set a flag your n8n flow can poll.
CREATE TABLE IF NOT EXISTS council_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text NOT NULL,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Example: after Claude report insert -> raise DeepSeek flag
CREATE OR REPLACE FUNCTION notify_deepseek()
RETURNS trigger AS $$
BEGIN
  INSERT INTO council_flags(flag_name, payload)
  VALUES ('claude_report_complete', jsonb_build_object('evaluation_id', NEW.id, 'path', '/evaluations/claude_investor_report.json'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach this to your 'evaluations' table once created:
-- CREATE TRIGGER trg_eval_after_ins
-- AFTER INSERT ON evaluations
-- FOR EACH ROW EXECUTE FUNCTION notify_deepseek();