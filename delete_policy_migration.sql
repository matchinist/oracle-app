-- Allow question creator to delete their questions
CREATE POLICY "Creator can delete question" ON questions
  FOR DELETE USING (auth.uid() = creator_id);

-- Allow question creator to delete predictions on their questions
CREATE POLICY "Creator can delete predictions" ON predictions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM questions
      WHERE questions.id = predictions.question_id
      AND questions.creator_id = auth.uid()
    )
  );
