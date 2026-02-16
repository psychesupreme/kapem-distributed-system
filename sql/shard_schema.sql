-- KAPEM REGIONAL SHARD SCHEMA (Used by both Central & Rift Nodes)
-- Role: Transactions, Inventory, M-Pesa Logs

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. REGIONAL INVENTORY
CREATE TABLE inventory (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(100),
    quantity_on_hand INT DEFAULT 0,
    last_restock_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TRANSACTIONS (Hybrid SQL + JSONB)
CREATE TABLE transactions (
    txn_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cashier_id UUID NOT NULL, 
    total_amount DECIMAL(12, 2) NOT NULL,
    
    -- The "Big Data" Component (JSON)
    cart_data JSONB NOT NULL,
    
    -- Commerce & Tracking
    mpesa_reference VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. SEED INITIAL DATA (Bootstrapping)
-- We insert both product types so the node is ready for either region
INSERT INTO inventory (product_id, product_name, quantity_on_hand) VALUES 
(200, 'Export Quality Avocados', 5000),
(300, 'Naivasha Cut Flowers', 8000)
ON CONFLICT (product_id) DO NOTHING;

-- 4. WAREHOUSE MANAGEMENT (New Feature)
-- Tracks farmers dropping off produce for storage/sale
CREATE TABLE warehouse_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_name VARCHAR(100),
    farmer_phone VARCHAR(20),
    produce_type VARCHAR(50), -- e.g., 'Avocado', 'Maize'
    quantity_kg DECIMAL(10, 2),
    storage_type VARCHAR(20), -- 'Small Scale' or 'Large Scale'
    request_status VARCHAR(20) DEFAULT 'PENDING', -- 'APPROVED', 'REJECTED'
    
    -- Link to Financials (if they pay a storage fee)
    storage_fee DECIMAL(10, 2) DEFAULT 0.00,
    mpesa_reference VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);