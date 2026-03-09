import { PrismaClient } from '@prisma/client';

// 租戶連線快取
const tenantClients: Map<string, PrismaClient> = new Map();

/**
 * 取得租戶專屬 Prisma Client
 * 採用 Database-per-Tenant 模式，每個租戶獨立資料庫
 */
export async function getTenantClient(tenantSlug: string): Promise<PrismaClient> {
  // 檢查是否已有快取
  if (tenantClients.has(tenantSlug)) {
    return tenantClients.get(tenantSlug)!;
  }

  // 建立新的連線
  const databaseUrl = buildTenantDatabaseUrl(tenantSlug);
  const client = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  // 測試連線
  try {
    await client.$connect();
    tenantClients.set(tenantSlug, client);
    console.log(`✅ 已連線到租戶資料庫: ${tenantSlug}`);
    return client;
  } catch (error) {
    console.error(`❌ 無法連線到租戶資料庫: ${tenantSlug}`, error);
    throw new Error(`租戶資料庫連線失敗: ${tenantSlug}`);
  }
}

/**
 * 建立租戶資料庫連線 URL
 */
function buildTenantDatabaseUrl(tenantSlug: string): string {
  // 使用 MASTER_DATABASE_URL 或 DATABASE_URL
  const baseUrl = process.env.MASTER_DATABASE_URL || process.env.DATABASE_URL || '';
  // 從 baseUrl 解析並替換資料庫名稱
  const dbName = `inn_tenant_${tenantSlug}`;
  return baseUrl.replace(/\/[^/]+$/, `/${dbName}`);
}

/**
 * 關閉所有租戶連線
 */
export async function disconnectAllTenants(): Promise<void> {
  const disconnectPromises = Array.from(tenantClients.values()).map(client => 
    client.$disconnect()
  );
  await Promise.all(disconnectPromises);
  tenantClients.clear();
  console.log('✅ 已關閉所有租戶連線');
}

/**
 * 檢查租戶資料庫是否存在
 */
export async function checkTenantDatabaseExists(tenantSlug: string): Promise<boolean> {
  try {
    const client = await getTenantClient(tenantSlug);
    // 嘗試執行簡單查詢
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
