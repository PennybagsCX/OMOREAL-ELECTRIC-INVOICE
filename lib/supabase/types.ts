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
      // Types will be generated from Supabase
      profiles: {
        Row: { id: string; full_name: string | null; role: 'admin' | 'viewer'; avatar_url: string | null }
        Insert: { id: string; full_name?: string | null; role: 'admin' | 'viewer'; avatar_url?: string | null }
        Update: { full_name?: string | null; role?: 'admin' | 'viewer'; avatar_url?: string | null }
      }
      clients: {
        Row: { id: string; team_id: string; name: string; email: string | null; phone: string | null; address: string | null; notes: string | null }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['clients']['Row']>
      }
      estimates: {
        Row: { id: string; team_id: string; client_id: string; estimate_number: string; status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'expired' | 'rejected'; valid_until: string; notes: string | null; subtotal: number; tax_rate: number; tax_amount: number; total: number; accepted_at: string | null }
        Insert: Omit<Database['public']['Tables']['estimates']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['estimates']['Row']>
      }
      invoices: {
        Row: { id: string; team_id: string; client_id: string; estimate_id: string | null; invoice_number: string; status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue'; issue_date: string; due_date: string; notes: string | null; subtotal: number; tax_rate: number; tax_amount: number; late_fee_rate: number; late_fee_amount: number; total: number; amount_paid: number; amount_due: number; paid_at: string | null }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['invoices']['Row']>
      }
      payments: {
        Row: { id: string; invoice_id: string; amount: number; payment_method: string | null; payment_date: string; notes: string | null; transaction_id: string | null }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['payments']['Row']>
      }
    }
  }
}
