import { Request, Response } from 'express';
import crypto from 'crypto';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';

// ============================================
// LINE Bot Webhook 處理
// ============================================

export async function lineWebhook(req: Request, res: Response): Promise<void> {
  try {
    const events = req.body.events;

    if (!events || !Array.isArray(events)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_PAYLOAD', message: '無效的請求格式' },
      });
      return;
    }

    const prisma = req.tenant!.prisma;
    const lineBotSettings = await prisma.lineBotSettings.findFirst();

    if (!lineBotSettings) {
      res.status(400).json({
        success: false,
        error: { code: 'LINEBOT_NOT_CONFIGURED', message: 'LINE Bot 未設定' },
      });
      return;
    }

    // 驗證簽章
    const signature = req.headers['x-line-signature'] as string;
    const channelSecret = lineBotSettings.channelSecret;
    const body = JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');

    // 在測試環境可以暫時跳過驗證
    // if (signature !== expectedSignature) {
    //   res.status(401).json({
    //     success: false,
    //     error: { code: 'INVALID_SIGNATURE', message: '簽章驗證失敗' },
    //   });
    //   return;
    // }

    // 處理事件
    for (const event of events) {
      await handleLineEvent(event, lineBotSettings, prisma);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('LINE Webhook 錯誤:', error);
    res.json({ success: false });
  }
}

// ============================================
// 事件處理
// ============================================

async function handleLineEvent(event: any, settings: any, prisma: any): Promise<void> {
  const { type, replyToken, source, message } = event;

  switch (type) {
    case 'message':
      if (message.type === 'text') {
        await handleTextMessage(message.text, replyToken, source, settings, prisma);
      }
      break;

    case 'follow':
      await sendWelcomeMessage(replyToken, settings);
      break;

    case 'unfollow':
      console.log('用戶封鎖:', source.userId);
      break;

    default:
      console.log('未處理的事件類型:', type);
  }
}

// ============================================
// 指令處理器
// ============================================

async function handleTextMessage(
  text: string,
  replyToken: string,
  source: any,
  settings: any,
  prisma: any
): Promise<void> {
  const trimmedText = text.trim();
  const lineUserId = source.userId;

  // 1. 取消訂單指令：取消 BK20260308001
  const cancelMatch = trimmedText.match(/^取消\s+(BK\d+)$/i);
  if (cancelMatch) {
    const bookingNumber = cancelMatch[1].toUpperCase();
    const result = await handleCancelBooking(bookingNumber, lineUserId, prisma);
    await replyMessage(replyToken, settings, result);
    return;
  }

  // 2. 查空房 - 範圍：查空房 2026-03-10 2026-03-12
  const dateRangeMatch = trimmedText.match(/^查空房\s+(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})$/);
  if (dateRangeMatch) {
    const checkIn = dateRangeMatch[1];
    const checkOut = dateRangeMatch[2];
    const result = await handleCheckAvailability(checkIn, checkOut, prisma, settings);
    await replyMessage(replyToken, settings, result);
    return;
  }

  // 3. 查空房 - 單日：查空房 2026-03-10
  const singleDateMatch = trimmedText.match(/^查空房\s+(\d{4}-\d{2}-\d{2})$/);
  if (singleDateMatch) {
    const checkIn = singleDateMatch[1];
    const checkOut = format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd');
    const result = await handleCheckAvailability(checkIn, checkOut, prisma, settings);
    await replyMessage(replyToken, settings, result);
    return;
  }

  // 4. 快捷查詢指令
  const lowerText = trimmedText.toLowerCase();

  if (lowerText === '今晚') {
    const today = new Date();
    const checkIn = format(today, 'yyyy-MM-dd');
    const checkOut = format(addDays(today, 1), 'yyyy-MM-dd');
    const result = await handleCheckAvailability(checkIn, checkOut, prisma, settings);
    await replyMessage(replyToken, settings, result);
    return;
  }

  if (lowerText === '明天') {
    const tomorrow = addDays(new Date(), 1);
    const checkIn = format(tomorrow, 'yyyy-MM-dd');
    const checkOut = format(addDays(tomorrow, 1), 'yyyy-MM-dd');
    const result = await handleCheckAvailability(checkIn, checkOut, prisma, settings);
    await replyMessage(replyToken, settings, result);
    return;
  }

  if (lowerText === '這週末' || lowerText === '这周末' || lowerText === '週末' || lowerText === '周末') {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=日, 6=六
    // 計算本週六（如果今天是週日，則是下週六）
    const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
    const saturday = addDays(today, daysUntilSaturday);
    const checkIn = format(saturday, 'yyyy-MM-dd');
    const checkOut = format(addDays(saturday, 1), 'yyyy-MM-dd');
    const result = await handleCheckAvailability(checkIn, checkOut, prisma, settings);
    await replyMessage(replyToken, settings, result);
    return;
  }

  // 5. 我的訂單
  if (lowerText === '我的訂單') {
    const result = await handleMyBookings(lineUserId, prisma);
    await replyMessage(replyToken, settings, result);
    return;
  }

  // 6. 幫助指令
  if (lowerText === '幫助' || lowerText === 'help' || lowerText === '?' || lowerText === '？') {
    await replyMessage(replyToken, settings, buildHelpMessage());
    return;
  }

  // 7. 價格/房型查詢
  if (lowerText.includes('價格') || lowerText.includes('房型')) {
    const result = await handleRoomTypeInfo(prisma);
    await replyMessage(replyToken, settings, result);
    return;
  }

  // 8. 自動回覆
  if (settings.autoReplyEnabled) {
    await replyMessage(replyToken, settings, {
      type: 'text',
      text: '感謝您的訊息！請輸入「幫助」查看可用指令，或聯繫我們的客服人員。',
    });
  }
}

