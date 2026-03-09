import { LineEvent } from '../types';
import { redisClient } from '../services/redis.service';
import { replyMessage } from '../services/line.service';
import { SessionStates, Commands } from '../config';
import * as commands from './commands.handler';

/**
 * 處理訊息事件
 */
export async function handleMessageEvent(event: LineEvent): Promise<void> {
  const { source, message, replyToken } = event;
  
  if (!source.userId || !replyToken) return;
  if (!message || message.type !== 'text' || !message.text) return;

  const userId = source.userId;
  const text = message.text.trim();

  console.log(`[${userId}] 收到訊息: ${text}`);

  try {
    // 取得或建立用戶會話
    let session = await redisClient.getSession(userId);
    if (!session) {
      session = await redisClient.resetSession(userId);
    } else {
      // 更新最後活動時間
      await redisClient.updateSession(userId, {});
    }

    // 根據會話狀態處理
    switch (session.state) {
      case SessionStates.IDLE:
        await handleIdleState(userId, text, replyToken);
        break;

      case SessionStates.AWAITING_CHECKIN_DATE:
        await handleAwaitingCheckinDate(userId, text, replyToken);
        break;

      case SessionStates.AWAITING_CHECKOUT_DATE:
        await handleAwaitingCheckoutDate(userId, text, replyToken);
        break;

      case SessionStates.AWAITING_ROOM_TYPE:
        await handleAwaitingRoomType(userId, text, replyToken);
        break;

      case SessionStates.AWAITING_GUEST_NAME:
        await handleAwaitingGuestName(userId, text, replyToken);
        break;

      case SessionStates.AWAITING_GUEST_PHONE:
        await handleAwaitingGuestPhone(userId, text, replyToken);
        break;

      case SessionStates.AWAITING_CONFIRMATION:
        await handleAwaitingConfirmation(userId, text, replyToken);
        break;

      case SessionStates.AWAITING_CANCELLATION_REASON:
        await handleAwaitingCancellationReason(userId, text, replyToken);
        break;

      default:
        await redisClient.resetSession(userId);
        await handleIdleState(userId, text, replyToken);
    }
  } catch (error) {
    console.error('處理訊息錯誤:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '抱歉，處理您的請求時發生錯誤，請稍後再試。',
    }]);
  }
}

/**
 * 處理閒置狀態
 */
async function handleIdleState(userId: string, text: string, replyToken: string): Promise<void> {
  const lowerText = text.toLowerCase();

  // 查空房指令
  if (Commands.CHECK_AVAILABILITY.some(cmd => lowerText.includes(cmd))) {
    await commands.handleCheckAvailability(userId, replyToken);
    return;
  }

  // 我的預訂指令
  if (Commands.MY_BOOKINGS.some(cmd => lowerText.includes(cmd))) {
    await commands.handleMyBookings(userId, text, replyToken);
    return;
  }

  // 取消預訂指令
  if (Commands.CANCEL_BOOKING.some(cmd => lowerText.includes(cmd))) {
    await commands.handleCancelBooking(userId, text, replyToken);
    return;
  }

  // 房型/價格指令
  if (Commands.ROOM_TYPES.some(cmd => lowerText.includes(cmd))) {
    await commands.handleRoomTypes(replyToken);
    return;
  }

  // 幫助/客服指令
  if (Commands.SUPPORT.some(cmd => lowerText.includes(cmd))) {
    await commands.handleSupport(replyToken);
    return;
  }

  // 預訂指令 (完整格式)
  if (text.startsWith('預訂') || text.startsWith('訂房')) {
    await commands.handleQuickBooking(userId, text, replyToken);
    return;
  }

  // 日期格式查詢
  const dateMatch = text.match(/(\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2})/);
  if (dateMatch) {
    await commands.handleDateQuery(userId, text, replyToken);
    return;
  }

  // 預設回覆
  await replyMessage(replyToken, [{
    type: 'text',
    text: `您好！我是 ${process.env.INN_NAME || '民宿'} 的智能助理。\n\n請輸入「幫助」查看可用指令，或直接輸入「查空房」開始查詢。`,
  }]);
}

/**
 * 處理等待入住日期
 */
async function handleAwaitingCheckinDate(userId: string, text: string, replyToken: string): Promise<void> {
  const date = parseDate(text);
  
  if (!date) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 日期格式不正確\n\n請輸入正確的日期格式：\n📅 2025-03-15\n📅 2025/03/15\n📅 今天、明天、後天',
    }]);
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 入住日期不能早於今天，請重新輸入。',
    }]);
    return;
  }

  const dateStr = formatDate(date);
  
  await redisClient.updateSession(userId, {
    state: SessionStates.AWAITING_CHECKOUT_DATE,
    data: { checkInDate: dateStr },
  });

  await replyMessage(replyToken, [{
    type: 'text',
    text: `✅ 入住日期：${dateStr}\n\n請輸入退房日期：`,
  }]);
}

