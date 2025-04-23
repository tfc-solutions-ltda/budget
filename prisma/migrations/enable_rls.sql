-- Enable Row Level Security
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Budget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Story" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Settings" ENABLE ROW LEVEL SECURITY;

-- Create policies for User table
CREATE POLICY "Enable insert for authenticated users only" ON "User"
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON "User"
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable update for users on their own records" ON "User"
    FOR UPDATE TO authenticated
    USING (auth.uid()::text = id);

-- Create policies for Client table
CREATE POLICY "Enable all operations for authenticated users" ON "Client"
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for Budget table
CREATE POLICY "Enable all operations for authenticated users" ON "Budget"
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for Story table
CREATE POLICY "Enable all operations for authenticated users" ON "Story"
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for Activity table
CREATE POLICY "Enable all operations for authenticated users" ON "Activity"
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for Settings table
CREATE POLICY "Enable select for authenticated users" ON "Settings"
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable update for authenticated users" ON "Settings"
    FOR UPDATE TO authenticated
    USING (true); 