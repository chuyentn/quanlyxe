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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          credit_limit: number | null
          current_debt: number | null
          customer_code: string
          customer_name: string
          customer_type: string | null
          email: string | null
          id: string
          is_deleted: boolean | null
          notes: string | null
          payment_terms: number | null
          phone: string | null
          short_name: string | null
          status: string | null
          tax_code: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_debt?: number | null
          customer_code: string
          customer_name: string
          customer_type?: string | null
          email?: string | null
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          short_name?: string | null
          status?: string | null
          tax_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_debt?: number | null
          customer_code?: string
          customer_name?: string
          customer_type?: string | null
          email?: string | null
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          short_name?: string | null
          status?: string | null
          tax_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      drivers: {
        Row: {
          address: string | null
          assigned_vehicle_id: string | null
          base_salary: number | null
          contract_type: string | null
          created_at: string | null
          date_of_birth: string | null
          driver_code: string
          full_name: string
          hire_date: string | null
          id: string
          id_card: string | null
          id_issue_date: string | null
          is_deleted: boolean | null
          license_class: string | null
          license_expiry: string | null
          license_number: string | null
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["driver_status"] | null
          tax_code: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_vehicle_id?: string | null
          base_salary?: number | null
          contract_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          driver_code: string
          full_name: string
          hire_date?: string | null
          id?: string
          id_card?: string | null
          id_issue_date?: string | null
          is_deleted?: boolean | null
          license_class?: string | null
          license_expiry?: string | null
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"] | null
          tax_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_vehicle_id?: string | null
          base_salary?: number | null
          contract_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          driver_code?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          id_card?: string | null
          id_issue_date?: string | null
          is_deleted?: boolean | null
          license_class?: string | null
          license_expiry?: string | null
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"] | null
          tax_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_assigned_vehicle_id_fkey"
            columns: ["assigned_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          category_code: string
          category_name: string
          category_type: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_trip_related: boolean | null
          is_vehicle_related: boolean | null
          notes: string | null
        }
        Insert: {
          category_code: string
          category_name: string
          category_type: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_trip_related?: boolean | null
          is_vehicle_related?: boolean | null
          notes?: string | null
        }
        Update: {
          category_code?: string
          category_name?: string
          category_type?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_trip_related?: boolean | null
          is_vehicle_related?: boolean | null
          notes?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          description: string
          document_date: string | null
          document_number: string | null
          driver_id: string | null
          expense_code: string
          expense_date: string
          id: string
          is_deleted: boolean | null
          notes: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["expense_status"] | null
          trip_id: string | null
          unit_price: number | null
          updated_at: string | null
          vehicle_id: string | null
          vendor_name: string | null
        }
        Insert: {
          amount: number
          category_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          description: string
          document_date?: string | null
          document_number?: string | null
          driver_id?: string | null
          expense_code: string
          expense_date: string
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          trip_id?: string | null
          unit_price?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          description?: string
          document_date?: string | null
          document_number?: string | null
          driver_id?: string | null
          expense_code?: string
          expense_date?: string
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          trip_id?: string | null
          unit_price?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_orders: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          is_deleted: boolean | null
          labor_cost: number | null
          maintenance_type: string
          next_service_date: string | null
          next_service_km: number | null
          notes: string | null
          odometer_at_service: number | null
          order_code: string
          parts_cost: number | null
          scheduled_date: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["maintenance_status"] | null
          total_cost: number | null
          updated_at: string | null
          vehicle_id: string
          vendor_name: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          labor_cost?: number | null
          maintenance_type: string
          next_service_date?: string | null
          next_service_km?: number | null
          notes?: string | null
          odometer_at_service?: number | null
          order_code: string
          parts_cost?: number | null
          scheduled_date?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          total_cost?: number | null
          updated_at?: string | null
          vehicle_id: string
          vendor_name?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          labor_cost?: number | null
          maintenance_type?: string
          next_service_date?: string | null
          next_service_km?: number | null
          notes?: string | null
          odometer_at_service?: number | null
          order_code?: string
          parts_cost?: number | null
          scheduled_date?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          total_cost?: number | null
          updated_at?: string | null
          vehicle_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      routes: {
        Row: {
          cargo_type: string | null
          cargo_weight_standard: number | null
          created_at: string | null
          default_extra_fee: number | null
          destination: string
          distance_km: number | null
          driver_allowance_standard: number | null
          estimated_duration_hours: number | null
          fuel_cost_standard: number | null
          fuel_liters_standard: number | null
          id: string
          is_deleted: boolean | null
          notes: string | null
          origin: string
          police_fee_standard: number | null
          profit_standard: number | null
          route_code: string
          route_name: string
          standard_freight_rate: number | null
          status: string | null
          support_fee_standard: number | null
          tire_service_fee_standard: number | null
          payment_on_invoice: boolean | null
          toll_cost: number | null
          total_cost_standard: number | null
          transport_revenue_standard: number | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          cargo_type?: string | null
          cargo_weight_standard?: number | null
          created_at?: string | null
          default_extra_fee?: number | null
          destination: string
          distance_km?: number | null
          driver_allowance_standard?: number | null
          estimated_duration_hours?: number | null
          fuel_cost_standard?: number | null
          fuel_liters_standard?: number | null
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          origin: string
          police_fee_standard?: number | null
          profit_standard?: number | null
          route_code: string
          route_name: string
          standard_freight_rate?: number | null
          status?: string | null
          support_fee_standard?: number | null
          tire_service_fee_standard?: number | null
          payment_on_invoice?: boolean | null
          toll_cost?: number | null
          total_cost_standard?: number | null
          transport_revenue_standard?: number | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          cargo_type?: string | null
          cargo_weight_standard?: number | null
          created_at?: string | null
          default_extra_fee?: number | null
          destination?: string
          distance_km?: number | null
          driver_allowance_standard?: number | null
          estimated_duration_hours?: number | null
          fuel_cost_standard?: number | null
          fuel_liters_standard?: number | null
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          origin?: string
          police_fee_standard?: number | null
          profit_standard?: number | null
          route_code?: string
          route_name?: string
          standard_freight_rate?: number | null
          status?: string | null
          support_fee_standard?: number | null
          tire_service_fee_standard?: number | null
          payment_on_invoice?: boolean | null
          toll_cost?: number | null
          total_cost_standard?: number | null
          transport_revenue_standard?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          actual_arrival_time: string | null
          actual_departure_time: string | null
          actual_distance_km: number | null
          additional_charges: number | null
          cargo_cbm: number | null
          cargo_description: string | null
          cargo_weight_tons: number | null
          closed_at: string | null
          closed_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          customer_id: string | null
          departure_date: string
          driver_id: string
          end_odometer: number | null
          freight_revenue: number | null
          id: string
          is_deleted: boolean | null
          notes: string | null
          planned_arrival_date: string | null
          route_id: string | null
          start_odometer: number | null
          status: Database["public"]["Enums"]["trip_status"] | null
          total_revenue: number | null
          trip_code: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          actual_arrival_time?: string | null
          actual_departure_time?: string | null
          actual_distance_km?: number | null
          additional_charges?: number | null
          cargo_cbm?: number | null
          cargo_description?: string | null
          cargo_weight_tons?: number | null
          closed_at?: string | null
          closed_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          customer_id?: string | null
          departure_date: string
          driver_id: string
          end_odometer?: number | null
          freight_revenue?: number | null
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          planned_arrival_date?: string | null
          route_id?: string | null
          start_odometer?: number | null
          status?: Database["public"]["Enums"]["trip_status"] | null
          total_revenue?: number | null
          trip_code: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          actual_arrival_time?: string | null
          actual_departure_time?: string | null
          actual_distance_km?: number | null
          additional_charges?: number | null
          cargo_cbm?: number | null
          cargo_description?: string | null
          cargo_weight_tons?: number | null
          closed_at?: string | null
          closed_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          customer_id?: string | null
          departure_date?: string
          driver_id?: string
          end_odometer?: number | null
          freight_revenue?: number | null
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          planned_arrival_date?: string | null
          route_id?: string | null
          start_odometer?: number | null
          status?: Database["public"]["Enums"]["trip_status"] | null
          total_revenue?: number | null
          trip_code?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string | null
          capacity_cbm: number | null
          capacity_tons: number | null
          created_at: string | null
          current_odometer: number | null
          fuel_consumption_per_100km: number | null
          fuel_type: string | null
          id: string
          is_deleted: boolean | null
          license_plate: string
          model: string | null
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          status: Database["public"]["Enums"]["vehicle_status"] | null
          updated_at: string | null
          vehicle_code: string
          vehicle_type: string
          year_manufactured: number | null
          usage_limit_years: string | null
          engine_number: string | null
          chassis_number: string | null
          insurance_purchase_date: string | null
          insurance_expiry_date: string | null
          insurance_cost: number | null
          registration_cycle: string | null
          registration_date: string | null
          registration_expiry_date: string | null
          registration_cost: number | null
          current_location: string | null
        }
        Insert: {
          brand?: string | null
          capacity_cbm?: number | null
          capacity_tons?: number | null
          created_at?: string | null
          current_odometer?: number | null
          fuel_consumption_per_100km?: number | null
          fuel_type?: string | null
          id?: string
          is_deleted?: boolean | null
          license_plate: string
          model?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          updated_at?: string | null
          vehicle_code: string
          vehicle_type: string
          year_manufactured?: number | null
          usage_limit_years?: string | null
          engine_number?: string | null
          chassis_number?: string | null
          insurance_purchase_date?: string | null
          insurance_expiry_date?: string | null
          insurance_cost?: number | null
          registration_cycle?: string | null
          registration_date?: string | null
          registration_expiry_date?: string | null
          registration_cost?: number | null
          current_location?: string | null
        }
        Update: {
          brand?: string | null
          capacity_cbm?: number | null
          capacity_tons?: number | null
          created_at?: string | null
          current_odometer?: number | null
          fuel_consumption_per_100km?: number | null
          fuel_type?: string | null
          id?: string
          is_deleted?: boolean | null
          license_plate?: string
          model?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          updated_at?: string | null
          vehicle_code?: string
          vehicle_type?: string
          year_manufactured?: number | null
          usage_limit_years?: string | null
          engine_number?: string | null
          chassis_number?: string | null
          insurance_purchase_date?: string | null
          insurance_expiry_date?: string | null
          insurance_cost?: number | null
          registration_cycle?: string | null
          registration_date?: string | null
          registration_expiry_date?: string | null
          registration_cost?: number | null
          current_location?: string | null
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
      app_role: "admin" | "manager" | "dispatcher" | "accountant" | "viewer"
      driver_status: "active" | "on_leave" | "inactive"
      expense_status: "draft" | "confirmed" | "cancelled"
      maintenance_status:
      | "scheduled"
      | "in_progress"
      | "completed"
      | "cancelled"
      trip_status:
      | "draft"
      | "confirmed"
      | "in_progress"
      | "completed"
      | "cancelled"
      vehicle_status: "active" | "maintenance" | "inactive"
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
      app_role: ["admin", "manager", "dispatcher", "accountant", "viewer"],
      driver_status: ["active", "on_leave", "inactive"],
      expense_status: ["draft", "confirmed", "cancelled"],
      maintenance_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      trip_status: [
        "draft",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      vehicle_status: ["active", "maintenance", "inactive"],
    },
  },
} as const
