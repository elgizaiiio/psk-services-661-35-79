-- Reset USDT balance for users who had the $3000 campaign prize
-- Return them to their original balance (0, since $3000 was promotional)
UPDATE public.bolt_users 
SET usdt_balance = 0 
WHERE usdt_balance >= 3000;