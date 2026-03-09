import { LineEvent } from '../types';
import { replyMessage } from '../services/line.service';
import { redisClient } from '../services/redis.service';
import * as flexMessages from '../flex-messages';

/**
 * 處理加入好友事件
 */
export async function handleFollowEvent(event: LineEvent): Promise<void> {
  const { source, replyToken } = event;
  
  if (!source.userId || !replyToken) return;

  const userId = source.userId;
  console.log(`[${userId}] 加入好友`);

  try {
    // 初始化用戶會話
    await redisClient.resetSession(userId);

    // 發送歡迎訊息
    const welcomeMessage = flexMessages.createWelcomeMessage();
    await replyMessage(replyToken, [welcomeMessage]);
  } catch (error) {
    console.error('處理加入好友錯誤:', error);
    // 發送簡易歡迎訊息
    await replyMessage(replyToken, [{
      type: 'text',
      text: '歡迎加入！請輸入「幫助」查看可用指令。',
    }]);
  }
}

/**
 * 處理封鎖事件
 */
export async function handleUnfollowEvent(event: LineEvent): Promise<void> {
  const { source } = event;
  
  if (!source.userId) return;

  const userId = source.userId;
  console.log(`[${userId}] 封鎖`);

  try {
    // 清除用戶會話
    await redisClient.clearSession(userId);
  } catch (error) {
    console.error('處理封鎖錯誤:', error);
  }
}
