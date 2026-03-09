import { redisClient } from '../services/redis.service';
import { replyMessage } from '../services/line.service';
import { SessionStates } from '../config';
import * as api from '../services/api.service';
import * as flexMessages from '../flex-messages';

/**
 * 處理查空房指令
 */
export async function handleCheckAvailability(userId: string, replyToken: string): Promise<void> {
  await redisClient.updateSession(userId, {
    state: SessionStates.AWAITING_CHECKIN_DATE,
    data: {},
  });

  await replyMessage(replyToken, [{
    type: 'text',
    text: '📅 請問您想入住的日期是？\n\n您可以輸入：\n• 今天、明天、後天\n• 2025-03-15\n• 2025/03/15',
  }]);
}

/**
 * 查詢空房
 */
export async function handleSearchAvailability(userId: string, replyToken: string): Promise<void> {
  const session = await redisClient.getSession(userId);
  if (!session || !session.data.checkInDate || !session.data.checkOutDate) return;

  const { checkInDate, checkOutDate } = session.data;

  await replyMessage(replyToken, [{
    type: 'text',
    text: `🔍 正在查詢 ${checkInDate} 到 ${checkOutDate} 的空房...`,
  }]);

  const result = await api.checkAvailability(checkInDate, checkOutDate, 1);

  if (!result) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 查詢失敗，請稍後再試或聯繫客服。',
    }]);
    await redisClient.resetSession(userId);
    return;
  }

  const message = flexMessages.createAvailabilityMessage(result);
  await replyMessage(replyToken, [message]);
}

/**
 * 處理我的預訂指令
 */
export async function handleMyBookings(userId: string, text: string, replyToken: string): Promise<void> {
  // 嘗試從文字中提取電話號碼
  const phoneMatch = text.match(/(\d{9,15})/);
  
  if (!phoneMatch) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '📱 請輸入您的預訂電話號碼查詢\n\n例如：我的預訂 0912345678',
    }]);
    return;
  }

  const phone = phoneMatch[1];
  
  await replyMessage(replyToken, [{
    type: 'text',
    text: '🔍 正在查詢您的預訂...',
  }]);

  const bookings = await api.getBookingsByPhone(phone);
  const message = flexMessages.createMyBookingsMessage(bookings);
  await replyMessage(replyToken, [message]);
}

/**
 * 處理取消預訂指令
 */
export async function handleCancelBooking(userId: string, text: string, replyToken: string): Promise<void> {
  // 嘗試提取預訂編號
  const bookingMatch = text.match(/[Bb][Kk]?(\d{8,12})/);
  
  if (!bookingMatch) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '📋 請輸入要取消的預訂編號\n\n例如：取消預訂 BK202503090001',
    }]);
    return;
  }

  const bookingNumber = 'BK' + bookingMatch[1];
  
  const booking = await api.getBookingByNumber(bookingNumber);
  
  if (!booking) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: `❌ 找不到預訂編號 ${bookingNumber}，請確認編號是否正確。`,
    }]);
    return;
  }

  if (booking.status === 'cancelled') {
    await replyMessage(replyToken, [{
      type: 'text',
      text: `❌ 預訂 ${bookingNumber} 已經取消了。`,
    }]);
    return;
  }

  if (booking.status !== 'pending' && booking.status !== 'confirmed') {
    await replyMessage(replyToken, [{
      type: 'text',
      text: `❌ 預訂 ${bookingNumber} 無法取消（狀態：${booking.status}）。\n如需協助請聯繫客服。`,
    }]);
    return;
  }

  await redisClient.updateSession(userId, {
    state: SessionStates.AWAITING_CANCELLATION_REASON,
    data: { selectedBookingNumber: bookingNumber },
  });

  await replyMessage(replyToken, [{
    type: 'text',
    text: `⚠️ 您確定要取消預訂 ${bookingNumber} 嗎？\n\n🏠 ${booking.room.roomType.name}\n📅 ${formatDate(booking.checkInDate)} - ${formatDate(booking.checkOutDate)}\n💰 NT$ ${booking.totalAmount.toLocaleString()}\n\n請輸入取消原因（或直接輸入「確認」取消）：`,
  }]);
}

/**
 * 處理取消預訂
 */
export async function processCancellation(userId: string, reason: string, replyToken: string): Promise<void> {
  const session = await redisClient.getSession(userId);
  if (!session || !session.data.selectedBookingNumber) return;

  const bookingNumber = session.data.selectedBookingNumber;
  const booking = await api.getBookingByNumber(bookingNumber);

  if (!booking) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 預訂資料錯誤，請重新查詢。',
    }]);
    await redisClient.resetSession(userId);
    return;
  }

  const success = await api.cancelBooking(booking.id, reason);

  if (success) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: `✅ 預訂 ${bookingNumber} 已成功取消。\n\n如有任何問題，請聯繫客服。`,
    }]);
  } else {
    await replyMessage(replyToken, [{
      type: 'text',
      text: `❌ 取消預訂 ${bookingNumber} 失敗，請稍後再試或聯繫客服。`,
    }]);
  }

  await redisClient.resetSession(userId);
}

