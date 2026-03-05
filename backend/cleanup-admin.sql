-- Clean up old admin account before creating new one
-- Run this script if you need to remove an existing admin account

-- Show current admin accounts
SELECT id, email, first_name, last_name, role, is_verified, is_active, created_at 
FROM users 
WHERE role = 'ADMIN';

-- Delete old admin account (if email doesn't match your .env)
-- Uncomment the line below to delete admin@zentaritas.com
-- DELETE FROM users WHERE role = 'ADMIN' AND email = 'admin@zentaritas.com';

-- Or delete all admin accounts to start fresh
-- Uncomment the line below to delete all admins
-- DELETE FROM users WHERE role = 'ADMIN';

-- After running the delete, restart your backend application
-- The new admin account will be created automatically with your .env email
