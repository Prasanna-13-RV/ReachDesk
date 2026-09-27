// Hand-written mirror of supabase/migrations/0001_init.sql.
// If you have the Supabase CLI, prefer regenerating this with:
//   supabase gen types typescript --project-id <ref> > src/types/database.ts

export type ContactStatus =
  | "pending"
  | "prepared"
  | "contacted"
  | "replied"
  | "follow_up"
  | "not_interested"
  | "do_not_contact"
  | "won";

export type TemplateStatus = "active" | "archived";
export type CampaignStatus = "active" | "archived";
export type MessageEventType = "prepared" | "copied" | "opened_whatsapp";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          total_score: number | null;
          reviews_count: number | null;
          street: string | null;
          city: string | null;
          state: string | null;
          country_code: string | null;
          website: string | null;
          phone_raw: string | null;
          phone_normalized: string | null;
          phone_valid: boolean;
          source_categories: string[];
          category_name: string | null;
          source_url: string | null;
          status: ContactStatus;
          notes: string | null;
          is_archived: boolean;
          do_not_contact: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["contacts"]["Row"],
          | "id"
          | "created_at"
          | "updated_at"
          | "phone_valid"
          | "source_categories"
          | "status"
          | "is_archived"
          | "do_not_contact"
          | "total_score"
          | "reviews_count"
          | "street"
          | "city"
          | "state"
          | "country_code"
          | "website"
          | "phone_raw"
          | "phone_normalized"
          | "category_name"
          | "source_url"
          | "notes"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          phone_valid?: boolean;
          source_categories?: string[];
          status?: ContactStatus;
          is_archived?: boolean;
          do_not_contact?: boolean;
          total_score?: number | null;
          reviews_count?: number | null;
          street?: string | null;
          city?: string | null;
          state?: string | null;
          country_code?: string | null;
          website?: string | null;
          phone_raw?: string | null;
          phone_normalized?: string | null;
          category_name?: string | null;
          source_url?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          template_id: string | null;
          status: CampaignStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["campaigns"]["Row"],
          "id" | "created_at" | "updated_at" | "status" | "description" | "template_id"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: CampaignStatus;
          description?: string | null;
          template_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
        Relationships: [];
      };
      campaign_contacts: {
        Row: {
          campaign_id: string;
          contact_id: string;
          added_at: string;
        };
        Insert: {
          campaign_id: string;
          contact_id: string;
          added_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["campaign_contacts"]["Insert"]>;
        Relationships: [];
      };
      message_templates: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string | null;
          name: string;
          content: string;
          status: TemplateStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["message_templates"]["Row"],
          "id" | "created_at" | "updated_at" | "status" | "campaign_id"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: TemplateStatus;
          campaign_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["message_templates"]["Insert"]>;
        Relationships: [];
      };
      message_events: {
        Row: {
          id: string;
          user_id: string;
          contact_id: string;
          campaign_id: string | null;
          template_id: string | null;
          event_type: MessageEventType;
          message_snapshot: string;
          phone_used: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["message_events"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["message_events"]["Insert"]>;
        Relationships: [];
      };
      imports: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          row_count: number;
          imported_count: number;
          rejected_count: number;
          duplicate_count: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["imports"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["imports"]["Insert"]>;
        Relationships: [];
      };
      import_errors: {
        Row: {
          id: string;
          import_id: string;
          row_number: number;
          field: string | null;
          error_message: string;
        };
        Insert: Omit<Database["public"]["Tables"]["import_errors"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["import_errors"]["Insert"]>;
        Relationships: [];
      };
      column_mappings: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          mapping: Record<string, string>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["column_mappings"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["column_mappings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