/**
 * 處理房型查詢
 */
export async function handleRoomTypes(replyToken: string): Promise<void> {
  const roomTypes = await api.getRoomTypes();
  const message = flexMessages.createRoomTypesMessage(roomTypes);
  await replyMessage(replyToken, [message]);
}

/**
 * 處理客服請求
 */
export async function handleSupport(replyToken: string): Promise<void> {
  const message = flexMessages.createSupportMessage();
  await replyMessage(replyToken, [message]);
}

/**
 * 處理快速預訂
 */
export async function handleQuickBooking(userId: string, text: string, replyToken: string): Promise<void> {
  // 解析格式：預訂 [房型] [日期] [姓名] [電話]
  // 例如：預訂 雙人房 2025-03-15 王小明 0912345678
  
  await replyMessage(replyToken, [{
    type: 'text',
    text: '📱 請使用「查空房」功能，逐步完成預訂流程，謝謝！',
  }]);
}

/**
 * 處理日期查詢
 */
export async function handleDateQuery(userId: string, text: string, replyToken: string): Promise<void> {
  // 提取日期
  const dateMatches = text.match(/(\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2})/g);
  
  if (!dateMatches || dateMatches.length < 2) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '請輸入入住和退房日期，例如：\n查詢 2025-03-15 到 2025-03-17',
    }]);
    return;
  }

  const checkIn = dateMatches[0].replace(/\//g, '-');
  const checkOut = dateMatches[1].replace(/\//g, '-');

  await replyMessage(replyToken, [{
    type: 'text',
    text: `🔍 正在查詢 ${checkIn} 到 ${checkOut} 的空房...`,
  }]);

  const result = await api.checkAvailability(checkIn, checkOut, 1);

  if (!result) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 查詢失敗，請稍後再試或聯繫客服。',
    }]);
    return;
  }

  const message = flexMessages.createAvailabilityMessage(result);
  await replyMessage(replyToken, [message]);
}

/**
 * 顯示預訂確認
 */
export async function showBookingConfirmation(userId: string, replyToken: string): Promise<void> {
  const session = await redisClient.getSession(userId);
  if (!session) return;

  const { checkInDate, checkOutDate, roomTypeId, guestName, guestPhone } = session.data;

  if (!checkInDate || !checkOutDate || !roomTypeId || !guestName || !guestPhone) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 預訂資料不完整，請重新開始。',
    }]);
    await redisClient.resetSession(userId);
    return;
  }

  // 取得房型資訊
  const result = await api.checkAvailability(checkInDate, checkOutDate, 1);
  const roomType = result?.availableRoomTypes.find(r => r.id === roomTypeId);

  if (!roomType) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 房型資料錯誤，請重新查詢。',
    }]);
    await redisClient.resetSession(userId);
    return;
  }

  const message = flexMessages.createBookingConfirmationCard(
    roomType.name,
    checkInDate,
    checkOutDate,
    roomType.nights,
    guestName,
    guestPhone,
    roomType.totalPrice
  );

  await replyMessage(replyToken, [{
    type: 'text',
    text: '請確認以下預訂資訊：',
  }, message]);
}

/**
 * 確認預訂
 */
export async function confirmBooking(userId: string, replyToken: string): Promise<void> {
  const session = await redisClient.getSession(userId);
  if (!session) return;

  const { checkInDate, checkOutDate, roomTypeId, guestName, guestPhone } = session.data;

  if (!checkInDate || !checkOutDate || !roomTypeId || !guestName || !guestPhone) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 預訂資料不完整，請重新開始。',
    }]);
    await redisClient.resetSession(userId);
    return;
  }

  // 取得房型資訊並找到可用房間
  const result = await api.checkAvailability(checkInDate, checkOutDate, 1);
  const roomType = result?.availableRoomTypes.find(r => r.id === roomTypeId);

  if (!roomType || roomType.availableCount === 0) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 抱歉，該房型已被訂完，請重新查詢。',
    }]);
    await redisClient.resetSession(userId);
    return;
  }

  // 這裡需要取得實際的 roomId，暫時使用 roomTypeId 作為 roomId
  // 在實際實作中，應該從 API 取得可用的特定房間
  const booking = await api.createBooking(
    roomTypeId, // 這裡應該是實際的 roomId
    checkInDate,
    checkOutDate,
    guestName,
    guestPhone,
    1
  );

  if (booking) {
    const message = flexMessages.createBookingSuccessCard(booking);
    await replyMessage(replyToken, [message]);
  } else {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 預訂失敗，該房間可能已被其他人預訂，請重新查詢。',
    }]);
  }

  await redisClient.resetSession(userId);
}

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
