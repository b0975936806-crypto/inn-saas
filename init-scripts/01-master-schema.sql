-- SaaS 民宿管理系統 - Master 資料庫初始化
-- 儲存租戶列表和系統設定

-- 租戶表
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- 聯絡資訊
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    
    -- 狀態
    is_active BOOLEAN DEFAULT TRUE,
    is_trial BOOLEAN DEFAULT TRUE,
    trial_ends_at TIMESTAMPTZ,
    
    -- 配額限制
    max_rooms INTEGER DEFAULT 20,
    max_users INTEGER DEFAULT 5,
    max_bookings_per_month INTEGER DEFAULT 100,
    
    -- 資料庫資訊
    db_name VARCHAR(100) NOT NULL,
    
    -- 時間戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 系統用戶表（跨租戶管理員）
CREATE TABLE IF NOT EXISTS system_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin', -- 'super_admin', 'admin', 'support'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 租戶邀請碼表
CREATE TABLE IF NOT EXISTS tenant_invitations (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'owner', -- 'owner', 'manager', 'staff'
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 系統日誌表
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL,
    level VARCHAR(20) NOT NULL, -- 'info', 'warn', 'error'
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);
CREATE INDEX idx_tenant_invitations_code ON tenant_invitations(code);
CREATE INDEX idx_tenant_invitations_tenant ON tenant_invitations(tenant_id);
CREATE INDEX idx_system_logs_tenant ON system_logs(tenant_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

-- 插入預設測試租戶
INSERT INTO tenants (slug, name, description, db_name, is_trial, trial_ends_at)
VALUES (
    'demo',
    'Demo Inn 測試民宿',
    'SaaS 民宿管理系統測試租戶',
    'inn_tenant_demo',
    TRUE,
    NOW() + INTERVAL '30 days'
) ON CONFLICT (slug) DO NOTHING;

-- 插入預設系統管理員（密碼需手動更新）
INSERT INTO system_users (email, password_hash, name, role)
VALUES (
    'admin@innsaas.tw',
    '$2b$10$placeholder',
    'System Admin',
    'super_admin'
) ON CONFLICT (email) DO NOTHING;
