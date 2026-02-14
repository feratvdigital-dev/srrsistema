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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          created_at: string
          id: string
          password: string
          role: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password: string
          role?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password?: string
          role?: string
          username?: string
        }
        Relationships: []
      }
      client_tickets: {
        Row: {
          created_at: string
          description: string
          id: string
          latitude: number | null
          linked_order_id: number | null
          location: string
          longitude: number | null
          name: string
          photos: string[] | null
          status: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          description?: string
          id: string
          latitude?: number | null
          linked_order_id?: number | null
          location?: string
          longitude?: number | null
          name: string
          photos?: string[] | null
          status?: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          latitude?: number | null
          linked_order_id?: number | null
          location?: string
          longitude?: number | null
          name?: string
          photos?: string[] | null
          status?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tickets_linked_order_id_fkey"
            columns: ["linked_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          address: string
          assigned_technician: string
          client_email: string
          client_name: string
          client_phone: string
          closed_at: string | null
          created_at: string
          description: string
          executed_at: string | null
          id: number
          labor_cost: number
          latitude: number | null
          longitude: number | null
          material_cost: number
          material_description: string
          observation: string
          photos_after: string[] | null
          photos_before: string[] | null
          photos_during: string[] | null
          service_type: string
          status: string
        }
        Insert: {
          address?: string
          assigned_technician?: string
          client_email?: string
          client_name: string
          client_phone?: string
          closed_at?: string | null
          created_at?: string
          description?: string
          executed_at?: string | null
          id?: number
          labor_cost?: number
          latitude?: number | null
          longitude?: number | null
          material_cost?: number
          material_description?: string
          observation?: string
          photos_after?: string[] | null
          photos_before?: string[] | null
          photos_during?: string[] | null
          service_type?: string
          status?: string
        }
        Update: {
          address?: string
          assigned_technician?: string
          client_email?: string
          client_name?: string
          client_phone?: string
          closed_at?: string | null
          created_at?: string
          description?: string
          executed_at?: string | null
          id?: number
          labor_cost?: number
          latitude?: number | null
          longitude?: number | null
          material_cost?: number
          material_description?: string
          observation?: string
          photos_after?: string[] | null
          photos_before?: string[] | null
          photos_during?: string[] | null
          service_type?: string
          status?: string
        }
        Relationships: []
      }
      technicians: {
        Row: {
          cpf: string | null
          created_at: string
          document_photo: string | null
          email: string
          id: string
          name: string
          password: string | null
          phone: string
          profile_photo: string | null
          rg: string | null
          specialty: string
          status: string
          username: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          document_photo?: string | null
          email?: string
          id?: string
          name: string
          password?: string | null
          phone?: string
          profile_photo?: string | null
          rg?: string | null
          specialty?: string
          status?: string
          username?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          document_photo?: string | null
          email?: string
          id?: string
          name?: string
          password?: string | null
          phone?: string
          profile_photo?: string | null
          rg?: string | null
          specialty?: string
          status?: string
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
  public: {
    Enums: {},
  },
} as const
