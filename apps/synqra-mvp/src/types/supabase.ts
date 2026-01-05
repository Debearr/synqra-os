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
      council_outcomes: {
        Row: {
          id: string
          user_id: string
          action_id: string
          outcome: 'success' | 'failure' | 'neutral'
          metrics: Json
          context: Json
          timestamp: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          action_id: string
          outcome: 'success' | 'failure' | 'neutral'
          metrics?: Json
          context?: Json
          timestamp: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          action_id?: string
          outcome?: 'success' | 'failure' | 'neutral'
          metrics?: Json
          context?: Json
          timestamp?: string
          created_at?: string | null
        }
      }
      council_rules: {
        Row: {
          id: string
          rule_id: string
          condition: string
          action: 'suggest' | 'warn' | 'constrain' | 'observe'
          priority: number | null
          learned_from: Json
          effectiveness: number | null
          last_updated: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          rule_id: string
          condition: string
          action: 'suggest' | 'warn' | 'constrain' | 'observe'
          priority?: number | null
          learned_from?: Json
          effectiveness?: number | null
          last_updated?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          rule_id?: string
          condition?: string
          action?: 'suggest' | 'warn' | 'constrain' | 'observe'
          priority?: number | null
          learned_from?: Json
          effectiveness?: number | null
          last_updated?: string | null
          created_at?: string | null
        }
      }
      council_learnings: {
        Row: {
          id: string
          source_product: 'synqra' | 'aurafx' | 'noid'
          target_product: 'synqra' | 'aurafx' | 'noid'
          rule_id: string
          effectiveness: number | null
          learned_at: string
          shared: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          source_product: 'synqra' | 'aurafx' | 'noid'
          target_product: 'synqra' | 'aurafx' | 'noid'
          rule_id: string
          effectiveness?: number | null
          learned_at: string
          shared?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          source_product?: 'synqra' | 'aurafx' | 'noid'
          target_product?: 'synqra' | 'aurafx' | 'noid'
          rule_id?: string
          effectiveness?: number | null
          learned_at?: string
          shared?: boolean | null
          created_at?: string | null
        }
      }
      exec_summaries: {
        Row: {
          id: string
          owner_id: string
          label: string
          product_name: string | null
          data_json: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          label: string
          product_name?: string | null
          data_json: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          label?: string
          product_name?: string | null
          data_json?: Json
          created_at?: string
          updated_at?: string
        }
      }
      aura_signals: {
        Row: {
          id: string
          pair: string
          style: string
          direction: string
          entry: string
          stop: string
          tp1: string | null
          tp2: string | null
          tp3: string | null
          reason: string | null
          status: 'open' | 'tp1' | 'tp2' | 'tp3' | 'closed' | 'stopped'
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          pair: string
          style: string
          direction: string
          entry: string
          stop: string
          tp1?: string | null
          tp2?: string | null
          tp3?: string | null
          reason?: string | null
          status?: 'open' | 'tp1' | 'tp2' | 'tp3' | 'closed' | 'stopped'
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          pair?: string
          style?: string
          direction?: string
          entry?: string
          stop?: string
          tp1?: string | null
          tp2?: string | null
          tp3?: string | null
          reason?: string | null
          status?: 'open' | 'tp1' | 'tp2' | 'tp3' | 'closed' | 'stopped'
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      aura_signal_status: 'open' | 'tp1' | 'tp2' | 'tp3' | 'closed' | 'stopped'
    }
  }
}
