import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  'https://yyvbabfgphkuacqerqql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dmJhYmZncGhrdWFjcWVycXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjA4MzMsImV4cCI6MjA4NjM5NjgzM30._ehjemkRGgin2T_ULghNDgC4RkhbrnTvaP9szdvr3nw',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);
