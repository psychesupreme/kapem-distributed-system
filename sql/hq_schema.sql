-- KAPEM HQ SCHEMA (Nairobi Node)
-- Role: Security, User Management, Global Metadata

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SYSTEM USERS (RBAC Security)
CREATE TABLE system_users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('Admin', 'Manager', 'Auditor')),
    region_access VARCHAR(10) DEFAULT 'ALL', -- 'CENTRAL', 'RIFT', or 'ALL'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. GLOBAL AUDIT LOG (Compliance)
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    event_type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Admin & Cashier
INSERT INTO system_users (user_id, username, password_hash, role, region_access) 
VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Maina_Cashier', 'hash123', 'Manager', 'ALL'),
(uuid_generate_v4(), 'Admin_User', 'admin_secret', 'Admin', 'ALL');