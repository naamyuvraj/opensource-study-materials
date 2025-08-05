-- Create increment functions for better performance
CREATE OR REPLACE FUNCTION increment_downloads(material_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.materials 
    SET downloads = downloads + 1,
        updated_at = NOW()
    WHERE id = material_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_views(material_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.materials 
    SET views = views + 1,
        updated_at = NOW()
    WHERE id = material_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_downloads(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO anon, authenticated;