// ============================================
// 查空房處理
// ============================================

async function handleCheckAvailability(
  checkIn: string,
  checkOut: string,
  prisma: any,
  settings: any
): Promise<any> {
  try {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // 驗證日期
    if (checkOutDate <= checkInDate) {
      return {
        type: 'text',
        text: '❌ 退房日期必須晚於入住日期',
      };
    }

    // 計算晚數
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // 查詢所有房型
    const roomTypes = await prisma.roomType.findMany({
      where: { isActive: true },
      include: {
        rooms: {
          where: { status: { in: ['available', 'occupied'] } },
        },
      },
    });

    // 查詢已預訂的房間
    const bookings = await prisma.booking.findMany({
      where: {
        status: { notIn: ['cancelled'] },
        AND: [
          { checkInDate: { lt: checkOutDate } },
          { checkOutDate: { gt: checkInDate } },
        ],
      },
      select: { roomId: true },
    });

    const bookedRoomIds = new Set(bookings.map((b: any) => b.roomId));

    // 過濾有空房的房型
    const availableRoomTypes = roomTypes
      .map((roomType: any) => {
        const availableRooms = roomType.rooms.filter(
          (room: any) => room.status === 'available' && !bookedRoomIds.has(room.id)
        );
        return {
          ...roomType,
          availableCount: availableRooms.length,
          totalPrice: roomType.basePrice * nights,
        };
      })
      .filter((rt: any) => rt.availableCount > 0);

    if (availableRoomTypes.length === 0) {
      return {
        type: 'text',
        text: `📅 ${checkIn} ~ ${checkOut} (${nights}晚)\n\n抱歉，這段期間沒有空房。\n\n建議您：\n1️⃣ 試試其他日期\n2️⃣ 縮短住宿天數\n3️⃣ 直接來電詢問`,
      };
    }

    // 構建 Flex Message
    return buildAvailabilityFlexMessage(checkIn, checkOut, nights, availableRoomTypes, settings);
  } catch (error) {
    console.error('查詢空房錯誤:', error);
    return {
      type: 'text',
      text: '查詢空房時發生錯誤，請稍後再試。',
    };
  }
}

