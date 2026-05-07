-- 1. Add sort_order column
ALTER TABLE public.proposal_sections
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill existing rows: assign sort_order by created_at within each project
WITH ranked AS (
  SELECT section_id,
         ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at ASC) - 1 AS rn
  FROM public.proposal_sections
)
UPDATE public.proposal_sections ps
SET sort_order = r.rn
FROM ranked r
WHERE ps.section_id = r.section_id;

-- 3. Index to make ordered fetches fast
CREATE INDEX IF NOT EXISTS idx_proposal_sections_project_sort
  ON public.proposal_sections (project_id, sort_order);

-- 4. Trigger to auto-assign next sort_order on insert when caller didn't provide one (or sent 0)
CREATE OR REPLACE FUNCTION public.set_proposal_section_sort_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.sort_order IS NULL OR NEW.sort_order = 0 THEN
    SELECT COALESCE(MAX(sort_order), -1) + 1
      INTO NEW.sort_order
      FROM public.proposal_sections
     WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_proposal_section_sort_order ON public.proposal_sections;
CREATE TRIGGER trg_set_proposal_section_sort_order
BEFORE INSERT ON public.proposal_sections
FOR EACH ROW
EXECUTE FUNCTION public.set_proposal_section_sort_order();