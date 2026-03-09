export const config = {
  // 服務配置
  port: parseInt(process.env.PORT || '3001'),
  
  // LINE Bot 配置
  line: {
    channelId: process.env.LINE_CHANNEL_ID || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  },
  
  // Redis 配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    sessionTTL: 30 * 60, // 30 分鐘（秒）
  },
  
  // API 配置
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    apiKey: process.env.API_KEY || '',
  },
  
  // 民宿名稱
  innName: process.env.INN_NAME || '民宿',
  
  // 客服電話
  supportPhone: process.env.SUPPORT_PHONE || '',
};

// 會話狀態類型
export const SessionStates = {
  IDLE: 'idle',
  AWAITING_CHECKIN_DATE: 'awaiting_checkin_date',
  AWAITING_CHECKOUT_DATE: 'awaiting_checkout_date',
  AWAITING_ROOM_TYPE: 'awaiting_room_type',
  AWAITING_GUEST_NAME: 'awaiting_guest_name',
  AWAITING_GUEST_PHONE: 'awaiting_guest_phone',
  AWAITING_CONFIRMATION: 'awaiting_confirmation',
  AWAITING_CANCELLATION_REASON: 'awaiting_cancellation_reason',
} as const;

// 指令對應
export const Commands = {
  CHECK_AVAILABILITY: ['查空房', '空房', '訂房', '預訂', '訂房查詢'],
  MY_BOOKINGS: ['我的預訂', '查詢預訂', '預訂查詢'],
  CANCEL_BOOKING: ['取消預訂', '取消'],
  SUPPORT: ['人工客服', '客服', '聯絡客服', '幫助', 'help', '?'],
  ROOM_TYPES: ['房型', '價格', '價錢'],
} as const;