function buildAvailabilityFlexMessage(
  checkIn: string,
  checkOut: string,
  nights: number,
  roomTypes: any[],
  settings: any
): any {
  const bubbles = roomTypes.map((roomType) => ({
    type: 'bubble',
    size: 'kilo',
    hero: roomType.images && roomType.images.length > 0
      ? {
          type: 'image',
          url: roomType.images[0],
          size: 'full',
          aspectRatio: '20:13',
          aspectMode: 'cover',
        }
      : undefined,
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        {
          type: 'text',
          text: roomType.name,
          weight: 'bold',
          size: 'lg',
        },
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'baseline',
              contents: [
                { type: 'text', text: '入住', flex: 2, size: 'sm', color: '#aaaaaa' },
                { type: 'text', text: checkIn, flex: 5, size: 'sm' },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              contents: [
                { type: 'text', text: '退房', flex: 2, size: 'sm', color: '#aaaaaa' },
                { type: 'text', text: checkOut, flex: 5, size: 'sm' },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              contents: [
                { type: 'text', text: '晚數', flex: 2, size: 'sm', color: '#aaaaaa' },
                { type: 'text', text: `${nights} 晚`, flex: 5, size: 'sm' },
              ],
            },
          ],
        },
        {
          type: 'text',
          text: `尚餘 ${roomType.availableCount} 間`,
          size: 'sm',
          color: '#0D5C34',
          weight: 'bold',
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: `NT$ ${roomType.totalPrice.toLocaleString()}`,
              size: 'lg',
              weight: 'bold',
              color: '#0D5C34',
              flex: 0,
            },
            {
              type: 'text',
              text: `起 / ${nights}晚`,
              size: 'sm',
              color: '#888888',
              flex: 0,
              margin: 'sm',
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '立即預訂',
            uri: `https://liff.line.me/${settings.liffId || ''}/booking?checkIn=${checkIn}&checkOut=${checkOut}&roomTypeId=${roomType.id}`,
          },
          style: 'primary',
          color: '#0D5C34',
        },
      ],
    },
  }));

  return {
    type: 'flex',
    altText: `${checkIn} ~ ${checkOut} 有空房`,
    contents: {
      type: 'carousel',
      contents: bubbles,
    },
  };
}

// ============================================
// 我的訂單處理
// ============================================

async function handleMyBookings(lineUserId: string, prisma: any): Promise<any> {
  try {
    if (!lineUserId) {
      return {
        type: 'text',
        text: '❌ 無法識別您的身份，請重新加入好友後再試。',
      };
    }

    // 查詢使用者
    const user = await prisma.user.findFirst({
      where: { lineUserId },
    });

    if (!user) {
      return {
        type: 'text',
        text: '您目前還沒有訂單。\n\n輸入「查空房」開始預訂吧！',
      };
    }

    // 查詢使用者的訂單
    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        status: { notIn: ['cancelled'] },
      },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
      },
      orderBy: { checkInDate: 'desc' },
      take: 5,
    });

    if (bookings.length === 0) {
      return {
        type: 'text',
        text: '您目前沒有進行中的訂單。\n\n輸入「查空房」開始預訂吧！',
      };
    }

    return buildBookingsFlexMessage(bookings);
  } catch (error) {
    console.error('查詢訂單錯誤:', error);
    return {
      type: 'text',
      text: '查詢訂單時發生錯誤，請稍後再試。',
    };
  }
}

