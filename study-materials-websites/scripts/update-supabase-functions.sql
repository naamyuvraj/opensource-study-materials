-- Update the increment functions to handle both downloads and views
CREATE OR REPLACE FUNCTION increment_downloads(material_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.materials 
    SET downloads = downloads + 1,
        updated_at = NOW()
    WHERE id = material_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE
