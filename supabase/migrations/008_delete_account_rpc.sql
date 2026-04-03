-- supabase/migrations/008_delete_account_rpc.sql
-- Function to securely allow users to self-delete their account

CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Security definer runs as the schema owner (postgres/superuser)
  -- So we can legitimately delete the calling user from auth.users
  -- Because profiles, friendships, messages are ON DELETE CASCADE 
  -- everything linked to the user will automatically drop.
  
  DELETE FROM auth.users WHERE id = auth.uid();
  
  -- Log deletion action if needed (optional audit log)
  -- RAISE LOG 'User % permanently deleted their account.', auth.uid();
END;
$$;
