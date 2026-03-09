-- SaaS 民宿管理系統 - 租戶資料庫初始化腳本
-- 此腳本會在建立新租戶時執行

-- 啟用必要擴充
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 民宿基本設定
CREATE TABLE IF NOT EXISTS inn_settings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- 金流設定（加密儲存）
    ecpay_enabled BOOLEAN DEFAULT FALSE,
    ecpay_merchant_id VARCHAR(20),
    ecpay_hash_key VARCHAR(255),
    ecpay_hash_iv VARCHAR(255),
    ecpay_test_mode BOOLEAN DEFAULT TRUE,
    
    linepay_enabled BOOLEAN DEFAULT FALSE,
    linepay_channel_id VARCHAR(50),
    linepay_channel_secret VARCHAR(255),
    linepay_channel_access_token TEXT,
    
    -- 前台設定
    theme VARCHAR(20) DEFAULT 'minimal',
    primary_color VARCHAR(7) DEFAULT '#4A90D9',
    logo_url TEXT,
    favicon_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 房間類型
CREATE TABLE IF NOT EXISTS room_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price INTEGER NOT NULL, -- 基礎價格（分）
    max_guests INTEGER NOT NULL DEFAULT 2,
    bed_type VARCHAR(50),
    amenities JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 房間
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    room_type_id INTEGER REFERENCES room_types(id),
    floor INTEGER,
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'occupied', 'maintenance'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用戶表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'customer', -- 'owner', 'manager', 'staff', 'customer'
    is_active BOOLEAN DEFAULT TRUE,
    line_user_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 預訂表
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id),
    room_id INTEGER REFERENCES rooms(id),
    
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INTEGER NOT NULL,
    
    guest_count INTEGER NOT NULL DEFAULT 1,
    guest_name VARCHAR(100),
    guest_phone VARCHAR(20),
    guest_email VARCHAR(255),
    special_requests TEXT,
    
    total_amount INTEGER NOT NULL, -- 總金額（分）
    
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
    payment_method VARCHAR(50), -- 'ecpay', 'linepay', 'cash', 'transfer'
    
    source VARCHAR(20) DEFAULT 'manual', -- 'web', 'line', 'manual', 'ota'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LINE Bot 設定
CREATE TABLE IF NOT EXISTS line_bot_settings (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(50),
    channel_secret VARCHAR(255) NOT NULL,
    channel_access_token TEXT NOT NULL,
    welcome_message TEXT DEFAULT '歡迎光臨！請輸入「查空房」查詢可訂房間。',
    auto_reply_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引
CREATE INDEX idx_rooms_room_type ON rooms(room_type_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_room ON bookings(room_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_users_line ON users(line_user_id);

-- 插入預設測試資料
INSERT INTO inn_settings (name, slug, description, phone, email, address)
VALUES (
    'Demo Inn 測試民宿',
    'demo',
    '這是一個測試民宿',
    '02-12345678',
    'demo@inn.tw',
    '台北市測試區測試路 123 號'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO room_types (name, description, base_price, max_guests, bed_type)
VALUES 
    ('標準雙人房', '舒適雙人房，適合情侶或朋友', 280000, 2, '一大床'),
    ('豪華雙人房', '寬敞豪華雙人房', 350000, 2, '一大床'),
    ('家庭房', '適合全家出遊', 420000, 4, '兩大床')
ON CONFLICT DO NOTHING;

INSERT INTO rooms (room_number, room_type_id, floor)
SELECT '101', id, 1 FROM room_types WHERE name = '標準雙人房'
UNION ALL
SELECT '102', id, 1 FROM room_types WHERE name = '標準雙人房'
UNION ALL
SELECT '201', id, 2 FROM room_types WHERE name = '豪華雙人房'
UNION ALL
SELECT '301', id, 3 FROM room_types WHERE name = '家庭房'
ON CONFLICT (room_number) DO NOTHING;
