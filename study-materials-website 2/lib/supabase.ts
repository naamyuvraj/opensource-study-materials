import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://sfirgiixugtqqievimoo.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJnaWl4dWd0cXFpZXZpbW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NzA1MDcsImV4cCI6MjA2NzU0NjUwN30.aS_w512S8cYd9GyPlJquSg3AFPv96aNl1X3-Sl88zUc"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: "admin" | "user"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "admin" | "user"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "admin" | "user"
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string
          slug: string
          material_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string
          slug: string
          material_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string
          slug?: string
          material_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      materials: {
        Row: {
          id: string
          title: string
          description: string | null
          category_id: string | null
          category: string | null
          file_url: string
          image_url: string | null
          file_size: number | null
          file_type: string | null
          downloads: number
          views: number
          rating: number
          rating_count: number
          status: "active" | "inactive" | "pending"
          tags: string[] | null
          author: string | null
          publisher: string | null
          publication_year: number | null
          isbn: string | null
          language: string
          page_count: number | null
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category_id?: string | null
          category?: string | null
          file_url: string
          image_url?: string | null
          file_size?: number | null
          file_type?: string | null
          downloads?: number
          views?: number
          rating?: number
          rating_count?: number
          status?: "active" | "inactive" | "pending"
          tags?: string[] | null
          author?: string | null
          publisher?: string | null
          publication_year?: number | null
          isbn?: string | null
          language?: string
          page_count?: number | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category_id?: string | null
          category?: string | null
          file_url?: string
          image_url?: string | null
          file_size?: number | null
          file_type?: string | null
          downloads?: number
          views?: number
          rating?: number
          rating_count?: number
          status?: "active" | "inactive" | "pending"
          tags?: string[] | null
          author?: string | null
          publisher?: string | null
          publication_year?: number | null
          isbn?: string | null
          language?: string
          page_count?: number | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      downloads: {
        Row: {
          id: string
          material_id: string | null
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          downloaded_at: string
        }
        Insert: {
          id?: string
          material_id?: string | null
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          downloaded_at?: string
        }
        Update: {
          id?: string
          material_id?: string | null
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          downloaded_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          material_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          material_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          material_id?: string
          created_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          user_id: string
          material_id: string
          rating: number
          review: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          material_id: string
          rating: number
          review?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          material_id?: string
          rating?: number
          review?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
