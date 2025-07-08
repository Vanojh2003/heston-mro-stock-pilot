-- Remove existing RLS policies that require authentication
DROP POLICY IF EXISTS "Authenticated users can manage airlines" ON public.airlines;
DROP POLICY IF EXISTS "Authenticated users can view airlines" ON public.airlines;
DROP POLICY IF EXISTS "Authenticated users can manage oil stock" ON public.oil_stock;
DROP POLICY IF EXISTS "Authenticated users can view oil stock" ON public.oil_stock;
DROP POLICY IF EXISTS "Authenticated users can manage oil types" ON public.oil_types;
DROP POLICY IF EXISTS "Authenticated users can view oil types" ON public.oil_types;
DROP POLICY IF EXISTS "Authenticated users can manage oil usage" ON public.oil_usage;
DROP POLICY IF EXISTS "Authenticated users can view oil usage" ON public.oil_usage;
DROP POLICY IF EXISTS "Authenticated users can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Authenticated users can view staff" ON public.staff;

-- Create new policies that allow all access without authentication
CREATE POLICY "Allow all access to airlines" ON public.airlines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to oil_stock" ON public.oil_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to oil_types" ON public.oil_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to oil_usage" ON public.oil_usage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);