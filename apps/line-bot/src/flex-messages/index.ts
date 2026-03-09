import { FlexMessage, RoomType, Booking, AvailabilityResult } from '../types';
import { config } from '../config';

/**
 * 歡迎訊息 Flex Message
 */
export function createWelcomeMessage(): FlexMessage {
  return {
    type: 'flex',
    altText: `歡迎使用 ${config.innName} LINE 服務`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png',
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `🏨 ${config.innName}`,
            weight: 'bold',
            size: 'xl',
          },
          {
            type: 'text',
            text: '歡迎使用我們的 LINE 預訂服務！',
            size: 'sm',
            color: '#666666',
            margin: 'md',
            wrap: true,
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              createInfoRow('🔍 查空房', '輸入「查空房」開始查詢'),
              createInfoRow('📅 查詢預訂', '輸入「我的預訂」查看訂單'),
              createInfoRow('❓ 幫助', '輸入「幫助」查看所有指令'),
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'message',
              label: '查詢空房',
              text: '查空房',
            },
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'message',
              label: '查看房型',
              text: '房型',
            },
          },
        ],
        flex: 0,
      },
    },
  };
}

/**
 * 空房列表 Flex Message
 */
export function createAvailabilityMessage(result: AvailabilityResult): FlexMessage {
  const { checkIn, checkOut, nights, availableRoomTypes } = result;
  
  if (availableRoomTypes.length === 0) {
    return {
      type: 'flex',
      altText: '該日期暫無空房',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '😔 暫無空房',
              weight: 'bold',
              size: 'xl',
              color: '#ff6b6b',
            },
            {
              type: 'text',
              text: `${checkIn} 至 ${checkOut}（${nights} 晚）`,
              size: 'sm',
              color: '#666666',
              margin: 'md',
            },
            {
              type: 'text',
              text: '該日期區間暫無可用房間，請嘗試其他日期或聯繫客服。',
              size: 'sm',
              color: '#666666',
              margin: 'lg',
              wrap: true,
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              style: 'primary',
              action: {
                type: 'message',
                label: '聯絡客服',
                text: '人工客服',
              },
            },
          ],
        },
      },
    };
  }

  const bubbles = availableRoomTypes.map(roomType => createRoomCard(roomType));
  
  return {
    type: 'flex',
    altText: `找到 ${availableRoomTypes.length} 種可用房型`,
    contents: {
      type: 'carousel',
      contents: bubbles,
    },
  };
}

/**
 * 單一房間卡片
 */
function createRoomCard(roomType: RoomType): any {
  const imageUrl = roomType.images?.[0] || 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png';
  
  return {
    type: 'bubble',
    hero: {
      type: 'image',
      url: imageUrl,
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: roomType.name,
          weight: 'bold',
          size: 'xl',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            createInfoRow('💰 價格', `NT$ ${roomType.totalPrice.toLocaleString()} / ${roomType.nights} 晚`),
            createInfoRow('👥 人數', `最多 ${roomType.maxGuests} 人`),
            createInfoRow('🛏️ 床型', roomType.bedType || '標準雙人床'),
            createInfoRow('✅ 可訂', `剩餘 ${roomType.availableCount} 間`),
          ],
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'text',
          text: roomType.description || '',
          size: 'xs',
          color: '#888888',
          margin: 'md',
          wrap: true,
          maxLines: 3,
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          action: {
            type: 'postback',
            label: '立即預訂',
            data: `action=book&roomTypeId=${roomType.id}`,
            displayText: '我要預訂這個房型',
          },
        },
      ],
    },
  };
}

/**
 * 預訂確認卡片
 */
export function createBookingConfirmationCard(
  roomTypeName: string,
  checkIn: string,
  checkOut: string,
  nights: number,
  guestName: string,
  guestPhone: string,
  totalPrice: number
): FlexMessage {
  return {
    type: 'flex',
    altText: '預訂確認',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📋 預訂確認',
            weight: 'bold',
            size: 'xl',
            color: '#4A90D9',
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              createInfoRow('🏠 房型', roomTypeName),
              createInfoRow('📅 入住', checkIn),
              createInfoRow('📅 退房', checkOut),
              createInfoRow('🌙 晚數', `${nights} 晚`),
              createInfoRow('👤 姓名', guestName),
              createInfoRow('📱 電話', guestPhone),
            ],
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: '💰 總金額',
                size: 'md',
                color: '#666666',
              },
              {
                type: 'text',
                text: `NT$ ${totalPrice.toLocaleString()}`,
                size: 'lg',
                weight: 'bold',
                color: '#4A90D9',
                align: 'end',
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'message',
              label: '取消',
              text: '取消',
            },
          },
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'postback',
              label: '確認預訂',
              data: 'action=confirm_booking',
            },
          },
        ],
      },
    },
  };
}

