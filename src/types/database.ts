export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          is_active?: boolean;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          discount_value: number;
          id: string;
          is_active: boolean;
          max_discount_amount: number | null;
          min_order_amount: number;
          type: string;
          usage_count: number;
          usage_limit: number | null;
          valid_from: string;
          valid_until: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          discount_value: number;
          id?: string;
          is_active?: boolean;
          max_discount_amount?: number | null;
          min_order_amount?: number;
          type: string;
          usage_count?: number;
          usage_limit?: number | null;
          valid_from?: string;
          valid_until?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          discount_value?: number;
          id?: string;
          is_active?: boolean;
          max_discount_amount?: number | null;
          min_order_amount?: number;
          type?: string;
          usage_count?: number;
          usage_limit?: number | null;
          valid_from?: string;
          valid_until?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_image_url: string | null;
          product_name: string;
          quantity: number;
          total_price: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_image_url?: string | null;
          product_name: string;
          quantity?: number;
          total_price: number;
          unit_price: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          product_image_url?: string | null;
          product_name?: string;
          quantity?: number;
          total_price?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          coupon_code: string | null;
          created_at: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          delivery_address: string;
          delivery_city: string;
          delivery_fee: number;
          delivery_pincode: string;
          discount_amount: number;
          id: string;
          notes: string | null;
          order_number: string;
          payment_method: string;
          payment_status: string;
          status: string;
          subtotal: number;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          coupon_code?: string | null;
          created_at?: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          delivery_address: string;
          delivery_city?: string;
          delivery_fee?: number;
          delivery_pincode: string;
          discount_amount?: number;
          id?: string;
          notes?: string | null;
          order_number: string;
          payment_method: string;
          payment_status?: string;
          status?: string;
          subtotal?: number;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          coupon_code?: string | null;
          created_at?: string;
          customer_email?: string;
          customer_name?: string;
          customer_phone?: string;
          delivery_address?: string;
          delivery_city?: string;
          delivery_fee?: number;
          delivery_pincode?: string;
          discount_amount?: number;
          id?: string;
          notes?: string | null;
          order_number?: string;
          payment_method?: string;
          payment_status?: string;
          status?: string;
          subtotal?: number;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          collected_at: string | null;
          created_at: string;
          id: string;
          method: string;
          order_id: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          collected_at?: string | null;
          created_at?: string;
          id?: string;
          method: string;
          order_id: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          collected_at?: string | null;
          created_at?: string;
          id?: string;
          method?: string;
          order_id?: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      product_images: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          sort_order: number;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          sort_order?: number;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          sort_order?: number;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };

      store_settings: {
        Row: {
          id: string;
          flat_delivery_charge: number;
          free_delivery_above: number;
          default_tax_percent: number;
          is_cod_enabled: boolean;
          is_online_payment_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          flat_delivery_charge?: number;
          free_delivery_above?: number;
          default_tax_percent?: number;
          is_cod_enabled?: boolean;
          is_online_payment_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          flat_delivery_charge?: number;
          free_delivery_above?: number;
          default_tax_percent?: number;
          is_cod_enabled?: boolean;
          is_online_payment_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };

      products: {
        Row: {
          actual_price: number;
          category_id: string | null;
          created_at: string;
          full_description: string | null;
          id: string;
          is_active: boolean;
          is_featured: boolean;
          is_new_arrival: boolean;
          low_stock_threshold: number;
          name: string;
          selling_price: number;
          short_description: string | null;
          sku: string | null;
          slug: string;
          stock_quantity: number;
          tax_percent: number;
          unit: string;
          updated_at: string;

          weight_grams: number | null;
        };
        Insert: {
          actual_price?: number;
          category_id?: string | null;
          created_at?: string;
          full_description?: string | null;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          is_new_arrival?: boolean;
          low_stock_threshold?: number;
          name: string;
          selling_price?: number;
          short_description?: string | null;
          sku?: string | null;
          slug: string;
          stock_quantity?: number;
          tax_percent?: number;
          unit?: string;
          updated_at?: string;
          weight_grams?: number | null;
        };
        Update: {
          actual_price?: number;
          category_id?: string | null;
          created_at?: string;
          full_description?: string | null;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          is_new_arrival?: boolean;
          low_stock_threshold?: number;
          name?: string;
          selling_price?: number;
          short_description?: string | null;
          sku?: string | null;
          slug?: string;
          stock_quantity?: number;
          tax_percent?: number;
          unit?: string;
          updated_at?: string;
          weight_grams?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
