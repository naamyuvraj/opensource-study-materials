"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Edit,
  Trash2,
  Eye,
  Download,
  Star,
  Users,
  BarChart3,
  Plus,
  Search,
  Settings,
  LogOut,
  Shield,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabase = createClient(
  "https://sfirgiixugtqqievimoo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJnaWl4dWd0cXFpZXZpbW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NzA1MDcsImV4cCI6MjA2NzU0NjUwN30.aS_w512S8cYd9GyPlJquSg3AFPv96aNl1X3-Sl88zUc",
)

interface Material {
  id: string
  title: string
  description: string
  category: string
  category_id: string
  file_url: string
  image_url: string
  downloads: number
  views: number
  rating: number
  rating_count: number
  status: "active" | "inactive" | "pending"
  author: string
  file_type: string
  language: string
  created_at: string
  updated_at: string
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
  pendingMaterials: number
}

export default function AdminPortal() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<Stats>({
    totalMaterials: 0,
    totalDownloads: 0,
    totalViews: 0,
    totalUsers: 0,
    pendingMaterials: 0,
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category_id: "",
    author: "",
    file_url: "",
    image_url: "",
    file_type: "pdf",
    language: "English",
    status: "active" as "active" | "inactive" | "pending",
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchMaterials()
      fetchCategories()
      fetchStats()
    }
  }, [isAuthenticated])

  const handleLogin = () => {
    // Simple password check - in production, use proper authentication
    if (adminPassword === "admin@123") {
      setIsAuthenticated(true)
      localStorage.setItem("adminAuth", "true")
    } else {
      alert("Invalid password")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("adminAuth")
    setAdminPassword("")
  }

  // Check if already authenticated
  useEffect(() => {
    const authStatus = localStorage.getItem("adminAuth")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase.from("materials").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error("Error fetching materials:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name")
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchStats = async () => {
    try {
      // Get total materials count
      const { count: materialsCount } = await supabase.from("materials").select("*", { count: "exact", head: true })

      // Get pending materials count
      const { count: pendingCount } = await supabase
        .from("materials")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")

      // Get total downloads and views
      const { data: materialData } = await supabase.from("materials").select("downloads, views")

      // Get total users
      const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

      const totalDownloads = materialData?.reduce((sum, item) => sum + (item.downloads || 0), 0) || 0
      const totalViews = materialData?.reduce((sum, item) => sum + (item.views || 0), 0) || 0

      setStats({
        totalMaterials: materialsCount || 0,
        totalDownloads,
        totalViews,
        totalUsers: usersCount || 0,
        pendingMaterials: pendingCount || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const category = categories.find((c) => c.id === uploadForm.category_id)

      const { data, error } = await supabase.from("materials").insert([
        {
          ...uploadForm,
          category: category?.name || "",
          downloads: 0,
          views: 0,
          rating: 0,
          rating_count: 0,
        },
      ])

      if (error) throw error

      // Reset form
      setUploadForm({
        title: "",
        description: "",
        category_id: "",
        author: "",
        file_url: "",
        image_url: "",
        file_type: "pdf",
        language: "English",
        status: "active",
      })

      setIsUploadDialogOpen(false)
      fetchMaterials()
      fetchStats()
      alert("Material uploaded successfully!")
    } catch (error) {
      console.error("Error uploading material:", error)
      alert("Error uploading material")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMaterial) return

    setIsLoading(true)

    try {
      const category = categories.find((c) => c.id === uploadForm.category_id)

      const { error } = await supabase
        .from("materials")
        .update({
          ...uploadForm,
          category: category?.name || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingMaterial.id)

      if (error) throw error

      setIsEditDialogOpen(false)
      setEditingMaterial(null)
      fetchMaterials()
      alert("Material updated successfully!")
    } catch (error) {
      console.error("Error updating material:", error)
      alert("Error updating material")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return

    try {
      const { error } = await supabase.from("materials").delete().eq("id", materialId)
      if (error) throw error

      fetchMaterials()
      fetchStats()
      alert("Material deleted successfully!")
    } catch (error) {
      console.error("Error deleting material:", error)
      alert("Error deleting material")
    }
  }

  const openEditDialog = (material: Material) => {
    setEditingMaterial(material)
    setUploadForm({
      title: material.title,
      description: material.description || "",
      category_id: material.category_id,
      author: material.author || "",
      file_url: material.file_url,
      image_url: material.image_url || "",
      file_type: material.file_type || "pdf",
      language: material.language || "English",
      status: material.status,
    })
    setIsEditDialogOpen(true)
  }

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = !selectedCategory || material.category === selectedCategory
    const matchesStatus = !selectedStatus || material.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/5 border-white/10">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-black" />
            </div>
            <CardTitle className="text-2xl font-bold font-space-grotesk">Admin Portal</CardTitle>
            <p className="text-gray-400">Enter admin password to continue</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="bg-white/5 border-white/20 text-white"
                placeholder="Enter admin password"
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full bg-green-500 hover:bg-green-600 text-black font-medium">
              Login
            </Button>
            <div className="text-center">
              <Link href="/" className="text-green-400 hover:text-green-300 text-sm">
                ← Back to Website
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-black font-bold" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-space-grotesk">StudyHub Admin</h1>
                <p className="text-sm text-gray-400">Material Management Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-400">
                  View Website
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-gray-400 hover:text-red-400">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="materials" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              <BookOpen className="h-4 w-4 mr-2" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              <Settings className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-400">Total Materials</CardTitle>
                    <BookOpen className="h-4 w-4 text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-space-grotesk">{stats.totalMaterials}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-400">Total Downloads</CardTitle>
                    <Download className="h-4 w-4 text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-space-grotesk">{stats.totalDownloads.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-400">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-space-grotesk">{stats.totalViews.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
                    <Users className="h-4 w-4 text-yellow-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-space-grotesk">{stats.totalUsers}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Materials */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="font-space-grotesk">Recent Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {materials.slice(0, 5).map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <Image
                          src={material.image_url || "/placeholder.svg"}
                          alt={material.title}
                          width={60}
                          height={40}
                          className="rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-medium">{material.title}</h3>
                          <p className="text-sm text-gray-400">{material.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Download className="h-4 w-4" />
                          <span>{material.downloads}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{material.views}</span>
                        </div>
                        <Badge
                          className={`${
                            material.status === "active"
                              ? "bg-green-500/10 text-green-400"
                              : material.status === "pending"
                                ? "bg-yellow-500/10 text-yellow-400"
                                : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {material.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search materials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white w-64"
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48 bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32 bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-500 hover:bg-green-600 text-black font-medium">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Material
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black border-white/20 text-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-space-grotesk">Upload New Material</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={uploadForm.title}
                          onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                          className="bg-white/5 border-white/20 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="author">Author</Label>
                        <Input
                          id="author"
                          value={uploadForm.author}
                          onChange={(e) => setUploadForm({ ...uploadForm, author: e.target.value })}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                        className="bg-white/5 border-white/20 text-white"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={uploadForm.category_id}
                          onValueChange={(value) => setUploadForm({ ...uploadForm, category_id: value })}
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-white/20">
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <Select
                          value={uploadForm.language}
                          onValueChange={(value) => setUploadForm({ ...uploadForm, language: value })}
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-white/20">
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="file_url">File URL *</Label>
                        <Input
                          id="file_url"
                          value={uploadForm.file_url}
                          onChange={(e) => setUploadForm({ ...uploadForm, file_url: e.target.value })}
                          className="bg-white/5 border-white/20 text-white"
                          placeholder="https://example.com/file.pdf"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="image_url">Image URL</Label>
                        <Input
                          id="image_url"
                          value={uploadForm.image_url}
                          onChange={(e) => setUploadForm({ ...uploadForm, image_url: e.target.value })}
                          className="bg-white/5 border-white/20 text-white"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="file_type">File Type</Label>
                        <Select
                          value={uploadForm.file_type}
                          onValueChange={(value) => setUploadForm({ ...uploadForm, file_type: value })}
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-white/20">
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="doc">DOC</SelectItem>
                            <SelectItem value="docx">DOCX</SelectItem>
                            <SelectItem value="epub">EPUB</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={uploadForm.status}
                          onValueChange={(value: "active" | "inactive" | "pending") =>
                            setUploadForm({ ...uploadForm, status: value })
                          }
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-white/20">
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-green-500 hover:bg-green-600 text-black font-medium"
                      >
                        {isLoading ? "Uploading..." : "Upload Material"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsUploadDialogOpen(false)}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Materials Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="bg-white/5 border-white/10 overflow-hidden">
                  <div className="aspect-video relative">
                    <Image
                      src={material.image_url || "/placeholder.svg"}
                      alt={material.title}
                      fill
                      className="object-cover"
                    />
                    <Badge
                      className={`absolute top-4 left-4 ${
                        material.status === "active"
                          ? "bg-green-500/90 text-black"
                          : material.status === "pending"
                            ? "bg-yellow-500/90 text-black"
                            : "bg-red-500/90 text-white"
                      }`}
                    >
                      {material.status}
                    </Badge>
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-space-grotesk line-clamp-2">{material.title}</CardTitle>
                    <p className="text-sm text-gray-400">{material.category}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Download className="h-4 w-4" />
                          <span>{material.downloads}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{material.views}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span>{material.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(material)}
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(material.id)}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredMaterials.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No materials found</h3>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.id} className="bg-white/5 border-white/10">
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-2">{category.icon}</div>
                    <CardTitle className="font-space-grotesk">{category.name}</CardTitle>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      {category.material_count} materials
                    </Badge>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-black border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-space-grotesk">Edit Material</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="bg-white/5 border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-author">Author</Label>
                <Input
                  id="edit-author"
                  value={uploadForm.author}
                  onChange={(e) => setUploadForm({ ...uploadForm, author: e.target.value })}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                className="bg-white/5 border-white/20 text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={uploadForm.category_id}
                  onValueChange={(value) => setUploadForm({ ...uploadForm, category_id: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={uploadForm.status}
                  onValueChange={(value: "active" | "inactive" | "pending") =>
                    setUploadForm({ ...uploadForm, status: value })
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-green-500 hover:bg-green-600 text-black font-medium"
              >
                {isLoading ? "Updating..." : "Update Material"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