/**
 * 預訂成功卡片
 */
export function createBookingSuccessCard(booking: Booking): FlexMessage {
  return {
    type: 'flex',
    altText: `預訂成功！編號：${booking.bookingNumber}`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '✅ 預訂成功！',
            weight: 'bold',
            size: 'xl',
            color: '#28a745',
          },
          {
            type: 'text',
            text: `預訂編號：${booking.bookingNumber}`,
            size: 'md',
            weight: 'bold',
            margin: 'md',
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              createInfoRow('🏠 房型', booking.room.roomType.name),
              createInfoRow('🚪 房號', booking.room.roomNumber),
              createInfoRow('📅 入住', formatDate(booking.checkInDate)),
              createInfoRow('📅 退房', formatDate(booking.checkOutDate)),
              createInfoRow('🌙 晚數', `${booking.nights} 晚`),
              createInfoRow('👤 姓名', booking.guestName || ''),
              createInfoRow('📱 電話', booking.guestPhone || ''),
            ],
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: '💰 總金額',
                size: 'md',
                color: '#666666',
              },
              {
                type: 'text',
                text: `NT$ ${booking.totalAmount.toLocaleString()}`,
                size: 'lg',
                weight: 'bold',
                color: '#28a745',
                align: 'end',
              },
            ],
          },
          {
            type: 'text',
            text: '請記住您的預訂編號，如需修改或取消請使用此編號。',
            size: 'xs',
            color: '#888888',
            margin: 'lg',
            wrap: true,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'message',
              label: '查詢我的預訂',
              text: '我的預訂',
            },
          },
        ],
      },
    },
  };
}

/**
 * 我的預訂列表
 */
export function createMyBookingsMessage(bookings: Booking[]): FlexMessage {
  if (bookings.length === 0) {
    return {
      type: 'flex',
      altText: '沒有找到預訂記錄',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '📭 沒有找到預訂記錄',
              weight: 'bold',
              size: 'xl',
            },
            {
              type: 'text',
              text: '您目前沒有任何預訂。',
              size: 'sm',
              color: '#666666',
              margin: 'md',
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              style: 'primary',
              action: {
                type: 'message',
                label: '立即預訂',
                text: '查空房',
              },
            },
          ],
        },
      },
    };
  }

  // 只顯示最近的 10 筆
  const recentBookings = bookings.slice(0, 10);
  const bubbles = recentBookings.map(booking => createBookingCard(booking));

  return {
    type: 'flex',
    altText: `您有 ${bookings.length} 筆預訂`,
    contents: {
      type: 'carousel',
      contents: bubbles,
    },
  };
}

/**
 * 單一預訂卡片
 */
function createBookingCard(booking: Booking): any {
  const statusColors: Record<string, string> = {
    pending: '#ffc107',
    confirmed: '#28a745',
    checked_in: '#17a2b8',
    checked_out: '#6c757d',
    cancelled: '#dc3545',
  };

  const statusLabels: Record<string, string> = {
    pending: '待確認',
    confirmed: '已確認',
    checked_in: '已入住',
    checked_out: '已退房',
    cancelled: '已取消',
  };

  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';

  return {
    type: 'bubble',
    size: 'kilo',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: booking.bookingNumber,
              weight: 'bold',
              size: 'md',
            },
            {
              type: 'text',
              text: statusLabels[booking.status] || booking.status,
              size: 'xs',
              color: statusColors[booking.status] || '#666666',
              align: 'end',
              weight: 'bold',
            },
          ],
        },
        {
          type: 'separator',
          margin: 'sm',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'sm',
          spacing: 'xs',
          contents: [
            {
              type: 'text',
              text: `🏠 ${booking.room.roomType.name} (${booking.room.roomNumber})`,
              size: 'sm',
            },
            {
              type: 'text',
              text: `📅 ${formatDate(booking.checkInDate)} - ${formatDate(booking.checkOutDate)}`,
              size: 'sm',
            },
            {
              type: 'text',
              text: `💰 NT$ ${booking.totalAmount.toLocaleString()}`,
              size: 'sm',
            },
          ],
        },
      ],
    },
    footer: canCancel
      ? {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '取消預訂',
                data: `action=cancel&bookingId=${booking.id}`,
                displayText: `我要取消預訂 ${booking.bookingNumber}`,
              },
            },
          ],
        }
      : undefined,
  };
}

