import { setRichMenu } from '../services/line.service';

/**
 * Rich Menu 設定
 */
export const richMenuConfig = {
  size: {
    width: 2500,
    height: 1686,
  },
  selected: true,
  name: 'Main Menu',
  chatBarText: '查看選單',
  areas: [
    {
      bounds: {
        x: 0,
        y: 0,
        width: 833,
        height: 843,
      },
      action: {
        type: 'message',
        text: '查空房',
      },
    },
    {
      bounds: {
        x: 834,
        y: 0,
        width: 833,
        height: 843,
      },
      action: {
        type: 'message',
        text: '房型',
      },
    },
    {
      bounds: {
        x: 1668,
        y: 0,
        width: 832,
        height: 843,
      },
      action: {
        type: 'message',
        text: '我的預訂',
      },
    },
    {
      bounds: {
        x: 0,
        y: 844,
        width: 833,
        height: 842,
      },
      action: {
        type: 'message',
        text: '幫助',
      },
    },
    {
      bounds: {
        x: 834,
        y: 844,
        width: 833,
        height: 842,
      },
      action: {
        type: 'uri',
        uri: 'https://example.com',
      },
    },
    {
      bounds: {
        x: 1668,
        y: 844,
        width: 832,
        height: 842,
      },
      action: {
        type: 'message',
        text: '人工客服',
      },
    },
  ],
};

/**
 * 設定 Rich Menu
 */
export async function setupRichMenu(): Promise<void> {
  try {
    const richMenuId = await setRichMenu(richMenuConfig);
    console.log('✅ Rich Menu 已設定，ID:', richMenuId);
  } catch (error) {
    console.error('❌ Rich Menu 設定失敗:', error);
  }
}
