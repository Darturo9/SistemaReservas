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
      audit_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          after_data: Json | null;
          before_data: Json | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: number;
          tenant_id: string;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: never;
          tenant_id: string;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: never;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      availability_exceptions: {
        Row: {
          created_at: string;
          ends_at: string;
          id: string;
          kind: Database["public"]["Enums"]["availability_exception_kind"];
          location_id: string;
          note: string | null;
          resource_id: string | null;
          starts_at: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          ends_at: string;
          id?: string;
          kind: Database["public"]["Enums"]["availability_exception_kind"];
          location_id: string;
          note?: string | null;
          resource_id?: string | null;
          starts_at: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          ends_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["availability_exception_kind"];
          location_id?: string;
          note?: string | null;
          resource_id?: string | null;
          starts_at?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "availability_exceptions_tenant_location_fkey";
            columns: ["tenant_id", "location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "availability_exceptions_tenant_resource_location_fkey";
            columns: ["tenant_id", "resource_id", "location_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["tenant_id", "id", "location_id"];
          },
        ];
      };
      availability_rules: {
        Row: {
          created_at: string;
          day_of_week: number;
          end_time: string;
          id: string;
          is_active: boolean;
          location_id: string;
          resource_id: string | null;
          start_time: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          day_of_week: number;
          end_time: string;
          id?: string;
          is_active?: boolean;
          location_id: string;
          resource_id?: string | null;
          start_time: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          is_active?: boolean;
          location_id?: string;
          resource_id?: string | null;
          start_time?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "availability_rules_tenant_location_fkey";
            columns: ["tenant_id", "location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "availability_rules_tenant_resource_location_fkey";
            columns: ["tenant_id", "resource_id", "location_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["tenant_id", "id", "location_id"];
          },
        ];
      };
      booking_verification_deliveries: {
        Row: {
          created_at: string;
          fallback_sent_at: string | null;
          fallback_started_at: string | null;
          id: string;
          provider: string;
          provider_error_code: string | null;
          provider_message_id: string | null;
          status: string;
          updated_at: string;
          verification_id: string;
        };
        Insert: {
          created_at?: string;
          fallback_sent_at?: string | null;
          fallback_started_at?: string | null;
          id?: string;
          provider: string;
          provider_error_code?: string | null;
          provider_message_id?: string | null;
          status: string;
          updated_at?: string;
          verification_id: string;
        };
        Update: {
          created_at?: string;
          fallback_sent_at?: string | null;
          fallback_started_at?: string | null;
          id?: string;
          provider?: string;
          provider_error_code?: string | null;
          provider_message_id?: string | null;
          status?: string;
          updated_at?: string;
          verification_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_verification_deliveries_verification_id_fkey";
            columns: ["verification_id"];
            isOneToOne: false;
            referencedRelation: "booking_verifications";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_verifications: {
        Row: {
          booking_id: string;
          channel: Database["public"]["Enums"]["booking_verification_channel"];
          contact_id: string;
          created_at: string;
          expires_at: string;
          id: string;
          invalidated_at: string | null;
          tenant_id: string;
          token_hash: string;
          verified_at: string | null;
        };
        Insert: {
          booking_id: string;
          channel: Database["public"]["Enums"]["booking_verification_channel"];
          contact_id: string;
          created_at?: string;
          expires_at: string;
          id?: string;
          invalidated_at?: string | null;
          tenant_id: string;
          token_hash: string;
          verified_at?: string | null;
        };
        Update: {
          booking_id?: string;
          channel?: Database["public"]["Enums"]["booking_verification_channel"];
          contact_id?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          invalidated_at?: string | null;
          tenant_id?: string;
          token_hash?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "booking_verifications_tenant_booking_fkey";
            columns: ["tenant_id", "booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "booking_verifications_tenant_contact_fkey";
            columns: ["tenant_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "customer_contacts";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      bookings: {
        Row: {
          buffer_after_minutes: number;
          buffer_before_minutes: number;
          confirmation_channel: Database["public"]["Enums"]["booking_verification_channel"];
          created_at: string;
          customer_id: string | null;
          ends_at: string;
          id: string;
          internal_note: string | null;
          location_id: string;
          occupied_at: unknown;
          resource_id: string;
          service_id: string;
          starts_at: string;
          status: Database["public"]["Enums"]["booking_status"];
          tenant_id: string;
          updated_at: string;
          verification_expires_at: string | null;
        };
        Insert: {
          buffer_after_minutes?: number;
          buffer_before_minutes?: number;
          confirmation_channel?: Database["public"]["Enums"]["booking_verification_channel"];
          created_at?: string;
          customer_id?: string | null;
          ends_at: string;
          id?: string;
          internal_note?: string | null;
          location_id: string;
          occupied_at: unknown;
          resource_id: string;
          service_id: string;
          starts_at: string;
          status?: Database["public"]["Enums"]["booking_status"];
          tenant_id: string;
          updated_at?: string;
          verification_expires_at?: string | null;
        };
        Update: {
          buffer_after_minutes?: number;
          buffer_before_minutes?: number;
          confirmation_channel?: Database["public"]["Enums"]["booking_verification_channel"];
          created_at?: string;
          customer_id?: string | null;
          ends_at?: string;
          id?: string;
          internal_note?: string | null;
          location_id?: string;
          occupied_at?: unknown;
          resource_id?: string;
          service_id?: string;
          starts_at?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          tenant_id?: string;
          updated_at?: string;
          verification_expires_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_tenant_customer_fkey";
            columns: ["tenant_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "bookings_tenant_location_fkey";
            columns: ["tenant_id", "location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "bookings_tenant_resource_fkey";
            columns: ["tenant_id", "resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "bookings_tenant_service_fkey";
            columns: ["tenant_id", "service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      customer_contacts: {
        Row: {
          created_at: string;
          customer_id: string;
          id: string;
          kind: Database["public"]["Enums"]["customer_contact_kind"];
          tenant_id: string;
          updated_at: string;
          value: string;
          verified_at: string | null;
          whatsapp_consent_at: string | null;
          whatsapp_opted_out_at: string | null;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          id?: string;
          kind: Database["public"]["Enums"]["customer_contact_kind"];
          tenant_id: string;
          updated_at?: string;
          value: string;
          verified_at?: string | null;
          whatsapp_consent_at?: string | null;
          whatsapp_opted_out_at?: string | null;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["customer_contact_kind"];
          tenant_id?: string;
          updated_at?: string;
          value?: string;
          verified_at?: string | null;
          whatsapp_consent_at?: string | null;
          whatsapp_opted_out_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customer_contacts_tenant_customer_fkey";
            columns: ["tenant_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      customers: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          preferred_contact_channel: Database["public"]["Enums"]["customer_preferred_channel"];
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id?: string;
          preferred_contact_channel?: Database["public"]["Enums"]["customer_preferred_channel"];
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          preferred_contact_channel?: Database["public"]["Enums"]["customer_preferred_channel"];
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: {
          address: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          tenant_id: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          tenant_id: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          tenant_id?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "locations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          organization_id: string;
          role: Database["public"]["Enums"]["organization_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          organization_id: string;
          role?: Database["public"]["Enums"]["organization_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["organization_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          booking_slug: string | null;
          created_at: string;
          id: string;
          is_booking_public: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          booking_slug?: string | null;
          created_at?: string;
          id?: string;
          is_booking_public?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          booking_slug?: string | null;
          created_at?: string;
          id?: string;
          is_booking_public?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          capacity: number;
          created_at: string;
          id: string;
          is_active: boolean;
          kind: Database["public"]["Enums"]["resource_kind"];
          location_id: string;
          name: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          capacity?: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kind?: Database["public"]["Enums"]["resource_kind"];
          location_id: string;
          name: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          capacity?: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kind?: Database["public"]["Enums"]["resource_kind"];
          location_id?: string;
          name?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resources_tenant_location_fkey";
            columns: ["tenant_id", "location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      service_resources: {
        Row: {
          created_at: string;
          id: string;
          resource_id: string;
          service_id: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          resource_id: string;
          service_id: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          resource_id?: string;
          service_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_resources_tenant_resource_fkey";
            columns: ["tenant_id", "resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "service_resources_tenant_service_fkey";
            columns: ["tenant_id", "service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      services: {
        Row: {
          allow_client_cancellation: boolean;
          allow_client_rescheduling: boolean;
          approval_policy: Database["public"]["Enums"]["service_approval_policy"];
          buffer_after_minutes: number;
          buffer_before_minutes: number;
          cancellation_notice_minutes: number;
          created_at: string;
          currency: string;
          description: string | null;
          duration_minutes: number;
          id: string;
          is_active: boolean;
          name: string;
          price_cents: number | null;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          allow_client_cancellation?: boolean;
          allow_client_rescheduling?: boolean;
          approval_policy?: Database["public"]["Enums"]["service_approval_policy"];
          buffer_after_minutes?: number;
          buffer_before_minutes?: number;
          cancellation_notice_minutes?: number;
          created_at?: string;
          currency?: string;
          description?: string | null;
          duration_minutes: number;
          id?: string;
          is_active?: boolean;
          name: string;
          price_cents?: number | null;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          allow_client_cancellation?: boolean;
          allow_client_rescheduling?: boolean;
          approval_policy?: Database["public"]["Enums"]["service_approval_policy"];
          buffer_after_minutes?: number;
          buffer_before_minutes?: number;
          cancellation_notice_minutes?: number;
          created_at?: string;
          currency?: string;
          description?: string | null;
          duration_minutes?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          price_cents?: number | null;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_booking: {
        Args: {
          p_internal_note?: string;
          p_location_id: string;
          p_resource_id?: string;
          p_service_id: string;
          p_starts_at: string;
          p_status?: Database["public"]["Enums"]["booking_status"];
          p_tenant_id: string;
          p_verification_expires_at?: string;
        };
        Returns: {
          buffer_after_minutes: number;
          buffer_before_minutes: number;
          confirmation_channel: Database["public"]["Enums"]["booking_verification_channel"];
          created_at: string;
          customer_id: string | null;
          ends_at: string;
          id: string;
          internal_note: string | null;
          location_id: string;
          occupied_at: unknown;
          resource_id: string;
          service_id: string;
          starts_at: string;
          status: Database["public"]["Enums"]["booking_status"];
          tenant_id: string;
          updated_at: string;
          verification_expires_at: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "bookings";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_organization: { Args: { p_name: string }; Returns: string };
      create_public_booking_hold: {
        Args: {
          p_booking_slug: string;
          p_customer_name: string;
          p_email: string;
          p_location_id: string;
          p_phone: string;
          p_service_id: string;
          p_starts_at: string;
          p_whatsapp_consent?: boolean;
        };
        Returns: {
          booking_id: string;
          verification_expires_at: string;
        }[];
      };
      create_service_with_resources: {
        Args: {
          p_allow_client_cancellation: boolean;
          p_allow_client_rescheduling: boolean;
          p_approval_policy: Database["public"]["Enums"]["service_approval_policy"];
          p_buffer_after_minutes: number;
          p_buffer_before_minutes: number;
          p_cancellation_notice_minutes: number;
          p_description: string;
          p_duration_minutes: number;
          p_name: string;
          p_price_cents: number;
          p_resource_ids: string[];
          p_tenant_id: string;
        };
        Returns: string;
      };
      get_public_booking_catalog: {
        Args: { p_booking_slug: string };
        Returns: {
          location_id: string;
          location_name: string;
          location_timezone: string;
          organization_name: string;
          service_currency: string;
          service_description: string;
          service_duration_minutes: number;
          service_id: string;
          service_name: string;
          service_price_cents: number;
        }[];
      };
      issue_email_booking_verification: {
        Args: { p_booking_id: string };
        Returns: {
          already_verified: boolean;
          expires_at: string;
          recipient_email: string;
          token: string;
          verification_id: string;
        }[];
      };
      issue_public_booking_verification: {
        Args: {
          p_booking_id: string;
          p_channel: Database["public"]["Enums"]["booking_verification_channel"];
        };
        Returns: {
          expires_at: string;
          recipient: string;
          token: string;
          verification_id: string;
        }[];
      };
      list_available_slots: {
        Args: {
          p_date: string;
          p_interval_minutes?: number;
          p_location_id: string;
          p_resource_id?: string;
          p_service_id: string;
          p_tenant_id: string;
        };
        Returns: {
          available_resource_count: number;
          ends_at: string;
          resource_ids: string[];
          starts_at: string;
        }[];
      };
      list_public_available_slots: {
        Args: {
          p_date: string;
          p_interval_minutes?: number;
          p_location_id: string;
          p_resource_id?: string;
          p_service_id: string;
        };
        Returns: {
          available_resource_count: number;
          ends_at: string;
          starts_at: string;
        }[];
      };
      resolve_pending_booking_approval: {
        Args: {
          p_booking_id: string;
          p_status: Database["public"]["Enums"]["booking_status"];
        };
        Returns: Database["public"]["Enums"]["booking_status"];
      };
      set_public_booking_confirmation_channel: {
        Args: {
          p_booking_id: string;
          p_channel: Database["public"]["Enums"]["booking_verification_channel"];
        };
        Returns: undefined;
      };
      verify_public_booking_confirmation: {
        Args: { p_token: string };
        Returns: boolean;
      };
      verify_public_booking_email: {
        Args: { p_token: string };
        Returns: boolean;
      };
    };
    Enums: {
      availability_exception_kind: "available" | "unavailable";
      booking_status:
        | "pending_verification"
        | "pending_approval"
        | "confirmed"
        | "cancelled"
        | "rescheduled"
        | "no_show";
      booking_verification_channel: "email" | "sms" | "whatsapp";
      customer_contact_kind: "email" | "phone";
      customer_preferred_channel: "email" | "sms" | "whatsapp";
      organization_role: "owner" | "admin" | "staff";
      resource_kind: "person" | "room" | "court" | "equipment" | "other";
      service_approval_policy: "automatic" | "manual";
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      availability_exception_kind: ["available", "unavailable"],
      booking_status: [
        "pending_verification",
        "pending_approval",
        "confirmed",
        "cancelled",
        "rescheduled",
        "no_show",
      ],
      booking_verification_channel: ["email", "sms", "whatsapp"],
      customer_contact_kind: ["email", "phone"],
      customer_preferred_channel: ["email", "sms", "whatsapp"],
      organization_role: ["owner", "admin", "staff"],
      resource_kind: ["person", "room", "court", "equipment", "other"],
      service_approval_policy: ["automatic", "manual"],
    },
  },
} as const;
