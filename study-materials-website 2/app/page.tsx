"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, BookOpen, Download, Star, Quote, Menu, X, Eye, ArrowRight, Zap, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

interface Stats {
  totalMaterials: number
  totalDownloads: number
  totalViews: number
  totalUsers: number
}

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [materials, setMaterials] = useState<Material[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredMaterials, setFeaturedMaterials] = useState<Material[]>([])
  const [stats, setStats] = useState<Stats>({
    totalMaterials: 0,
    totalDownloads: 0,
    totalViews: 0,
    totalUsers: 0,
  })
  const [userRatings, setUserRatings] = useState<{ [key: string]: number }>({})
  const router = useRouter()

  // Fetch initial data
  useEffect(() => {
    fetchMaterials()
    fetchCategories()
    fetchStats()
  }, [])

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
        setFeaturedMaterials(mockMaterials.slice(0, 3))
      } else {
        setMaterials(data || [])
        setFeaturedMaterials((data || []).slice(0, 3))
      }
    } catch (error) {
      console.error("Error:", error)
      setMaterials(mockMaterials)
      setFeaturedMaterials(mockMaterials.slice(0, 3))
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

  const fetchStats = async () => {
    try {
      // Get total materials count
      const { count: materialsCount } = await supabase
        .from("materials")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")

      // Get total downloads
      const { data: downloadData } = await supabase.from("materials").select("downloads").eq("status", "active")

      // Get total views
      const { data: viewData } = await supabase.from("materials").select("views").eq("status", "active")

      // Get total users (profiles)
      const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

      const totalDownloads = downloadData?.reduce((sum, item) => sum + (item.downloads || 0), 0) || 0
      const totalViews = viewData?.reduce((sum, item) => sum + (item.views || 0), 0) || 0

      setStats({
        totalMaterials: materialsCount || 0,
        totalDownloads,
        totalViews,
        totalUsers: usersCount || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
      // Use mock stats if database fails
      setStats({
        totalMaterials: mockMaterials.length,
        totalDownloads: 50000,
        totalViews: 75000,
        totalUsers: 5000,
      })
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
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

      // Refresh data to show updated counts
      fetchMaterials()
      fetchStats()
    } catch (error) {
      console.error("Error downloading:", error)
      // Fallback download
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

      // Refresh data to show updated counts
      fetchMaterials()
      fetchStats()
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
      description: "Comprehensive guide for UPSC preliminary examination with latest syllabus",
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
      description: "Complete DSA guide for programming interviews and competitive coding",
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
      description: "Curated collection of timeless English literature masterpieces",
      created_at: new Date().toISOString(),
    },
  ]

  const mockCategories: Category[] = [
    { id: "1", name: "Government Exams", material_count: 150, icon: "🏛️" },
    { id: "2", name: "Technical Books", material_count: 120, icon: "💻" },
    { id: "3", name: "Novels", material_count: 89, icon: "📚" },
    { id: "4", name: "Competitive Exams", material_count: 200, icon: "🎯" },
  ]

  const statsDisplay = [
    { icon: BookOpen, value: `${stats.totalMaterials}+`, label: "Study Materials", color: "text-green-400" },
    {
      icon: Download,
      value: `${Math.floor(stats.totalDownloads / 1000)}K+`,
      label: "Downloads",
      color: "text-blue-400",
    },
    { icon: Eye, value: `${Math.floor(stats.totalViews / 1000)}K+`, label: "Views", color: "text-purple-400" },
    { icon: Users, value: `${Math.floor(stats.totalUsers / 1000)}K+`, label: "Active Users", color: "text-yellow-400" },
  ]

  const successStories = [
    {
      name: "Dr. A.P.J. Abdul Kalam",
      quote: "Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.",
      role: "Former President of India",
    },
    {
      name: "Nelson Mandela",
      quote: "Education is the most powerful weapon which you can use to change the world.",
      role: "Former President of South Africa",
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Floating Navigation */}
      <nav className="fixed top-4 left-4 right-4 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-black font-bold" />
                </div>
                <span className="text-2xl font-bold font-space-grotesk">StudyHub</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-gray-300 hover:text-green-400 transition-colors font-medium">
                  Home
                </Link>
                <button
                  onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-300 hover:text-green-400 transition-colors font-medium"
                >
                  Categories
                </button>
                <form onSubmit={handleSearch} className="flex items-center">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search materials..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-green-400 focus:ring-green-400/20 rounded-xl"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="absolute right-1 top-1 bg-green-500 hover:bg-green-600 text-black rounded-lg h-8 w-8 p-0"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
                <button
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-300 hover:text-green-400 transition-colors font-medium"
                >
                  Contact
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-white hover:text-green-400 hover:bg-white/10"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
              <div className="md:hidden mt-4 pt-4 border-t border-white/10">
                <div className="space-y-4">
                  <Link href="/" className="block text-gray-300 hover:text-green-400 font-medium">
                    Home
                  </Link>
                  <button
                    onClick={() => {
                      document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })
                      setIsMenuOpen(false)
                    }}
                    className="block text-gray-300 hover:text-green-400 font-medium w-full text-left"
                  >
                    Categories
                  </button>
                  <form onSubmit={handleSearch} className="flex items-center">
                    <div className="relative w-full">
                      <Input
                        type="text"
                        placeholder="Search materials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-green-400 rounded-xl"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="absolute right-1 top-1 bg-green-500 hover:bg-green-600 text-black rounded-lg h-8 w-8 p-0"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                  <button
                    onClick={() => {
                      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
                      setIsMenuOpen(false)
                    }}
                    className="block text-gray-300 hover:text-green-400 font-medium w-full text-left"
                  >
                    Contact
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(34,197,94,0.02)_50%,transparent_75%)] bg-[length:60px_60px]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 px-4 py-2 text-sm font-medium">
              🚀 Free Study Materials Platform
            </Badge>
          </div>

          <h1 className="text-5xl md:text-8xl font-bold font-space-grotesk mb-8 leading-tight">
            <span className="text-green-400">StudyHub</span>
            <br />
            <span className="text-white">Enterprise</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Access thousands of premium study materials, books, and resources for government exams, competitive tests,
            and academic success. Completely free, forever.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-8 py-4 rounded-xl text-lg"
              onClick={() => document.getElementById("materials")?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore Materials
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-8 py-4 rounded-xl text-lg font-medium bg-transparent"
              onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
            >
              Browse Categories
            </Button>
          </div>

          {/* Real-time Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsDisplay.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 mb-4`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold font-space-grotesk mb-2">{stat.value}</div>
                <div className="text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold font-space-grotesk mb-6">
              Browse <span className="text-green-400">Categories</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Find exactly what you need for your studies across our comprehensive collection
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-green-500/50 transition-all duration-300 cursor-pointer group rounded-2xl"
              >
                <CardHeader className="text-center p-8">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <CardTitle className="text-white font-space-grotesk text-xl mb-2">{category.name}</CardTitle>
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                    {category.material_count} materials
                  </Badge>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Materials */}
      <section id="materials" className="py-24 px-4 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold font-space-grotesk mb-6">
              Featured <span className="text-green-400">Materials</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Most popular and highly rated study resources from our collection
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredMaterials.map((material, index) => (
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
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">{material.description}</p>

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

          <div className="text-center mt-12">
            <Link href="/search">
              <Button
                size="lg"
                variant="outline"
                className="border-green-500/50 text-green-400 hover:bg-green-500/10 px-8 py-4 rounded-xl font-medium bg-transparent"
              >
                View All Materials
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold font-space-grotesk mb-6">
              Words of <span className="text-green-400">Wisdom</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Inspiration from those who changed the world through knowledge
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {successStories.map((story, index) => (
              <Card
                key={index}
                className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-green-500/50 transition-all duration-300 rounded-2xl"
              >
                <CardContent className="p-8">
                  <Quote className="h-12 w-12 text-green-400 mb-6" />
                  <blockquote className="text-xl text-gray-300 mb-6 italic leading-relaxed">"{story.quote}"</blockquote>
                  <div className="border-t border-white/10 pt-6">
                    <p className="font-bold text-white text-lg font-space-grotesk">{story.name}</p>
                    <p className="text-green-400 font-medium">{story.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-green-500/10 to-blue-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold font-space-grotesk mb-6">
            Ready to Start Your <span className="text-green-400">Journey?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join thousands of students who are already benefiting from our free study materials
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-8 py-4 rounded-xl text-lg"
              onClick={() => document.getElementById("materials")?.scrollIntoView({ behavior: "smooth" })}
            >
              Get Started Now
              <Zap className="ml-2 h-5 w-5" />
            </Button>
            <Link href="/search">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-4 rounded-xl text-lg font-medium bg-transparent"
              >
                Explore Library
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-white/10 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-7 w-7 text-black font-bold" />
                </div>
                <span className="text-3xl font-bold font-space-grotesk">StudyHub</span>
              </div>
              <p className="text-gray-400 mb-6 text-lg leading-relaxed">
                Empowering students worldwide with free access to quality study materials and resources for academic and
                competitive success.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-400 hover:bg-white/5">
                  Facebook
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-400 hover:bg-white/5">
                  Twitter
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-400 hover:bg-white/5">
                  LinkedIn
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold mb-6 font-space-grotesk text-lg">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="text-gray-400 hover:text-green-400 transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-gray-400 hover:text-green-400 transition-colors"
                  >
                    Categories
                  </button>
                </li>
                <li>
                  <Link href="/search" className="text-gray-400 hover:text-green-400 transition-colors">
                    Search
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-6 font-space-grotesk text-lg">Support</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/help" className="text-gray-400 hover:text-green-400 transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-gray-400 hover:text-green-400 transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-green-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} StudyHub. All rights reserved. Made with ❤️ for students worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
