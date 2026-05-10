CREATE OR REPLACE FUNCTION public.enforce_employee_job_stage_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  actor_role text;
  old_stage_position integer;
  target_stage_position integer;
  required_checklist_count integer;
  completed_checklist_count integer;
BEGIN
  SELECT role
  INTO actor_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF actor_role IS DISTINCT FROM 'employee' THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.job_assignments
    WHERE job_id = OLD.id
      AND employee_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Employees can only update assigned jobs';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.title IS DISTINCT FROM OLD.title
    OR NEW.customer_name IS DISTINCT FROM OLD.customer_name
    OR NEW.due_date IS DISTINCT FROM OLD.due_date
    OR NEW.notes IS DISTINCT FROM OLD.notes
    OR NEW.job_type_id IS DISTINCT FROM OLD.job_type_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Employees can only update job stage';
  END IF;

  IF NEW.current_stage_id IS NOT DISTINCT FROM OLD.current_stage_id THEN
    RETURN NEW;
  END IF;

  IF NEW.current_stage_id IS NULL THEN
    RAISE EXCEPTION 'Employees cannot clear a job stage';
  END IF;

  SELECT position
  INTO target_stage_position
  FROM public.stages
  WHERE id = NEW.current_stage_id
    AND job_type_id = OLD.job_type_id;

  IF target_stage_position IS NULL THEN
    RAISE EXCEPTION 'Target stage does not belong to this job type';
  END IF;

  IF OLD.current_stage_id IS NULL THEN
    IF target_stage_position <> 0 THEN
      RAISE EXCEPTION 'Employees can only start a job at the first stage';
    END IF;
    RETURN NEW;
  END IF;

  SELECT position
  INTO old_stage_position
  FROM public.stages
  WHERE id = OLD.current_stage_id
    AND job_type_id = OLD.job_type_id;

  IF old_stage_position IS NULL THEN
    RAISE EXCEPTION 'Current stage does not belong to this job type';
  END IF;

  IF target_stage_position > old_stage_position + 1 THEN
    RAISE EXCEPTION 'Employees can only advance one stage at a time';
  END IF;

  IF target_stage_position <= old_stage_position THEN
    RETURN NEW;
  END IF;

  SELECT count(*)
  INTO required_checklist_count
  FROM public.stage_checklist_items
  WHERE stage_id = OLD.current_stage_id;

  IF required_checklist_count = 0 THEN
    RETURN NEW;
  END IF;

  SELECT count(DISTINCT completion.stage_checklist_item_id)
  INTO completed_checklist_count
  FROM public.job_checklist_completions completion
  JOIN public.stage_checklist_items item
    ON item.id = completion.stage_checklist_item_id
  WHERE completion.job_id = OLD.id
    AND item.stage_id = OLD.current_stage_id;

  IF completed_checklist_count < required_checklist_count THEN
    RAISE EXCEPTION 'Complete all checklist items before advancing';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_employee_job_stage_update ON public.jobs;

CREATE TRIGGER enforce_employee_job_stage_update
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.enforce_employee_job_stage_update();

REVOKE ALL ON FUNCTION public.enforce_employee_job_stage_update() FROM PUBLIC;
GRANT ALL ON FUNCTION public.enforce_employee_job_stage_update() TO service_role;
