// 房型 API 路由處理
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: { message: '缺少 tenantId', code: 'MISSING_TENANT' } },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/room-types?tenantId=${tenantId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: '伺服器錯誤', code: 'SERVER_ERROR' } },
      { status: 500 }
    );
  }
}
