import { setupRichMenu } from './rich-menu';

// 執行 Rich Menu 設定
console.log('🎨 設定 LINE Rich Menu...');

setupRichMenu()
  .then(() => {
    console.log('✅ Rich Menu 設定完成');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('❌ Rich Menu 設定失敗:', error);
    process.exit(1);
  });
