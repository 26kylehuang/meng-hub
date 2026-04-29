import type { SupabaseClient, Session } from '@supabase/supabase-js';

declare global {
    namespace App {
        interface Locals {
            supabase: SupabaseClient;
            session: Session | null;
            userRole: 'admin' | 'warren' | 'student' | null;
        }
        interface PageData {
            session: Session | null;
            userRole: string | null;
        }
    }
}

export {};
