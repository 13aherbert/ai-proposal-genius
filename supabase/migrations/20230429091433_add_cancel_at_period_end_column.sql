
-- Add cancel_at_period_end column to the subscriptions table if it doesn't exist already
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions' 
        AND column_name = 'cancel_at_period_end'
    ) THEN
        ALTER TABLE public.subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
