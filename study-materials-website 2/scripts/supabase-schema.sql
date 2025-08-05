-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE material_status AS ENUM ('active', 'inactive', 'pending');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📚',
    slug TEXT UNIQUE NOT NULL,
    material_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials table
CREATE TABLE public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category TEXT, -- Denormalized for easier queries
    file_url TEXT NOT NULL,
    image_url TEXT,
    file_size BIGINT, -- in bytes
    file_type TEXT, -- pdf, doc, etc.
    downloads INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    status material_status DEFAULT 'active',
    tags TEXT[], -- Array of tags
    author TEXT,
    publisher TEXT,
    publication_year INTEGER,
    isbn TEXT,
    language TEXT DEFAULT 'English',
    page_count INTEGER,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Downloads tracking table
CREATE TABLE public.downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Views tracking table
CREATE TABLE public.views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookmarks table
CREATE TABLE public.bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, material_id)
);

-- Ratings table
CREATE TABLE public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, material_id)
);

-- Comments table
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search logs table
CREATE TABLE public.search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    results_count INTEGER DEFAULT 0,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_materials_category ON public.materials(category);
CREATE INDEX idx_materials_status ON public.materials(status);
CREATE INDEX idx_materials_created_at ON public.materials(created_at DESC);
CREATE INDEX idx_materials_downloads ON public.materials(downloads DESC);
CREATE INDEX idx_materials_rating ON public.materials(rating DESC);
CREATE INDEX idx_materials_title_search ON public.materials USING gin(to_tsvector('english', title));
CREATE INDEX idx_materials_description_search ON public.materials USING gin(to_tsvector('english', description));
CREATE INDEX idx_materials_tags ON public.materials USING gin(tags);
CREATE INDEX idx_downloads_material_id ON public.downloads(material_id);
CREATE INDEX idx_downloads_created_at ON public.downloads(downloaded_at DESC);
CREATE INDEX idx_views_material_id ON public.views(material_id);
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_ratings_material_id ON public.ratings(material_id);

-- Create functions for updating counters
CREATE OR REPLACE FUNCTION update_material_downloads()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.materials 
    SET downloads = downloads + 1,
        updated_at = NOW()
    WHERE id = NEW.material_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_material_views()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.materials 
    SET views = views + 1,
        updated_at = NOW()
    WHERE id = NEW.material_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_material_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.materials 
    SET rating = (
        SELECT AVG(rating)::DECIMAL(3,2) 
        FROM public.ratings 
        WHERE material_id = COALESCE(NEW.material_id, OLD.material_id)
    ),
    rating_count = (
        SELECT COUNT(*) 
        FROM public.ratings 
        WHERE material_id = COALESCE(NEW.material_id, OLD.material_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.material_id, OLD.material_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_category_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update old category count
    IF OLD.category_id IS NOT NULL THEN
        UPDATE public.categories 
        SET material_count = (
            SELECT COUNT(*) 
            FROM public.materials 
            WHERE category_id = OLD.category_id AND status = 'active'
        )
        WHERE id = OLD.category_id;
    END IF;
    
    -- Update new category count
    IF NEW.category_id IS NOT NULL THEN
        UPDATE public.categories 
        SET material_count = (
            SELECT COUNT(*) 
            FROM public.materials 
            WHERE category_id = NEW.category_id AND status = 'active'
        )
        WHERE id = NEW.category_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_downloads
    AFTER INSERT ON public.downloads
    FOR EACH ROW
    EXECUTE FUNCTION update_material_downloads();

CREATE TRIGGER trigger_update_views
    AFTER INSERT ON public.views
    FOR EACH ROW
    EXECUTE FUNCTION update_material_views();

CREATE TRIGGER trigger_update_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_material_rating();

CREATE TRIGGER trigger_update_category_count
    AFTER INSERT OR UPDATE OR DELETE ON public.materials
    FOR EACH ROW
    EXECUTE FUNCTION update_category_count();

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Categories policies
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Materials policies
CREATE POLICY "Active materials are viewable by everyone" ON public.materials
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can insert materials" ON public.materials
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own materials" ON public.materials
    FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage all materials" ON public.materials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Downloads policies
CREATE POLICY "Anyone can insert downloads" ON public.downloads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own downloads" ON public.downloads
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Views policies
CREATE POLICY "Anyone can insert views" ON public.views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own views" ON public.views
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Bookmarks policies
CREATE POLICY "Users can manage their own bookmarks" ON public.bookmarks
    FOR ALL USING (auth.uid() = user_id);

-- Ratings policies
CREATE POLICY "Ratings are viewable by everyone" ON public.ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own ratings" ON public.ratings
    FOR ALL USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own comments" ON public.comments
    FOR ALL USING (auth.uid() = user_id);

-- Insert sample data
INSERT INTO public.categories (name, description, icon, slug) VALUES
('Government Exams', 'Materials for civil services and government job preparations', '🏛️', 'government-exams'),
('Novels', 'Fiction and literature books', '📚', 'novels'),
('Technical Books', 'Programming, engineering, and technical subjects', '💻', 'technical-books'),
('Competitive Exams', 'Materials for various competitive examinations', '🎯', 'competitive-exams'),
('Academic Books', 'University and college level academic materials', '🎓', 'academic-books'),
('Reference Materials', 'Dictionaries, encyclopedias, and reference books', '📖', 'reference-materials');

-- Insert sample materials
INSERT INTO public.materials (title, description, category_id, category, file_url, image_url, author, file_type, language) 
SELECT 
    'UPSC Prelims Complete Guide 2024',
    'Comprehensive guide for UPSC preliminary examination with latest syllabus and practice questions',
    c.id,
    'Government Exams',
    'https://example.com/upsc-guide.pdf',
    '/placeholder.svg?height=200&width=300',
    'Expert Team',
    'pdf',
    'English'
FROM public.categories c WHERE c.slug = 'government-exams';

INSERT INTO public.materials (title, description, category_id, category, file_url, image_url, author, file_type, language)
SELECT 
    'Data Structures and Algorithms',
    'Complete guide to data structures and algorithms for programming interviews',
    c.id,
    'Technical Books',
    'https://example.com/dsa-guide.pdf',
    '/placeholder.svg?height=200&width=300',
    'Programming Experts',
    'pdf',
    'English'
FROM public.categories c WHERE c.slug = 'technical-books';

INSERT INTO public.materials (title, description, category_id, category, file_url, image_url, author, file_type, language)
SELECT 
    'English Literature Classics',
    'Collection of classic English literature works and analysis',
    c.id,
    'Novels',
    'https://example.com/literature.pdf',
    '/placeholder.svg?height=200&width=300',
    'Various Authors',
    'pdf',
    'English'
FROM public.categories c WHERE c.slug = 'novels';

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.materials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.downloads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.views;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
