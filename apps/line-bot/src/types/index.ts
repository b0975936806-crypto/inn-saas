import { SessionStates } from '../config';

// LINE Webhook 事件
export interface LineEvent {
  type: string;
  timestamp: number;
  source: LineSource;
  replyToken?: string;
  message?: LineMessage;
  postback?: LinePostback;
}

export interface LineSource {
  type: 'user' | 'group' | 'room';
  userId?: string;
  groupId?: string;
  roomId?: string;
}

export interface LineMessage {
  type: string;
  id: string;
  text?: string;
}

export interface LinePostback {
  data: string;
  params?: {
    date?: string;
    time?: string;
    datetime?: string;
  };
}

// LINE Webhook 請求
export interface WebhookRequest {
  events: LineEvent[];
}

// 用戶會話
export interface UserSession {
  userId: string;
  state: typeof SessionStates[keyof typeof SessionStates];
  data: SessionData;
  lastActivity: number;
}

export interface SessionData {
  checkInDate?: string;
  checkOutDate?: string;
  roomTypeId?: number;
  guestCount?: number;
  guestName?: string;
  guestPhone?: string;
  selectedBookingNumber?: string;
}

// 房型
export interface RoomType {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  maxGuests: number;
  bedType: string | null;
  amenities: string[];
  images: string[];
  availableCount: number;
  totalPrice: number;
  nights: number;
}

// 房間
export interface Room {
  id: number;
  roomNumber: string;
  floor: number | null;
  status: string;
}

// 預訂
export interface Booking {
  id: number;
  bookingNumber: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestCount: number;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  specialRequests: string | null;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  room: {
    id: number;
    roomNumber: string;
    roomType: {
      id: number;
      name: string;
      basePrice: number;
    };
  };
  user: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
  };
}

// 空房查詢結果
export interface AvailabilityResult {
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  availableRoomTypes: RoomType[];
}

// LINE Flex Message
export interface FlexMessage {
  type: 'flex';
  altText: string;
  contents: any;
}

// LINE 文字訊息
export interface TextMessage {
  type: 'text';
  text: string;
}

// LINE 訊息
export type LineReplyMessage = FlexMessage | TextMessage;
