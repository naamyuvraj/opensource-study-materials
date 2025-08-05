"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, BookOpen, Download, Star, Quote, ChevronRight, Menu, X, Eye, Filter, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSupabase } from "@/hooks/useSupabase"

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const { materials, categories, loading, error, recordDownload, recordView } = useSupabase()

  // Search and filter functionality
  useEffect(() => {
    if (searchQuery.trim() === "" && selectedCategory === "") {
      setFilteredMaterials(materials.slice(0, 6))
      setIsSearching(false)
    } else {
      setIsSearching(true)
      let filtered = materials

      if (searchQuery.trim() !== "") {
        filtered = filtered.filter(
          (material) =>
            material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase())),
        )
      }

      if (selectedCategory !== "") {
        filtered = filtered.filter((material) => material.category === selectedCategory)
      }

      setFilteredMaterials(filtered)
    }
  }, [searchQuery, selectedCategory, materials])

  const handleDownload = async (materialId: string, fileUrl: string, title: string) => {
    try {
      // Record download in database
      await recordDownload(materialId)

      // Trigger download
      const link = document.createElement("a")
      link.href = fileUrl
      link.download = title
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading:", error)
    }
  }

  const handleViewOnline = async (materialId: string, fileUrl: string) => {
    try {
      // Record view
      await recordView(materialId)
      window.open(fileUrl, "_blank")
    } catch (error) {
      console.error("Error viewing:", error)
    }
  }

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(selectedCategory === categoryName ? "" : categoryName)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("")
  }

  const successStories = [
    {
      name: "Dr. A.P.J. Abdul Kalam",
      quote: "Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.",
      role: "Former President of India",
    },
    {
      name: "Oprah Winfrey",
      quote: "The biggest adventure you can take is to live the life of your dreams.",
      role: "Media Executive & Philanthropist",
    },
    {
      name: "Nelson Mandela",
      quote: "Education is the most powerful weapon which you can use to change the world.",
      role: "Former President of South Africa",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-xl text-gray-300">Loading study materials...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">Error loading data: {error}</p>
          <Button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-700 text-black">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-green-400" />
                <span className="text-xl font-bold text-white">StudyHub</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link
                  href="/"
                  className="text-gray-300 hover:text-green-400 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Home
                </Link>
                <button
                  onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-300 hover:text-green-400 px-3 py-2 text-sm font-medium flex items-center transition-colors"
                >
                  Categories
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
                <div className="relative flex items-center">
                  <Input
                    type="text"
                    placeholder="Search materials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-green-500 focus:ring-green-500"
                  />
                  <Button size="sm" className="ml-2 bg-green-600 hover:bg-green-700 text-black font-medium">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <button
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-300 hover:text-green-400 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Contact Us
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-400 hover:text-green-400"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-900">
              <Link href="/" className="text-gray-300 hover:text-green-400 block px-3 py-2 text-base font-medium">
                Home
              </Link>
              <button
                onClick={() => {
                  document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })
                  setIsMenuOpen(false)
                }}
                className="text-gray-300 hover:text-green-400 block px-3 py-2 text-base font-medium w-full text-left"
              >
                Categories
              </button>
              <div className="px-3 py-2">
                <Input
                  type="text"
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-green-500"
                />
              </div>
              <button
                onClick={() => {
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
                  setIsMenuOpen(false)
                }}
                className="text-gray-300 hover:text-green-400 block px-3 py-2 text-base font-medium w-full text-left"
              >
                Contact Us
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Unlock Your Potential with
              <span className="text-green-400"> Free Study Materials</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Access thousands of books, study guides, and materials for government exams, competitive tests, and
              academic success. All completely free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-black font-medium"
                onClick={() => document.getElementById("materials")?.scrollIntoView({ behavior: "smooth" })}
              >
                Explore Materials
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-black bg-transparent"
                onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
              >
                Browse Categories
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories/Quotes Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Words of Wisdom</h2>
            <p className="text-gray-300">Inspiration from those who changed the world through knowledge</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800 hover:border-green-500 transition-colors">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-green-400 mb-4" />
                  <blockquote className="text-gray-300 mb-4 italic">"{story.quote}"</blockquote>
                  <div className="border-t border-gray-800 pt-4">
                    <p className="font-semibold text-white">{story.name}</p>
                    <p className="text-sm text-gray-400">{story.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{materials.length}+</div>
              <div className="text-gray-300">Study Materials</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {materials.reduce((sum, material) => sum + material.downloads, 0)}+
              </div>
              <div className="text-gray-300">Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {materials.reduce((sum, material) => sum + material.views, 0)}+
              </div>
              <div className="text-gray-300">Views</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">100%</div>
              <div className="text-gray-300">Free Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Browse by Category</h2>
            <p className="text-gray-300">Find exactly what you need for your studies</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Card
                key={index}
                className={`bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-green-500 transition-all cursor-pointer ${
                  selectedCategory === category.name ? "border-green-500 bg-gray-800" : ""
                }`}
                onClick={() => handleCategoryClick(category.name)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{category.icon}</span>
                      <CardTitle className="text-white">{category.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="bg-green-600 text-black font-medium">
                      {category.material_count}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Search Results / Featured Materials */}
      <section id="materials" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div className="text-center flex-1">
              <h2 className="text-3xl font-bold text-white mb-4">
                {isSearching ? "Search Results" : "Featured Materials"}
              </h2>
              <p className="text-gray-300">
                {isSearching
                  ? `Found ${filteredMaterials.length} materials`
                  : "Most popular and highly rated study resources"}
              </p>
            </div>
            {(searchQuery || selectedCategory) && (
              <Button
                onClick={clearFilters}
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-black bg-transparent"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No materials found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMaterials.map((material, index) => (
                <Card
                  key={index}
                  className="bg-gray-900 border-gray-800 overflow-hidden hover:bg-gray-800 hover:border-green-500 transition-all"
                >
                  <div className="aspect-video relative">
                    <Image
                      src={material.image_url || "/placeholder.svg?height=200&width=300"}
                      alt={material.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="bg-green-600 text-black font-medium">
                        {material.category}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-300">{material.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <CardTitle className="text-white">{material.title}</CardTitle>
                    <p className="text-gray-400 text-sm">{material.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-gray-400 text-sm">
                        <div className="flex items-center space-x-1">
                          <Download className="h-4 w-4" />
                          <span>{material.downloads}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{material.views}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-black font-medium flex-1"
                        onClick={() => handleDownload(material.id, material.file_url, material.title)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-600 text-green-400 hover:bg-green-600 hover:text-black bg-transparent"
                        onClick={() => handleViewOnline(material.id, material.file_url)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Study Images Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Study Environment</h2>
            <p className="text-gray-300">Create the perfect atmosphere for learning</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square relative rounded-lg overflow-hidden border-2 border-transparent hover:border-green-500 transition-colors"
              >
                <Image
                  src={`/placeholder.svg?height=300&width=300&text=Study+${i}`}
                  alt={`Study environment ${i}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of students who are already benefiting from our free study materials
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-black font-medium"
              onClick={() => document.getElementById("materials")?.scrollIntoView({ behavior: "smooth" })}
            >
              Get Started Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-green-600 text-green-400 hover:bg-green-600 hover:text-black bg-transparent"
              onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-8 w-8 text-green-400" />
                <span className="text-xl font-bold text-white">StudyHub</span>
              </div>
              <p className="text-gray-400 mb-4">
                Empowering students worldwide with free access to quality study materials and resources for academic and
                competitive success.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-400">
                  Facebook
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-400">
                  Twitter
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-400">
                  LinkedIn
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="text-gray-400 hover:text-green-400"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-gray-400 hover:text-green-400"
                  >
                    Categories
                  </button>
                </li>
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-green-400">
                    About Us
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-gray-400 hover:text-green-400"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/help" className="text-gray-400 hover:text-green-400">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-gray-400 hover:text-green-400">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-green-400">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-green-400">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} StudyHub. All rights reserved. Made with ❤️ for students worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
