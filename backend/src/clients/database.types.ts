export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      from_emails: {
        Row: {
          created_at: string
          email: string
          id: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          account: string | null
          created_at: string | null
          emails_errorMessages: Json | null
          emails_errors: number | null
          emails_found: number | null
          emails_processed: number | null
          id: string
          inbox: string | null
          links_attemptedOpen: number | null
          links_errorMessages: Json | null
          links_errors: number | null
          links_found: number | null
          links_targetOpen: number | null
          process_id: string | null
          replies_Sent: number
          sender: string | null
          spam_found: number
          spam_moved: number
          status: string | null
        }
        Insert: {
          account?: string | null
          created_at?: string | null
          emails_errorMessages?: Json | null
          emails_errors?: number | null
          emails_found?: number | null
          emails_processed?: number | null
          id?: string
          inbox?: string | null
          links_attemptedOpen?: number | null
          links_errorMessages?: Json | null
          links_errors?: number | null
          links_found?: number | null
          links_targetOpen?: number | null
          process_id?: string | null
          replies_Sent?: number
          sender?: string | null
          spam_found?: number
          spam_moved?: number
          status?: string | null
        }
        Update: {
          account?: string | null
          created_at?: string | null
          emails_errorMessages?: Json | null
          emails_errors?: number | null
          emails_found?: number | null
          emails_processed?: number | null
          id?: string
          inbox?: string | null
          links_attemptedOpen?: number | null
          links_errorMessages?: Json | null
          links_errors?: number | null
          links_found?: number | null
          links_targetOpen?: number | null
          process_id?: string | null
          replies_Sent?: number
          sender?: string | null
          spam_found?: number
          spam_moved?: number
          status?: string | null
        }
        Relationships: []
      }
      sender_aggregates: {
        Row: {
          sender: string
          spam_moved: number
          total_emails_processed: number
          total_links_attempted_open: number
          total_links_opened: number
          total_replies_sent: number
          total_reports: number
          total_spam_found: number
        }
        Insert: {
          sender: string
          spam_moved?: number
          total_emails_processed?: number
          total_links_attempted_open?: number
          total_links_opened?: number
          total_replies_sent?: number
          total_reports?: number
          total_spam_found?: number
        }
        Update: {
          sender?: string
          spam_moved?: number
          total_emails_processed?: number
          total_links_attempted_open?: number
          total_links_opened?: number
          total_replies_sent?: number
          total_reports?: number
          total_spam_found?: number
        }
        Relationships: []
      }
      sender_aggregates_archive: {
        Row: {
          sender: string
          spam_moved: number
          total_emails_processed: number
          total_links_attempted_open: number
          total_links_opened: number
          total_replies_sent: number
          total_reports: number
          total_spam_found: number
        }
        Insert: {
          sender: string
          spam_moved?: number
          total_emails_processed?: number
          total_links_attempted_open?: number
          total_links_opened?: number
          total_replies_sent?: number
          total_reports?: number
          total_spam_found?: number
        }
        Update: {
          sender?: string
          spam_moved?: number
          total_emails_processed?: number
          total_links_attempted_open?: number
          total_links_opened?: number
          total_replies_sent?: number
          total_reports?: number
          total_spam_found?: number
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          access_token: string | null
          app_password: string | null
          connected: boolean
          email: string
          expires_at: number | null
          id: string
          is_token: boolean
          provider: Database["public"]["Enums"]["Provider"]
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          app_password?: string | null
          connected?: boolean
          email?: string
          expires_at?: number | null
          id?: string
          is_token?: boolean
          provider?: Database["public"]["Enums"]["Provider"]
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          app_password?: string | null
          connected?: boolean
          email?: string
          expires_at?: number | null
          id?: string
          is_token?: boolean
          provider?: Database["public"]["Enums"]["Provider"]
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_sender_aggregate: {
        Args: { sender_id: string }
        Returns: undefined
      }
    }
    Enums: {
      Provider: "google" | "yahoo" | "mailru" | "yandex" | "rambler"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      Provider: ["google", "yahoo", "mailru", "yandex", "rambler"],
    },
  },
} as const
