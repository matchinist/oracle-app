-- Add odds columns to questions
ALTER TABLE questions ADD COLUMN odds_a NUMERIC(5,2) DEFAULT 1.0;
ALTER TABLE questions ADD COLUMN odds_b NUMERIC(5,2) DEFAULT 1.0;

-- Update resolve_question to apply odds multiplier on wins
CREATE OR REPLACE FUNCTION resolve_question(q_id UUID, correct_opt TEXT)
RETURNS VOID AS $$
DECLARE
  q_odds_a NUMERIC;
  q_odds_b NUMERIC;
BEGIN
  SELECT odds_a, odds_b INTO q_odds_a, q_odds_b FROM questions WHERE id = q_id;

  UPDATE questions
  SET correct_option = correct_opt, is_resolved = TRUE
  WHERE id = q_id AND creator_id = auth.uid();

  UPDATE predictions
  SET points_result = CASE
    WHEN selected_option = correct_opt THEN
      ROUND(stake * CASE WHEN correct_opt = 'a' THEN q_odds_a ELSE q_odds_b END)
    ELSE -stake
  END
  WHERE question_id = q_id;

  UPDATE profiles p
  SET total_points = total_points + pr.points_result
  FROM predictions pr
  WHERE pr.question_id = q_id AND pr.user_id = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
