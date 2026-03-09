import { Request, Response } from 'express';
import { WebhookRequest, LineEvent } from '../types';
import { handleMessageEvent } from './message.handler';
import { handlePostbackEvent } from './postback.handler';
import { handleFollowEvent, handleUnfollowEvent } from './follow.handler';

/**
 * 處理 LINE Webhook
 */
export async function webhookHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as WebhookRequest;
    
    // LINE 需要立即回應 200
    res.status(200).send('OK');

    // 處理每個事件
    if (body.events && Array.isArray(body.events)) {
      for (const event of body.events) {
        await handleEvent(event);
      }
    }
  } catch (error) {
    console.error('Webhook 處理錯誤:', error);
    // 已經回應 200，只在日誌記錄錯誤
  }
}

/**
 * 處理單一事件
 */
async function handleEvent(event: LineEvent): Promise<void> {
  try {
    console.log('處理事件:', event.type, event.source.userId);

    switch (event.type) {
      case 'message':
        await handleMessageEvent(event);
        break;

      case 'postback':
        await handlePostbackEvent(event);
        break;

      case 'follow':
        await handleFollowEvent(event);
        break;

      case 'unfollow':
        await handleUnfollowEvent(event);
        break;

      case 'join':
        console.log('加入群組/聊天室:', event.source);
        break;

      case 'leave':
        console.log('離開群組/聊天室:', event.source);
        break;

      default:
        console.log('未處理的事件類型:', event.type);
    }
  } catch (error) {
    console.error('處理事件錯誤:', error);
  }
}
