export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ducks: {
        Row: {
          id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          name: string
          description: string | null
          type: 'free_item' | 'discount' | 'bonus_ducks'
          value: string
          duck_threshold: number
          expiry_days: number | null
          stock: number | null
          image_url: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          type: 'free_item' | 'discount' | 'bonus_ducks'
          value: string
          duck_threshold?: number
          expiry_days?: number | null
          stock?: number | null
          image_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          type?: 'free_item' | 'discount' | 'bonus_ducks'
          value?: string
          duck_threshold?: number
          expiry_days?: number | null
          stock?: number | null
          image_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_rewards: {
        Row: {
          id: string
          user_id: string
          reward_id: string
          status: 'active' | 'redeemed' | 'expired'
          qr_code: string
          expires_at: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reward_id: string
          status?: 'active' | 'redeemed' | 'expired'
          qr_code: string
          expires_at?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reward_id?: string
          status?: 'active' | 'redeemed' | 'expired'
          qr_code?: string
          expires_at?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          created_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referee_id: string | null
          referee_email: string | null
          confirmed: boolean
          confirmed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referee_id?: string | null
          referee_email?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referee_id?: string | null
          referee_email?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
        }
      }
      staff: {
        Row: {
          id: string
          user_id: string
          role: 'owner' | 'employee'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: 'owner' | 'employee'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'owner' | 'employee'
          created_at?: string
          updated_at?: string
        }
      }
      mini_games: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          icon: string | null
          enabled: boolean
          play_limit_per_day: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          icon?: string | null
          enabled?: boolean
          play_limit_per_day?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          icon?: string | null
          enabled?: boolean
          play_limit_per_day?: number
          created_at?: string
          updated_at?: string
        }
      }
      game_prizes: {
        Row: {
          id: string
          game_id: string
          prize_type: 'ducks' | 'reward' | 'nothing'
          prize_value: number | null
          probability: number
          label: string
          daily_limit: number | null
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          prize_type: 'ducks' | 'reward' | 'nothing'
          prize_value?: number | null
          probability: number
          label: string
          daily_limit?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          prize_type?: 'ducks' | 'reward' | 'nothing'
          prize_value?: number | null
          probability?: number
          label?: string
          daily_limit?: number | null
          created_at?: string
        }
      }
      game_plays: {
        Row: {
          id: string
          user_id: string
          game_id: string
          prize_type: string
          prize_value: number | null
          reward_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          prize_type: string
          prize_value?: number | null
          reward_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          prize_type?: string
          prize_value?: number | null
          reward_id?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          action: string
          details: Json | null
          staff_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          details?: Json | null
          staff_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          details?: Json | null
          staff_id?: string | null
          created_at?: string
        }
      }
      promotional_offers: {
        Row: {
          id: string
          title: string
          description: string
          terms: string | null
          reward_type: 'free_item' | 'discount' | 'bonus_beans' | 'custom'
          reward_value: string
          reward_description: string | null
          icon: string
          image_url: string | null
          button_text: string
          redemption_limit: number | null
          total_redemption_limit: number | null
          redemptions_count: number
          voucher_expiry_hours: number
          auto_create_voucher: boolean
          active: boolean
          start_date: string | null
          end_date: string | null
          target_audience: string
          min_beans: number | null
          max_beans: number | null
          priority: number
          show_as_modal: boolean
          show_as_notification: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          terms?: string | null
          reward_type: 'free_item' | 'discount' | 'bonus_beans' | 'custom'
          reward_value: string
          reward_description?: string | null
          icon?: string
          image_url?: string | null
          button_text?: string
          redemption_limit?: number | null
          total_redemption_limit?: number | null
          redemptions_count?: number
          voucher_expiry_hours?: number
          auto_create_voucher?: boolean
          active?: boolean
          start_date?: string | null
          end_date?: string | null
          target_audience?: string
          min_beans?: number | null
          max_beans?: number | null
          priority?: number
          show_as_modal?: boolean
          show_as_notification?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          terms?: string | null
          reward_type?: 'free_item' | 'discount' | 'bonus_beans' | 'custom'
          reward_value?: string
          reward_description?: string | null
          icon?: string
          image_url?: string | null
          button_text?: string
          redemption_limit?: number | null
          total_redemption_limit?: number | null
          redemptions_count?: number
          voucher_expiry_hours?: number
          auto_create_voucher?: boolean
          active?: boolean
          start_date?: string | null
          end_date?: string | null
          target_audience?: string
          min_beans?: number | null
          max_beans?: number | null
          priority?: number
          show_as_modal?: boolean
          show_as_notification?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      user_promotional_offers: {
        Row: {
          id: string
          user_id: string
          offer_id: string
          viewed_at: string
          redeemed_at: string | null
          voucher_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          offer_id: string
          viewed_at?: string
          redeemed_at?: string | null
          voucher_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          offer_id?: string
          viewed_at?: string
          redeemed_at?: string | null
          voucher_id?: string | null
          created_at?: string
        }
      }
      promotional_offer_rewards: {
        Row: {
          id: string
          offer_id: string
          reward_id: string | null
          custom_name: string | null
          custom_description: string | null
          custom_type: 'free_item' | 'discount' | 'bonus_beans' | null
          custom_value: string | null
          created_at: string
        }
        Insert: {
          id?: string
          offer_id: string
          reward_id?: string | null
          custom_name?: string | null
          custom_description?: string | null
          custom_type?: 'free_item' | 'discount' | 'bonus_beans' | null
          custom_value?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          offer_id?: string
          reward_id?: string | null
          custom_name?: string | null
          custom_description?: string | null
          custom_type?: 'free_item' | 'discount' | 'bonus_beans' | null
          custom_value?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      can_check_in: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      get_user_duck_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      can_play_game: {
        Args: { p_user_id: string; p_game_id: string }
        Returns: boolean
      }
      get_user_promotional_offers: {
        Args: { p_user_id: string }
        Returns: Array<{
          id: string
          title: string
          description: string
          terms: string | null
          reward_type: string
          reward_value: string
          reward_description: string | null
          icon: string
          image_url: string | null
          button_text: string
          priority: number
          show_as_modal: boolean
          show_as_notification: boolean
          has_redeemed: boolean
          redemptions_remaining: number | null
        }>
      }
      redeem_promotional_offer: {
        Args: { p_user_id: string; p_offer_id: string }
        Returns: Array<{
          success: boolean
          message: string
          voucher_id: string | null
          voucher_code: string | null
        }>
      }
      mark_promotional_offer_viewed: {
        Args: { p_user_id: string; p_offer_id: string }
        Returns: boolean
      }
    }
  }
}