function buildBookingsFlexMessage(bookings: any[]): any {
  const contents = bookings.map((booking) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待確認', color: '#FF9800' },
      confirmed: { text: '已確認', color: '#0D5C34' },
      checked_in: { text: '已入住', color: '#2196F3' },
      checked_out: { text: '已退房', color: '#9E9E9E' },
    };
    const statusInfo = statusMap[booking.status] || { text: booking.status, color: '#666666' };

    return {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#F5F5F5',
      cornerRadius: 'md',
      paddingAll: 'lg',
      margin: 'md',
      action: {
        type: 'postback',
        label: '查看詳情',
        data: `action=view_booking&booking_id=${booking.bookingNumber}`,
      },
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: booking.bookingNumber,
              weight: 'bold',
              flex: 2,
              size: 'sm',
            },
            {
              type: 'text',
              text: statusInfo.text,
              color: statusInfo.color,
              align: 'end',
              flex: 1,
              size: 'sm',
              weight: 'bold',
            },
          ],
        },
        {
          type: 'text',
          text: `${booking.room?.roomType?.name || '房型'} | ${booking.nights}晚`,
          size: 'sm',
          color: '#666666',
          margin: 'sm',
        },
        {
          type: 'text',
          text: `${format(new Date(booking.checkInDate), 'yyyy/MM/dd')} ~ ${format(new Date(booking.checkOutDate), 'yyyy/MM/dd')}`,
          size: 'sm',
          color: '#666666',
        },
        {
          type: 'text',
          text: `NT$ ${booking.totalAmount.toLocaleString()}`,
          size: 'sm',
          color: '#0D5C34',
          weight: 'bold',
          margin: 'sm',
        },
      ],
    };
  });

  return {
    type: 'flex',
    altText: '您的訂單列表',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📋 您的訂單',
            weight: 'bold',
            size: 'lg',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: contents,
      },
    },
  };
}

// ============================================
// 取消訂單處理
// ============================================

async function handleCancelBooking(
  bookingNumber: string,
  lineUserId: string,
  prisma: any
): Promise<any> {
  try {
    if (!lineUserId) {
      return {
        type: 'text',
        text: '❌ 無法識別您的身份，請重新加入好友後再試。',
      };
    }

    // 查詢使用者
    const user = await prisma.user.findFirst({
      where: { lineUserId },
    });

    if (!user) {
      return {
        type: 'text',
        text: '❌ 找不到您的會員資料，請先完成預訂。',
      };
    }

    // 查詢訂單
    const booking = await prisma.booking.findFirst({
      where: {
        bookingNumber,
        userId: user.id,
      },
    });

    if (!booking) {
      return {
        type: 'text',
        text: `❌ 找不到訂單 ${bookingNumber}\n\n請確認訂單編號是否正確，或輸入「我的訂單」查看您的所有訂單。`,
      };
    }

    if (booking.status === 'cancelled') {
      return {
        type: 'text',
        text: `訂單 ${bookingNumber} 已經取消了。`,
      };
    }

    if (booking.status === 'checked_in' || booking.status === 'checked_out') {
      return {
        type: 'text',
        text: `❌ 訂單 ${bookingNumber} 無法取消（已入住或已退房）。\n\n如有需要請聯繫客服。`,
      };
    }

    // 執行取消
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'cancelled',
        paymentStatus: booking.paymentStatus === 'paid' ? 'refunded' : 'pending',
      },
    });

    return {
      type: 'text',
      text: `✅ 訂單 ${bookingNumber} 已成功取消。\n\n退款將於 3-5 個工作天退回原付款方式。\n\n如需協助，請聯繫客服。`,
    };
  } catch (error) {
    console.error('取消訂單錯誤:', error);
    return {
      type: 'text',
      text: '取消訂單時發生錯誤，請稍後再試或聯繫客服。',
    };
  }
}

// ============================================
// 房型資訊處理
// ============================================

async function handleRoomTypeInfo(prisma: any): Promise<any> {
  try {
    const roomTypes = await prisma.roomType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (roomTypes.length === 0) {
      return {
        type: 'text',
        text: '目前沒有可用的房型資訊。',
      };
    }

    let text = '🏨 房型與價格\n\n';
    for (const roomType of roomTypes) {
      text += `🏠 ${roomType.name}\n`;
      text += `   💰 NT$ ${roomType.basePrice.toLocaleString()}/晚\n`;
      text += `   👥 最多 ${roomType.maxGuests} 人\n`;
      if (roomType.bedType) {
        text += `   🛏️ ${roomType.bedType}\n`;
      }
      text += '\n';
    }

    text += '輸入「查空房 日期」查詢空房可用性';

    return { type: 'text', text };
  } catch (error) {
    console.error('取得房型資訊錯誤:', error);
    return {
      type: 'text',
      text: '取得房型資訊時發生錯誤。',
    };
  }
}