/**
 * 房型列表
 */
export function createRoomTypesMessage(roomTypes: RoomType[]): FlexMessage {
  if (roomTypes.length === 0) {
    return {
      type: 'flex',
      altText: '暫無房型資訊',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🏨 房型介紹',
              weight: 'bold',
              size: 'xl',
            },
            {
              type: 'text',
              text: '目前沒有可用的房型資訊。',
              size: 'sm',
              color: '#666666',
              margin: 'md',
            },
          ],
        },
      },
    };
  }

  const bubbles = roomTypes.map(roomType => ({
    type: 'bubble',
    size: 'kilo',
    hero: {
      type: 'image',
      url: roomType.images?.[0] || 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png',
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: roomType.name,
          weight: 'bold',
          size: 'md',
        },
        {
          type: 'text',
          text: `💰 NT$ ${roomType.basePrice.toLocaleString()}/晚`,
          size: 'sm',
          color: '#4A90D9',
          margin: 'sm',
        },
        {
          type: 'text',
          text: `👥 最多 ${roomType.maxGuests} 人・🛏️ ${roomType.bedType || '雙人床'}`,
          size: 'xs',
          color: '#666666',
          margin: 'sm',
        },
        {
          type: 'text',
          text: roomType.description || '',
          size: 'xs',
          color: '#888888',
          margin: 'sm',
          wrap: true,
          maxLines: 2,
        },
      ],
    },
  }));

  return {
    type: 'flex',
    altText: `共有 ${roomTypes.length} 種房型`,
    contents: {
      type: 'carousel',
      contents: bubbles,
    },
  };
}

/**
 * 幫助訊息
 */
export function createHelpMessage(): FlexMessage {
  return {
    type: 'flex',
    altText: '可用指令說明',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '❓ 指令說明',
            weight: 'bold',
            size: 'xl',
            color: '#4A90D9',
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'md',
            contents: [
              createHelpRow('🔍 查空房', '查詢可訂房間\n例如：查空房'),
              createHelpRow('📅 查詢預訂', '查看您的預訂\n例如：我的預訂'),
              createHelpRow('🏨 房型', '查看房型與價格'),
              createHelpRow('🗑️ 取消預訂', '取消現有預訂\n例如：取消預訂'),
              createHelpRow('👤 人工客服', '轉接真人客服'),
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
            style: 'primary',
            action: {
              type: 'message',
              label: '開始查詢空房',
              text: '查空房',
            },
          },
        ],
      },
    },
  };
}

/**
 * 客服訊息
 */
export function createSupportMessage(): FlexMessage {
  return {
    type: 'flex',
    altText: '聯絡客服',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '👤 人工客服',
            weight: 'bold',
            size: 'xl',
            color: '#4A90D9',
          },
          {
            type: 'text',
            text: '如需協助，請透過以下方式聯繫我們：',
            size: 'sm',
            color: '#666666',
            margin: 'md',
            wrap: true,
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              ...(config.supportPhone
                ? [createInfoRow('📞 電話', config.supportPhone)]
                : []),
              createInfoRow('💬 LINE', '直接傳送訊息'),
              createInfoRow('⏰ 服務時間', '每日 08:00 - 22:00'),
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '我們會盡快回覆您的訊息！',
            size: 'xs',
            color: '#888888',
            align: 'center',
          },
        ],
      },
    },
  };
}

/**
 * 建立資訊行
 */
function createInfoRow(label: string, value: string): any {
  return {
    type: 'box',
    layout: 'horizontal',
    spacing: 'sm',
    contents: [
      {
        type: 'text',
        text: label,
        size: 'sm',
        color: '#666666',
        flex: 2,
      },
      {
        type: 'text',
        text: value,
        size: 'sm',
        color: '#333333',
        flex: 3,
        wrap: true,
      },
    ],
  };
}

/**
 * 建立幫助行
 */
function createHelpRow(command: string, description: string): any {
  return {
    type: 'box',
    layout: 'horizontal',
    spacing: 'sm',
    contents: [
      {
        type: 'text',
        text: command,
        size: 'sm',
        weight: 'bold',
        flex: 2,
      },
      {
        type: 'text',
        text: description,
        size: 'sm',
        color: '#666666',
        flex: 3,
        wrap: true,
      },
    ],
  };
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
