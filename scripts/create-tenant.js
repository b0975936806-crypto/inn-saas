#!/usr/bin/env node

/**
 * InnSaaS 租戶自動創建腳本（Node.js 版本）
 * 使用方式: node create-tenant.js <slug> <名稱> <郵箱>
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const masterPrisma = new PrismaClient();

async function createTenant(slug, name, email) {
  console.log(`🚀 開始創建租戶: ${name}`);
  console.log('==========================================');

  try {
    // 步驟 1: 在 inn_master 建立租戶記錄
    console.log('📋 步驟 1: 建立租戶記錄');
    const tenant = await masterPrisma.tenant.upsert({
      where: { slug },
      update: {
        name,
        email,
        updatedAt: new Date(),
      },
      create: {
        slug,
        name,
        email,
        dbName: `inn_tenant_${slug}`,
        isActive: true,
        isTrial: true,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天後
      },
    });
    console.log('✅ 租戶記錄已建立');

    // 步驟 2: 輸出後續手動步驟
    console.log('\n📋 下一步（請手動執行）:');
    console.log('==========================================');
    console.log(`
# 1. 建立資料庫
sudo -i -u postgres psql -p 5433 -c "CREATE DATABASE inn_tenant_${slug};"

# 2. 匯入 Schema
sudo -i -u postgres psql -d inn_tenant_${slug} -p 5433 < ~/projects/inn-saas/init-scripts/02-tenant-schema.sql

# 3. 啟用 pgcrypto
sudo -i -u postgres psql -d inn_tenant_${slug} -p 5433 -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
    `);

    // 步驟 3: 生成管理員密碼
    const adminEmail = `admin@${slug}.inn.tw`;
    const adminPassword = `${slug}123456`;
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    console.log('\n📋 管理員資訊:');
    console.log('==========================================');
    console.log(`帳號: ${adminEmail}`);
    console.log(`密碼: ${adminPassword}`);
    console.log(`密碼哈希: ${passwordHash}`);

    console.log(`
# 4. 建立管理員（請在匯入 Schema 後執行）:
sudo -i -u postgres psql -d inn_tenant_${slug} -p 5433 -c "
INSERT INTO users (email, name, password_hash, role, is_active) 
VALUES ('${adminEmail}', '${name} 管理員', '${passwordHash}', 'owner', true);
"
    `);

    // 步驟 4: 輸出 Caddy 配置
    console.log('\n📋 Caddy 配置:');
    console.log('==========================================');
    console.log(`
# ${name} 前台
${slug}.inn.yu.dopay.biz {
    encode gzip
    reverse_proxy localhost:3102
    log {
        output file /var/log/caddy/inn-saas-${slug}.log {
            roll_size 10MB
            roll_keep 10
        }
    }
}

# ${name} 管理後台
admin.${slug}.inn.yu.dopay.biz {
    encode gzip
    
    handle /api/* {
        reverse_proxy localhost:3101
    }
    
    handle {
        reverse_proxy localhost:3103
    }
    
    log {
        output file /var/log/caddy/inn-saas-${slug}-admin.log {
            roll_size 10MB
            roll_keep 10
        }
    }
}
    `);

    console.log('\n✅ 租戶創建完成！');
    console.log('==========================================');

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    process.exit(1);
  } finally {
    await masterPrisma.$disconnect();
  }
}

// 主程序
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('使用方式: node create-tenant.js <slug> <民宿名稱> <郵箱>');
  console.log('範例: node create-tenant.js happystay "快樂居民宿" "happy@inn.tw"');
  process.exit(1);
}

createTenant(args[0], args[1], args[2]);
