-- Allow users to update their own unresolved predictions
CREATE POLICY "Users can update own predictions" ON predictions
  FOR UPDATE USING (auth.uid() = user_id AND points_result IS NULL);
