-- ENFORCE ROLES IMPLEMENTATION
-- 1. Lock the 4 Super Admins
-- 2. Set default role for NEW users to 'viewer'

-- PART 1: HARDCODE THE 4 ADMINS (Run this to fix current state)
INSERT INTO public.user_roles (user_id, role, email)
VALUES 
    ('73b4fbe4-0257-48b0-ae4a-080d5f12d036', 'admin', 'francis.ho87@gmail.com'),
    ('871d92ba-0981-4fc5-9801-dd7b6977a883', 'admin', 'trangocchuyen1980@gmail.com'),
    ('a6cb37f3-79a0-470c-acee-ab0bee918d6c', 'admin', 'dataphuan@gmail.com'),
    ('a0187ba9-0658-4f41-bad1-b4543c8a85e0', 'admin', 'thuthuyccr@gmail.com')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';

-- PART 2: UPDATE TRIGGER FOR NEW USERS
-- Ensure the handle_new_user function sets role to 'viewer' by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, email, full_name)
  VALUES (
    new.id,
    'viewer', -- DEFAULT ROLE IS NOW VIEWER
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  
  -- Create profile
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify Trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify
SELECT * FROM public.user_roles;
