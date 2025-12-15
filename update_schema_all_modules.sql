-- Add missing tables for full module coverage
-- SPACES
CREATE TABLE IF NOT EXISTS spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50)
);
-- LISTS
CREATE TABLE IF NOT EXISTS lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(20),
    type VARCHAR(50),
    custom_fields JSONB,
    description TEXT
);
-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    stock_count INTEGER DEFAULT 0,
    price NUMERIC(10, 2) DEFAULT 0.00,
    description TEXT,
    brand VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    categories TEXT []
);
-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN DEFAULT FALSE,
    type VARCHAR(50),
    link_task_id UUID
);
-- TEMPLATES
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    custom_field_values JSONB
);
-- RLS POLICIES
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Public Access Spaces'
) THEN CREATE POLICY "Public Access Spaces" ON spaces FOR ALL USING (true) WITH CHECK (true);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Public Access Lists'
) THEN CREATE POLICY "Public Access Lists" ON lists FOR ALL USING (true) WITH CHECK (true);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Public Access Products'
) THEN CREATE POLICY "Public Access Products" ON products FOR ALL USING (true) WITH CHECK (true);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Public Access Notifications'
) THEN CREATE POLICY "Public Access Notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Public Access Templates'
) THEN CREATE POLICY "Public Access Templates" ON templates FOR ALL USING (true) WITH CHECK (true);
END IF;
END $$;