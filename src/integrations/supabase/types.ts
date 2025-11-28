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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      agenda_entries: {
        Row: {
          auteur_id: string | null
          categorie: Database["public"]["Enums"]["categorie_agenda"]
          commentaire_validation: string | null
          controle_effectue: boolean | null
          controle_par: string | null
          created_at: string
          date: string
          date_controle: string | null
          date_validation: string | null
          detail: string | null
          detail_probleme: string | null
          duree_minutes: number | null
          ecart_pourcentage: number | null
          employee_id: string
          gravite: Database["public"]["Enums"]["gravite_erreur"] | null
          id: string
          manager_notifie: boolean | null
          motif: string | null
          photos: string[] | null
          points: number | null
          points_indicateur: number | null
          raison_ecart: string | null
          statut_objectif: Database["public"]["Enums"]["statut_objectif"] | null
          statut_validation:
            | Database["public"]["Enums"]["statut_validation"]
            | null
          type: string | null
          type_absence: Database["public"]["Enums"]["type_absence"] | null
          type_incident:
            | Database["public"]["Enums"]["type_incident_materiel"]
            | null
          updated_at: string
          valeur_controlee: number | null
          valeur_declaree: number | null
          valide_par: string | null
        }
        Insert: {
          auteur_id?: string | null
          categorie: Database["public"]["Enums"]["categorie_agenda"]
          commentaire_validation?: string | null
          controle_effectue?: boolean | null
          controle_par?: string | null
          created_at?: string
          date: string
          date_controle?: string | null
          date_validation?: string | null
          detail?: string | null
          detail_probleme?: string | null
          duree_minutes?: number | null
          ecart_pourcentage?: number | null
          employee_id: string
          gravite?: Database["public"]["Enums"]["gravite_erreur"] | null
          id?: string
          manager_notifie?: boolean | null
          motif?: string | null
          photos?: string[] | null
          points?: number | null
          points_indicateur?: number | null
          raison_ecart?: string | null
          statut_objectif?:
            | Database["public"]["Enums"]["statut_objectif"]
            | null
          statut_validation?:
            | Database["public"]["Enums"]["statut_validation"]
            | null
          type?: string | null
          type_absence?: Database["public"]["Enums"]["type_absence"] | null
          type_incident?:
            | Database["public"]["Enums"]["type_incident_materiel"]
            | null
          updated_at?: string
          valeur_controlee?: number | null
          valeur_declaree?: number | null
          valide_par?: string | null
        }
        Update: {
          auteur_id?: string | null
          categorie?: Database["public"]["Enums"]["categorie_agenda"]
          commentaire_validation?: string | null
          controle_effectue?: boolean | null
          controle_par?: string | null
          created_at?: string
          date?: string
          date_controle?: string | null
          date_validation?: string | null
          detail?: string | null
          detail_probleme?: string | null
          duree_minutes?: number | null
          ecart_pourcentage?: number | null
          employee_id?: string
          gravite?: Database["public"]["Enums"]["gravite_erreur"] | null
          id?: string
          manager_notifie?: boolean | null
          motif?: string | null
          photos?: string[] | null
          points?: number | null
          points_indicateur?: number | null
          raison_ecart?: string | null
          statut_objectif?:
            | Database["public"]["Enums"]["statut_objectif"]
            | null
          statut_validation?:
            | Database["public"]["Enums"]["statut_validation"]
            | null
          type?: string | null
          type_absence?: Database["public"]["Enums"]["type_absence"] | null
          type_incident?:
            | Database["public"]["Enums"]["type_incident_materiel"]
            | null
          updated_at?: string
          valeur_controlee?: number | null
          valeur_declaree?: number | null
          valide_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_entries_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "agenda_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics: {
        Row: {
          avg_response_time: number | null
          created_at: string | null
          date: string
          escalation_reasons: Json | null
          id: string
          most_used_blocks: Json | null
          satisfaction_score: number | null
          total_conversations: number | null
          total_escalations: number | null
        }
        Insert: {
          avg_response_time?: number | null
          created_at?: string | null
          date: string
          escalation_reasons?: Json | null
          id?: string
          most_used_blocks?: Json | null
          satisfaction_score?: number | null
          total_conversations?: number | null
          total_escalations?: number | null
        }
        Update: {
          avg_response_time?: number | null
          created_at?: string | null
          date?: string
          escalation_reasons?: Json | null
          id?: string
          most_used_blocks?: Json | null
          satisfaction_score?: number | null
          total_conversations?: number | null
          total_escalations?: number | null
        }
        Relationships: []
      }
      annual_cagnotte: {
        Row: {
          annee: number
          created_at: string
          employee_id: string
          id: string
          total_points: number
          updated_at: string
        }
        Insert: {
          annee: number
          created_at?: string
          employee_id: string
          id?: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          annee?: number
          created_at?: string
          employee_id?: string
          id?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "annual_cagnotte_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "annual_cagnotte_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          ancien_contenu: Json | null
          created_at: string
          id: string
          nouveau_contenu: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          ancien_contenu?: Json | null
          created_at?: string
          id?: string
          nouveau_contenu?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          ancien_contenu?: Json | null
          created_at?: string
          id?: string
          nouveau_contenu?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      best_of_month: {
        Row: {
          annee: number
          bonus_points: number
          employee_id: string
          id: string
          mois: number
          validated_at: string
          validated_by: string | null
        }
        Insert: {
          annee: number
          bonus_points: number
          employee_id: string
          id?: string
          mois: number
          validated_at?: string
          validated_by?: string | null
        }
        Update: {
          annee?: number
          bonus_points?: number
          employee_id?: string
          id?: string
          mois?: number
          validated_at?: string
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "best_of_month_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "best_of_month_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "best_of_month_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "best_of_month_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_malus_config: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          gravite: Database["public"]["Enums"]["gravite_type"] | null
          id: string
          is_active: boolean
          points: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          gravite?: Database["public"]["Enums"]["gravite_type"] | null
          id?: string
          is_active?: boolean
          points?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          gravite?: Database["public"]["Enums"]["gravite_type"] | null
          id?: string
          is_active?: boolean
          points?: number
          updated_at?: string
        }
        Relationships: []
      }
      challenge_progress: {
        Row: {
          challenge_id: string
          date_completion: string | null
          employee_id: string
          id: string
          points: number | null
          progression: Json | null
        }
        Insert: {
          challenge_id: string
          date_completion?: string | null
          employee_id: string
          id?: string
          points?: number | null
          progression?: Json | null
        }
        Update: {
          challenge_id?: string
          date_completion?: string | null
          employee_id?: string
          id?: string
          points?: number | null
          progression?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_progress_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "challenge_progress_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          criteres: Json | null
          date_debut: string
          date_fin: string
          description: string | null
          id: string
          is_active: boolean | null
          recompense: string | null
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criteres?: Json | null
          date_debut: string
          date_fin: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          recompense?: string | null
          titre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criteres?: Json | null
          date_debut?: string
          date_fin?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          recompense?: string | null
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      closure_reminders: {
        Row: {
          acknowledged: boolean | null
          annee: number
          id: string
          manager_employee_id: string
          mois: number
          sent_at: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          annee: number
          id?: string
          manager_employee_id: string
          mois: number
          sent_at?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          annee?: number
          id?: string
          manager_employee_id?: string
          mois?: number
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "closure_reminders_manager_employee_id_fkey"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "closure_reminders_manager_employee_id_fkey"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      colleague_votes: {
        Row: {
          annee: number
          commentaire: string | null
          created_at: string
          id: string
          mois: number
          voted_for_employee_id: string
          voter_employee_id: string
        }
        Insert: {
          annee: number
          commentaire?: string | null
          created_at?: string
          id?: string
          mois: number
          voted_for_employee_id: string
          voter_employee_id: string
        }
        Update: {
          annee?: number
          commentaire?: string | null
          created_at?: string
          id?: string
          mois?: number
          voted_for_employee_id?: string
          voter_employee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "colleague_votes_voted_for_employee_id_fkey"
            columns: ["voted_for_employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "colleague_votes_voted_for_employee_id_fkey"
            columns: ["voted_for_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colleague_votes_voter_employee_id_fkey"
            columns: ["voter_employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "colleague_votes_voter_employee_id_fkey"
            columns: ["voter_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_lectures: {
        Row: {
          communication_id: string
          employee_id: string
          id: string
          lu_at: string
        }
        Insert: {
          communication_id: string
          employee_id: string
          id?: string
          lu_at?: string
        }
        Update: {
          communication_id?: string
          employee_id?: string
          id?: string
          lu_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_lectures_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_lectures_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "communication_lectures_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          contenu: string
          created_at: string
          created_by: string
          date_expiration: string | null
          equipes: string[] | null
          groupes: string[] | null
          id: string
          is_active: boolean | null
          require_confirmation: boolean | null
          show_in_calendar: boolean | null
          titre: string
          type_destinataire: Database["public"]["Enums"]["destinataire_type"]
          updated_at: string
        }
        Insert: {
          contenu: string
          created_at?: string
          created_by: string
          date_expiration?: string | null
          equipes?: string[] | null
          groupes?: string[] | null
          id?: string
          is_active?: boolean | null
          require_confirmation?: boolean | null
          show_in_calendar?: boolean | null
          titre: string
          type_destinataire?: Database["public"]["Enums"]["destinataire_type"]
          updated_at?: string
        }
        Update: {
          contenu?: string
          created_at?: string
          created_by?: string
          date_expiration?: string | null
          equipes?: string[] | null
          groupes?: string[] | null
          id?: string
          is_active?: boolean | null
          require_confirmation?: boolean | null
          show_in_calendar?: boolean | null
          titre?: string
          type_destinataire?: Database["public"]["Enums"]["destinataire_type"]
          updated_at?: string
        }
        Relationships: []
      }
      conditional_blocks: {
        Row: {
          bloc_id: string
          condition_type: string
          condition_value: Json
          created_at: string
          id: string
          is_active: boolean
          parent_bloc_id: string
          priority: number
          updated_at: string
        }
        Insert: {
          bloc_id: string
          condition_type: string
          condition_value?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          parent_bloc_id: string
          priority?: number
          updated_at?: string
        }
        Update: {
          bloc_id?: string
          condition_type?: string
          condition_value?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          parent_bloc_id?: string
          priority?: number
          updated_at?: string
        }
        Relationships: []
      }
      configuration: {
        Row: {
          categorie: string
          cle: string
          created_at: string
          description: string | null
          id: string
          updated_at: string
          valeur: Json
        }
        Insert: {
          categorie: string
          cle: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          valeur?: Json
        }
        Update: {
          categorie?: string
          cle?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          valeur?: Json
        }
        Relationships: []
      }
      conversation_history: {
        Row: {
          block_used: string | null
          confidence_score: number | null
          content: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          processing_time_ms: number | null
          rules_triggered: string[] | null
          user_profile_id: string | null
        }
        Insert: {
          block_used?: string | null
          confidence_score?: number | null
          content: string
          created_at?: string
          id?: string
          message_type: string
          metadata?: Json | null
          processing_time_ms?: number | null
          rules_triggered?: string[] | null
          user_profile_id?: string | null
        }
        Update: {
          block_used?: string | null
          confidence_score?: number | null
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          processing_time_ms?: number | null
          rules_triggered?: string[] | null
          user_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_history_block_used_fkey"
            columns: ["block_used"]
            isOneToOne: false
            referencedRelation: "response_blocks"
            referencedColumns: ["bloc_id"]
          },
          {
            foreignKeyName: "conversation_history_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_rules: {
        Row: {
          action_type: string
          associated_block_id: string | null
          conditions: Json
          created_at: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          priority: number | null
          rule_name: string
          rule_type: string
          updated_at: string
        }
        Insert: {
          action_type: string
          associated_block_id?: string | null
          conditions: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          priority?: number | null
          rule_name: string
          rule_type: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          associated_block_id?: string | null
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          priority?: number | null
          rule_name?: string
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_rules_associated_block_id_fkey"
            columns: ["associated_block_id"]
            isOneToOne: false
            referencedRelation: "response_blocks"
            referencedColumns: ["bloc_id"]
          },
        ]
      }
      conversations: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          detected_intent: string | null
          escalation_reason: string | null
          escalation_triggered: boolean | null
          id: string
          message_content: string
          message_embedding: string | null
          response_block_id: string | null
          response_content: string | null
          session_id: string | null
          user_profile_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          detected_intent?: string | null
          escalation_reason?: string | null
          escalation_triggered?: boolean | null
          id?: string
          message_content: string
          message_embedding?: string | null
          response_block_id?: string | null
          response_content?: string | null
          session_id?: string | null
          user_profile_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          detected_intent?: string | null
          escalation_reason?: string | null
          escalation_triggered?: boolean | null
          id?: string
          message_content?: string
          message_embedding?: string | null
          response_block_id?: string | null
          response_content?: string | null
          session_id?: string | null
          user_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_response_block_id_fkey"
            columns: ["response_block_id"]
            isOneToOne: false
            referencedRelation: "response_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_mood: {
        Row: {
          created_at: string | null
          date: string
          employee_id: string | null
          id: string
          mood_emoji: string
          mood_label: string
          need_type: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          mood_emoji: string
          mood_label: string
          need_type?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          mood_emoji?: string
          mood_label?: string
          need_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_mood_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "daily_mood_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_quotes: {
        Row: {
          author: string | null
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          quote_text: string
        }
        Insert: {
          author?: string | null
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          quote_text: string
        }
        Update: {
          author?: string | null
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          quote_text?: string
        }
        Relationships: []
      }
      employee_badges: {
        Row: {
          annee: number | null
          annual_count: number | null
          badge_id: string
          created_at: string | null
          employee_id: string
          id: string
          mois: number | null
          progress: number | null
          unlocked_at: string | null
        }
        Insert: {
          annee?: number | null
          annual_count?: number | null
          badge_id: string
          created_at?: string | null
          employee_id: string
          id?: string
          mois?: number | null
          progress?: number | null
          unlocked_at?: string | null
        }
        Update: {
          annee?: number | null
          annual_count?: number | null
          badge_id?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          mois?: number | null
          progress?: number | null
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_badges_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_badges_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          email: string | null
          equipe: string | null
          groupe: string | null
          id: string
          is_remote: boolean | null
          manager_id: string | null
          nom: string
          photo_url: string | null
          poste: string | null
          prenom: string
          profile_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          equipe?: string | null
          groupe?: string | null
          id?: string
          is_remote?: boolean | null
          manager_id?: string | null
          nom: string
          photo_url?: string | null
          poste?: string | null
          prenom: string
          profile_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          equipe?: string | null
          groupe?: string | null
          id?: string
          is_remote?: boolean | null
          manager_id?: string | null
          nom?: string
          photo_url?: string | null
          poste?: string | null
          prenom?: string
          profile_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escalations: {
        Row: {
          assigned_to: string | null
          context: Json | null
          created_at: string
          escalation_type: string
          id: string
          metadata: Json | null
          priority: number | null
          reason: string
          resolved_at: string | null
          status: string | null
          updated_at: string
          user_profile_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          context?: Json | null
          created_at?: string
          escalation_type: string
          id?: string
          metadata?: Json | null
          priority?: number | null
          reason: string
          resolved_at?: string | null
          status?: string | null
          updated_at?: string
          user_profile_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          context?: Json | null
          created_at?: string
          escalation_type?: string
          id?: string
          metadata?: Json | null
          priority?: number | null
          reason?: string
          resolved_at?: string | null
          status?: string | null
          updated_at?: string
          user_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalations_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_clues: {
        Row: {
          clue_number: number
          clue_text: string
          created_at: string | null
          difficulty_score: number | null
          id: string
          is_revealed: boolean | null
          revealed_at: string | null
          session_id: string
        }
        Insert: {
          clue_number: number
          clue_text: string
          created_at?: string | null
          difficulty_score?: number | null
          id?: string
          is_revealed?: boolean | null
          revealed_at?: string | null
          session_id: string
        }
        Update: {
          clue_number?: number
          clue_text?: string
          created_at?: string | null
          difficulty_score?: number | null
          id?: string
          is_revealed?: boolean | null
          revealed_at?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_clues_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "weekly_game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_participants: {
        Row: {
          created_at: string | null
          elimination_date: string | null
          employee_id: string
          id: string
          is_eliminated: boolean | null
          role: Database["public"]["Enums"]["game_role"]
          session_id: string
          total_points: number | null
        }
        Insert: {
          created_at?: string | null
          elimination_date?: string | null
          employee_id: string
          id?: string
          is_eliminated?: boolean | null
          role: Database["public"]["Enums"]["game_role"]
          session_id: string
          total_points?: number | null
        }
        Update: {
          created_at?: string | null
          elimination_date?: string | null
          employee_id?: string
          id?: string
          is_eliminated?: boolean | null
          role?: Database["public"]["Enums"]["game_role"]
          session_id?: string
          total_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_participants_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "game_participants_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "weekly_game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_player_stats: {
        Row: {
          best_investigator_awards: number | null
          employee_id: string
          id: string
          times_as_target: number | null
          times_investigator_won: number | null
          times_target_won: number | null
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          best_investigator_awards?: number | null
          employee_id: string
          id?: string
          times_as_target?: number | null
          times_investigator_won?: number | null
          times_target_won?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          best_investigator_awards?: number | null
          employee_id?: string
          id?: string
          times_as_target?: number | null
          times_investigator_won?: number | null
          times_target_won?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_player_stats_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "game_player_stats_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      game_prize_catalog: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean | null
          points_required: number
          prize_description: string | null
          prize_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          points_required: number
          prize_description?: string | null
          prize_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          points_required?: number
          prize_description?: string | null
          prize_name?: string
        }
        Relationships: []
      }
      game_rewards_config: {
        Row: {
          config_type: string
          description: string | null
          id: string
          is_active: boolean | null
          points_amount: number
          updated_at: string | null
        }
        Insert: {
          config_type: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          points_amount: number
          updated_at?: string | null
        }
        Update: {
          config_type?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          points_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      game_votes: {
        Row: {
          clue_id: string | null
          difficulty_rating: number | null
          id: string
          originality_rating: number | null
          session_id: string
          suspect_employee_id: string | null
          vote_day: number | null
          vote_type: Database["public"]["Enums"]["vote_type"]
          voted_at: string | null
          voter_employee_id: string
        }
        Insert: {
          clue_id?: string | null
          difficulty_rating?: number | null
          id?: string
          originality_rating?: number | null
          session_id: string
          suspect_employee_id?: string | null
          vote_day?: number | null
          vote_type: Database["public"]["Enums"]["vote_type"]
          voted_at?: string | null
          voter_employee_id: string
        }
        Update: {
          clue_id?: string | null
          difficulty_rating?: number | null
          id?: string
          originality_rating?: number | null
          session_id?: string
          suspect_employee_id?: string | null
          vote_day?: number | null
          vote_type?: Database["public"]["Enums"]["vote_type"]
          voted_at?: string | null
          voter_employee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_votes_clue_id_fkey"
            columns: ["clue_id"]
            isOneToOne: false
            referencedRelation: "game_clues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_votes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "weekly_game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_votes_suspect_employee_id_fkey"
            columns: ["suspect_employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "game_votes_suspect_employee_id_fkey"
            columns: ["suspect_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_votes_voter_employee_id_fkey"
            columns: ["voter_employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "game_votes_voter_employee_id_fkey"
            columns: ["voter_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          commentaire_manager: string | null
          created_at: string
          description: string
          employee_id: string | null
          id: string
          is_anonymous: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          statut: Database["public"]["Enums"]["statut_idee"] | null
          titre: string
          updated_at: string
        }
        Insert: {
          commentaire_manager?: string | null
          created_at?: string
          description: string
          employee_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          statut?: Database["public"]["Enums"]["statut_idee"] | null
          titre: string
          updated_at?: string
        }
        Update: {
          commentaire_manager?: string | null
          created_at?: string
          description?: string
          employee_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          statut?: Database["public"]["Enums"]["statut_idee"] | null
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "ideas_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intention_mapping: {
        Row: {
          bloc_id: string
          created_at: string
          id: string
          intention: string
          is_active: boolean
          priority: number
          updated_at: string
        }
        Insert: {
          bloc_id: string
          created_at?: string
          id?: string
          intention: string
          is_active?: boolean
          priority?: number
          updated_at?: string
        }
        Update: {
          bloc_id?: string
          created_at?: string
          id?: string
          intention?: string
          is_active?: boolean
          priority?: number
          updated_at?: string
        }
        Relationships: []
      }
      job_document_profiles: {
        Row: {
          created_at: string
          id: string
          job_document_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_document_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_document_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_document_profiles_job_document_id_fkey"
            columns: ["job_document_id"]
            isOneToOne: false
            referencedRelation: "job_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_document_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_documents: {
        Row: {
          category: Database["public"]["Enums"]["job_category"]
          created_at: string
          created_by: string | null
          file_name: string | null
          file_url: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["job_category"]
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["job_category"]
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      kpi_definitions: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          nom: string
          recurrence: string
          responsable_id: string | null
          type_donnee: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          nom: string
          recurrence: string
          responsable_id?: string | null
          type_donnee: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          nom?: string
          recurrence?: string
          responsable_id?: string | null
          type_donnee?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "kpi_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_definitions_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "kpi_definitions_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_objectifs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kpi_id: string
          periode_debut: string
          periode_fin: string | null
          type_periode: string
          updated_at: string
          valeur_objectif: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kpi_id: string
          periode_debut: string
          periode_fin?: string | null
          type_periode: string
          updated_at?: string
          valeur_objectif: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kpi_id?: string
          periode_debut?: string
          periode_fin?: string | null
          type_periode?: string
          updated_at?: string
          valeur_objectif?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_objectifs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "kpi_objectifs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_objectifs_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_values: {
        Row: {
          created_at: string | null
          id: string
          kpi_id: string
          notes: string | null
          periode_debut: string
          periode_fin: string | null
          saisi_par: string | null
          updated_at: string | null
          valeur: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          kpi_id: string
          notes?: string | null
          periode_debut: string
          periode_fin?: string | null
          saisi_par?: string | null
          updated_at?: string | null
          valeur: number
        }
        Update: {
          created_at?: string | null
          id?: string
          kpi_id?: string
          notes?: string | null
          periode_debut?: string
          periode_fin?: string | null
          saisi_par?: string | null
          updated_at?: string | null
          valeur?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_values_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_values_saisi_par_fkey"
            columns: ["saisi_par"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "kpi_values_saisi_par_fkey"
            columns: ["saisi_par"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_log: {
        Row: {
          completed_at: string
          completed_by: string | null
          created_at: string
          id: string
          machine_piece: string
          maintenance_type: string
          notes: string | null
          photos: string[] | null
          task_id: string | null
        }
        Insert: {
          completed_at?: string
          completed_by?: string | null
          created_at?: string
          id?: string
          machine_piece: string
          maintenance_type: string
          notes?: string | null
          photos?: string[] | null
          task_id?: string | null
        }
        Update: {
          completed_at?: string
          completed_by?: string | null
          created_at?: string
          id?: string
          machine_piece?: string
          maintenance_type?: string
          notes?: string | null
          photos?: string[] | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_log_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "maintenance_log_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_permissions: {
        Row: {
          can_access_meetings: boolean
          employee_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          can_access_meetings?: boolean
          employee_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          can_access_meetings?: boolean
          employee_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_permissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "meeting_permissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_timestamps: {
        Row: {
          created_at: string | null
          id: string
          meeting_id: string
          note: string | null
          project_id: string | null
          task_id: string | null
          timestamp_seconds: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meeting_id: string
          note?: string | null
          project_id?: string | null
          task_id?: string | null
          timestamp_seconds: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meeting_id?: string
          note?: string | null
          project_id?: string | null
          task_id?: string | null
          timestamp_seconds?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_timestamps_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "project_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_timestamps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_timestamps_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      module_visibility: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon: string
          id: string
          is_enabled: boolean | null
          is_external: boolean | null
          module_key: string
          module_name: string
          path: string
          updated_at: string | null
          visible_to_admin: boolean | null
          visible_to_manager: boolean | null
          visible_to_user: boolean | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon: string
          id?: string
          is_enabled?: boolean | null
          is_external?: boolean | null
          module_key: string
          module_name: string
          path: string
          updated_at?: string | null
          visible_to_admin?: boolean | null
          visible_to_manager?: boolean | null
          visible_to_user?: boolean | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon?: string
          id?: string
          is_enabled?: boolean | null
          is_external?: boolean | null
          module_key?: string
          module_name?: string
          path?: string
          updated_at?: string | null
          visible_to_admin?: boolean | null
          visible_to_manager?: boolean | null
          visible_to_user?: boolean | null
        }
        Relationships: []
      }
      monthly_scores: {
        Row: {
          annee: number
          bonus_points: number | null
          cloture_par: string | null
          created_at: string
          date_cloture: string | null
          employee_id: string
          id: string
          malus_points: number | null
          mois: number
          prime_montant: number | null
          projection_percentage: number | null
          projection_status: string | null
          score_attitude: number | null
          score_global: number | null
          score_horaires: number | null
          score_indicateurs: number | null
          score_materiel: number | null
          score_protocoles: number | null
          statut: Database["public"]["Enums"]["statut_score_mensuel"] | null
          updated_at: string
        }
        Insert: {
          annee: number
          bonus_points?: number | null
          cloture_par?: string | null
          created_at?: string
          date_cloture?: string | null
          employee_id: string
          id?: string
          malus_points?: number | null
          mois: number
          prime_montant?: number | null
          projection_percentage?: number | null
          projection_status?: string | null
          score_attitude?: number | null
          score_global?: number | null
          score_horaires?: number | null
          score_indicateurs?: number | null
          score_materiel?: number | null
          score_protocoles?: number | null
          statut?: Database["public"]["Enums"]["statut_score_mensuel"] | null
          updated_at?: string
        }
        Update: {
          annee?: number
          bonus_points?: number | null
          cloture_par?: string | null
          created_at?: string
          date_cloture?: string | null
          employee_id?: string
          id?: string
          malus_points?: number | null
          mois?: number
          prime_montant?: number | null
          projection_percentage?: number | null
          projection_status?: string | null
          score_attitude?: number | null
          score_global?: number | null
          score_horaires?: number | null
          score_indicateurs?: number | null
          score_materiel?: number | null
          score_protocoles?: number | null
          statut?: Database["public"]["Enums"]["statut_score_mensuel"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_scores_cloture_par_fkey"
            columns: ["cloture_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_scores_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "monthly_scores_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_ratings: {
        Row: {
          annee: number
          commentaire: string | null
          created_at: string
          employee_id: string
          id: string
          mois: number
          rating: number
        }
        Insert: {
          annee: number
          commentaire?: string | null
          created_at?: string
          employee_id: string
          id?: string
          mois: number
          rating: number
        }
        Update: {
          annee?: number
          commentaire?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          mois?: number
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "mood_ratings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "mood_ratings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          lu: boolean | null
          message: string | null
          statut: string | null
          titre: string
          type: string
          url: string | null
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          lu?: boolean | null
          message?: string | null
          statut?: string | null
          titre: string
          type: string
          url?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          lu?: boolean | null
          message?: string | null
          statut?: string | null
          titre?: string
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "notifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      objectifs_individuels: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          modifie_par: string | null
          nom: string
          periode_debut: string
          periode_fin: string | null
          raison_modification: string | null
          statut: string | null
          type_periode: string
          unite: string | null
          updated_at: string | null
          valeur_cible: number
          valeur_realisee: number | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          modifie_par?: string | null
          nom: string
          periode_debut: string
          periode_fin?: string | null
          raison_modification?: string | null
          statut?: string | null
          type_periode: string
          unite?: string | null
          updated_at?: string | null
          valeur_cible: number
          valeur_realisee?: number | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          modifie_par?: string | null
          nom?: string
          periode_debut?: string
          periode_fin?: string | null
          raison_modification?: string | null
          statut?: string | null
          type_periode?: string
          unite?: string | null
          updated_at?: string | null
          valeur_cible?: number
          valeur_realisee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "objectifs_individuels_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "objectifs_individuels_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectifs_individuels_modifie_par_fkey"
            columns: ["modifie_par"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "objectifs_individuels_modifie_par_fkey"
            columns: ["modifie_par"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      objectifs_modifications: {
        Row: {
          ancienne_valeur: number | null
          created_at: string | null
          id: string
          modifie_par: string | null
          nouvelle_valeur: number | null
          objectif_id: string
          raison: string | null
        }
        Insert: {
          ancienne_valeur?: number | null
          created_at?: string | null
          id?: string
          modifie_par?: string | null
          nouvelle_valeur?: number | null
          objectif_id: string
          raison?: string | null
        }
        Update: {
          ancienne_valeur?: number | null
          created_at?: string | null
          id?: string
          modifie_par?: string | null
          nouvelle_valeur?: number | null
          objectif_id?: string
          raison?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objectifs_modifications_modifie_par_fkey"
            columns: ["modifie_par"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "objectifs_modifications_modifie_par_fkey"
            columns: ["modifie_par"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectifs_modifications_objectif_id_fkey"
            columns: ["objectif_id"]
            isOneToOne: false
            referencedRelation: "objectifs_individuels"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          product_reference_id: string
          quantity: number
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          product_reference_id: string
          quantity: number
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          product_reference_id?: string
          quantity?: number
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_reference_id_fkey"
            columns: ["product_reference_id"]
            isOneToOne: false
            referencedRelation: "product_references"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          comments: string | null
          created_at: string
          created_by: string
          delivered_at: string | null
          delivered_by: string | null
          expected_delivery_date: string | null
          id: string
          linked_task_id: string | null
          order_date: string
          order_method: Database["public"]["Enums"]["order_method"] | null
          order_number: string | null
          order_placed_at: string | null
          order_placed_by: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["order_status"]
          supplier_id: string
          total_amount: number | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_mode: Database["public"]["Enums"]["validation_mode"]
        }
        Insert: {
          comments?: string | null
          created_at?: string
          created_by: string
          delivered_at?: string | null
          delivered_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          linked_task_id?: string | null
          order_date?: string
          order_method?: Database["public"]["Enums"]["order_method"] | null
          order_number?: string | null
          order_placed_at?: string | null
          order_placed_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          supplier_id: string
          total_amount?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_mode?: Database["public"]["Enums"]["validation_mode"]
        }
        Update: {
          comments?: string | null
          created_at?: string
          created_by?: string
          delivered_at?: string | null
          delivered_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          linked_task_id?: string | null
          order_date?: string
          order_method?: Database["public"]["Enums"]["order_method"] | null
          order_number?: string | null
          order_placed_at?: string | null
          order_placed_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          supplier_id?: string
          total_amount?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_mode?: Database["public"]["Enums"]["validation_mode"]
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivered_by_fkey"
            columns: ["delivered_by"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "orders_delivered_by_fkey"
            columns: ["delivered_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_order_placed_by_fkey"
            columns: ["order_placed_by"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "orders_order_placed_by_fkey"
            columns: ["order_placed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "orders_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          actual_payment_date: string | null
          amount: number | null
          created_at: string | null
          delay_days: number | null
          escalation_triggered: boolean | null
          expected_payment_date: string | null
          formation_end_date: string | null
          id: string
          payment_type: string
          status: string | null
          updated_at: string | null
          user_profile_id: string | null
        }
        Insert: {
          actual_payment_date?: string | null
          amount?: number | null
          created_at?: string | null
          delay_days?: number | null
          escalation_triggered?: boolean | null
          expected_payment_date?: string | null
          formation_end_date?: string | null
          id?: string
          payment_type: string
          status?: string | null
          updated_at?: string | null
          user_profile_id?: string | null
        }
        Update: {
          actual_payment_date?: string | null
          amount?: number | null
          created_at?: string | null
          delay_days?: number | null
          escalation_triggered?: boolean | null
          expected_payment_date?: string | null
          formation_end_date?: string | null
          id?: string
          payment_type?: string
          status?: string | null
          updated_at?: string | null
          user_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pointage: {
        Row: {
          created_at: string | null
          date: string
          details_justification: Json | null
          ecart_totalement_justifie: boolean | null
          employee_id: string
          heures: number
          id: string
          justification_requise: boolean | null
          raison_ecart: string | null
          saisi_par: string | null
          taux_activite: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          details_justification?: Json | null
          ecart_totalement_justifie?: boolean | null
          employee_id: string
          heures: number
          id?: string
          justification_requise?: boolean | null
          raison_ecart?: string | null
          saisi_par?: string | null
          taux_activite?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          details_justification?: Json | null
          ecart_totalement_justifie?: boolean | null
          employee_id?: string
          heures?: number
          id?: string
          justification_requise?: boolean | null
          raison_ecart?: string | null
          saisi_par?: string | null
          taux_activite?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pointage_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pointage_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pointage_saisi_par_fkey"
            columns: ["saisi_par"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pointage_saisi_par_fkey"
            columns: ["saisi_par"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_references: {
        Row: {
          alert_threshold: number | null
          category_id: string | null
          created_at: string
          current_stock: number | null
          id: string
          is_active: boolean | null
          minimum_order_quantity: number | null
          name: string
          packaging: string | null
          reference_code: string
          supplier_id: string
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          alert_threshold?: number | null
          category_id?: string | null
          created_at?: string
          current_stock?: number | null
          id?: string
          is_active?: boolean | null
          minimum_order_quantity?: number | null
          name: string
          packaging?: string | null
          reference_code: string
          supplier_id: string
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          alert_threshold?: number | null
          category_id?: string | null
          created_at?: string
          current_stock?: number | null
          id?: string
          is_active?: boolean | null
          minimum_order_quantity?: number | null
          name?: string
          packaging?: string | null
          reference_code?: string
          supplier_id?: string
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_references_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_references_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_blocks: {
        Row: {
          bloc_id: string
          created_at: string
          id: string
          intention: string
          is_active: boolean
          priority: number
          profile_type: string
          updated_at: string
        }
        Insert: {
          bloc_id: string
          created_at?: string
          id?: string
          intention: string
          is_active?: boolean
          priority?: number
          profile_type: string
          updated_at?: string
        }
        Update: {
          bloc_id?: string
          created_at?: string
          id?: string
          intention?: string
          is_active?: boolean
          priority?: number
          profile_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_meetings: {
        Row: {
          audio_url: string | null
          created_at: string | null
          created_by: string | null
          date_reunion: string
          decisions: Json | null
          deleted_at: string | null
          deleted_by: string | null
          duree_minutes: number | null
          fichier_audio_url: string | null
          id: string
          notes: string | null
          participants: Json | null
          project_id: string | null
          project_ids: Json | null
          resume_ia: string | null
          task_id: string | null
          titre: string
          transcription: string | null
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          created_by?: string | null
          date_reunion: string
          decisions?: Json | null
          deleted_at?: string | null
          deleted_by?: string | null
          duree_minutes?: number | null
          fichier_audio_url?: string | null
          id?: string
          notes?: string | null
          participants?: Json | null
          project_id?: string | null
          project_ids?: Json | null
          resume_ia?: string | null
          task_id?: string | null
          titre: string
          transcription?: string | null
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          created_by?: string | null
          date_reunion?: string
          decisions?: Json | null
          deleted_at?: string | null
          deleted_by?: string | null
          duree_minutes?: number | null
          fichier_audio_url?: string | null
          id?: string
          notes?: string | null
          participants?: Json | null
          project_id?: string | null
          project_ids?: Json | null
          resume_ia?: string | null
          task_id?: string | null
          titre?: string
          transcription?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "project_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_meetings_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          created_at: string | null
          id: string
          ordre: number | null
          project_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ordre?: number | null
          project_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ordre?: number | null
          project_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          created_by: string | null
          date_creation: string | null
          date_echeance: string | null
          description: string | null
          id: string
          is_priority: boolean | null
          progression: number | null
          responsable_id: string | null
          statut: Database["public"]["Enums"]["project_status"] | null
          titre: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date_creation?: string | null
          date_echeance?: string | null
          description?: string | null
          id?: string
          is_priority?: boolean | null
          progression?: number | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["project_status"] | null
          titre: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date_creation?: string | null
          date_echeance?: string | null
          description?: string | null
          id?: string
          is_priority?: boolean | null
          progression?: number | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["project_status"] | null
          titre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "projects_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_profiles: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          protocol_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          protocol_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          protocol_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_profiles_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocols: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          file_name: string | null
          file_url: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          file_name: string | null
          file_url: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_monthly: {
        Row: {
          annee: number
          bareme: Json | null
          contenu: Json
          created_at: string
          id: string
          is_active: boolean | null
          mois: number
          titre: string
          type: Database["public"]["Enums"]["type_quiz"]
          updated_at: string
        }
        Insert: {
          annee: number
          bareme?: Json | null
          contenu?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          mois: number
          titre: string
          type: Database["public"]["Enums"]["type_quiz"]
          updated_at?: string
        }
        Update: {
          annee?: number
          bareme?: Json | null
          contenu?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          mois?: number
          titre?: string
          type?: Database["public"]["Enums"]["type_quiz"]
          updated_at?: string
        }
        Relationships: []
      }
      quiz_profiles: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          quiz_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          quiz_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_profiles_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          date_reponse: string
          employee_id: string
          id: string
          mood_commentaire: string | null
          mood_note: number | null
          quiz_id: string
          reponses: Json | null
          score: number | null
          vote_collegue_id: string | null
          vote_justification: string | null
        }
        Insert: {
          date_reponse?: string
          employee_id: string
          id?: string
          mood_commentaire?: string | null
          mood_note?: number | null
          quiz_id: string
          reponses?: Json | null
          score?: number | null
          vote_collegue_id?: string | null
          vote_justification?: string | null
        }
        Update: {
          date_reponse?: string
          employee_id?: string
          id?: string
          mood_commentaire?: string | null
          mood_note?: number | null
          quiz_id?: string
          reponses?: Json | null
          score?: number | null
          vote_collegue_id?: string | null
          vote_justification?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "quiz_responses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz_monthly"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_vote_collegue_id_fkey"
            columns: ["vote_collegue_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "quiz_responses_vote_collegue_id_fkey"
            columns: ["vote_collegue_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_tasks: {
        Row: {
          created_at: string | null
          created_by: string | null
          derniere_execution: string | null
          description: string | null
          heure_rappel: string | null
          id: string
          is_active: boolean | null
          jour_mois: number | null
          jour_semaine: number | null
          lien_process: string | null
          prochaine_execution: string | null
          recurrence: string
          responsable_id: string
          titre: string
          type: string
          type_process: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          derniere_execution?: string | null
          description?: string | null
          heure_rappel?: string | null
          id?: string
          is_active?: boolean | null
          jour_mois?: number | null
          jour_semaine?: number | null
          lien_process?: string | null
          prochaine_execution?: string | null
          recurrence: string
          responsable_id: string
          titre: string
          type: string
          type_process?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          derniere_execution?: string | null
          description?: string | null
          heure_rappel?: string | null
          id?: string
          is_active?: boolean | null
          jour_mois?: number | null
          jour_semaine?: number | null
          lien_process?: string | null
          prochaine_execution?: string | null
          recurrence?: string
          responsable_id?: string
          titre?: string
          type?: string
          type_process?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "recurring_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_tasks_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "recurring_tasks_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      response_blocks: {
        Row: {
          bloc_id: string
          block_type: string | null
          category: string
          content: string
          content_embedding: string | null
          context_required: string[] | null
          created_at: string
          escalation_level: number | null
          id: string
          intention: string | null
          is_active: boolean | null
          is_user_facing: boolean | null
          metadata: Json | null
          prerequisite_blocks: string[] | null
          priority: number | null
          profile_target: string | null
          sentiment_target: string | null
          specificity_level: number | null
          title: string
          triggers: string[] | null
          updated_at: string
        }
        Insert: {
          bloc_id: string
          block_type?: string | null
          category: string
          content: string
          content_embedding?: string | null
          context_required?: string[] | null
          created_at?: string
          escalation_level?: number | null
          id?: string
          intention?: string | null
          is_active?: boolean | null
          is_user_facing?: boolean | null
          metadata?: Json | null
          prerequisite_blocks?: string[] | null
          priority?: number | null
          profile_target?: string | null
          sentiment_target?: string | null
          specificity_level?: number | null
          title: string
          triggers?: string[] | null
          updated_at?: string
        }
        Update: {
          bloc_id?: string
          block_type?: string | null
          category?: string
          content?: string
          content_embedding?: string | null
          context_required?: string[] | null
          created_at?: string
          escalation_level?: number | null
          id?: string
          intention?: string | null
          is_active?: boolean | null
          is_user_facing?: boolean | null
          metadata?: Json | null
          prerequisite_blocks?: string[] | null
          priority?: number | null
          profile_target?: string | null
          sentiment_target?: string | null
          specificity_level?: number | null
          title?: string
          triggers?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      reward_catalog: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          points_required: number
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          points_required: number
          titre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          points_required?: number
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          delivered_at: string | null
          employee_id: string
          id: string
          notes: string | null
          points_spent: number
          redeemed_at: string
          reward_id: string
          status: string
        }
        Insert: {
          delivered_at?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          points_spent: number
          redeemed_at?: string
          reward_id: string
          status?: string
        }
        Update: {
          delivered_at?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          points_spent?: number
          redeemed_at?: string
          reward_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "reward_redemptions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "reward_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          employee_id: string | null
          id: string
          movement_type: string
          notes: string | null
          order_id: string | null
          product_reference_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          order_id?: string | null
          product_reference_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          order_id?: string | null
          product_reference_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "stock_movements_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_reference_id_fkey"
            columns: ["product_reference_id"]
            isOneToOne: false
            referencedRelation: "product_references"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          auto_email_on_order: boolean | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          responsible_employee_id: string | null
          updated_at: string
        }
        Insert: {
          auto_email_on_order?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          responsible_employee_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_email_on_order?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          responsible_employee_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_responsible_employee_id_fkey"
            columns: ["responsible_employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "suppliers_responsible_employee_id_fkey"
            columns: ["responsible_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          created_at: string
          employee_id: string | null
          id: string
          is_anonymous: boolean | null
          reponses: Json
          survey_id: string
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          reponses?: Json
          survey_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          reponses?: Json
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "survey_responses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          allow_anonymous: boolean | null
          created_at: string
          created_by: string | null
          date_debut: string | null
          date_fin: string | null
          description: string | null
          equipes: string[] | null
          groupes: string[] | null
          id: string
          is_active: boolean | null
          questions: Json
          titre: string
          type_destinataire: Database["public"]["Enums"]["destinataire_type"]
          updated_at: string
        }
        Insert: {
          allow_anonymous?: boolean | null
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          equipes?: string[] | null
          groupes?: string[] | null
          id?: string
          is_active?: boolean | null
          questions?: Json
          titre: string
          type_destinataire?: Database["public"]["Enums"]["destinataire_type"]
          updated_at?: string
        }
        Update: {
          allow_anonymous?: boolean | null
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          equipes?: string[] | null
          groupes?: string[] | null
          id?: string
          is_active?: boolean | null
          questions?: Json
          titre?: string
          type_destinataire?: Database["public"]["Enums"]["destinataire_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_postponements: {
        Row: {
          ancienne_date: string
          commentaire_validateur: string | null
          created_at: string | null
          date_validation: string | null
          demandeur_id: string
          id: string
          nouvelle_date_proposee: string
          raison_imprevue: string
          statut: Database["public"]["Enums"]["postponement_status"] | null
          task_id: string
          validateur_id: string | null
        }
        Insert: {
          ancienne_date: string
          commentaire_validateur?: string | null
          created_at?: string | null
          date_validation?: string | null
          demandeur_id: string
          id?: string
          nouvelle_date_proposee: string
          raison_imprevue: string
          statut?: Database["public"]["Enums"]["postponement_status"] | null
          task_id: string
          validateur_id?: string | null
        }
        Update: {
          ancienne_date?: string
          commentaire_validateur?: string | null
          created_at?: string | null
          date_validation?: string | null
          demandeur_id?: string
          id?: string
          nouvelle_date_proposee?: string
          raison_imprevue?: string
          statut?: Database["public"]["Enums"]["postponement_status"] | null
          task_id?: string
          validateur_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_postponements_demandeur_id_fkey"
            columns: ["demandeur_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "task_postponements_demandeur_id_fkey"
            columns: ["demandeur_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_postponements_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_postponements_validateur_id_fkey"
            columns: ["validateur_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "task_postponements_validateur_id_fkey"
            columns: ["validateur_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      task_progress_comments: {
        Row: {
          commentaire: string
          created_at: string | null
          date_avancement: string | null
          employee_id: string
          id: string
          photos: string[] | null
          pourcentage_avancement: number | null
          task_id: string
        }
        Insert: {
          commentaire: string
          created_at?: string | null
          date_avancement?: string | null
          employee_id: string
          id?: string
          photos?: string[] | null
          pourcentage_avancement?: number | null
          task_id: string
        }
        Update: {
          commentaire?: string
          created_at?: string | null
          date_avancement?: string | null
          employee_id?: string
          id?: string
          photos?: string[] | null
          pourcentage_avancement?: number | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_progress_comments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "task_progress_comments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_progress_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string
          avancement_pourcentage: number | null
          boomerang_active: boolean | null
          boomerang_current_holder: string | null
          boomerang_deadline: string | null
          boomerang_duration_hours: number | null
          boomerang_history: Json | null
          boomerang_original_owner: string | null
          commentaires: Json | null
          created_at: string
          created_by: string
          date_echeance: string
          depend_de: string | null
          dernier_commentaire_avancement: string | null
          description: string | null
          id: string
          is_priority: boolean | null
          last_progress_comment_at: string | null
          machine_piece: string | null
          maintenance_type: string | null
          parent_task_id: string | null
          photos: string[] | null
          priorite: string | null
          rappels: Json | null
          recurrence: Json | null
          statut: string | null
          titre: string
          updated_at: string
        }
        Insert: {
          assigned_to: string
          avancement_pourcentage?: number | null
          boomerang_active?: boolean | null
          boomerang_current_holder?: string | null
          boomerang_deadline?: string | null
          boomerang_duration_hours?: number | null
          boomerang_history?: Json | null
          boomerang_original_owner?: string | null
          commentaires?: Json | null
          created_at?: string
          created_by: string
          date_echeance: string
          depend_de?: string | null
          dernier_commentaire_avancement?: string | null
          description?: string | null
          id?: string
          is_priority?: boolean | null
          last_progress_comment_at?: string | null
          machine_piece?: string | null
          maintenance_type?: string | null
          parent_task_id?: string | null
          photos?: string[] | null
          priorite?: string | null
          rappels?: Json | null
          recurrence?: Json | null
          statut?: string | null
          titre: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          avancement_pourcentage?: number | null
          boomerang_active?: boolean | null
          boomerang_current_holder?: string | null
          boomerang_deadline?: string | null
          boomerang_duration_hours?: number | null
          boomerang_history?: Json | null
          boomerang_original_owner?: string | null
          commentaires?: Json | null
          created_at?: string
          created_by?: string
          date_echeance?: string
          depend_de?: string | null
          dernier_commentaire_avancement?: string | null
          description?: string | null
          id?: string
          is_priority?: boolean | null
          last_progress_comment_at?: string | null
          machine_piece?: string | null
          maintenance_type?: string | null
          parent_task_id?: string | null
          photos?: string[] | null
          priorite?: string | null
          rappels?: Json | null
          recurrence?: Json | null
          statut?: string | null
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_boomerang_current_holder_fkey"
            columns: ["boomerang_current_holder"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "tasks_boomerang_current_holder_fkey"
            columns: ["boomerang_current_holder"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_boomerang_original_owner_fkey"
            columns: ["boomerang_original_owner"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "tasks_boomerang_original_owner_fkey"
            columns: ["boomerang_original_owner"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_depend_de_fkey"
            columns: ["depend_de"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "tasks_depend_de_fkey"
            columns: ["depend_de"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_managers: {
        Row: {
          created_at: string | null
          created_by: string | null
          equipe: string
          id: string
          manager_employee_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          equipe: string
          id?: string
          manager_employee_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          equipe?: string
          id?: string
          manager_employee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_managers_manager_employee_id_fkey"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "team_managers_manager_employee_id_fkey"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          candidate_email: string | null
          candidate_name: string
          created_at: string
          global_score: number | null
          id: string
          logic_questions_correct: number | null
          logic_score: number | null
          logic_total_questions: number | null
          memory_level_reached: number | null
          memory_max_level: number | null
          memory_score: number | null
          observation_avg_time: number | null
          observation_differences_found: number | null
          observation_score: number | null
          raw_details: Json | null
          rigor_accuracy: number | null
          rigor_avg_time: number | null
          rigor_differences_found: number | null
          rigor_score: number | null
          session_duration: number | null
          speed_accuracy: number | null
          speed_avg_reaction_time: number | null
          speed_score: number | null
          synced_to_sheets: boolean | null
          test_date: string
          tests_completed: number | null
          updated_at: string
        }
        Insert: {
          candidate_email?: string | null
          candidate_name: string
          created_at?: string
          global_score?: number | null
          id?: string
          logic_questions_correct?: number | null
          logic_score?: number | null
          logic_total_questions?: number | null
          memory_level_reached?: number | null
          memory_max_level?: number | null
          memory_score?: number | null
          observation_avg_time?: number | null
          observation_differences_found?: number | null
          observation_score?: number | null
          raw_details?: Json | null
          rigor_accuracy?: number | null
          rigor_avg_time?: number | null
          rigor_differences_found?: number | null
          rigor_score?: number | null
          session_duration?: number | null
          speed_accuracy?: number | null
          speed_avg_reaction_time?: number | null
          speed_score?: number | null
          synced_to_sheets?: boolean | null
          test_date?: string
          tests_completed?: number | null
          updated_at?: string
        }
        Update: {
          candidate_email?: string | null
          candidate_name?: string
          created_at?: string
          global_score?: number | null
          id?: string
          logic_questions_correct?: number | null
          logic_score?: number | null
          logic_total_questions?: number | null
          memory_level_reached?: number | null
          memory_max_level?: number | null
          memory_score?: number | null
          observation_avg_time?: number | null
          observation_differences_found?: number | null
          observation_score?: number | null
          raw_details?: Json | null
          rigor_accuracy?: number | null
          rigor_avg_time?: number | null
          rigor_differences_found?: number | null
          rigor_score?: number | null
          session_duration?: number | null
          speed_accuracy?: number | null
          speed_avg_reaction_time?: number | null
          speed_score?: number | null
          synced_to_sheets?: boolean | null
          test_date?: string
          tests_completed?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          confidence_score: number | null
          conversation_history: Json | null
          created_at: string
          escalation_count: number | null
          id: string
          last_interaction: string | null
          metadata: Json | null
          phone_number: string | null
          profile_type: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          conversation_history?: Json | null
          created_at?: string
          escalation_count?: number | null
          id?: string
          last_interaction?: string | null
          metadata?: Json | null
          phone_number?: string | null
          profile_type?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          conversation_history?: Json | null
          created_at?: string
          escalation_count?: number | null
          id?: string
          last_interaction?: string | null
          metadata?: Json | null
          phone_number?: string | null
          profile_type?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_validation_config: {
        Row: {
          employee_id: string
          id: string
          updated_at: string
          updated_by: string | null
          validation_mode: Database["public"]["Enums"]["validation_mode"]
        }
        Insert: {
          employee_id: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          validation_mode?: Database["public"]["Enums"]["validation_mode"]
        }
        Update: {
          employee_id?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          validation_mode?: Database["public"]["Enums"]["validation_mode"]
        }
        Relationships: [
          {
            foreignKeyName: "user_validation_config_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "user_validation_config_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_validation_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "user_validation_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_game_sessions: {
        Row: {
          anecdote: string | null
          anecdote_originality_score: number | null
          created_at: string | null
          finished_at: string | null
          id: string
          started_at: string | null
          status: Database["public"]["Enums"]["game_status"]
          target_employee_id: string | null
          week_number: number
          year: number
        }
        Insert: {
          anecdote?: string | null
          anecdote_originality_score?: number | null
          created_at?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          target_employee_id?: string | null
          week_number: number
          year: number
        }
        Update: {
          anecdote?: string | null
          anecdote_originality_score?: number | null
          created_at?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          target_employee_id?: string | null
          week_number?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_game_sessions_target_employee_id_fkey"
            columns: ["target_employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "weekly_game_sessions_target_employee_id_fkey"
            columns: ["target_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          commentaire: string | null
          created_at: string
          created_by: string
          date: string
          employee_id: string
          heure_debut: string
          heure_fin: string
          id: string
          pause_minutes: number | null
          schedule_group_id: string | null
          updated_at: string
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          created_by: string
          date: string
          employee_id: string
          heure_debut: string
          heure_fin: string
          id?: string
          pause_minutes?: number | null
          schedule_group_id?: string | null
          updated_at?: string
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          created_by?: string
          date?: string
          employee_id?: string
          heure_debut?: string
          heure_fin?: string
          id?: string
          pause_minutes?: number | null
          schedule_group_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "work_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      employee_badge_annual_counts: {
        Row: {
          annee: number | null
          badge_id: string | null
          count: number | null
          employee_id: string | null
          last_unlocked_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_badges_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_badge_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_badges_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_badge_summary: {
        Row: {
          badges_this_year: number | null
          employee_id: string | null
          equipe: string | null
          nom: string | null
          photo_url: string | null
          poste: string | null
          prenom: string | null
          recent_badges: Json | null
          total_unique_badges: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_auto_declare: { Args: { p_categorie: string }; Returns: boolean }
      can_close_project: { Args: { project_id: string }; Returns: boolean }
      generate_order_number: { Args: never; Returns: string }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_employee_badge_stats: {
        Args: { p_employee_id: string; p_month?: number; p_year?: number }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_direct_manager: { Args: { p_employee_id: string }; Returns: boolean }
      is_employee_team_member: {
        Args: { p_employee_id: string }
        Returns: boolean
      }
      is_manager: { Args: never; Returns: boolean }
      is_project_creator: { Args: { project_id: string }; Returns: boolean }
      is_team_manager: { Args: { p_equipe: string }; Returns: boolean }
      match_response_blocks: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          bloc_id: string
          category: string
          content: string
          id: string
          priority: number
          similarity: number
          title: string
          triggers: string[]
        }[]
      }
      search_blocks_by_similarity: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          bloc_id: string
          category: string
          content: string
          similarity: number
          title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "manager"
      categorie_agenda:
        | "protocoles"
        | "indicateurs"
        | "horaires"
        | "materiel"
        | "attitude"
        | "absence"
        | "incident"
        | "a_faire"
      destinataire_type: "tout_le_monde" | "selection_equipe" | "groupe"
      game_role: "target" | "investigator"
      game_status:
        | "registration_open"
        | "waiting_anecdote"
        | "in_progress"
        | "finished"
        | "cancelled_no_anecdote"
      gravite_erreur: "mineure" | "moyenne" | "majeure" | "critique"
      gravite_type: "mineure" | "moyenne" | "majeure"
      job_category: "Admin" | "Prothèse"
      order_method: "phone" | "email" | "platform" | "other"
      order_status:
        | "draft"
        | "pending_validation"
        | "validated"
        | "ordered"
        | "delivered"
        | "archived"
        | "rejected"
      postponement_status: "en_attente" | "approuve" | "refuse"
      project_status: "a_venir" | "en_cours" | "termine" | "en_pause"
      statut_idee:
        | "soumise"
        | "en_examen"
        | "approuvee"
        | "rejetee"
        | "implementee"
      statut_objectif: "atteint" | "en_cours" | "non_atteint"
      statut_score_mensuel: "ouvert" | "cloture" | "publie"
      statut_validation: "en_attente" | "valide" | "refuse"
      type_absence: "demande_conges" | "arret_maladie" | "injustifie"
      type_incident_materiel:
        | "retard"
        | "negligence"
        | "erreur_protocole"
        | "autre"
      type_quiz: "technique" | "collegue" | "mood"
      validation_mode: "auto" | "manual"
      vote_type:
        | "elimination"
        | "anecdote_originality"
        | "clue_difficulty"
        | "final_suspect"
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
      app_role: ["admin", "user", "manager"],
      categorie_agenda: [
        "protocoles",
        "indicateurs",
        "horaires",
        "materiel",
        "attitude",
        "absence",
        "incident",
        "a_faire",
      ],
      destinataire_type: ["tout_le_monde", "selection_equipe", "groupe"],
      game_role: ["target", "investigator"],
      game_status: [
        "registration_open",
        "waiting_anecdote",
        "in_progress",
        "finished",
        "cancelled_no_anecdote",
      ],
      gravite_erreur: ["mineure", "moyenne", "majeure", "critique"],
      gravite_type: ["mineure", "moyenne", "majeure"],
      job_category: ["Admin", "Prothèse"],
      order_method: ["phone", "email", "platform", "other"],
      order_status: [
        "draft",
        "pending_validation",
        "validated",
        "ordered",
        "delivered",
        "archived",
        "rejected",
      ],
      postponement_status: ["en_attente", "approuve", "refuse"],
      project_status: ["a_venir", "en_cours", "termine", "en_pause"],
      statut_idee: [
        "soumise",
        "en_examen",
        "approuvee",
        "rejetee",
        "implementee",
      ],
      statut_objectif: ["atteint", "en_cours", "non_atteint"],
      statut_score_mensuel: ["ouvert", "cloture", "publie"],
      statut_validation: ["en_attente", "valide", "refuse"],
      type_absence: ["demande_conges", "arret_maladie", "injustifie"],
      type_incident_materiel: [
        "retard",
        "negligence",
        "erreur_protocole",
        "autre",
      ],
      type_quiz: ["technique", "collegue", "mood"],
      validation_mode: ["auto", "manual"],
      vote_type: [
        "elimination",
        "anecdote_originality",
        "clue_difficulty",
        "final_suspect",
      ],
    },
  },
} as const
