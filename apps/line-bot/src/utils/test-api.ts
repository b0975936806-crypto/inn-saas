import { checkAvailability, getRoomTypes, getBookingsByPhone } from '../services/api.service';

async function testAPI() {
  console.log('🧪 測試 API 連線\n');

  // 測試查詢空房
  console.log('1. 測試查詢空房...');
  const availability = await checkAvailability('2025-03-15', '2025-03-17', 2);
  console.log('   結果:', availability ? `找到 ${availability.availableRoomTypes.length} 種房型` : '查詢失敗');

  // 測試取得房型
  console.log('\n2. 測試取得房型列表...');
  const roomTypes = await getRoomTypes();
  console.log('   結果:', roomTypes.length > 0 ? `找到 ${roomTypes.length} 種房型` : '無房型資料');

  // 測試查詢預訂
  console.log('\n3. 測試查詢預訂...');
  const bookings = await getBookingsByPhone('0912345678');
  console.log('   結果:', `找到 ${bookings.length} 筆預訂`);

  console.log('\n✅ API 測試完成');
}

testAPI().catch(console.error);
