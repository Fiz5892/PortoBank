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
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      educations: {
        Row: {
          created_at: string
          degree: string
          description: string | null
          end_year: number | null
          field_of_study: string | null
          gpa: string | null
          id: string
          institution_logo_url: string | null
          institution_name: string
          start_year: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          degree: string
          description?: string | null
          end_year?: number | null
          field_of_study?: string | null
          gpa?: string | null
          id?: string
          institution_logo_url?: string | null
          institution_name: string
          start_year?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          degree?: string
          description?: string | null
          end_year?: number | null
          field_of_study?: string | null
          gpa?: string | null
          id?: string
          institution_logo_url?: string | null
          institution_name?: string
          start_year?: number | null
          user_id?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          company_logo_url: string | null
          company_name: string
          created_at: string
          description: string | null
          employment_type: string | null
          end_date: string | null
          id: string
          is_current: boolean
          job_title: string
          location: string | null
          start_date: string | null
          user_id: string
        }
        Insert: {
          company_logo_url?: string | null
          company_name: string
          created_at?: string
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          job_title: string
          location?: string | null
          start_date?: string | null
          user_id: string
        }
        Update: {
          company_logo_url?: string | null
          company_name?: string
          created_at?: string
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          job_title?: string
          location?: string | null
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          portfolio_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          portfolio_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          portfolio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          external_link: string | null
          gallery_images: string[] | null
          id: string
          portfolio_id: string
          tags: string[] | null
          title: string
          type: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          external_link?: string | null
          gallery_images?: string[] | null
          id?: string
          portfolio_id: string
          tags?: string[] | null
          title: string
          type: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          external_link?: string | null
          gallery_images?: string[] | null
          id?: string
          portfolio_id?: string
          tags?: string[] | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          title: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          title: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          title?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          behance_url: string | null
          bio: string | null
          created_at: string
          dribbble_url: string | null
          email_contact: string | null
          full_name: string | null
          github_url: string | null
          id: string
          instagram_url: string | null
          is_active: boolean
          is_public: boolean
          linkedin_url: string | null
          location: string | null
          phone: string | null
          profession: string | null
          role: string
          twitter_url: string | null
          user_id: string
          username: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          behance_url?: string | null
          bio?: string | null
          created_at?: string
          dribbble_url?: string | null
          email_contact?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          is_public?: boolean
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          profession?: string | null
          role?: string
          twitter_url?: string | null
          user_id: string
          username?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          behance_url?: string | null
          bio?: string | null
          created_at?: string
          dribbble_url?: string | null
          email_contact?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          is_public?: boolean
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          profession?: string | null
          role?: string
          twitter_url?: string | null
          user_id?: string
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          status: string
          target_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_user_id?: string
        }
        Relationships: []
      }
      skill_categories: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          profile_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          profile_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
