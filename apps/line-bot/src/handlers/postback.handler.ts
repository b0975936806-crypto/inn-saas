import { LineEvent } from '../types';
import { redisClient } from '../services/redis.service';
import { replyMessage } from '../services/line.service';
import { SessionStates } from '../config';
import * as commands from './commands.handler';

/**
 * 處理 Postback 事件
 */
export async function handlePostbackEvent(event: LineEvent): Promise<void> {
  const { source, postback, replyToken } = event;
  
  if (!source.userId || !replyToken || !postback) return;

  const userId = source.userId;
  const data = parsePostbackData(postback.data);

  console.log(`[${userId}] Postback:`, data);

  try {
    switch (data.action) {
      case 'book':
        await handleBookAction(userId, data, replyToken);
        break;

      case 'confirm_booking':
        await commands.confirmBooking(userId, replyToken);
        break;

      case 'cancel':
        await handleCancelAction(userId, data, replyToken);
        break;

      case 'check_availability':
        await commands.handleCheckAvailability(userId, replyToken);
        break;

      case 'view_room_types':
        await commands.handleRoomTypes(replyToken);
        break;

      case 'my_bookings':
        await commands.handleMyBookings(userId, '', replyToken);
        break;

      case 'support':
        await commands.handleSupport(replyToken);
        break;

      default:
        await replyMessage(replyToken, [{
          type: 'text',
          text: '抱歉，我無法處理這個操作。',
        }]);
    }
  } catch (error) {
    console.error('處理 Postback 錯誤:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '處理操作時發生錯誤，請稍後再試。',
    }]);
  }
}

/**
 * 處理預訂動作
 */
async function handleBookAction(
  userId: string,
  data: Record<string, string>,
  replyToken: string
): Promise<void> {
  const roomTypeId = parseInt(data.roomTypeId);
  
  if (isNaN(roomTypeId)) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 房型資料錯誤，請重新選擇。',
    }]);
    return;
  }

  const session = await redisClient.getSession(userId);
  if (!session || !session.data.checkInDate || !session.data.checkOutDate) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 預訂資料已過期，請重新查詢空房。',
    }]);
    await redisClient.resetSession(userId);
    return;
  }

  // 更新會話狀態
  await redisClient.updateSession(userId, {
    state: SessionStates.AWAITING_GUEST_NAME,
    data: { roomTypeId },
  });

  await replyMessage(replyToken, [{
    type: 'text',
    text: `✅ 您選擇了房型\n\n請輸入入住人姓名：`,
  }]);
}

/**
 * 處理取消動作
 */
async function handleCancelAction(
  userId: string,
  data: Record<string, string>,
  replyToken: string
): Promise<void> {
  const bookingId = parseInt(data.bookingId);
  
  if (isNaN(bookingId)) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 預訂資料錯誤。',
    }]);
    return;
  }

  // 這裡可以進一步確認用戶身份
  await replyMessage(replyToken, [{
    type: 'text',
    text: '請輸入「取消預訂 [預訂編號]」來取消預訂，例如：取消預訂 BK202503090001',
  }]);
}

/**
 * 解析 Postback 資料
 */
function parsePostbackData(data: string): Record<string, string> {
  const result: Record<string, string> = {};
  const params = new URLSearchParams(data);
  
  for (const [key, value] of params) {
    result[key] = value;
  }
  
  return result;
}
