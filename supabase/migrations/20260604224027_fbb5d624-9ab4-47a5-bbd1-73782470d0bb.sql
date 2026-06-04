DROP POLICY IF EXISTS realtime_authenticated_only ON realtime.messages;
CREATE POLICY realtime_user_scoped_topics ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() IS NULL
    OR position(auth.uid()::text in realtime.topic()) > 0
  );