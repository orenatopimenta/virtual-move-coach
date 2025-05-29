import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ukyfemahvtnezynwxpjt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreWZlbWFodnRuZXp5bnd4cGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMDM3MTcsImV4cCI6MjA2Mjg3OTcxN30.fCkOm5u3nP2k6Bdi19DBtR63NT1L8WmJjUvuvXGJ6kg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 