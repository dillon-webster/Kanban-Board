export interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'employee';
}

export interface StageChecklistItem {
  id: string;
  stage_id: string;
  text: string;
  position: number;
}

export interface Stage {
  id: string;
  job_type_id: string;
  name: string;
  position: number;
  notify_admin: boolean;
  checklist_items: StageChecklistItem[];
}

export interface JobType {
  id: string;
  name: string;
  stages: Stage[];
}

export interface Job {
  id: string;
  title: string;
  customer_name: string | null;
  due_date: string | null;
  notes: string | null;
  job_type_id: string;
  current_stage_id: string | null;
  created_at: string;
  assignees: Profile[];
  checklist_completions: { stage_checklist_item_id: string }[];
}

export interface MyJob {
  id: string;
  title: string;
  customer_name: string | null;
  due_date: string | null;
  notes: string | null;
  job_type_id: string;
  current_stage_id: string | null;
  created_at: string;
  job_type: {
    id: string;
    name: string;
    stages: Stage[];
  };
  current_stage: { name: string } | null;
  checklist_completions: { stage_checklist_item_id: string }[];
}
