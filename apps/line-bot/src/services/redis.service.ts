import { Redis } from 'ioredis';
import { config } from '../config';
import { UserSession } from '../types';

class RedisService {
  private client: Redis | null = null;

  async connect(): Promise<void> {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis 錯誤:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis 已連線');
    });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  private getSessionKey(userId: string): string {
    return `linebot:session:${userId}`;
  }

  async getSession(userId: string): Promise<UserSession | null> {
    if (!this.client) throw new Error('Redis 未連線');
    
    const data = await this.client.get(this.getSessionKey(userId));
    if (!data) return null;
    
    return JSON.parse(data) as UserSession;
  }

  async setSession(userId: string, session: UserSession): Promise<void> {
    if (!this.client) throw new Error('Redis 未連線');
    
    await this.client.setex(
      this.getSessionKey(userId),
      config.redis.sessionTTL,
      JSON.stringify(session)
    );
  }

  async updateSession(userId: string, updates: Partial<UserSession>): Promise<void> {
    const session = await this.getSession(userId);
    if (!session) {
      throw new Error('會話不存在');
    }
    
    const updatedSession = {
      ...session,
      ...updates,
      lastActivity: Date.now(),
    };
    
    await this.setSession(userId, updatedSession);
  }

  async clearSession(userId: string): Promise<void> {
    if (!this.client) throw new Error('Redis 未連線');
    
    await this.client.del(this.getSessionKey(userId));
  }

  async resetSession(userId: string): Promise<UserSession> {
    const { SessionStates } = await import('../config');
    const newSession: UserSession = {
      userId,
      state: SessionStates.IDLE,
      data: {},
      lastActivity: Date.now(),
    };
    
    await this.setSession(userId, newSession);
    return newSession;
  }
}

export const redisClient = new RedisService();
