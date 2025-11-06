-- Temporary public insert policy for CCI submissions (for testing with auth disabled)
-- Remove this in production when auth is enabled
CREATE POLICY "Temporary: Allow anonymous CCI submissions for testing"
ON public.cci_submissions
FOR INSERT
WITH CHECK (true);

-- Also allow public to view aggregate data (will be used by RPC functions)
CREATE POLICY "Public can view CCI submissions for aggregates"
ON public.cci_submissions
FOR SELECT
USING (true);