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
      access_control: {
        Row: {
          allowed: boolean
          campanha_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          route: string
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          campanha_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          route: string
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          campanha_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          route?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_control_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_events: {
        Row: {
          bairro: string | null
          campanha_id: string
          cidade: string | null
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          local: string | null
          notas: string | null
          participantes: string[] | null
          prioridade: string
          recorrente: boolean
          responsavel_id: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          campanha_id: string
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          local?: string | null
          notas?: string | null
          participantes?: string[] | null
          prioridade?: string
          recorrente?: boolean
          responsavel_id?: string | null
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          campanha_id?: string
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          local?: string | null
          notas?: string | null
          participantes?: string[] | null
          prioridade?: string
          recorrente?: boolean
          responsavel_id?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_events_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      budget_allocations: {
        Row: {
          budget_id: string
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          id: string
          planned_amount: number
          updated_at: string
        }
        Insert: {
          budget_id: string
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          id?: string
          planned_amount?: number
          updated_at?: string
        }
        Update: {
          budget_id?: string
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          id?: string
          planned_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_allocations_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_allocations_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "v_execucao_orcamentaria"
            referencedColumns: ["budget_id"]
          },
        ]
      }
      budgets: {
        Row: {
          active: boolean
          campanha_id: string | null
          candidate_id: string | null
          created_at: string
          id: string
          notes: string | null
          title: string | null
          total_planned: number
          updated_at: string
          year: number | null
        }
        Insert: {
          active?: boolean
          campanha_id?: string | null
          candidate_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          title?: string | null
          total_planned?: number
          updated_at?: string
          year?: number | null
        }
        Update: {
          active?: boolean
          campanha_id?: string | null
          candidate_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          title?: string | null
          total_planned?: number
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas: {
        Row: {
          cargo: string | null
          cor_primaria: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          logo_url: string | null
          municipio: string | null
          nome: string
          numero_candidato: string | null
          partido: string | null
          uf: string | null
          updated_at: string | null
        }
        Insert: {
          cargo?: string | null
          cor_primaria?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          municipio?: string | null
          nome: string
          numero_candidato?: string | null
          partido?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Update: {
          cargo?: string | null
          cor_primaria?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          municipio?: string | null
          nome?: string
          numero_candidato?: string | null
          partido?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          created_at: string
          id: string
          name: string
          party: string | null
          position: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          party?: string | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          party?: string | null
          position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_widget_config: {
        Row: {
          campanha_id: string
          created_at: string
          enabled: boolean
          id: string
          updated_at: string
          widget_key: string
        }
        Insert: {
          campanha_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          widget_key: string
        }
        Update: {
          campanha_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          widget_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_widget_config_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          campanha_id: string | null
          candidate_id: string | null
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          date: string
          description: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          receipt_url: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          campanha_id?: string | null
          candidate_id?: string | null
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          date: string
          description: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          receipt_url?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          campanha_id?: string | null
          candidate_id?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      external_form_config: {
        Row: {
          campanha_id: string
          created_at: string
          enabled: boolean
          fields: Json
          id: string
          mensagem_sucesso: string | null
          titulo: string | null
          updated_at: string
        }
        Insert: {
          campanha_id: string
          created_at?: string
          enabled?: boolean
          fields?: Json
          id?: string
          mensagem_sucesso?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          campanha_id?: string
          created_at?: string
          enabled?: boolean
          fields?: Json
          id?: string
          mensagem_sucesso?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_form_config_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: true
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_links: {
        Row: {
          campanha_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          campanha_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          token: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          campanha_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_links_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      material_inventory: {
        Row: {
          campanha_id: string
          cidade: string
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          quantidade_enviada: number
          quantidade_reportada: number
          tipo: string
          updated_at: string
        }
        Insert: {
          campanha_id: string
          cidade: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          quantidade_enviada?: number
          quantidade_reportada?: number
          tipo: string
          updated_at?: string
        }
        Update: {
          campanha_id?: string
          cidade?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          quantidade_enviada?: number
          quantidade_reportada?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_inventory_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "team_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      municipio_eleicoes: {
        Row: {
          campanha_id: string
          cargo: string
          created_at: string
          eleicao_ano: number
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          campanha_id: string
          cargo: string
          created_at?: string
          eleicao_ano: number
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          campanha_id?: string
          cargo?: string
          created_at?: string
          eleicao_ano?: number
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipio_eleicoes_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      municipio_historico_votacao: {
        Row: {
          campanha_id: string
          cargo: string
          created_at: string
          eleicao_ano: number
          eleicao_id: string | null
          id: string
          municipio_id: string
          notes: string | null
          updated_at: string
          votacao: number
        }
        Insert: {
          campanha_id: string
          cargo: string
          created_at?: string
          eleicao_ano: number
          eleicao_id?: string | null
          id?: string
          municipio_id: string
          notes?: string | null
          updated_at?: string
          votacao?: number
        }
        Update: {
          campanha_id?: string
          cargo?: string
          created_at?: string
          eleicao_ano?: number
          eleicao_id?: string | null
          id?: string
          municipio_id?: string
          notes?: string | null
          updated_at?: string
          votacao?: number
        }
        Relationships: [
          {
            foreignKeyName: "municipio_historico_votacao_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "municipio_historico_votacao_eleicao_id_fkey"
            columns: ["eleicao_id"]
            isOneToOne: false
            referencedRelation: "municipio_eleicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "municipio_historico_votacao_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      municipios: {
        Row: {
          campanha_id: string
          coordenador_id: string | null
          created_at: string
          estado: string
          id: string
          meta_votos: number | null
          nome: string
          notes: string | null
          populacao: number | null
          prioridade: string
          status: string
          updated_at: string
          zona_eleitoral: string | null
        }
        Insert: {
          campanha_id: string
          coordenador_id?: string | null
          created_at?: string
          estado: string
          id?: string
          meta_votos?: number | null
          nome: string
          notes?: string | null
          populacao?: number | null
          prioridade?: string
          status?: string
          updated_at?: string
          zona_eleitoral?: string | null
        }
        Update: {
          campanha_id?: string
          coordenador_id?: string | null
          created_at?: string
          estado?: string
          id?: string
          meta_votos?: number | null
          nome?: string
          notes?: string | null
          populacao?: number | null
          prioridade?: string
          status?: string
          updated_at?: string
          zona_eleitoral?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "municipios_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blocked_at: string | null
          campanha_id: string | null
          candidate_id: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          parent_id: string | null
          pin: string | null
          supporter_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          blocked_at?: string | null
          campanha_id?: string | null
          candidate_id?: string | null
          created_at?: string
          email?: string | null
          id: string
          name: string
          parent_id?: string | null
          pin?: string | null
          supporter_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          blocked_at?: string | null
          campanha_id?: string | null
          candidate_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          pin?: string | null
          supporter_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supporter_id_fkey"
            columns: ["supporter_id"]
            isOneToOne: false
            referencedRelation: "supporters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supporter_id_fkey"
            columns: ["supporter_id"]
            isOneToOne: false
            referencedRelation: "supporters_heatmap"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          device_name: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          device_name?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          device_name?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          campanha_id: string | null
          created_at: string | null
          description: string | null
          file_url: string | null
          generated_at: string | null
          id: string
          report_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          campanha_id?: string | null
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          generated_at?: string | null
          id?: string
          report_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          campanha_id?: string | null
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          generated_at?: string | null
          id?: string
          report_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_requests: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          bairro: string | null
          campanha_id: string
          cidade: string | null
          created_at: string
          descricao: string
          expense_id: string | null
          id: string
          localidade: string
          notes: string | null
          quantidade: number
          quantidade_utilizada: number
          status: string
          tipo: string
          updated_at: string
          user_id: string
          valor_estimado: number
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          bairro?: string | null
          campanha_id: string
          cidade?: string | null
          created_at?: string
          descricao: string
          expense_id?: string | null
          id?: string
          localidade: string
          notes?: string | null
          quantidade?: number
          quantidade_utilizada?: number
          status?: string
          tipo: string
          updated_at?: string
          user_id: string
          valor_estimado?: number
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          bairro?: string | null
          campanha_id?: string
          cidade?: string | null
          created_at?: string
          descricao?: string
          expense_id?: string | null
          id?: string
          localidade?: string
          notes?: string | null
          quantidade?: number
          quantidade_utilizada?: number
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          valor_estimado?: number
        }
        Relationships: [
          {
            foreignKeyName: "resource_requests_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_requests_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      revenues: {
        Row: {
          amount: number
          campanha_id: string | null
          created_at: string
          created_by: string | null
          date: string
          description: string
          donor_cpf_cnpj: string | null
          donor_name: string | null
          id: string
          notes: string | null
          receipt_url: string | null
          source: string
          updated_at: string
        }
        Insert: {
          amount: number
          campanha_id?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          description: string
          donor_cpf_cnpj?: string | null
          donor_name?: string | null
          id?: string
          notes?: string | null
          receipt_url?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          campanha_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          donor_cpf_cnpj?: string | null
          donor_name?: string | null
          id?: string
          notes?: string | null
          receipt_url?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenues_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      route_assignments: {
        Row: {
          assigned_by: string
          assigned_to: string
          campanha_id: string
          created_at: string
          data_planejada: string
          id: string
          notes: string | null
          status: string
          street_id: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          campanha_id: string
          created_at?: string
          data_planejada: string
          id?: string
          notes?: string | null
          status?: string
          street_id: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          campanha_id?: string
          created_at?: string
          data_planejada?: string
          id?: string
          notes?: string | null
          status?: string
          street_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_assignments_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_assignments_street_id_fkey"
            columns: ["street_id"]
            isOneToOne: false
            referencedRelation: "streets"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      street_checkins: {
        Row: {
          campanha_id: string
          created_at: string
          ended_at: string | null
          feedback_clima:
            | Database["public"]["Enums"]["feedback_clima_type"]
            | null
          feedback_demandas: string | null
          geolocation: unknown
          id: string
          liderancas_identificadas: string | null
          notes: string | null
          photo_url: string | null
          started_at: string
          status: string
          street_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campanha_id: string
          created_at?: string
          ended_at?: string | null
          feedback_clima?:
            | Database["public"]["Enums"]["feedback_clima_type"]
            | null
          feedback_demandas?: string | null
          geolocation?: unknown
          id?: string
          liderancas_identificadas?: string | null
          notes?: string | null
          photo_url?: string | null
          started_at?: string
          status?: string
          street_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campanha_id?: string
          created_at?: string
          ended_at?: string | null
          feedback_clima?:
            | Database["public"]["Enums"]["feedback_clima_type"]
            | null
          feedback_demandas?: string | null
          geolocation?: unknown
          id?: string
          liderancas_identificadas?: string | null
          notes?: string | null
          photo_url?: string | null
          started_at?: string
          status?: string
          street_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "street_checkins_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "street_checkins_street_id_fkey"
            columns: ["street_id"]
            isOneToOne: false
            referencedRelation: "streets"
            referencedColumns: ["id"]
          },
        ]
      }
      streets: {
        Row: {
          bairro: string | null
          campanha_id: string
          cep: string | null
          cidade: string | null
          created_at: string
          estado: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          status_cobertura: Database["public"]["Enums"]["status_cobertura_type"]
        }
        Insert: {
          bairro?: string | null
          campanha_id: string
          cep?: string | null
          cidade?: string | null
          created_at?: string
          estado?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          status_cobertura?: Database["public"]["Enums"]["status_cobertura_type"]
        }
        Update: {
          bairro?: string | null
          campanha_id?: string
          cep?: string | null
          cidade?: string | null
          created_at?: string
          estado?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          status_cobertura?: Database["public"]["Enums"]["status_cobertura_type"]
        }
        Relationships: [
          {
            foreignKeyName: "streets_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      supporters: {
        Row: {
          bairro: string | null
          campanha_id: string | null
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          escolaridade: string | null
          estado: string | null
          foto_url: string | null
          funcao_politica: string | null
          genero: string | null
          geolocation: unknown
          id: string
          latitude: number | null
          lideranca_politica: boolean
          longitude: number | null
          nome: string
          observacao: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          campanha_id?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          escolaridade?: string | null
          estado?: string | null
          foto_url?: string | null
          funcao_politica?: string | null
          genero?: string | null
          geolocation?: unknown
          id?: string
          latitude?: number | null
          lideranca_politica?: boolean
          longitude?: number | null
          nome: string
          observacao?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          campanha_id?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          escolaridade?: string | null
          estado?: string | null
          foto_url?: string | null
          funcao_politica?: string | null
          genero?: string | null
          geolocation?: unknown
          id?: string
          latitude?: number | null
          lideranca_politica?: boolean
          longitude?: number | null
          nome?: string
          observacao?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supporters_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          campanha_id: string
          cidade: string | null
          conteudo: string
          created_at: string
          id: string
          prioridade: string
          sender_id: string
          target_cidade: string | null
          target_roles: string[] | null
          target_user_ids: string[] | null
          titulo: string
        }
        Insert: {
          campanha_id: string
          cidade?: string | null
          conteudo: string
          created_at?: string
          id?: string
          prioridade?: string
          sender_id: string
          target_cidade?: string | null
          target_roles?: string[] | null
          target_user_ids?: string[] | null
          titulo: string
        }
        Update: {
          campanha_id?: string
          cidade?: string | null
          conteudo?: string
          created_at?: string
          id?: string
          prioridade?: string
          sender_id?: string
          target_cidade?: string | null
          target_roles?: string[] | null
          target_user_ids?: string[] | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_name: string | null
          device_token: string
          id: string
          last_used_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          device_token: string
          id?: string
          last_used_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          device_token?: string
          id?: string
          last_used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_access_control: {
        Row: {
          allowed: boolean
          campanha_id: string
          created_at: string
          id: string
          route: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed?: boolean
          campanha_id: string
          created_at?: string
          id?: string
          route: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed?: boolean
          campanha_id?: string
          created_at?: string
          id?: string
          route?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_access_control_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_campanhas: {
        Row: {
          campanha_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          campanha_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          campanha_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_campanhas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_candidates: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          is_default: boolean | null
          user_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          user_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_candidates_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes_agg: {
        Row: {
          candidate_id: string
          id: string
          last_updated: string
          total_votes: number
        }
        Insert: {
          candidate_id: string
          id?: string
          last_updated?: string
          total_votes?: number
        }
        Update: {
          candidate_id?: string
          id?: string
          last_updated?: string
          total_votes?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_agg_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      votes_raw: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          section: string | null
          votes: number
          zone: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          section?: string | null
          votes?: number
          zone?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          section?: string | null
          votes?: number
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_raw_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      supporters_heatmap: {
        Row: {
          bairro: string | null
          campanha_nome: string | null
          campanha_partido: string | null
          cidade: string | null
          estado: string | null
          geolocation: unknown
          id: string | null
          latitude: number | null
          longitude: number | null
          nome: string | null
        }
        Relationships: []
      }
      v_execucao_orcamentaria: {
        Row: {
          budget_id: string | null
          campanha_id: string | null
          candidate_id: string | null
          percentual_executado: number | null
          saldo: number | null
          total_planned: number | null
          total_spent: number | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_email_by_pin: { Args: { p_pin: string }; Returns: string }
      get_unread_message_count: {
        Args: { _campanha_id: string; _user_id: string }
        Returns: number
      }
      get_user_available_candidates: {
        Args: { _user_id: string }
        Returns: {
          candidate_id: string
          candidate_name: string
          candidate_party: string
          candidate_position: string
          is_default: boolean
        }[]
      }
      get_user_candidate_id: { Args: { _user_id: string }; Returns: string }
      gettransactionid: { Args: never; Returns: unknown }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_of_campanha: {
        Args: { _campanha_id: string; _user_id: string }
        Returns: boolean
      }
      is_master: { Args: { _user_id: string }; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      validate_pin: { Args: { p_pin: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "candidate"
        | "supporter"
        | "master"
        | "coordinator"
        | "supervisor"
        | "local_coordinator"
        | "political_leader"
        | "assessor"
        | "territorial_coordinator"
      expense_category:
        | "publicidade"
        | "transporte"
        | "alimentacao"
        | "material"
        | "eventos"
        | "pessoal"
        | "outros"
      feedback_clima_type: "receptivo" | "neutro" | "hostil"
      payment_method: "pix" | "cartao" | "dinheiro" | "transferencia" | "boleto"
      status_cobertura_type:
        | "nao_visitada"
        | "em_visitacao"
        | "concluida"
        | "necessita_retorno"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      app_role: [
        "admin",
        "candidate",
        "supporter",
        "master",
        "coordinator",
        "supervisor",
        "local_coordinator",
        "political_leader",
        "assessor",
        "territorial_coordinator",
      ],
      expense_category: [
        "publicidade",
        "transporte",
        "alimentacao",
        "material",
        "eventos",
        "pessoal",
        "outros",
      ],
      feedback_clima_type: ["receptivo", "neutro", "hostil"],
      payment_method: ["pix", "cartao", "dinheiro", "transferencia", "boleto"],
      status_cobertura_type: [
        "nao_visitada",
        "em_visitacao",
        "concluida",
        "necessita_retorno",
      ],
    },
  },
} as const
