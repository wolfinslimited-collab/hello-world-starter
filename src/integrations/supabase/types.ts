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
      airdrop_tokens: {
        Row: {
          category: string | null
          chain_id: number | null
          contract_address: string | null
          cover_url: string | null
          created_at: string
          daily_reward: number
          decimals: number
          description: string | null
          discord_url: string | null
          ends_at: string | null
          id: number
          initial_airdrop: number
          is_active: boolean
          is_featured: boolean
          logo_url: string | null
          name: string
          network: string | null
          price: number
          slug: string
          starts_at: string | null
          symbol: string
          tags: string[] | null
          telegram_url: string | null
          total_claimed: number
          total_supply: number
          twitter_url: string | null
          website_url: string | null
          whitepaper_url: string | null
        }
        Insert: {
          category?: string | null
          chain_id?: number | null
          contract_address?: string | null
          cover_url?: string | null
          created_at?: string
          daily_reward?: number
          decimals?: number
          description?: string | null
          discord_url?: string | null
          ends_at?: string | null
          id?: number
          initial_airdrop?: number
          is_active?: boolean
          is_featured?: boolean
          logo_url?: string | null
          name: string
          network?: string | null
          price?: number
          slug: string
          starts_at?: string | null
          symbol: string
          tags?: string[] | null
          telegram_url?: string | null
          total_claimed?: number
          total_supply?: number
          twitter_url?: string | null
          website_url?: string | null
          whitepaper_url?: string | null
        }
        Update: {
          category?: string | null
          chain_id?: number | null
          contract_address?: string | null
          cover_url?: string | null
          created_at?: string
          daily_reward?: number
          decimals?: number
          description?: string | null
          discord_url?: string | null
          ends_at?: string | null
          id?: number
          initial_airdrop?: number
          is_active?: boolean
          is_featured?: boolean
          logo_url?: string | null
          name?: string
          network?: string | null
          price?: number
          slug?: string
          starts_at?: string | null
          symbol?: string
          tags?: string[] | null
          telegram_url?: string | null
          total_claimed?: number
          total_supply?: number
          twitter_url?: string | null
          website_url?: string | null
          whitepaper_url?: string | null
        }
        Relationships: []
      }
      asset_networks: {
        Row: {
          asset_id: number
          can_deposit: boolean
          can_withdraw: boolean
          contract_address: string | null
          decimals: number
          id: number
          is_active: boolean
          min_deposit: number
          min_withdraw: number
          network_id: number
          withdraw_fee: number
        }
        Insert: {
          asset_id: number
          can_deposit?: boolean
          can_withdraw?: boolean
          contract_address?: string | null
          decimals?: number
          id?: number
          is_active?: boolean
          min_deposit?: number
          min_withdraw?: number
          network_id: number
          withdraw_fee?: number
        }
        Update: {
          asset_id?: number
          can_deposit?: boolean
          can_withdraw?: boolean
          contract_address?: string | null
          decimals?: number
          id?: number
          is_active?: boolean
          min_deposit?: number
          min_withdraw?: number
          network_id?: number
          withdraw_fee?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_networks_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_networks_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          active: boolean
          created_at: string
          id: number
          logo: string | null
          name: string
          price: number
          symbol: string
          visible: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: number
          logo?: string | null
          name: string
          price?: number
          symbol: string
          visible?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: number
          logo?: string | null
          name?: string
          price?: number
          symbol?: string
          visible?: boolean
        }
        Relationships: []
      }
      auth_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: number
          token: string
          user_id: number
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: number
          token: string
          user_id: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: number
          token?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "auth_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          id: number
          period: string
          score: number
          start_date: string
          updated_at: string
          user_id: number
        }
        Insert: {
          id?: number
          period: string
          score?: number
          start_date: string
          updated_at?: string
          user_id: number
        }
        Update: {
          id?: number
          period?: string
          score?: number
          start_date?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          address: string
          chain: string
          created_at: string
          id: number
          signature: string | null
          user_id: number
        }
        Insert: {
          address: string
          chain: string
          created_at?: string
          id?: number
          signature?: string | null
          user_id: number
        }
        Update: {
          address?: string
          chain?: string
          created_at?: string
          id?: number
          signature?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          action_url: string | null
          created_at: string
          description: string | null
          force: boolean
          id: number
          is_active: boolean
          logo: string | null
          meta: Json | null
          order_id: number
          provider: string
          reward_amount: number
          tags: string[] | null
          title: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          description?: string | null
          force?: boolean
          id?: number
          is_active?: boolean
          logo?: string | null
          meta?: Json | null
          order_id?: number
          provider?: string
          reward_amount?: number
          tags?: string[] | null
          title: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          description?: string | null
          force?: boolean
          id?: number
          is_active?: boolean
          logo?: string | null
          meta?: Json | null
          order_id?: number
          provider?: string
          reward_amount?: number
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      networks: {
        Row: {
          chain: string
          created_at: string
          explorer_url: string | null
          id: number
          is_active: boolean
          logo: string | null
          main_address: string | null
          name: string
        }
        Insert: {
          chain: string
          created_at?: string
          explorer_url?: string | null
          id?: number
          is_active?: boolean
          logo?: string | null
          main_address?: string | null
          name: string
        }
        Update: {
          chain?: string
          created_at?: string
          explorer_url?: string | null
          id?: number
          is_active?: boolean
          logo?: string | null
          main_address?: string | null
          name?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          avg_fill_price: number
          created_at: string
          error_message: string | null
          external_id: string | null
          filled_qty: number
          id: number
          is_isolated: boolean
          leverage: number
          pair_id: number
          price: number | null
          quantity: number
          side: string
          status: string
          type: string
          updated_at: string
          user_id: number
        }
        Insert: {
          avg_fill_price?: number
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          filled_qty?: number
          id?: number
          is_isolated?: boolean
          leverage?: number
          pair_id: number
          price?: number | null
          quantity: number
          side: string
          status?: string
          type: string
          updated_at?: string
          user_id: number
        }
        Update: {
          avg_fill_price?: number
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          filled_qty?: number
          id?: number
          is_isolated?: boolean
          leverage?: number
          pair_id?: number
          price?: number | null
          quantity?: number
          side?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "trading_pairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          amount: number
          created_at: string
          entry_price: number
          id: number
          is_open: boolean
          leverage: number
          liquidation_price: number | null
          margin: number
          pair_id: number
          side: string
          unrealized_pnl: number
          updated_at: string
          user_id: number
        }
        Insert: {
          amount: number
          created_at?: string
          entry_price: number
          id?: number
          is_open?: boolean
          leverage?: number
          liquidation_price?: number | null
          margin?: number
          pair_id: number
          side: string
          unrealized_pnl?: number
          updated_at?: string
          user_id: number
        }
        Update: {
          amount?: number
          created_at?: string
          entry_price?: number
          id?: number
          is_open?: boolean
          leverage?: number
          liquidation_price?: number | null
          margin?: number
          pair_id?: number
          side?: string
          unrealized_pnl?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "positions_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "trading_pairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: number
          referee_id: number
          referrer_id: number
          status: boolean
        }
        Insert: {
          created_at?: string
          id?: number
          referee_id: number
          referrer_id: number
          status?: boolean
        }
        Update: {
          created_at?: string
          id?: number
          referee_id?: number
          referrer_id?: number
          status?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_pairs: {
        Row: {
          active: boolean
          base: string
          base_asset_id: number | null
          created_at: string
          external_symbol: string | null
          id: number
          max_qty: number
          min_price: number
          min_qty: number
          price_precision: number
          provider: string
          quantity_precision: number
          quote: string
          quote_asset_id: number | null
          status: number
          step_size: number
          symbol: string
          tick_size: number
          type: string
        }
        Insert: {
          active?: boolean
          base: string
          base_asset_id?: number | null
          created_at?: string
          external_symbol?: string | null
          id?: number
          max_qty?: number
          min_price?: number
          min_qty?: number
          price_precision?: number
          provider?: string
          quantity_precision?: number
          quote: string
          quote_asset_id?: number | null
          status?: number
          step_size?: number
          symbol: string
          tick_size?: number
          type?: string
        }
        Update: {
          active?: boolean
          base?: string
          base_asset_id?: number | null
          created_at?: string
          external_symbol?: string | null
          id?: number
          max_qty?: number
          min_price?: number
          min_qty?: number
          price_precision?: number
          provider?: string
          quantity_precision?: number
          quote?: string
          quote_asset_id?: number | null
          status?: number
          step_size?: number
          symbol?: string
          tick_size?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_pairs_base_asset_id_fkey"
            columns: ["base_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trading_pairs_quote_asset_id_fkey"
            columns: ["quote_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: number
          tag: string
          type: string
          user_id: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: number
          tag: string
          type: string
          user_id: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: number
          tag?: string
          type?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_missions: {
        Row: {
          completed_at: string
          id: number
          mission_id: number
          user_id: number
        }
        Insert: {
          completed_at?: string
          id?: number
          mission_id: number
          user_id: number
        }
        Update: {
          completed_at?: string
          id?: number
          mission_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tokens: {
        Row: {
          balance: number
          created_at: string
          id: number
          last_action_at: string
          token_id: number
          updated_at: string
          user_id: number
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: number
          last_action_at?: string
          token_id: number
          updated_at?: string
          user_id: number
        }
        Update: {
          balance?: number
          created_at?: string
          id?: number
          last_action_at?: string
          token_id?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_tokens_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "airdrop_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          boost: number
          created_at: string
          friends: number
          full_name: string | null
          id: number
          level: number
          remain_friends: number
          status: string
          updated_at: string
        }
        Insert: {
          boost?: number
          created_at?: string
          friends?: number
          full_name?: string | null
          id?: number
          level?: number
          remain_friends?: number
          status?: string
          updated_at?: string
        }
        Update: {
          boost?: number
          created_at?: string
          friends?: number
          full_name?: string | null
          id?: number
          level?: number
          remain_friends?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          asset_id: number
          created_at: string
          from_address: string | null
          id: number
          memo: string | null
          network_id: number | null
          status: string
          to_address: string | null
          tx_id: string | null
          type: string
          updated_at: string
          user_id: number
        }
        Insert: {
          amount: number
          asset_id: number
          created_at?: string
          from_address?: string | null
          id?: number
          memo?: string | null
          network_id?: number | null
          status?: string
          to_address?: string | null
          tx_id?: string | null
          type: string
          updated_at?: string
          user_id: number
        }
        Update: {
          amount?: number
          asset_id?: number
          created_at?: string
          from_address?: string | null
          id?: number
          memo?: string | null
          network_id?: number | null
          status?: string
          to_address?: string | null
          tx_id?: string | null
          type?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          asset_id: number
          balance: number
          id: number
          locked: number
          updated_at: string
          user_id: number
        }
        Insert: {
          asset_id: number
          balance?: number
          id?: number
          locked?: number
          updated_at?: string
          user_id: number
        }
        Update: {
          asset_id?: number
          balance?: number
          id?: number
          locked?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "wallets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
