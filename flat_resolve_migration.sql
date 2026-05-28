-- Update resolve function to flat points (no odds)
CREATE OR REPLACE FUNCTION resolve_question(q_id UUID, correct_opt TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE questions
  SET correct_option = correct_opt, is_resolved = TRUE
  WHERE id = q_id AND creator_id = auth.uid();

  UPDATE predictions
  SET points_result = CASE
    WHEN selected_option = correct_opt THEN stake
    ELSE -stake
  END
  WHERE question_id = q_id;

  UPDATE profiles p
  SET total_points = total_points + pr.points_result
  FROM predictions pr
  WHERE pr.question_id = q_id AND pr.user_id = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
