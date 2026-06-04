DROP POLICY IF EXISTS realtime_authenticated_only ON realtime.messages;
DROP POLICY IF EXISTS realtime_user_scoped_topics ON realtime.messages;

CREATE POLICY realtime_user_scoped_topics ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() IS NOT NULL
    AND (auth.uid()::text) = ANY (string_to_array(realtime.topic(), ':'))
  );