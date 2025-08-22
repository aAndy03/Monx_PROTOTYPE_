-- Add missing date columns to projects table
-- This script is idempotent and can be run multiple times safely

-- Add start_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'start_date'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN start_date DATE;
        COMMENT ON COLUMN public.projects.start_date IS 'Project start date for timeline range';
    END IF;
END $$;

-- Add end_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'end_date'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN end_date DATE;
        COMMENT ON COLUMN public.projects.end_date IS 'Project end date for timeline range';
    END IF;
END $$;

-- Update existing projects with default date range if they have null values
UPDATE public.projects 
SET 
    start_date = COALESCE(start_date, CURRENT_DATE),
    end_date = COALESCE(end_date, CURRENT_DATE + INTERVAL '1 year')
WHERE start_date IS NULL OR end_date IS NULL;

-- Add check constraint to ensure end_date is after start_date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'projects' 
        AND constraint_name = 'projects_date_range_check'
    ) THEN
        ALTER TABLE public.projects 
        ADD CONSTRAINT projects_date_range_check 
        CHECK (end_date >= start_date);
    END IF;
END $$;
