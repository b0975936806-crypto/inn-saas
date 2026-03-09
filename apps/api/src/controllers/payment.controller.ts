import { Request, Response } from 'express';
import crypto from 'crypto';

// 綠界測試環境設定
const ECPAY_TEST_API = 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

/**
 * 建立綠界付款請求
 */
export async function createEcpayPayment(req: Request, res: Response): Promise<void> {
  try {
    const { bookingId, totalAmount, itemName, returnUrl, clientBackUrl } = req.body;

    if (!bookingId || !totalAmount || !itemName) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMS', message: '缺少必要參數' },
      });
      return;
    }

    const prisma = req.tenant!.prisma;
    const tenant = await prisma.tenant.findFirst();

    if (!tenant || !tenant.ecpayEnabled || !tenant.ecpayMerchantId) {
      res.status(400).json({
        success: false,
        error: { code: 'PAYMENT_NOT_ENABLED', message: '綠界支付未啟用' },
      });
      return;
    }

    // 測試模式使用測試帳號
    const isTestMode = tenant.ecpayTestMode;
    const merchantId = isTestMode ? '3002607' : tenant.ecpayMerchantId;
    const hashKey = isTestMode ? 'pwFHCqoQZGmho4w6' : (tenant.ecpayHashKey || '');
    const hashIv = isTestMode ? 'EkRm7iFT261dpevs' : (tenant.ecpayHashIv || '');

    const merchantTradeNo = `EC${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const merchantTradeDate = new Date().toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/\//g, '\/');

    const params: Record<string, string> = {
      MerchantID: merchantId,
      MerchantTradeNo: merchantTradeNo,
      MerchantTradeDate: merchantTradeDate,
      PaymentType: 'aio',
      TotalAmount: totalAmount.toString(),
      TradeDesc: 'InnSaaS 訂房付款',
      ItemName: itemName,
      ReturnURL: returnUrl || `${process.env.API_URL}/api/payments/ecpay/callback`,
      ClientBackURL: clientBackUrl || `${process.env.FRONTEND_URL}/booking/complete`,
      ChoosePayment: 'ALL',
      EncryptType: '1',
    };

    // 產生 CheckMacValue
    const checkMacValue = generateCheckMacValue(params, hashKey, hashIv);

    res.json({
      success: true,
      data: {
        paymentUrl: ECPAY_TEST_API,
        params: {
          ...params,
          CheckMacValue: checkMacValue,
        },
        isTestMode,
      },
    });
  } catch (error) {
    console.error('建立綠界付款錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PAYMENT_ERROR', message: '建立付款失敗' },
    });
  }
}

/**
 * 綠界付款回調
 */
export async function ecpayCallback(req: Request, res: Response): Promise<void> {
  try {
    const { MerchantTradeNo, RtnCode, PaymentDate, TradeNo } = req.body;

    console.log('綠界回調:', req.body);

    // 驗證 CheckMacValue
    const receivedCheckMac = req.body.CheckMacValue;
    const params = { ...req.body };
    delete params.CheckMacValue;

    // TODO: 驗證 CheckMacValue
    // const calculatedCheckMac = generateCheckMacValue(params, hashKey, hashIv);
    // if (receivedCheckMac !== calculatedCheckMac) {
    //   res.status(400).send('0|CheckMacValueError');
    //   return;
    // }

    if (RtnCode === '1') {
      // 付款成功，更新預訂狀態
      // TODO: 根據 MerchantTradeNo 找到對應預訂並更新
      console.log(`✅ 付款成功: ${MerchantTradeNo}`);
    }

    // 回應綠界
    res.send('1|OK');
  } catch (error) {
    console.error('綠界回調處理錯誤:', error);
    res.status(500).send('0|Error');
  }
}

/**
 * 建立 LINE Pay 付款請求
 */
export async function createLinePayPayment(req: Request, res: Response): Promise<void> {
  try {
    const { bookingId, amount, currency, orderId, packages, redirectUrls } = req.body;

    if (!amount || !orderId) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMS', message: '缺少必要參數' },
      });
      return;
    }

    const prisma = req.tenant!.prisma;
    const tenant = await prisma.tenant.findFirst();

    if (!tenant || !tenant.linepayEnabled || !tenant.linepayChannelId) {
      res.status(400).json({
        success: false,
        error: { code: 'PAYMENT_NOT_ENABLED', message: 'LINE Pay 未啟用' },
      });
      return;
    }

    const channelId = tenant.linepayChannelId;
    const channelSecret = tenant.linepayChannelSecret || '';
    const apiUrl = 'https://sandbox-api-pay.line.me';

    const requestUri = '/v3/payments/request';
    const nonce = crypto.randomUUID();
    const body = JSON.stringify({
      amount,
      currency: currency || 'TWD',
      orderId,
      packages: packages || [],
      redirectUrls: redirectUrls || {
        confirmUrl: `${process.env.FRONTEND_URL}/payment/linepay/confirm`,
        cancelUrl: `${process.env.FRONTEND_URL}/payment/linepay/cancel`,
      },
    });

    const signature = generateLinePaySignature(channelSecret, requestUri, body, nonce);

    res.json({
      success: true,
      data: {
        apiUrl: `${apiUrl}${requestUri}`,
        headers: {
          'Content-Type': 'application/json',
          'X-LINE-ChannelId': channelId,
          'X-LINE-Authorization-Nonce': nonce,
          'X-LINE-Authorization': signature,
        },
        body: JSON.parse(body),
        isSandbox: true,
      },
    });
  } catch (error) {
    console.error('建立 LINE Pay 付款錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PAYMENT_ERROR', message: '建立付款失敗' },
    });
  }
}

/**
 * LINE Pay 付款確認
 */
export async function linePayConfirm(req: Request, res: Response): Promise<void> {
  try {
    const { transactionId, amount, currency } = req.body;

    const prisma = req.tenant!.prisma;
    const tenant = await prisma.tenant.findFirst();

    if (!tenant || !tenant.linepayChannelId) {
      res.status(400).json({
        success: false,
        error: { code: 'PAYMENT_NOT_ENABLED', message: 'LINE Pay 未啟用' },
      });
      return;
    }

    const channelId = tenant.linepayChannelId;
    const channelSecret = tenant.linepayChannelSecret || '';
    const apiUrl = 'https://sandbox-api-pay.line.me';

    const requestUri = `/v3/payments/${transactionId}/confirm`;
    const nonce = crypto.randomUUID();
    const body = JSON.stringify({
      amount,
      currency: currency || 'TWD',
    });

    const signature = generateLinePaySignature(channelSecret, requestUri, body, nonce);

    res.json({
      success: true,
      data: {
        apiUrl: `${apiUrl}${requestUri}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LINE-ChannelId': channelId,
          'X-LINE-Authorization-Nonce': nonce,
          'X-LINE-Authorization': signature,
        },
        body: JSON.parse(body),
      },
    });
  } catch (error) {
    console.error('LINE Pay 確認錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PAYMENT_ERROR', message: '確認付款失敗' },
    });
  }
}

