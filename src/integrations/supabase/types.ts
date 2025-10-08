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
          created_at: string
          date: string
          date_validation: string | null
          detail: string | null
          duree_minutes: number | null
          employee_id: string
          gravite: Database["public"]["Enums"]["gravite_erreur"] | null
          id: string
          motif: string | null
          photos: string[] | null
          points: number | null
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
          valide_par: string | null
        }
        Insert: {
          auteur_id?: string | null
          categorie: Database["public"]["Enums"]["categorie_agenda"]
          commentaire_validation?: string | null
          created_at?: string
          date: string
          date_validation?: string | null
          detail?: string | null
          duree_minutes?: number | null
          employee_id: string
          gravite?: Database["public"]["Enums"]["gravite_erreur"] | null
          id?: string
          motif?: string | null
          photos?: string[] | null
          points?: number | null
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
          valide_par?: string | null
        }
        Update: {
          auteur_id?: string | null
          categorie?: Database["public"]["Enums"]["categorie_agenda"]
          commentaire_validation?: string | null
          created_at?: string
          date?: string
          date_validation?: string | null
          detail?: string | null
          duree_minutes?: number | null
          employee_id?: string
          gravite?: Database["public"]["Enums"]["gravite_erreur"] | null
          id?: string
          motif?: string | null
          photos?: string[] | null
          points?: number | null
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
      employees: {
        Row: {
          atelier: string | null
          created_at: string
          email: string | null
          equipe: string | null
          id: string
          nom: string
          poste: string | null
          prenom: string
          profile_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          atelier?: string | null
          created_at?: string
          email?: string | null
          equipe?: string | null
          id?: string
          nom: string
          poste?: string | null
          prenom: string
          profile_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          atelier?: string | null
          created_at?: string
          email?: string | null
          equipe?: string | null
          id?: string
          nom?: string
          poste?: string | null
          prenom?: string
          profile_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
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
      monthly_scores: {
        Row: {
          annee: number
          cloture_par: string | null
          created_at: string
          date_cloture: string | null
          employee_id: string
          id: string
          mois: number
          prime_montant: number | null
          score_attitude: number | null
          score_global: number | null
          score_horaires: number | null
          score_materiel: number | null
          score_objectifs: number | null
          score_protocoles: number | null
          statut: Database["public"]["Enums"]["statut_score_mensuel"] | null
          updated_at: string
        }
        Insert: {
          annee: number
          cloture_par?: string | null
          created_at?: string
          date_cloture?: string | null
          employee_id: string
          id?: string
          mois: number
          prime_montant?: number | null
          score_attitude?: number | null
          score_global?: number | null
          score_horaires?: number | null
          score_materiel?: number | null
          score_objectifs?: number | null
          score_protocoles?: number | null
          statut?: Database["public"]["Enums"]["statut_score_mensuel"] | null
          updated_at?: string
        }
        Update: {
          annee?: number
          cloture_par?: string | null
          created_at?: string
          date_cloture?: string | null
          employee_id?: string
          id?: string
          mois?: number
          prime_montant?: number | null
          score_attitude?: number | null
          score_global?: number | null
          score_horaires?: number | null
          score_materiel?: number | null
          score_objectifs?: number | null
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
          titre?: string
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_employee_id_fkey"
            columns: ["employee_id"]
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
      tasks: {
        Row: {
          assigned_to: string
          commentaires: Json | null
          created_at: string
          created_by: string
          date_echeance: string
          depend_de: string | null
          description: string | null
          id: string
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
          commentaires?: Json | null
          created_at?: string
          created_by: string
          date_echeance: string
          depend_de?: string | null
          description?: string | null
          id?: string
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
          commentaires?: Json | null
          created_at?: string
          created_by?: string
          date_echeance?: string
          depend_de?: string | null
          description?: string | null
          id?: string
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
            referencedRelation: "employees"
            referencedColumns: ["id"]
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
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      can_auto_declare: {
        Args: { p_categorie: string }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_employee_team_member: {
        Args: { p_employee_id: string }
        Returns: boolean
      }
      is_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
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
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "user" | "manager"
      categorie_agenda:
        | "protocoles"
        | "objectifs"
        | "horaires"
        | "materiel"
        | "attitude"
        | "absence"
        | "incident"
        | "a_faire"
      destinataire_type: "tout_le_monde" | "selection_equipe" | "groupe"
      gravite_erreur: "mineure" | "moyenne" | "majeure" | "critique"
      job_category: "Admin" | "Prothèse"
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
        "objectifs",
        "horaires",
        "materiel",
        "attitude",
        "absence",
        "incident",
        "a_faire",
      ],
      destinataire_type: ["tout_le_monde", "selection_equipe", "groupe"],
      gravite_erreur: ["mineure", "moyenne", "majeure", "critique"],
      job_category: ["Admin", "Prothèse"],
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
    },
  },
} as const
