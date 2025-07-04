export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      airlines: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      oil_stock: {
        Row: {
          batch_number: string
          created_at: string | null
          created_by: string | null
          id: string
          oil_type_id: string
          owner: Database["public"]["Enums"]["stock_owner"]
          owner_airline_id: string | null
          quantity_received: number
          quantity_remaining: number
          received_date: string | null
          updated_at: string | null
        }
        Insert: {
          batch_number: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          oil_type_id: string
          owner: Database["public"]["Enums"]["stock_owner"]
          owner_airline_id?: string | null
          quantity_received: number
          quantity_remaining: number
          received_date?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          oil_type_id?: string
          owner?: Database["public"]["Enums"]["stock_owner"]
          owner_airline_id?: string | null
          quantity_received?: number
          quantity_remaining?: number
          received_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oil_stock_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oil_stock_oil_type_id_fkey"
            columns: ["oil_type_id"]
            isOneToOne: false
            referencedRelation: "oil_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oil_stock_owner_airline_id_fkey"
            columns: ["owner_airline_id"]
            isOneToOne: false
            referencedRelation: "airlines"
            referencedColumns: ["id"]
          },
        ]
      }
      oil_types: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string | null
          specifications: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id?: string | null
          specifications?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          specifications?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oil_types_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "airlines"
            referencedColumns: ["id"]
          },
        ]
      }
      oil_usage: {
        Row: {
          aircraft_registration: string
          airline_id: string
          batch_id: string
          created_at: string | null
          id: string
          notes: string | null
          quantity_used: number
          staff_id: string
          updated_at: string | null
          usage_date: string | null
        }
        Insert: {
          aircraft_registration: string
          airline_id: string
          batch_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          quantity_used: number
          staff_id: string
          updated_at?: string | null
          usage_date?: string | null
        }
        Update: {
          aircraft_registration?: string
          airline_id?: string
          batch_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          quantity_used?: number
          staff_id?: string
          updated_at?: string | null
          usage_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oil_usage_airline_id_fkey"
            columns: ["airline_id"]
            isOneToOne: false
            referencedRelation: "airlines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oil_usage_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "oil_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oil_usage_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          id: string
          name: string
          permissions: Json | null
          role: Database["public"]["Enums"]["user_role"] | null
          theme_preference: Database["public"]["Enums"]["theme_mode"] | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          theme_preference?: Database["public"]["Enums"]["theme_mode"] | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          theme_preference?: Database["public"]["Enums"]["theme_mode"] | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      stock_owner: "heston" | "customer"
      theme_mode: "light" | "dark" | "auto"
      user_role: "admin" | "manager" | "staff"
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
  public: {
    Enums: {
      stock_owner: ["heston", "customer"],
      theme_mode: ["light", "dark", "auto"],
      user_role: ["admin", "manager", "staff"],
    },
  },
} as const
