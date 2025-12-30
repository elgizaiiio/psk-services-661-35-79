-- Create user_spin_tickets table for ticket system
CREATE TABLE public.user_spin_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.bolt_users(id) ON DELETE CASCADE NOT NULL,
  tickets_count integer DEFAULT 0 NOT NULL,
  free_ticket_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_spin_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tickets"
ON public.user_spin_tickets
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own tickets"
ON public.user_spin_tickets
FOR UPDATE
USING (true);

CREATE POLICY "Users can insert their own tickets"
ON public.user_spin_tickets
FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_user_spin_tickets_updated_at
BEFORE UPDATE ON public.user_spin_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();