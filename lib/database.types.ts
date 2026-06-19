// Gerado via: npx supabase gen types typescript --project-id <id> > lib/database.types.ts
// Por enquanto, placeholder tipado. Substituir após criar o schema no Supabase.
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          sobriety_start: string | null;
          plan: 'free' | 'essencial' | 'guardiao';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      daily_checklists: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          sleep: boolean;
          water: boolean;
          food: boolean;
          movement: boolean;
          connection: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['daily_checklists']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['daily_checklists']['Insert']>;
      };
      emergency_protocols: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          completed_at: string | null;
          step_reached: number;
        };
        Insert: Omit<Database['public']['Tables']['emergency_protocols']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['emergency_protocols']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      calculate_sobriety_days: {
        Args: { user_id: string };
        Returns: number;
      };
    };
    Enums: {
      plan_type: 'free' | 'essencial' | 'guardiao';
    };
  };
}
