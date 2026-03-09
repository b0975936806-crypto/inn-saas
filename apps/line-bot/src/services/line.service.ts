import axios from 'axios';
import { config } from '../config';
import { LineReplyMessage, AvailabilityResult, RoomType, Booking } from '../types';

const LINE_API_BASE = 'https://api.line.me/v2/bot';

/**
 * 發送回覆訊息
 */
export async function replyMessage(replyToken: string, messages: LineReplyMessage[]): Promise<void> {
  try {
    await axios.post(
      `${LINE_API_BASE}/message/reply`,
      {
        replyToken,
        messages: messages.slice(0, 5), // LINE 限制最多 5 則
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.line.channelAccessToken}`,
        },
      }
    );
  } catch (error) {
    console.error('LINE 回覆訊息錯誤:', error);
    throw error;
  }
}

/**
 * 發送推播訊息
 */
export async function pushMessage(userId: string, messages: LineReplyMessage[]): Promise<void> {
  try {
    await axios.post(
      `${LINE_API_BASE}/message/push`,
      {
        to: userId,
        messages: messages.slice(0, 5),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.line.channelAccessToken}`,
        },
      }
    );
  } catch (error) {
    console.error('LINE 推播訊息錯誤:', error);
    throw error;
  }
}

/**
 * 取得用戶資訊
 */
export async function getUserProfile(userId: string): Promise<{ displayName: string; pictureUrl?: string }> {
  try {
    const response = await axios.get(`${LINE_API_BASE}/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${config.line.channelAccessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('取得用戶資訊錯誤:', error);
    return { displayName: '用戶' };
  }
}

/**
 * 設定 Rich Menu
 */
export async function setRichMenu(richMenu: any): Promise<string> {
  try {
    // 1. 建立 Rich Menu
    const createResponse = await axios.post(
      `${LINE_API_BASE}/richmenu`,
      richMenu,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.line.channelAccessToken}`,
        },
      }
    );
    
    const richMenuId = createResponse.data.richMenuId;
    
    // 2. 設定為預設 Rich Menu
    await axios.post(
      `${LINE_API_BASE}/user/all/richmenu/${richMenuId}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${config.line.channelAccessToken}`,
        },
      }
    );
    
    return richMenuId;
  } catch (error) {
    console.error('設定 Rich Menu 錯誤:', error);
    throw error;
  }
}

/**
 * 上傳 Rich Menu 圖片
 */
export async function uploadRichMenuImage(richMenuId: string, imageBuffer: Buffer): Promise<void> {
  try {
    await axios.post(
      `${LINE_API_BASE}/richmenu/${richMenuId}/content`,
      imageBuffer,
      {
        headers: {
          'Content-Type': 'image/png',
          'Authorization': `Bearer ${config.line.channelAccessToken}`,
        },
      }
    );
  } catch (error) {
    console.error('上傳 Rich Menu 圖片錯誤:', error);
    throw error;
  }
}
