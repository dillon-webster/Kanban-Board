


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  begin
    insert into public.profiles (id, full_name, role)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', 'Unknown'),
      'employee'
    );
    return new;
  end;
  $$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_assignments" (
    "job_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL
);


ALTER TABLE "public"."job_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_checklist_completions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "stage_checklist_item_id" "uuid" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_by" "uuid"
);


ALTER TABLE "public"."job_checklist_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "customer_name" "text",
    "due_date" "date",
    "notes" "text",
    "job_type_id" "uuid",
    "current_stage_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'employee'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stage_checklist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."stage_checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_type_id" "uuid",
    "name" "text" NOT NULL,
    "position" integer NOT NULL,
    "notify_admin" boolean DEFAULT false
);


ALTER TABLE "public"."stages" OWNER TO "postgres";


ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_assignments"
    ADD CONSTRAINT "job_assignments_pkey" PRIMARY KEY ("job_id", "employee_id");



ALTER TABLE ONLY "public"."job_checklist_completions"
    ADD CONSTRAINT "job_checklist_completions_job_id_stage_checklist_item_id_key" UNIQUE ("job_id", "stage_checklist_item_id");



ALTER TABLE ONLY "public"."job_checklist_completions"
    ADD CONSTRAINT "job_checklist_completions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_types"
    ADD CONSTRAINT "job_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stage_checklist_items"
    ADD CONSTRAINT "stage_checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stages"
    ADD CONSTRAINT "stages_pkey" PRIMARY KEY ("id");



CREATE INDEX "job_assignments_employee_id_idx" ON "public"."job_assignments" USING "btree" ("employee_id");



CREATE INDEX "job_checklist_completions_completed_by_idx" ON "public"."job_checklist_completions" USING "btree" ("completed_by");



CREATE INDEX "job_checklist_completions_job_id_idx" ON "public"."job_checklist_completions" USING "btree" ("job_id");



CREATE INDEX "jobs_current_stage_id_idx" ON "public"."jobs" USING "btree" ("current_stage_id");



CREATE INDEX "jobs_job_type_id_idx" ON "public"."jobs" USING "btree" ("job_type_id");



CREATE INDEX "stage_checklist_items_stage_id_idx" ON "public"."stage_checklist_items" USING "btree" ("stage_id");



CREATE INDEX "stages_job_type_id_idx" ON "public"."stages" USING "btree" ("job_type_id");



ALTER TABLE ONLY "public"."job_assignments"
    ADD CONSTRAINT "job_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_assignments"
    ADD CONSTRAINT "job_assignments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_checklist_completions"
    ADD CONSTRAINT "job_checklist_completions_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."job_checklist_completions"
    ADD CONSTRAINT "job_checklist_completions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_checklist_completions"
    ADD CONSTRAINT "job_checklist_completions_stage_checklist_item_id_fkey" FOREIGN KEY ("stage_checklist_item_id") REFERENCES "public"."stage_checklist_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "public"."stages"("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_job_type_id_fkey" FOREIGN KEY ("job_type_id") REFERENCES "public"."job_types"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stage_checklist_items"
    ADD CONSTRAINT "stage_checklist_items_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stages"
    ADD CONSTRAINT "stages_job_type_id_fkey" FOREIGN KEY ("job_type_id") REFERENCES "public"."job_types"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all job checklist completions" ON "public"."job_checklist_completions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage stage checklist items" ON "public"."stage_checklist_items" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Authenticated users can read stage checklist items" ON "public"."stage_checklist_items" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Employees can manage completions for their jobs" ON "public"."job_checklist_completions" USING ((EXISTS ( SELECT 1
   FROM "public"."job_assignments"
  WHERE (("job_assignments"."job_id" = "job_checklist_completions"."job_id") AND ("job_assignments"."employee_id" = "auth"."uid"())))));



CREATE POLICY "assignments: admin all" ON "public"."job_assignments" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "assignments: employee read own" ON "public"."job_assignments" FOR SELECT USING (("employee_id" = "auth"."uid"()));



ALTER TABLE "public"."invites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invites: admin all" ON "public"."invites" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



ALTER TABLE "public"."job_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_checklist_completions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "job_types: admin write" ON "public"."job_types" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "job_types: read all" ON "public"."job_types" FOR SELECT USING (true);



ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "jobs: admin all" ON "public"."jobs" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "jobs: employee read assigned" ON "public"."jobs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."job_assignments"
  WHERE (("job_assignments"."job_id" = "jobs"."id") AND ("job_assignments"."employee_id" = "auth"."uid"())))));



CREATE POLICY "jobs: employee update assigned" ON "public"."jobs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."job_assignments"
  WHERE (("job_assignments"."job_id" = "jobs"."id") AND ("job_assignments"."employee_id" = "auth"."uid"())))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles: insert own" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles: read authenticated" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles: update own" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."stage_checklist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stages: admin delete" ON "public"."stages" FOR DELETE USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "stages: admin insert" ON "public"."stages" FOR INSERT WITH CHECK ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "stages: admin update" ON "public"."stages" FOR UPDATE USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "stages: read all" ON "public"."stages" FOR SELECT USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."invites" TO "anon";
GRANT ALL ON TABLE "public"."invites" TO "authenticated";
GRANT ALL ON TABLE "public"."invites" TO "service_role";



GRANT ALL ON TABLE "public"."job_assignments" TO "anon";
GRANT ALL ON TABLE "public"."job_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."job_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."job_checklist_completions" TO "anon";
GRANT ALL ON TABLE "public"."job_checklist_completions" TO "authenticated";
GRANT ALL ON TABLE "public"."job_checklist_completions" TO "service_role";



GRANT ALL ON TABLE "public"."job_types" TO "anon";
GRANT ALL ON TABLE "public"."job_types" TO "authenticated";
GRANT ALL ON TABLE "public"."job_types" TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."stage_checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."stage_checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."stage_checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."stages" TO "anon";
GRANT ALL ON TABLE "public"."stages" TO "authenticated";
GRANT ALL ON TABLE "public"."stages" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


