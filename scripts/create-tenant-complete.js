#!/usr/bin/env node

/**
 * InnSaaS 租戶完整自動創建腳本
 * 使用方法: node create-tenant-complete.js <slug> <名稱> <郵箱>
 */

const { PrismaClient } = require('../apps/api/node_modules/@prisma/client');
const bcrypt = require('../apps/api/node_modules/bcryptjs');
const { Client } = require('../apps/api/node_modules/pg');
const fs = require('fs');
const path = require('path');

// 從環境變數獲取資料庫連線資訊
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:InnSaas_2026_NewPass@localhost:5433/inn_master';

// 解析連線字串
function parseDatabaseUrl(url) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(\w+)/);
  if (!match) throw new Error('無效的 DATABASE_URL');
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5]
  };
}

const dbConfig = parseDatabaseUrl(DATABASE_URL);
const masterPrisma = new PrismaClient();

// 讀取 SQL 文件
function readSqlFile(filename) {
  const filePath = path.join(__dirname, '..', 'init-scripts', filename);
  return fs.readFileSync(filePath, 'utf8');
}

// 執行 SQL 命令
async function executeSql(database, sql) {
  const client = new Client({
    ...dbConfig,
    database: database
  });
  
  await client.connect();
  
  // 分割 SQL 語句（按分號）
  const statements = sql.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await client.query(statement + ';');
      } catch (err) {
        // 忽略已存在的錯誤
        if (!err.message.includes('already exists')) {
          console.warn(`警告: ${err.message}`);
        }
      }
    }
  }
  
  await client.end();
}

async function createTenant(slug, name, email) {
  console.log(`🚀 開始完整創建租戶: ${name}`);
  console.log('==========================================\n');

  const dbName = `inn_tenant_${slug}`;
  const adminEmail = `admin@${slug}.inn.tw`;
  const adminPassword = `${slug}123456`;

  try {
    // 步驟 1: 在 inn_master 建立租戶記錄
    console.log('📋 步驟 1/6: 建立租戶記錄...');
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
      },
    });
    console.log(`✅ 租戶記錄已建立 (ID: ${tenant.id})\n`);

    // 步驟 2: 建立資料庫
    console.log('📋 步驟 2/6: 建立資料庫...');
    const masterClient = new Client({ ...dbConfig, database: 'postgres' });
    await masterClient.connect();
    
    // 檢查資料庫是否已存在
    const dbExists = await masterClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    
    if (dbExists.rows.length === 0) {
      await masterClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ 資料庫 ${dbName} 已建立\n`);
    } else {
      console.log(`ℹ️ 資料庫 ${dbName} 已存在\n`);
    }
    
    await masterClient.end();

    // 步驟 3: 匯入 Schema
    console.log('📋 步驟 3/6: 匯入 Schema...');
    const schemaSql = readSqlFile('02-tenant-schema.sql');
    await executeSql(dbName, schemaSql);
    console.log('✅ Schema 匯入完成\n');

    // 步驟 4: 啟用 pgcrypto
    console.log('📋 步驟 4/6: 啟用 pgcrypto...');
    const pgcryptoClient = new Client({ ...dbConfig, database: dbName });
    await pgcryptoClient.connect();
    await pgcryptoClient.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await pgcryptoClient.end();
    console.log('✅ pgcrypto 已啟用\n');

    // 步驟 5: 建立管理員
    console.log('📋 步驟 5/6: 建立管理員...');
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    const adminClient = new Client({ ...dbConfig, database: dbName });
    await adminClient.connect();
    
    // 檢查是否已存在
    const existingUser = await adminClient.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingUser.rows.length === 0) {
      await adminClient.query(
        `INSERT INTO users (email, name, password_hash, role, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
        [adminEmail, `${name} 管理員`, passwordHash, 'owner']
      );
      console.log('✅ 管理員已建立\n');
    } else {
      await adminClient.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
        [passwordHash, adminEmail]
      );
      console.log('✅ 管理員密碼已更新\n');
    }
    
    await adminClient.end();

    // 步驟 6: 輸出配置
    console.log('📋 步驟 6/6: 輸出配置...');
    const caddyConfig = `
# ${name}
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
}`;

    // 寫入臨時配置檔案
    const configPath = path.join(__dirname, `caddy-${slug}.conf`);
    fs.writeFileSync(configPath, caddyConfig);
    
    console.log(`✅ Caddy 配置已保存到: ${configPath}\n`);

    // 輸出摘要
    console.log('🎉 租戶創建完成！');
    console.log('==========================================');
    console.log(`租戶名稱: ${name}`);
    console.log(`Slug: ${slug}`);
    console.log(`資料庫: ${dbName}`);
    console.log('\n管理員帳號:');
    console.log(`  帳號: ${adminEmail}`);
    console.log(`  密碼: ${adminPassword}`);
    console.log('\n前台網址: https://' + slug + '.inn.yu.dopay.biz');
    console.log('後台網址: https://admin.' + slug + '.inn.yu.dopay.biz');
    console.log('\n下一步:');
    console.log('1. 將 Caddy 配置添加到 /etc/caddy/Caddyfile');
    console.log(`   cat ${configPath} | sudo tee -a /etc/caddy/Caddyfile`);
    console.log('2. 重載 Caddy: sudo systemctl reload caddy');
    console.log('3. 確認 DNS 已設定');
    console.log('==========================================');

  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await masterPrisma.$disconnect();
  }
}

// 主程序
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('使用方法: node create-tenant-complete.js <slug> <民宿名稱> <郵箱>');
  console.log('範例: node create-tenant-complete.js happystay "快樂居民宿" "happy@inn.tw"');
  process.exit(1);
}

createTenant(args[0], args[1], args[2]);
