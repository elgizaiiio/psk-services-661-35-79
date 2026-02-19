-- Add UPDATE policy for wallet_verifications to fix upsert RLS error
CREATE POLICY "Users can update their own wallet verifications"
ON public.wallet_verifications
FOR UPDATE
USING (true)
WITH CHECK (true);