/**
 * 處理等待退房日期
 */
async function handleAwaitingCheckoutDate(userId: string, text: string, replyToken: string): Promise<void> {
  const session = await redisClient.getSession(userId);
  if (!session) return;

  const date = parseDate(text);
  
  if (!date) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 日期格式不正確\n\n請輸入正確的日期格式：\n📅 2025-03-17\n📅 2025/03/17\n📅 明天、後天、大後天',
    }]);
    return;
  }

  const checkInDate = new Date(session.data.checkInDate!);
  
  if (date <= checkInDate) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 退房日期必須晚於入住日期，請重新輸入。',
    }]);
    return;
  }

  const dateStr = formatDate(date);
  
  await redisClient.updateSession(userId, {
    state: SessionStates.AWAITING_ROOM_TYPE,
    data: { checkOutDate: dateStr },
  });

  // 查詢空房
  await commands.handleSearchAvailability(userId, replyToken);
}

/**
 * 處理等待房型選擇
 */
async function handleAwaitingRoomType(userId: string, text: string, replyToken: string): Promise<void> {
  // 用戶應該透過 postback 選擇，這裡處理文字輸入
  if (text === '取消') {
    await redisClient.resetSession(userId);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '已取消預訂流程。',
    }]);
    return;
  }

  await replyMessage(replyToken, [{
    type: 'text',
    text: '請點擊卡片上的「立即預訂」按鈕選擇房型，或輸入「取消」結束預訂。',
  }]);
}

/**
 * 處理等待客人姓名
 */
async function handleAwaitingGuestName(userId: string, text: string, replyToken: string): Promise<void> {
  if (text.length < 2) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 姓名至少需要 2 個字，請重新輸入。',
    }]);
    return;
  }

  await redisClient.updateSession(userId, {
    state: SessionStates.AWAITING_GUEST_PHONE,
    data: { guestName: text },
  });

  await replyMessage(replyToken, [{
    type: 'text',
    text: `✅ 姓名：${text}\n\n請輸入聯絡電話：`,
  }]);
}

/**
 * 處理等待客人電話
 */
async function handleAwaitingGuestPhone(userId: string, text: string, replyToken: string): Promise<void> {
  const phoneRegex = /^[\d\-\s]{8,15}$/;
  
  if (!phoneRegex.test(text.replace(/\s/g, ''))) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 電話格式不正確，請輸入有效的電話號碼（例如：0912345678 或 02-12345678）。',
    }]);
    return;
  }

  const phone = text.replace(/\s/g, '');
  
  await redisClient.updateSession(userId, {
    state: SessionStates.AWAITING_CONFIRMATION,
    data: { guestPhone: phone },
  });

  // 顯示預訂確認
  await commands.showBookingConfirmation(userId, replyToken);
}

/**
 * 處理等待確認
 */
async function handleAwaitingConfirmation(userId: string, text: string, replyToken: string): Promise<void> {
  const lowerText = text.toLowerCase();

  if (lowerText === '確認' || lowerText === '確定' || lowerText === 'yes') {
    await commands.confirmBooking(userId, replyToken);
    return;
  }

  if (lowerText === '取消' || lowerText === 'no') {
    await redisClient.resetSession(userId);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '已取消預訂。如需查詢空房，請輸入「查空房」。',
    }]);
    return;
  }

  await replyMessage(replyToken, [{
    type: 'text',
    text: '請輸入「確認」完成預訂，或「取消」放棄預訂。',
  }]);
}

/**
 * 處理等待取消原因
 */
async function handleAwaitingCancellationReason(userId: string, text: string, replyToken: string): Promise<void> {
  await commands.processCancellation(userId, text, replyToken);
}

/**
 * 解析日期
 */
function parseDate(text: string): Date | null {
  const lowerText = text.toLowerCase().trim();

  // 特殊關鍵字
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (lowerText === '今天') {
    return today;
  }
  if (lowerText === '明天') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  if (lowerText === '後天') {
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    return dayAfterTomorrow;
  }
  if (lowerText === '大後天') {
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    return threeDaysLater;
  }

  // 標準日期格式
  const patterns = [
    /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,
    /(\d{4})年(\d{1,2})月(\d{1,2})日?/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const day = parseInt(match[3]);
      const date = new Date(year, month, day);
      
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }
  }

  return null;
}

/**
 * 格式化日期
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
