-- Primeiro, vamos garantir que o schema public está acessível
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Garantir que o service_role tem acesso total
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Garantir que authenticated tem acesso às tabelas
GRANT ALL ON "User" TO authenticated;
GRANT ALL ON "Client" TO authenticated;
GRANT ALL ON "Budget" TO authenticated;
GRANT ALL ON "Story" TO authenticated;
GRANT ALL ON "Activity" TO authenticated;
GRANT ALL ON "Settings" TO authenticated;

-- Habilitar RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Budget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Story" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Settings" ENABLE ROW LEVEL SECURITY;

-- Políticas para User
CREATE POLICY "Enable insert for service role" ON "User"
    FOR INSERT TO service_role
    WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON "User"
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can update their own records" ON "User"
    FOR UPDATE TO authenticated
    USING (auth.uid()::text = id);

-- Políticas para outras tabelas
CREATE POLICY "Enable all operations for authenticated users" ON "Client"
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON "Budget"
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON "Story"
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON "Activity"
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON "Settings"
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true); 