/**
 * 產生綠界 CheckMacValue
 */
function generateCheckMacValue(params: Record<string, string>, hashKey: string, hashIv: string): string {
  // 1. 將參數按照字母順序排序
  const sortedKeys = Object.keys(params).sort();
  
  // 2. 組合成字串
  let paramStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  
  // 3. 加上 HashKey 和 HashIV
  paramStr = `HashKey=${hashKey}&${paramStr}&HashIV=${hashIv}`;
  
  // 4. URL encode
  paramStr = encodeURIComponent(paramStr).toLowerCase();
  
  // 5. 替換特殊字元
  paramStr = paramStr
    .replace(/%2d/g, '-')
    .replace(/%5f/g, '_')
    .replace(/%2e/g, '.')
    .replace(/%21/g, '!')
    .replace(/%2a/g, '*')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')');
  
  // 6. SHA256 雜湊
  const hash = crypto.createHash('sha256').update(paramStr).digest('hex');
  
  // 7. 轉大寫
  return hash.toUpperCase();
}

/**
 * 產生 LINE Pay 簽章
 */
function generateLinePaySignature(channelSecret: string, uri: string, body: string, nonce: string): string {
  const authMac = crypto.createHmac('sha256', channelSecret)
    .update(channelSecret + uri + body + nonce)
    .digest('base64');
  return authMac;
}

/**
 * 取得租戶金流設定狀態
 */
export async function getPaymentStatus(req: Request, res: Response): Promise<void> {
  try {
    const prisma = req.tenant!.prisma;
    const tenant = await prisma.tenant.findFirst({
      select: {
        ecpayEnabled: true,
        ecpayMerchantId: true,
        ecpayTestMode: true,
        linepayEnabled: true,
        linepayChannelId: true,
      },
    });

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: { code: 'TENANT_NOT_FOUND', message: '租戶不存在' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ecpay: {
          enabled: tenant.ecpayEnabled,
          configured: !!tenant.ecpayMerchantId,
          testMode: tenant.ecpayTestMode,
        },
        linepay: {
          enabled: tenant.linepayEnabled,
          configured: !!tenant.linepayChannelId,
        },
      },
    });
  } catch (error) {
    console.error('取得金流狀態錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}
