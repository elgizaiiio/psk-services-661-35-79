-- Drop old conflicting RLS policies on user_spin_tickets
DROP POLICY IF EXISTS "Users can insert own tickets" ON user_spin_tickets;
DROP POLICY IF EXISTS "Users can insert their own tickets" ON user_spin_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON user_spin_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON user_spin_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON user_spin_tickets;

-- Create new compatible policies that work with bolt_users table
CREATE POLICY "Allow select for own tickets" ON user_spin_tickets
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM bolt_users WHERE telegram_id::text = get_current_telegram_id()
    )
  );

CREATE POLICY "Allow insert for own tickets" ON user_spin_tickets
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM bolt_users WHERE telegram_id::text = get_current_telegram_id()
    )
  );

CREATE POLICY "Allow update for own tickets" ON user_spin_tickets
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM bolt_users WHERE telegram_id::text = get_current_telegram_id()
    )
  );