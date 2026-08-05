/**
 * Database types matching supabase/migrations/20260322000000_init.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "free" | "core" | "gold" | "admin";
export type UserPlan = "free" | "core" | "gold";
export type MarketStatus = "active" | "closed" | "resolved" | "archived";
export type ResolvedOutcome = "yes" | "no" | "unknown";
export type PredictionSide = "yes" | "no";
export type PredictionStatus =
  | "active"
  | "frozen"
  | "resolved"
  | "expired"
  | "invalidated";
export type ModelRunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete";
export type PositionStatus = "open" | "closed" | "resolved";
export type SystemHealthStatus =
  | "healthy"
  | "degraded"
  | "unhealthy"
  | "unknown"
  | "running"
  | "idle";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          plan: UserPlan;
          timezone: string | null;
          locale: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          plan?: UserPlan;
          timezone?: string | null;
          locale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          plan?: UserPlan;
          timezone?: string | null;
          locale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      markets: {
        Row: {
          id: string;
          polymarket_id: string;
          condition_id: string | null;
          slug: string | null;
          question: string;
          description: string | null;
          category: string | null;
          tags: string[] | null;
          status: MarketStatus;
          outcome_prices: number[] | null;
          yes_price: number | null;
          no_price: number | null;
          volume: number | null;
          liquidity: number | null;
          open_interest: number | null;
          end_date: string | null;
          resolved_at: string | null;
          resolved_outcome: ResolvedOutcome | null;
          clob_token_ids: string[] | null;
          metadata: Json;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          polymarket_id: string;
          condition_id?: string | null;
          slug?: string | null;
          question: string;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          status?: MarketStatus;
          outcome_prices?: number[] | null;
          yes_price?: number | null;
          no_price?: number | null;
          volume?: number | null;
          liquidity?: number | null;
          open_interest?: number | null;
          end_date?: string | null;
          resolved_at?: string | null;
          resolved_outcome?: ResolvedOutcome | null;
          clob_token_ids?: string[] | null;
          metadata?: Json;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          polymarket_id?: string;
          condition_id?: string | null;
          slug?: string | null;
          question?: string;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          status?: MarketStatus;
          outcome_prices?: number[] | null;
          yes_price?: number | null;
          no_price?: number | null;
          volume?: number | null;
          liquidity?: number | null;
          open_interest?: number | null;
          end_date?: string | null;
          resolved_at?: string | null;
          resolved_outcome?: ResolvedOutcome | null;
          clob_token_ids?: string[] | null;
          metadata?: Json;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      market_snapshots: {
        Row: {
          id: string;
          market_id: string;
          yes_price: number | null;
          no_price: number | null;
          volume: number | null;
          liquidity: number | null;
          open_interest: number | null;
          best_bid: number | null;
          best_ask: number | null;
          spread: number | null;
          snapshot_at: string;
          source: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          market_id: string;
          yes_price?: number | null;
          no_price?: number | null;
          volume?: number | null;
          liquidity?: number | null;
          open_interest?: number | null;
          best_bid?: number | null;
          best_ask?: number | null;
          spread?: number | null;
          snapshot_at?: string;
          source?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          market_id?: string;
          yes_price?: number | null;
          no_price?: number | null;
          volume?: number | null;
          liquidity?: number | null;
          open_interest?: number | null;
          best_bid?: number | null;
          best_ask?: number | null;
          spread?: number | null;
          snapshot_at?: string;
          source?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "market_snapshots_market_id_fkey";
            columns: ["market_id"];
            isOneToOne: false;
            referencedRelation: "markets";
            referencedColumns: ["id"];
          },
        ];
      };
      model_versions: {
        Row: {
          id: string;
          name: string;
          version: string;
          description: string | null;
          configuration: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          version: string;
          description?: string | null;
          configuration?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          version?: string;
          description?: string | null;
          configuration?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      model_runs: {
        Row: {
          id: string;
          model_version_id: string;
          status: ModelRunStatus;
          started_at: string | null;
          finished_at: string | null;
          markets_processed: number;
          predictions_created: number;
          error_message: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          model_version_id: string;
          status?: ModelRunStatus;
          started_at?: string | null;
          finished_at?: string | null;
          markets_processed?: number;
          predictions_created?: number;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          model_version_id?: string;
          status?: ModelRunStatus;
          started_at?: string | null;
          finished_at?: string | null;
          markets_processed?: number;
          predictions_created?: number;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "model_runs_model_version_id_fkey";
            columns: ["model_version_id"];
            isOneToOne: false;
            referencedRelation: "model_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      predictions: {
        Row: {
          id: string;
          market_id: string;
          model_run_id: string | null;
          model_version_id: string;
          side: PredictionSide;
          fair_probability: number;
          market_probability: number;
          edge: number;
          confidence: number;
          quality_score: number | null;
          is_gold: boolean;
          is_frozen: boolean;
          status: PredictionStatus;
          time_bucket: string | null;
          resolved_correct: boolean | null;
          frozen_at: string | null;
          resolved_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          market_id: string;
          model_run_id?: string | null;
          model_version_id: string;
          side: PredictionSide;
          fair_probability: number;
          market_probability: number;
          edge: number;
          confidence: number;
          quality_score?: number | null;
          is_gold?: boolean;
          is_frozen?: boolean;
          status?: PredictionStatus;
          time_bucket?: string | null;
          resolved_correct?: boolean | null;
          frozen_at?: string | null;
          resolved_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          market_id?: string;
          model_run_id?: string | null;
          model_version_id?: string;
          side?: PredictionSide;
          fair_probability?: number;
          market_probability?: number;
          edge?: number;
          confidence?: number;
          quality_score?: number | null;
          is_gold?: boolean;
          is_frozen?: boolean;
          status?: PredictionStatus;
          time_bucket?: string | null;
          resolved_correct?: boolean | null;
          frozen_at?: string | null;
          resolved_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "predictions_market_id_fkey";
            columns: ["market_id"];
            isOneToOne: false;
            referencedRelation: "markets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "predictions_model_run_id_fkey";
            columns: ["model_run_id"];
            isOneToOne: false;
            referencedRelation: "model_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "predictions_model_version_id_fkey";
            columns: ["model_version_id"];
            isOneToOne: false;
            referencedRelation: "model_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      prediction_factors: {
        Row: {
          id: string;
          prediction_id: string;
          factor_name: string;
          factor_value: number;
          weight: number;
          contribution: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          prediction_id: string;
          factor_name: string;
          factor_value: number;
          weight?: number;
          contribution?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          prediction_id?: string;
          factor_name?: string;
          factor_value?: number;
          weight?: number;
          contribution?: number;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prediction_factors_prediction_id_fkey";
            columns: ["prediction_id"];
            isOneToOne: false;
            referencedRelation: "predictions";
            referencedColumns: ["id"];
          },
        ];
      };
      wallets: {
        Row: {
          id: string;
          address: string;
          label: string | null;
          category: string | null;
          win_rate: number | null;
          total_pnl: number | null;
          trade_count: number;
          volume_traded: number | null;
          is_tracked: boolean;
          metadata: Json;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          address: string;
          label?: string | null;
          category?: string | null;
          win_rate?: number | null;
          total_pnl?: number | null;
          trade_count?: number;
          volume_traded?: number | null;
          is_tracked?: boolean;
          metadata?: Json;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          address?: string;
          label?: string | null;
          category?: string | null;
          win_rate?: number | null;
          total_pnl?: number | null;
          trade_count?: number;
          volume_traded?: number | null;
          is_tracked?: boolean;
          metadata?: Json;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wallet_positions: {
        Row: {
          id: string;
          wallet_id: string;
          market_id: string;
          side: PredictionSide;
          size: number;
          avg_price: number | null;
          current_value: number | null;
          pnl: number | null;
          status: PositionStatus;
          opened_at: string;
          closed_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_id: string;
          market_id: string;
          side: PredictionSide;
          size: number;
          avg_price?: number | null;
          current_value?: number | null;
          pnl?: number | null;
          status?: PositionStatus;
          opened_at?: string;
          closed_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_id?: string;
          market_id?: string;
          side?: PredictionSide;
          size?: number;
          avg_price?: number | null;
          current_value?: number | null;
          pnl?: number | null;
          status?: PositionStatus;
          opened_at?: string;
          closed_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wallet_positions_wallet_id_fkey";
            columns: ["wallet_id"];
            isOneToOne: false;
            referencedRelation: "wallets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wallet_positions_market_id_fkey";
            columns: ["market_id"];
            isOneToOne: false;
            referencedRelation: "markets";
            referencedColumns: ["id"];
          },
        ];
      };
      wallet_consensus: {
        Row: {
          id: string;
          market_id: string;
          side: PredictionSide;
          wallet_count: number;
          total_size: number;
          consensus_score: number;
          snapshot_at: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          market_id: string;
          side: PredictionSide;
          wallet_count?: number;
          total_size?: number;
          consensus_score?: number;
          snapshot_at?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          market_id?: string;
          side?: PredictionSide;
          wallet_count?: number;
          total_size?: number;
          consensus_score?: number;
          snapshot_at?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wallet_consensus_market_id_fkey";
            columns: ["market_id"];
            isOneToOne: false;
            referencedRelation: "markets";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          market_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          market_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          market_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_market_id_fkey";
            columns: ["market_id"];
            isOneToOne: false;
            referencedRelation: "markets";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          preferences: Json;
          min_edge: number | null;
          min_confidence: number | null;
          categories: string[] | null;
          notify_email: boolean;
          notify_push: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          preferences?: Json;
          min_edge?: number | null;
          min_confidence?: number | null;
          categories?: string[] | null;
          notify_email?: boolean;
          notify_push?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          preferences?: Json;
          min_edge?: number | null;
          min_confidence?: number | null;
          categories?: string[] | null;
          notify_email?: boolean;
          notify_push?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: UserPlan;
          status: SubscriptionStatus;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: UserPlan;
          status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: UserPlan;
          status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      system_health: {
        Row: {
          id: string;
          service_name: string;
          status: SystemHealthStatus;
          last_success_at: string | null;
          last_error: string | null;
          last_run_at: string | null;
          locked_until: string | null;
          lock_owner: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_name: string;
          status?: SystemHealthStatus;
          last_success_at?: string | null;
          last_error?: string | null;
          last_run_at?: string | null;
          locked_until?: string | null;
          lock_owner?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_name?: string;
          status?: SystemHealthStatus;
          last_success_at?: string | null;
          last_error?: string | null;
          last_run_at?: string | null;
          locked_until?: string | null;
          lock_owner?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      system_health_public: {
        Row: {
          service_name: string | null;
          status: SystemHealthStatus | null;
          last_success_at: string | null;
          last_run_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      try_acquire_job_lock: {
        Args: {
          p_service_name: string;
          p_owner: string;
          p_ttl_seconds?: number;
        };
        Returns: boolean;
      };
      release_job_lock: {
        Args: {
          p_service_name: string;
          p_owner: string;
          p_status?: string;
          p_error?: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
