-- Allow creators to delete their own questions
CREATE POLICY "Creator can delete question" ON questions
  FOR DELETE USING (auth.uid() = creator_id);

-- Allow deletion of predictions on owned questions
CREATE POLICY "Creator can delete predictions" ON predictions
  FOR DELETE USING (
    auth.uid() = (SELECT creator_id FROM questions WHERE id = question_id)
    OR auth.uid() = user_id
  );
