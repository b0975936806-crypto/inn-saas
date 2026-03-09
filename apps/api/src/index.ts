import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { tenantMiddleware } from './middleware/tenant';
import { getTenantClient } from './lib/tenant-connection';
import { authMiddleware, generateToken, requireRole } from './middleware/auth';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Master 資料庫連線（用於系統管理員）
const { Pool } = pg;
const masterPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 中間件
app.use(helmet());
app.use(cors());
app.use(express.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'inn-saas-api', 
    version: '1.0.0',
    timestamp: new Date().toISOString() 
  });
});

// 系統管理員登入（支持系統和租戶）
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const host = req.headers.host || '';
    
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: '請提供帳號和密碼' }
      });
      return;
    }
    
    // 判斷是系統管理員還是租戶管理員
    const isSystemAdmin = host === 'admin.inn.yu.dopay.biz' || host === 'admin.inn.localhost';
    
    if (isSystemAdmin) {
      // 系統管理員登入 - 查詢 system_users
      const result = await masterPool.query(
        'SELECT id, email, name, password_hash, role, is_active FROM system_users WHERE email = $1 LIMIT 1',
        [email]
      );
      
      if (result.rows.length === 0 || !result.rows[0].is_active) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: '帳號或密碼錯誤' }
        });
        return;
      }
      
      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isValid) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: '帳號或密碼錯誤' }
        });
        return;
      }
      
      const token = generateToken({ 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });
      
      res.json({
        success: true,
        data: { 
          token, 
          user: { 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            role: user.role 
          } 
        }
      });
    } else {
      // 租戶管理員登入 - 識別子域名
      const subdomainMatch = host.match(/^admin\.(?<tenant>[^.]+)\./);
      const tenantSlug = subdomainMatch?.groups?.tenant;
      
      if (!tenantSlug) {
        res.status(400).json({
          success: false,
          error: { code: 'TENANT_NOT_FOUND', message: '無法識別租戶' }
        });
        return;
      }
      
      // 建立租戶資料庫連線（使用 pg）
      const dbName = `inn_tenant_${tenantSlug}`;
      const tenantPool = new pg.Pool({
        connectionString: (process.env.MASTER_DATABASE_URL || process.env.DATABASE_URL)?.replace(/\/[^/]+$/, `/${dbName}`)
      });
      
      try {
        // 查詢租戶用戶
        const result = await tenantPool.query(
          'SELECT id, email, phone, name, password_hash, role, is_active FROM users WHERE email = $1 AND is_active = true LIMIT 1',
          [email]
        );
        
        if (result.rows.length === 0 || !result.rows[0].password_hash) {
          res.status(401).json({
            success: false,
            error: { code: 'INVALID_CREDENTIALS', message: '帳號或密碼錯誤' }
          });
          await tenantPool.end();
          return;
        }
        
        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
          res.status(401).json({
            success: false,
            error: { code: 'INVALID_CREDENTIALS', message: '帳號或密碼錯誤' }
          });
          await tenantPool.end();
          return;
        }
        
        const token = generateToken({ 
          userId: user.id, 
          email: user.email || '',
          role: user.role 
        });
        
        res.json({
          success: true,
          data: { 
            token, 
            user: { 
              id: user.id, 
              email: user.email, 
              phone: user.phone,
              name: user.name, 
              role: user.role 
            } 
          }
        });
        
        await tenantPool.end();
      } catch (dbError) {
        await tenantPool.end();
        throw dbError;
      }
    }
    
  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'LOGIN_ERROR', message: '登入處理失敗' }
    });
  }
});

// API 路由（帶租戶識別）
app.use('/api', tenantMiddleware, apiRoutes);

// 錯誤處理
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API 錯誤:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '伺服器內部錯誤',
    },
  });
});

// 啟動服務
app.listen(PORT, () => {
  console.log(`🚀 InnSaaS API 服務啟動於埠 ${PORT}`);
  console.log(`📊 健康檢查: http://localhost:${PORT}/health`);
  console.log(`📚 API 文件: http://localhost:${PORT}/api`);
});
