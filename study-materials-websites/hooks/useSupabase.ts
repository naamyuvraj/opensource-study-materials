"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"

type Material = Database["public"]["Tables"]["materials"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]

export function useSupabase() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch materials with realtime updates
  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (err) {
      console.error("Error fetching materials:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  // Fetch categories with realtime updates
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error("Error fetching categories:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  // Record download
  const recordDownload = async (materialId: string) => {
    try {
      // Insert download record
      const { error: downloadError } = await supabase.from("downloads").insert([
        {
          material_id: materialId,
          downloaded_at: new Date().toISOString(),
        },
      ])

      if (downloadError) throw downloadError

      // Update material download count
      const { error: updateError } = await supabase.rpc("increment_downloads", { material_id: materialId })

      if (updateError) throw updateError

      // Refresh materials to show updated count
      await fetchMaterials()
    } catch (err) {
      console.error("Error recording download:", err)
    }
  }

  // Record view
  const recordView = async (materialId: string) => {
    try {
      const { error } = await supabase.from("views").insert([
        {
          material_id: materialId,
          viewed_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      // Update material view count
      await supabase.rpc("increment_views", { material_id: materialId })
    } catch (err) {
      console.error("Error recording view:", err)
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true)
      await Promise.all([fetchMaterials(), fetchCategories()])
      setLoading(false)
    }

    initializeData()

    // Set up realtime subscriptions
    const materialsSubscription = supabase
      .channel("materials_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "materials" }, (payload) => {
        console.log("Materials change received!", payload)
        fetchMaterials()
      })
      .subscribe()

    const categoriesSubscription = supabase
      .channel("categories_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, (payload) => {
        console.log("Categories change received!", payload)
        fetchCategories()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(materialsSubscription)
      supabase.removeChannel(categoriesSubscription)
    }
  }, [])

  return {
    materials,
    categories,
    loading,
    error,
    recordDownload,
    recordView,
    refetch: () => Promise.all([fetchMaterials(), fetchCategories()]),
  }
}