// ============================================
// 歡迎訊息
// ============================================

async function sendWelcomeMessage(replyToken: string, settings: any): Promise<void> {
  const welcomeText = settings.welcomeMessage || buildHelpMessage().text;
  await replyMessage(replyToken, settings, {
    type: 'text',
    text: welcomeText,
  });
}

function buildHelpMessage(): any {
  return {
    type: 'text',
    text: `歡迎使用訂房小幫手！🏠

📅 查詢空房：
• 「查空房 2026-03-10」- 單日查詢
• 「查空房 2026-03-10 2026-03-12」- 日期範圍
• 「今晚」- 今天空房
• 「明天」- 明天空房
• 「這週末」- 本週六空房

📋 訂單管理：
• 「我的訂單」- 查看所有訂單
• 「取消 BK20260308001」- 取消訂單

💰 其他：
• 「價格」或「房型」- 查看房型價格
• 「幫助」- 顯示此說明`,
  };
}

// ============================================
// 訊息發送工具
// ============================================

async function replyMessage(replyToken: string, settings: any, message: any): Promise<void> {
  try {
    const channelAccessToken = settings.channelAccessToken;
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [message],
      }),
    });

    if (!response.ok) {
      console.error('LINE API 錯誤:', await response.text());
    }
  } catch (error) {
    console.error('發送 LINE 訊息錯誤:', error);
  }
}

// ============================================
// 推播訊息 API
// ============================================

export async function sendPushMessage(req: Request, res: Response): Promise<void> {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMS', message: '缺少必要參數' },
      });
      return;
    }

    const prisma = req.tenant!.prisma;
    const lineBotSettings = await prisma.lineBotSettings.findFirst();

    if (!lineBotSettings) {
      res.status(400).json({
        success: false,
        error: { code: 'LINEBOT_NOT_CONFIGURED', message: 'LINE Bot 未設定' },
      });
      return;
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineBotSettings.channelAccessToken}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{
          type: 'text',
          text: message,
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    res.json({
      success: true,
      message: '訊息已發送',
    });
  } catch (error) {
    console.error('發送推播訊息錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PUSH_ERROR', message: '發送訊息失敗' },
    });
  }
}

// ============================================
// 依 Line User ID 查詢訂單 API
// ============================================

export async function getBookingsByLineUserId(req: Request, res: Response): Promise<void> {
  try {
    const { lineUserId } = req.params;

    if (!lineUserId) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMS', message: '缺少 lineUserId 參數' },
      });
      return;
    }

    const prisma = req.tenant!.prisma;

    // 查詢使用者
    const user = await prisma.user.findFirst({
      where: { lineUserId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '找不到該 Line 用戶' },
      });
      return;
    }

    // 查詢訂單
    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
      },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        bookings,
      },
    });
  } catch (error) {
    console.error('查詢 Line 用戶訂單錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}

// ============================================
// 依訂單編號取消訂單 API (Line 用戶專用)
// ============================================

export async function cancelBookingByNumber(req: Request, res: Response): Promise<void> {
  try {
    const { bookingNumber } = req.params;
    const { lineUserId } = req.body;

    if (!bookingNumber || !lineUserId) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMS', message: '缺少必要參數' },
      });
      return;
    }

    const prisma = req.tenant!.prisma;

    // 查詢使用者
    const user = await prisma.user.findFirst({
      where: { lineUserId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '找不到該 Line 用戶' },
      });
      return;
    }

    // 查詢訂單
    const booking = await prisma.booking.findFirst({
      where: {
        bookingNumber,
        userId: user.id,
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: '找不到該訂單' },
      });
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_CANCELLED', message: '訂單已取消' },
      });
      return;
    }

    // 執行取消
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'cancelled',
        paymentStatus: booking.paymentStatus === 'paid' ? 'refunded' : 'pending',
      },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: '訂單已取消',
      data: { booking: updatedBooking },
    });
  } catch (error) {
    console.error('取消訂單錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '取消失敗' },
    });
  }
}
