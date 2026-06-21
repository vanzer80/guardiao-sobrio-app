export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      checklist_completions: {
        Row: {
          completed_at: string
          completed_date: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          completed_date: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          completed_date?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_completions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          sort_order: number
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      diary_entries: {
        Row: {
          content: Json
          craving_level: number | null
          created_at: string
          entry_date: string
          id: string
          mood_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          craving_level?: number | null
          created_at?: string
          entry_date: string
          id?: string
          mood_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          craving_level?: number | null
          created_at?: string
          entry_date?: string
          id?: string
          mood_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          name: string
          phone: string
          relationship: string | null
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          name: string
          phone: string
          relationship?: string | null
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string
          relationship?: string | null
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      family_connections: {
        Row: {
          can_see_checklist: boolean
          can_see_diary: boolean
          can_see_sos: boolean
          can_see_triggers: boolean
          created_at: string
          family_email: string | null
          family_name: string
          family_user_id: string | null
          id: string
          invitation_expires_at: string | null
          invitation_status: string
          invitation_token: string | null
          relationship: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_see_checklist?: boolean
          can_see_diary?: boolean
          can_see_sos?: boolean
          can_see_triggers?: boolean
          created_at?: string
          family_email?: string | null
          family_name: string
          family_user_id?: string | null
          id?: string
          invitation_expires_at?: string | null
          invitation_status?: string
          invitation_token?: string | null
          relationship?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_see_checklist?: boolean
          can_see_diary?: boolean
          can_see_sos?: boolean
          can_see_triggers?: boolean
          created_at?: string
          family_email?: string | null
          family_name?: string
          family_user_id?: string | null
          id?: string
          invitation_expires_at?: string | null
          invitation_status?: string
          invitation_token?: string | null
          relationship?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          anonymous_created_at: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_anonymous: boolean
          is_premium: boolean
          onboarding_completed: boolean
          onboarding_desafio: string | null
          onboarding_motivo: string | null
          onboarding_tempo: string | null
          plan: string | null
          sobriety_start_date: string | null
          stripe_customer_id: string | null
          substance_focus: string | null
          timezone: string
          trial_activated_at: string | null
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          anonymous_created_at?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_anonymous?: boolean
          is_premium?: boolean
          onboarding_completed?: boolean
          onboarding_desafio?: string | null
          onboarding_motivo?: string | null
          onboarding_tempo?: string | null
          plan?: string | null
          sobriety_start_date?: string | null
          stripe_customer_id?: string | null
          substance_focus?: string | null
          timezone?: string
          trial_activated_at?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          anonymous_created_at?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_anonymous?: boolean
          is_premium?: boolean
          onboarding_completed?: boolean
          onboarding_desafio?: string | null
          onboarding_motivo?: string | null
          onboarding_tempo?: string | null
          plan?: string | null
          sobriety_start_date?: string | null
          stripe_customer_id?: string | null
          substance_focus?: string | null
          timezone?: string
          trial_activated_at?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          platform: string | null
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: string | null
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: string | null
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sobriety_records: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          relapse_notes: string | null
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          relapse_notes?: string | null
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          relapse_notes?: string | null
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      sos_activations: {
        Row: {
          actions_taken: string[] | null
          craving_level: number | null
          id: string
          notes: string | null
          resolved_at: string | null
          trigger_description: string | null
          triggered_at: string
          user_id: string
        }
        Insert: {
          actions_taken?: string[] | null
          craving_level?: number | null
          id?: string
          notes?: string | null
          resolved_at?: string | null
          trigger_description?: string | null
          triggered_at?: string
          user_id: string
        }
        Update: {
          actions_taken?: string[] | null
          craving_level?: number | null
          id?: string
          notes?: string | null
          resolved_at?: string | null
          trigger_description?: string | null
          triggered_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          new_plan: string | null
          old_plan: string | null
          stripe_event_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          new_plan?: string | null
          old_plan?: string | null
          stripe_event_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          new_plan?: string | null
          old_plan?: string | null
          stripe_event_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          provider: string | null
          provider_subscription_id: string | null
          status: string
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          provider?: string | null
          provider_subscription_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          provider?: string | null
          provider_subscription_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trigger_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_system: boolean
          name: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          name: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          biometric_lock: boolean
          daily_reminder_time: string
          language: string
          notification_enabled: boolean
          quiet_hours_end: string
          quiet_hours_start: string
          share_anonymous_data: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          biometric_lock?: boolean
          daily_reminder_time?: string
          language?: string
          notification_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          share_anonymous_data?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          biometric_lock?: boolean
          daily_reminder_time?: string
          language?: string
          notification_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          share_anonymous_data?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_triggers: {
        Row: {
          category_id: string | null
          coping_strategies: string[] | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          people_involved: string[] | null
          risk_level: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          coping_strategies?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          people_involved?: string[] | null
          risk_level?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          coping_strategies?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          people_involved?: string[] | null
          risk_level?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_triggers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "trigger_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_family_invite: { Args: { p_token: string }; Returns: Json }
      activate_trial: { Args: never; Returns: string }
      effective_plan: { Args: { uid: string }; Returns: string }
      get_family_day_status: { Args: never; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
