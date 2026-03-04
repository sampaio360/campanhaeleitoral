
-- Create a helper function to check if user is admin with access to a specific campaign
CREATE OR REPLACE FUNCTION public.is_admin_of_campanha(_user_id uuid, _campanha_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = 'admin'
      AND (
        _campanha_id IN (SELECT uc.campanha_id FROM public.user_campanhas uc WHERE uc.user_id = _user_id)
        OR _campanha_id IN (SELECT p.campanha_id FROM public.profiles p WHERE p.id = _user_id)
      )
  )
$$;

-- Update RLS policies for all main data tables to include admin multi-campaign access

-- agenda_events
DROP POLICY IF EXISTS "Users access own campanha agenda_events" ON public.agenda_events;
CREATE POLICY "Users access own campanha agenda_events" ON public.agenda_events
FOR ALL TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
)
WITH CHECK (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
);

-- supporters
DROP POLICY IF EXISTS "Users access own campanha supporters" ON public.supporters;
CREATE POLICY "Users access own campanha supporters" ON public.supporters
FOR ALL TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
)
WITH CHECK (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- streets
DROP POLICY IF EXISTS "Users access own campanha streets" ON public.streets;
CREATE POLICY "Users access own campanha streets" ON public.streets
FOR ALL TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
)
WITH CHECK (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- street_checkins
DROP POLICY IF EXISTS "Users access own campanha checkins" ON public.street_checkins;
CREATE POLICY "Users access own campanha checkins" ON public.street_checkins
FOR ALL TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
)
WITH CHECK (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- expenses
DROP POLICY IF EXISTS "Users access own campanha expenses" ON public.expenses;
CREATE POLICY "Users access own campanha expenses" ON public.expenses
FOR ALL TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
)
WITH CHECK (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- revenues
DROP POLICY IF EXISTS "Users access own campanha revenues" ON public.revenues;
CREATE POLICY "Users access own campanha revenues" ON public.revenues
FOR ALL TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
)
WITH CHECK (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- reports
DROP POLICY IF EXISTS "Users access own campanha reports" ON public.reports;
CREATE POLICY "Users access own campanha reports" ON public.reports
FOR ALL TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
)
WITH CHECK (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- resource_requests
DROP POLICY IF EXISTS "Users access own campanha resource_requests" ON public.resource_requests;
CREATE POLICY "Users access own campanha resource_requests" ON public.resource_requests
FOR ALL TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
)
WITH CHECK (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- material_inventory
DROP POLICY IF EXISTS "Users access own campanha material_inventory" ON public.material_inventory;
CREATE POLICY "Users access own campanha material_inventory" ON public.material_inventory
FOR ALL TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
)
WITH CHECK (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- municipios
DROP POLICY IF EXISTS "Users access own campanha municipios" ON public.municipios;
CREATE POLICY "Users access own campanha municipios" ON public.municipios
FOR ALL TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
)
WITH CHECK (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- municipio_eleicoes
DROP POLICY IF EXISTS "Users access own campanha municipio_eleicoes" ON public.municipio_eleicoes;
CREATE POLICY "Users access own campanha municipio_eleicoes" ON public.municipio_eleicoes
FOR ALL TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
)
WITH CHECK (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- municipio_historico_votacao
DROP POLICY IF EXISTS "Users access own campanha municipio_historico_votacao" ON public.municipio_historico_votacao;
CREATE POLICY "Users access own campanha municipio_historico_votacao" ON public.municipio_historico_votacao
FOR ALL TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
)
WITH CHECK (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- team_messages (read policy)
DROP POLICY IF EXISTS "Users read own campanha messages" ON public.team_messages;
CREATE POLICY "Users read own campanha messages" ON public.team_messages
FOR SELECT TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- route_assignments
DROP POLICY IF EXISTS "Users access own campanha route_assignments" ON public.route_assignments;
CREATE POLICY "Users access own campanha route_assignments" ON public.route_assignments
FOR ALL TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
)
WITH CHECK (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- campanhas - update the "Users can view own campanha" to also check user_campanhas for admins
DROP POLICY IF EXISTS "Users can view own campanha" ON public.campanhas;
CREATE POLICY "Users can view own campanha" ON public.campanhas
FOR SELECT TO authenticated
USING (
  id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), id)
  OR is_master(auth.uid())
);

-- budget_allocations - update to include admin check via budgets join
DROP POLICY IF EXISTS "Users access own campanha allocations" ON public.budget_allocations;
CREATE POLICY "Users access own campanha allocations" ON public.budget_allocations
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_allocations.budget_id
    AND (
      b.campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
      OR is_admin_of_campanha(auth.uid(), b.campanha_id)
      OR is_master(auth.uid())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_allocations.budget_id
    AND (
      b.campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
      OR is_admin_of_campanha(auth.uid(), b.campanha_id)
      OR is_master(auth.uid())
    )
  )
);
