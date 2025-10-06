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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      breeding_pairs: {
        Row: {
          birth_date: string
          breeding_started_at: string
          created_at: string
          id: string
          is_born: boolean | null
          is_completed: boolean | null
          is_weaned: boolean | null
          litter_number: number | null
          litter_size: number | null
          parent1_breed: string | null
          parent1_id: string
          parent1_name: string | null
          parent2_breed: string | null
          parent2_id: string
          parent2_name: string | null
          user_id: string
          wean_date: string
        }
        Insert: {
          birth_date?: string
          breeding_started_at?: string
          created_at?: string
          id?: string
          is_born?: boolean | null
          is_completed?: boolean | null
          is_weaned?: boolean | null
          litter_number?: number | null
          litter_size?: number | null
          parent1_breed?: string | null
          parent1_id: string
          parent1_name?: string | null
          parent2_breed?: string | null
          parent2_id: string
          parent2_name?: string | null
          user_id: string
          wean_date?: string
        }
        Update: {
          birth_date?: string
          breeding_started_at?: string
          created_at?: string
          id?: string
          is_born?: boolean | null
          is_completed?: boolean | null
          is_weaned?: boolean | null
          litter_number?: number | null
          litter_size?: number | null
          parent1_breed?: string | null
          parent1_id?: string
          parent1_name?: string | null
          parent2_breed?: string | null
          parent2_id?: string
          parent2_name?: string | null
          user_id?: string
          wean_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "breeding_pairs_parent1_id_fkey"
            columns: ["parent1_id"]
            isOneToOne: false
            referencedRelation: "user_pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_pairs_parent2_id_fkey"
            columns: ["parent2_id"]
            isOneToOne: false
            referencedRelation: "user_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_rewards_log: {
        Row: {
          completed_at: string | null
          created_at: string
          error_details: Json | null
          errors_count: number | null
          execution_date: string
          id: string
          status: string
          trigger_source: string
          users_processed: number | null
          users_rewarded: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          errors_count?: number | null
          execution_date: string
          id?: string
          status?: string
          trigger_source?: string
          users_processed?: number | null
          users_rewarded?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          errors_count?: number | null
          execution_date?: string
          id?: string
          status?: string
          trigger_source?: string
          users_processed?: number | null
          users_rewarded?: number | null
        }
        Relationships: []
      }
      forum_poll_options: {
        Row: {
          created_at: string
          id: string
          option_text: string
          poll_id: string
          vote_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          option_text: string
          poll_id: string
          vote_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          option_text?: string
          poll_id?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "forum_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "forum_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "forum_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_polls: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          multiple_choice: boolean
          post_id: string
          question: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          multiple_choice?: boolean
          post_id: string
          question: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          multiple_choice?: boolean
          post_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_post_views: {
        Row: {
          id: string
          ip_address: unknown | null
          post_id: string
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          ip_address?: unknown | null
          post_id: string
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          ip_address?: unknown | null
          post_id?: string
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          content: string
          created_at: string | null
          edited_at: string | null
          forum_id: string
          id: string
          is_edited: boolean | null
          pinned: boolean
          title: string
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          edited_at?: string | null
          forum_id: string
          id?: string
          is_edited?: boolean | null
          pinned?: boolean
          title: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          edited_at?: string | null
          forum_id?: string
          id?: string
          is_edited?: boolean | null
          pinned?: boolean
          title?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_forum_posts_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_forum_id_fkey"
            columns: ["forum_id"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_forum_replies_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forums: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_position: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_position: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_position?: number
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      item_sales: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          is_private: boolean | null
          price_nd: number | null
          price_np: number | null
          quantity: number
          secret_link: string | null
          shop_item_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_private?: boolean | null
          price_nd?: number | null
          price_np?: number | null
          quantity?: number
          secret_link?: string | null
          shop_item_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_private?: boolean | null
          price_nd?: number | null
          price_np?: number | null
          quantity?: number
          secret_link?: string | null
          shop_item_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_sales_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      litter_babies: {
        Row: {
          birthday: string
          breed: string
          breeding_pair_id: string
          created_at: string
          curiosity: number
          description: string | null
          energy: number
          friendliness: number
          gender: string
          id: string
          loyalty: number
          parent1_breed: string | null
          parent2_breed: string | null
          pet_name: string
          playfulness: number
        }
        Insert: {
          birthday: string
          breed: string
          breeding_pair_id: string
          created_at?: string
          curiosity: number
          description?: string | null
          energy: number
          friendliness: number
          gender: string
          id?: string
          loyalty: number
          parent1_breed?: string | null
          parent2_breed?: string | null
          pet_name: string
          playfulness: number
        }
        Update: {
          birthday?: string
          breed?: string
          breeding_pair_id?: string
          created_at?: string
          curiosity?: number
          description?: string | null
          energy?: number
          friendliness?: number
          gender?: string
          id?: string
          loyalty?: number
          parent1_breed?: string | null
          parent2_breed?: string | null
          pet_name?: string
          playfulness?: number
        }
        Relationships: [
          {
            foreignKeyName: "litter_babies_breeding_pair_id_fkey"
            columns: ["breeding_pair_id"]
            isOneToOne: false
            referencedRelation: "breeding_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      litter_licenses: {
        Row: {
          created_at: string
          id: string
          pet_id: string | null
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pet_id?: string | null
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pet_id?: string | null
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      paw_dollar_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pet_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          user_pet_id: string
          xp_gained: number | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          user_pet_id: string
          xp_gained?: number | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          user_pet_id?: string
          xp_gained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_activities_user_pet_id_fkey"
            columns: ["user_pet_id"]
            isOneToOne: false
            referencedRelation: "user_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_sales: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_private: boolean | null
          price_nd: number
          secret_link: string | null
          seller_id: string
          target_username: string | null
          updated_at: string | null
          user_pet_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_private?: boolean | null
          price_nd: number
          secret_link?: string | null
          seller_id: string
          target_username?: string | null
          updated_at?: string | null
          user_pet_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_private?: boolean | null
          price_nd?: number
          secret_link?: string | null
          seller_id?: string
          target_username?: string | null
          updated_at?: string | null
          user_pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_sales_user_pet_id_fkey"
            columns: ["user_pet_id"]
            isOneToOne: false
            referencedRelation: "user_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_transactions: {
        Row: {
          created_at: string
          description: string
          id: string
          paw_dollars: number | null
          paw_points: number | null
          pet_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          paw_dollars?: number | null
          paw_points?: number | null
          pet_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          paw_dollars?: number | null
          paw_points?: number | null
          pet_id?: string
          user_id?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          base_curiosity: number
          base_energy: number
          base_friendliness: number
          base_loyalty: number
          base_playfulness: number
          created_at: string | null
          extra_stats: Json | null
          gender: string | null
          id: string
          image_url: string | null
          name: string
          type: Database["public"]["Enums"]["pet_type"]
        }
        Insert: {
          base_curiosity: number
          base_energy: number
          base_friendliness: number
          base_loyalty: number
          base_playfulness: number
          created_at?: string | null
          extra_stats?: Json | null
          gender?: string | null
          id?: string
          image_url?: string | null
          name: string
          type: Database["public"]["Enums"]["pet_type"]
        }
        Update: {
          base_curiosity?: number
          base_energy?: number
          base_friendliness?: number
          base_loyalty?: number
          base_playfulness?: number
          created_at?: string | null
          extra_stats?: Json | null
          gender?: string | null
          id?: string
          image_url?: string | null
          name?: string
          type?: Database["public"]["Enums"]["pet_type"]
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          like_type: Database["public"]["Enums"]["like_type"]
          post_id: string | null
          reply_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          like_type: Database["public"]["Enums"]["like_type"]
          post_id?: string | null
          reply_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          like_type?: Database["public"]["Enums"]["like_type"]
          post_id?: string | null
          reply_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          care_badge_days: number | null
          created_at: string | null
          daily_xp_earned: number | null
          default_adopt_gender: string | null
          email_address: string | null
          feeding_privacy: string | null
          food_bags: number | null
          id: string
          is_banned: boolean | null
          last_care_date: string | null
          last_daily_reward_date: string | null
          last_wheel_spin: string | null
          last_xp_date: string | null
          message_privacy: string | null
          nursery_visible: boolean | null
          paw_dollars: number | null
          paw_points: number | null
          pawclub_litter_licenses_granted_month: string | null
          pawclub_member: boolean | null
          profile_description: string | null
          profile_description_short: string | null
          profile_image_url: string | null
          profile_number: number | null
          tier: Database["public"]["Enums"]["user_tier"] | null
          updated_at: string | null
          username: string | null
          water_bags: number | null
          xp: number | null
        }
        Insert: {
          care_badge_days?: number | null
          created_at?: string | null
          daily_xp_earned?: number | null
          default_adopt_gender?: string | null
          email_address?: string | null
          feeding_privacy?: string | null
          food_bags?: number | null
          id: string
          is_banned?: boolean | null
          last_care_date?: string | null
          last_daily_reward_date?: string | null
          last_wheel_spin?: string | null
          last_xp_date?: string | null
          message_privacy?: string | null
          nursery_visible?: boolean | null
          paw_dollars?: number | null
          paw_points?: number | null
          pawclub_litter_licenses_granted_month?: string | null
          pawclub_member?: boolean | null
          profile_description?: string | null
          profile_description_short?: string | null
          profile_image_url?: string | null
          profile_number?: number | null
          tier?: Database["public"]["Enums"]["user_tier"] | null
          updated_at?: string | null
          username?: string | null
          water_bags?: number | null
          xp?: number | null
        }
        Update: {
          care_badge_days?: number | null
          created_at?: string | null
          daily_xp_earned?: number | null
          default_adopt_gender?: string | null
          email_address?: string | null
          feeding_privacy?: string | null
          food_bags?: number | null
          id?: string
          is_banned?: boolean | null
          last_care_date?: string | null
          last_daily_reward_date?: string | null
          last_wheel_spin?: string | null
          last_xp_date?: string | null
          message_privacy?: string | null
          nursery_visible?: boolean | null
          paw_dollars?: number | null
          paw_points?: number | null
          pawclub_litter_licenses_granted_month?: string | null
          pawclub_member?: boolean | null
          profile_description?: string | null
          profile_description_short?: string | null
          profile_image_url?: string | null
          profile_number?: number | null
          tier?: Database["public"]["Enums"]["user_tier"] | null
          updated_at?: string | null
          username?: string | null
          water_bags?: number | null
          xp?: number | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number | null
          created_at: string | null
          id: string
          user_id: string
          window_start: string | null
        }
        Insert: {
          action: string
          count?: number | null
          created_at?: string | null
          id?: string
          user_id: string
          window_start?: string | null
        }
        Update: {
          action?: string
          count?: number | null
          created_at?: string | null
          id?: string
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shelter_pets: {
        Row: {
          birthday: string | null
          breed: string | null
          curiosity: number | null
          description: string | null
          energy: number | null
          friendliness: number | null
          gender: string | null
          id: string
          is_available: boolean
          last_fed: string
          listed_at: string
          loyalty: number | null
          original_pet_id: string | null
          pet_name: string | null
          pet_number: number | null
          pet_type: string | null
          playfulness: number | null
          price_nd: number
          seller_id: string
          user_pet_id: string
        }
        Insert: {
          birthday?: string | null
          breed?: string | null
          curiosity?: number | null
          description?: string | null
          energy?: number | null
          friendliness?: number | null
          gender?: string | null
          id?: string
          is_available?: boolean
          last_fed?: string
          listed_at?: string
          loyalty?: number | null
          original_pet_id?: string | null
          pet_name?: string | null
          pet_number?: number | null
          pet_type?: string | null
          playfulness?: number | null
          price_nd?: number
          seller_id: string
          user_pet_id: string
        }
        Update: {
          birthday?: string | null
          breed?: string | null
          curiosity?: number | null
          description?: string | null
          energy?: number | null
          friendliness?: number | null
          gender?: string | null
          id?: string
          is_available?: boolean
          last_fed?: string
          listed_at?: string
          loyalty?: number | null
          original_pet_id?: string | null
          pet_name?: string | null
          pet_number?: number | null
          pet_type?: string | null
          playfulness?: number | null
          price_nd?: number
          seller_id?: string
          user_pet_id?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          item_type: string
          name: string
          price_nd: number | null
          price_np: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          item_type: string
          name: string
          price_nd?: number | null
          price_np?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          item_type?: string
          name?: string
          price_nd?: number | null
          price_np?: number | null
        }
        Relationships: []
      }
      stripe_payments: {
        Row: {
          amount_cents: number
          browser_verified: boolean | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          paw_dollars: number
          paw_dollars_credited: boolean | null
          retry_count: number | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string
          updated_at: string
          user_id: string
          webhook_received: boolean | null
        }
        Insert: {
          amount_cents: number
          browser_verified?: boolean | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          paw_dollars: number
          paw_dollars_credited?: boolean | null
          retry_count?: number | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id: string
          updated_at?: string
          user_id: string
          webhook_received?: boolean | null
        }
        Update: {
          amount_cents?: number
          browser_verified?: boolean | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          paw_dollars?: number
          paw_dollars_credited?: boolean | null
          retry_count?: number | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string
          updated_at?: string
          user_id?: string
          webhook_received?: boolean | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          last_license_grant_period_end: string | null
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_license_grant_period_end?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_license_grant_period_end?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trade_items: {
        Row: {
          created_at: string | null
          id: string
          owner_id: string
          quantity: number
          shop_item_id: string
          trade_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          owner_id: string
          quantity?: number
          shop_item_id: string
          trade_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          owner_id?: string
          quantity?: number
          shop_item_id?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_items_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_items_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_pets: {
        Row: {
          created_at: string | null
          id: string
          owner_id: string
          trade_id: string
          user_pet_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          owner_id: string
          trade_id: string
          user_pet_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          owner_id?: string
          trade_id?: string
          user_pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_pets_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_pets_user_pet_id_fkey"
            columns: ["user_pet_id"]
            isOneToOne: false
            referencedRelation: "user_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          initiator_confirmed: boolean | null
          initiator_id: string
          recipient_confirmed: boolean | null
          recipient_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          initiator_confirmed?: boolean | null
          initiator_id: string
          recipient_confirmed?: boolean | null
          recipient_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          initiator_confirmed?: boolean | null
          initiator_id?: string
          recipient_confirmed?: boolean | null
          recipient_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_counters: {
        Row: {
          counter_type: string
          current_value: number
          id: number
        }
        Insert: {
          counter_type: string
          current_value?: number
          id?: number
        }
        Update: {
          counter_type?: string
          current_value?: number
          id?: number
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          acquired_at: string | null
          id: string
          item_id: string
          quantity: number | null
          user_id: string
        }
        Insert: {
          acquired_at?: string | null
          id?: string
          item_id: string
          quantity?: number | null
          user_id: string
        }
        Update: {
          acquired_at?: string | null
          id?: string
          item_id?: string
          quantity?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory_items: {
        Row: {
          acquired_at: string
          id: string
          quantity: number
          shop_item_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          quantity?: number
          shop_item_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          quantity?: number
          shop_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_items_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_messages: {
        Row: {
          created_at: string | null
          id: string
          is_profile_message: boolean | null
          is_read: boolean | null
          message: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_profile_message?: boolean | null
          is_read?: boolean | null
          message: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_profile_message?: boolean | null
          is_read?: boolean | null
          message?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      user_pets: {
        Row: {
          about_section: string | null
          adopted_at: string | null
          birthday: string | null
          breed: string | null
          breeding_cooldown_until: string | null
          curiosity: number
          description: string | null
          display_order: number | null
          energy: number
          extra_stats: Json | null
          friendliness: number
          gender: string | null
          hunger: number | null
          id: string
          is_first_pet: boolean | null
          is_for_breeding: boolean | null
          is_locked: boolean | null
          is_odd_stat: boolean | null
          last_bred: string | null
          last_cleaned: string | null
          last_fed: string | null
          last_played: string | null
          last_watered: string | null
          lock_pin: string | null
          locked_at: string | null
          loyalty: number
          parent1_id: string | null
          parent2_id: string | null
          pet_id: string
          pet_name: string
          pet_number: number | null
          playfulness: number
          user_id: string
          water: number | null
        }
        Insert: {
          about_section?: string | null
          adopted_at?: string | null
          birthday?: string | null
          breed?: string | null
          breeding_cooldown_until?: string | null
          curiosity: number
          description?: string | null
          display_order?: number | null
          energy: number
          extra_stats?: Json | null
          friendliness: number
          gender?: string | null
          hunger?: number | null
          id?: string
          is_first_pet?: boolean | null
          is_for_breeding?: boolean | null
          is_locked?: boolean | null
          is_odd_stat?: boolean | null
          last_bred?: string | null
          last_cleaned?: string | null
          last_fed?: string | null
          last_played?: string | null
          last_watered?: string | null
          lock_pin?: string | null
          locked_at?: string | null
          loyalty: number
          parent1_id?: string | null
          parent2_id?: string | null
          pet_id: string
          pet_name: string
          pet_number?: number | null
          playfulness: number
          user_id: string
          water?: number | null
        }
        Update: {
          about_section?: string | null
          adopted_at?: string | null
          birthday?: string | null
          breed?: string | null
          breeding_cooldown_until?: string | null
          curiosity?: number
          description?: string | null
          display_order?: number | null
          energy?: number
          extra_stats?: Json | null
          friendliness?: number
          gender?: string | null
          hunger?: number | null
          id?: string
          is_first_pet?: boolean | null
          is_for_breeding?: boolean | null
          is_locked?: boolean | null
          is_odd_stat?: boolean | null
          last_bred?: string | null
          last_cleaned?: string | null
          last_fed?: string | null
          last_played?: string | null
          last_watered?: string | null
          lock_pin?: string | null
          locked_at?: string | null
          loyalty?: number
          parent1_id?: string | null
          parent2_id?: string | null
          pet_id?: string
          pet_name?: string
          pet_number?: number | null
          playfulness?: number
          user_id?: string
          water?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_pets_parent1_id_fkey"
            columns: ["parent1_id"]
            isOneToOne: false
            referencedRelation: "user_pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pets_parent2_id_fkey"
            columns: ["parent2_id"]
            isOneToOne: false
            referencedRelation: "user_pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      virtual_scenes: {
        Row: {
          background_url: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          scene_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          background_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          scene_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          background_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          scene_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          user_id: string
          xp_amount: number
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          user_id?: string
          xp_amount?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_friend_request: {
        Args: { request_id_param: string }
        Returns: boolean
      }
      adopt_shelter_pet: {
        Args: {
          adopter_id_param: string
          adoption_price_param: number
          shelter_pet_id_param: string
        }
        Returns: Json
      }
      collect_breeding_babies: {
        Args: { breeding_pair_id_param: string; user_id_param: string }
        Returns: Json
      }
      credit_paw_dollars_safe: {
        Args: {
          paw_dollars_amount: number
          payment_id: string
          user_id_param: string
        }
        Returns: boolean
      }
      ensure_clean_shelter_sale: {
        Args: { pet_id_param: string; seller_id_param: string }
        Returns: boolean
      }
      execute_paw_dollar_transfer: {
        Args: { p_amount: number; p_recipient_id: string; p_sender_id: string }
        Returns: Json
      }
      feed_shelter_pets: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fix_over_stat_babies: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      force_generate_babies_for_litter_numbers: {
        Args: { target_litters: number[] }
        Returns: Json
      }
      generate_missing_babies: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_next_litter_number: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_next_pet_id: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_next_pet_number: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_next_profile_number: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_roles_list: {
        Args: { target_user_id: string }
        Returns: Json
      }
      grant_pawclub_litter_licenses: {
        Args: {
          grant_reason?: string
          license_count?: number
          user_id_param: string
        }
        Returns: Json
      }
      grant_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_pet_pin: {
        Args: { pin_text: string }
        Returns: string
      }
      increment_paw_dollars: {
        Args: { amount: number; user_id: string }
        Returns: undefined
      }
      is_user_blocked: {
        Args: { receiver_id: string; sender_id: string }
        Returns: boolean
      }
      lock_pet: {
        Args: { pet_id_param: string; pin_text: string }
        Returns: Json
      }
      log_security_event: {
        Args: {
          event_data_param?: Json
          event_type_param: string
          severity_param?: string
        }
        Returns: undefined
      }
      process_daily_reward_transaction: {
        Args: {
          paw_dollars_amount: number
          paw_points_amount: number
          reward_date: string
          target_user_id: string
        }
        Returns: undefined
      }
      release_breeding_parents: {
        Args: { breeding_pair_id_param: string }
        Returns: undefined
      }
      revoke_user_role: {
        Args: {
          role_to_revoke: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: Json
      }
      sell_pet_to_shelter: {
        Args: {
          pet_id_param: string
          sale_price_pd?: number
          seller_id_param: string
          shelter_price_pd?: number
        }
        Returns: Json
      }
      test_shelter_insert: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      transfer_pet_ownership: {
        Args: {
          buyer_id_param: string
          pet_id_param: string
          sale_price_param: number
          seller_id_param: string
        }
        Returns: Json
      }
      trigger_auto_wean: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      unlock_pet: {
        Args: { pet_id_param: string; provided_pin: string }
        Returns: Json
      }
      update_overdue_weaning_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_admin_action: {
        Args: { action_type: string }
        Returns: boolean
      }
      validate_alpha_key: {
        Args: { key_input: string }
        Returns: Json
      }
      validate_financial_operation: {
        Args: { amount: number; operation_type: string; user_id_param: string }
        Returns: boolean
      }
      validate_financial_transaction: {
        Args: {
          amount_param: number
          transaction_type: string
          user_id_param: string
        }
        Returns: Json
      }
      verify_pet_pin: {
        Args: { pet_id_param: string; provided_pin: string }
        Returns: boolean
      }
      verify_pet_pin_bcrypt: {
        Args: { pet_id_param: string; provided_pin: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      like_type: "like" | "love"
      pet_type: "dog" | "cat"
      user_tier: "bronze" | "silver" | "gold" | "platinum" | "diamond"
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
      app_role: ["admin", "moderator", "user"],
      like_type: ["like", "love"],
      pet_type: ["dog", "cat"],
      user_tier: ["bronze", "silver", "gold", "platinum", "diamond"],
    },
  },
} as const
