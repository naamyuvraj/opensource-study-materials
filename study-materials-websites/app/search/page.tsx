"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, BookOpen, Download, Star, Eye, Filter, ArrowLeft, SlidersHorizontal } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabase = createClient(
  "https://sfirgiixugtqqievimoo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJnaWl4dWd0cXFpZXZpbW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NzA1MDcsImV4cCI6MjA2NzU0NjUwN30.aS_w512S8cYd9GyPlJquSg3AFPv96aNl1X3-Sl88zUc",
)

interface Material {
  id: string
  title: string
  category: string
  downloads: number
  views: number
  rating: number
  rating_count: number
  image_url: string
  file_url: string
  description: string
  created_at: string
}

interface Category {
  id: string
  name: string
  icon: string
  material_count: number
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [materials, setMaterials] = useState<Material[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [isLoading, setIsLoading] = useState(true)
  const [userRatings, setUserRatings] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    fetchMaterials()
    fetchCategories()
  }, [])

  useEffect(() => {
    filterAndSortMaterials()
  }, [materials, searchQuery, selectedCategory, sortBy])

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching materials:", error)
        setMaterials(mockMaterials)
      } else {
        setMaterials(data || [])
      }
    } catch (error) {
      console.error("Error:", error)
      setMaterials(mockMaterials)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) {
        console.error("Error fetching categories:", error)
        setCategories(mockCategories)
      } else {
        setCategories(data || [])
      }
    } catch (error) {
      console.error("Error:", error)
      setCategories(mockCategories)
    }
  }

  const filterAndSortMaterials = () => {
    let filtered = materials

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (material) =>
          material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((material) => material.category === selectedCategory)
    }

    // Sort materials
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "downloads":
        filtered.sort((a, b) => b.downloads - a.downloads)
        break
      case "views":
        filtered.sort((a, b) => b.views - a.views)
        break
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
    }

    setFilteredMaterials(filtered)
  }

  const handleDownload = async (materialId: string, fileUrl: string, title: string) => {
    try {
      // Record download in database
      await supabase.from("downloads").insert([
        {
          material_id: materialId,
          downloaded_at: new Date().toISOString(),
        },
      ])

      // Update material download count
      const material = materials.find((m) => m.id === materialId)
      if (material) {
        await supabase
          .from("materials")
          .update({ downloads: material.downloads + 1 })
          .eq("id", materialId)
      }

      // Create a proper download
      try {
        const response = await fetch(fileUrl)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${title}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (downloadError) {
        // Fallback to opening in new tab if direct download fails
        window.open(fileUrl, "_blank")
      }

      // Refresh materials to show updated counts
      fetchMaterials()
    } catch (error) {
      console.error("Error downloading:", error)
      window.open(fileUrl, "_blank")
    }
  }

  const handleView = async (materialId: string, fileUrl: string) => {
    try {
      // Record view in database
      await supabase.from("views").insert([
        {
          material_id: materialId,
          viewed_at: new Date().toISOString(),
        },
      ])

      // Update material view count
      const material = materials.find((m) => m.id === materialId)
      if (material) {
        await supabase
          .from("materials")
          .update({ views: material.views + 1 })
          .eq("id", materialId)
      }

      // Open in new tab
      window.open(fileUrl, "_blank")

      // Refresh materials to show updated counts
      fetchMaterials()
    } catch (error) {
      console.error("Error viewing:", error)
      window.open(fileUrl, "_blank")
    }
  }

  const handleRating = async (materialId: string, rating: number) => {
    try {
      // Check if user already rated this material
      const { data: existingRating } = await supabase.from("ratings").select("*").eq("material_id", materialId).single()

      if (existingRating) {
        // Update existing rating
        await supabase
          .from("ratings")
          .update({
            rating,
            updated_at: new Date().toISOString(),
          })
          .eq("material_id", materialId)
      } else {
        // Insert new rating
        await supabase.from("ratings").insert([
          {
            material_id: materialId,
            rating,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
      }

      // Update local state
      setUserRatings((prev) => ({ ...prev, [materialId]: rating }))

      // Recalculate material rating
      const { data: allRatings } = await supabase.from("ratings").select("rating").eq("material_id", materialId)

      if (allRatings && allRatings.length > 0) {
        const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
        const ratingCount = allRatings.length

        await supabase
          .from("materials")
          .update({
            rating: Number(avgRating.toFixed(1)),
            rating_count: ratingCount,
          })
          .eq("id", materialId)
      }

      // Refresh materials to show updated rating
      fetchMaterials()
    } catch (error) {
      console.error("Error rating material:", error)
    }
  }

  const renderStars = (materialId: string, currentRating: number, isInteractive = false) => {
    const userRating = userRatings[materialId] || 0

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => isInteractive && handleRating(materialId, star)}
            disabled={!isInteractive}
            className={`${isInteractive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          >
            <Star
              className={`h-4 w-4 ${
                star <= (userRating || currentRating) ? "text-yellow-400 fill-current" : "text-gray-400"
              }`}
            />
          </button>
        ))}
        {isInteractive && (
          <span className="text-xs text-gray-400 ml-2">{userRating ? `You rated: ${userRating}` : "Rate this"}</span>
        )}
      </div>
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("")
    setSortBy("newest")
  }

  // Mock data with realistic numbers
  const mockMaterials: Material[] = [
    {
      id: "1",
      title: "UPSC Prelims Complete Guide 2024",
      category: "Government Exams",
      downloads: 1250,
      views: 2100,
      rating: 4.8,
      rating_count: 156,
      image_url: "/placeholder.svg?height=300&width=400",
      file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      description: "Comprehensive guide for UPSC preliminary examination with latest syllabus and practice questions",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Data Structures & Algorithms Mastery",
      category: "Technical Books",
      downloads: 890,
      views: 1540,
      rating: 4.9,
      rating_count: 203,
      image_url: "/placeholder.svg?height=300&width=400",
      file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      description: "Complete DSA guide for programming interviews and competitive coding challenges",
      created_at: new Date().toISOString(),
    },
    {
      id: "3",
      title: "English Literature Classics Collection",
      category: "Novels",
      downloads: 650,
      views: 980,
      rating: 4.7,
      rating_count: 89,
      image_url: "/placeholder.svg?height=300&width=400",
      file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      description: "Curated collection of timeless English literature masterpieces and analysis",
      created_at: new Date().toISOString(),
    },
    {
      id: "4",
      title: "SSC CGL Complete Preparation Kit",
      category: "Government Exams",
      downloads: 980,
      views: 1650,
      rating: 4.6,
      rating_count: 124,
      image_url: "/placeholder.svg?height=300&width=400",
      file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      description: "Comprehensive preparation material for SSC CGL examination with mock tests",
      created_at: new Date().toISOString(),
    },
    {
      id: "5",
      title: "Machine Learning Fundamentals",
      category: "Technical Books",
      downloads: 720,
      views: 1200,
      rating: 4.8,
      rating_count: 167,
      image_url: "/placeholder.svg?height=300&width=400",
      file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      description: "Introduction to machine learning concepts, algorithms, and practical applications",
      created_at: new Date().toISOString(),
    },
    {
      id: "6",
      title: "World History Comprehensive Guide",
      category: "Academic Books",
      downloads: 540,
      views: 890,
      rating: 4.5,
      rating_count: 78,
      image_url: "/placeholder.svg?height=300&width=400",
      file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      description: "Complete world history guide covering ancient to modern civilizations",
      created_at: new Date().toISOString(),
    },
  ]

  const mockCategories: Category[] = [
    { id: "1", name: "Government Exams", material_count: 150, icon: "🏛️" },
    { id: "2", name: "Technical Books", material_count: 120, icon: "💻" },
    { id: "3", name: "Novels", material_count: 89, icon: "📚" },
    { id: "4", name: "Academic Books", material_count: 95, icon: "🎓" },
    { id: "5", name: "Competitive Exams", material_count: 200, icon: "🎯" },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Floating Navigation */}
      <nav className="fixed top-4 left-4 right-4 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-black font-bold" />
                  </div>
                  <span className="text-2xl font-bold font-space-grotesk">StudyHub</span>
                </Link>
                <div className="hidden md:block w-px h-6 bg-white/20"></div>
                <div className="hidden md:flex items-center space-x-2 text-gray-400">
                  <Link href="/" className="hover:text-green-400 transition-colors">
                    Home
                  </Link>
                  <span>/</span>
                  <span className="text-green-400">Search</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-400 hover:bg-white/10">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Header */}
      <section className="pt-32 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold font-space-grotesk mb-6">
              Search <span className="text-green-400">Materials</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Find the perfect study materials from our comprehensive collection
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for books, guides, materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-green-400 focus:ring-green-400/20 rounded-2xl pl-6 pr-14 text-lg"
                />
                <Button
                  size="sm"
                  className="absolute right-2 top-2 bg-green-500 hover:bg-green-600 text-black rounded-xl h-10 w-10 p-0"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="h-5 w-5 text-gray-400" />
                <span className="text-gray-400 font-medium">Filters:</span>
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white/5 border border-white/20 text-white rounded-xl px-4 py-2 focus:border-green-400 focus:ring-green-400/20"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name} className="bg-black">
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Sort Filter */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/5 border border-white/20 text-white rounded-xl px-4 py-2 focus:border-green-400 focus:ring-green-400/20"
              >
                <option value="newest" className="bg-black">
                  Newest First
                </option>
                <option value="oldest" className="bg-black">
                  Oldest First
                </option>
                <option value="downloads" className="bg-black">
                  Most Downloaded
                </option>
                <option value="views" className="bg-black">
                  Most Viewed
                </option>
                <option value="rating" className="bg-black">
                  Highest Rated
                </option>
                <option value="title" className="bg-black">
                  Alphabetical
                </option>
              </select>

              {(searchQuery || selectedCategory) && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="text-gray-400">
              {isLoading ? "Loading..." : `${filteredMaterials.length} materials found`}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading materials...</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold font-space-grotesk mb-4">No materials found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your search terms or filters</p>
              <Button onClick={clearFilters} className="bg-green-500 hover:bg-green-600 text-black font-medium">
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMaterials.map((material, index) => (
                <Card
                  key={index}
                  className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-green-500/50 transition-all duration-300 overflow-hidden rounded-2xl group"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <Image
                      src={material.image_url || "/placeholder.svg"}
                      alt={material.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <Badge className="absolute top-4 left-4 bg-green-500/90 text-black font-medium">
                      {material.category}
                    </Badge>
                  </div>
                  <CardHeader className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        {renderStars(material.id, material.rating, true)}
                        <span className="text-sm text-gray-300">({material.rating_count})</span>
                      </div>
                    </div>
                    <CardTitle className="text-white font-space-grotesk text-xl mb-3 line-clamp-2">
                      {material.title}
                    </CardTitle>
                    <p className="text-gray-400 text-sm line-clamp-3 mb-4">{material.description}</p>

                    <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Download className="h-4 w-4" />
                        <span>{material.downloads}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{material.views}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-black font-medium flex-1 rounded-xl"
                        onClick={() => handleDownload(material.id, material.file_url, material.title)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent"
                        onClick={() => handleView(material.id, material.file_url)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
