/**
 * 手動測試 NextAuth 認證流程
 *
 * 此腳本直接調用 NextAuth API endpoints，繞過 signIn() 函數
 * 用於診斷認證問題的根本原因
 */

// 使用 Node.js 18+ 內建的 fetch

const BASE_URL = 'http://localhost:3006';

interface SignInResponse {
  url?: string;
  error?: string;
  status?: number;
  ok?: boolean;
}

/**
 * 步驟 1: 獲取 CSRF Token
 */
async function getCsrfToken(): Promise<string> {
  console.log('🔐 步驟 1: 獲取 CSRF Token');
  const response = await fetch(`${BASE_URL}/api/auth/csrf`);
  const data = await response.json() as { csrfToken: string };
  console.log('✅ CSRF Token:', data.csrfToken);
  return data.csrfToken;
}

/**
 * 步驟 2: 發送登入請求
 */
async function signInWithCredentials(csrfToken: string, email: string, password: string): Promise<SignInResponse> {
  console.log('\n🔐 步驟 2: 發送登入請求');
  console.log('📧 Email:', email);

  const body = new URLSearchParams({
    email,
    password,
    csrfToken,
    callbackUrl: `${BASE_URL}/dashboard`,
    json: 'true',
  });

  // 修正：應該 POST 到 /api/auth/signin/credentials，而不是 callback
  console.log('📤 請求 URL:', `${BASE_URL}/api/auth/signin/credentials`);
  console.log('📤 請求 Body:', body.toString());

  const response = await fetch(`${BASE_URL}/api/auth/signin/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    redirect: 'manual', // 不自動跟隨重定向
  });

  console.log('📥 響應狀態:', response.status);
  console.log('📥 響應標頭:', JSON.stringify(Object.fromEntries(response.headers), null, 2));

  // 檢查 Set-Cookie 標頭
  const setCookie = response.headers.get('set-cookie');
  console.log('🍪 Set-Cookie:', setCookie);

  // 嘗試讀取響應體
  let responseBody: any;
  try {
    const text = await response.text();
    console.log('📥 響應體（原始）:', text);
    if (text) {
      try {
        responseBody = JSON.parse(text);
        console.log('📥 響應體（JSON）:', JSON.stringify(responseBody, null, 2));
      } catch {
        responseBody = { text };
      }
    }
  } catch (e) {
    console.log('⚠️ 無法讀取響應體:', e);
  }

  return {
    status: response.status,
    ok: response.ok,
    url: response.headers.get('location') || undefined,
    error: responseBody?.error,
  };
}

/**
 * 步驟 3: 檢查 Session
 */
async function checkSession(cookies: string): Promise<any> {
  console.log('\n🔐 步驟 3: 檢查 Session');

  const response = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: {
      Cookie: cookies,
    },
  });

  const session = await response.json();
  console.log('📥 Session 數據:', JSON.stringify(session, null, 2));
  return session;
}

/**
 * 主測試函數
 */
async function main() {
  console.log('🧪 開始手動測試 NextAuth 認證流程\n');
  console.log('🌐 BASE_URL:', BASE_URL);
  console.log('📅 時間:', new Date().toISOString());
  console.log('='.repeat(60));

  try {
    // 測試用戶
    const testUsers = [
      { email: 'test-manager@example.com', password: 'testpassword123', role: 'ProjectManager' },
      { email: 'test-supervisor@example.com', password: 'testpassword123', role: 'Supervisor' },
    ];

    for (const user of testUsers) {
      console.log(`\n\n${'='.repeat(60)}`);
      console.log(`測試用戶: ${user.email} (${user.role})`);
      console.log('='.repeat(60));

      // 步驟 1: 獲取 CSRF Token
      const csrfToken = await getCsrfToken();

      // 步驟 2: 發送登入請求
      const signInResult = await signInWithCredentials(csrfToken, user.email, user.password);

      console.log('\n📊 登入結果:');
      console.log('  - 狀態:', signInResult.ok ? '✅ 成功' : '❌ 失敗');
      console.log('  - HTTP 狀態碼:', signInResult.status);
      console.log('  - 重定向 URL:', signInResult.url || '無');
      console.log('  - 錯誤:', signInResult.error || '無');

      // 如果登入失敗，跳過 session 檢查
      if (!signInResult.ok) {
        console.log('\n❌ 登入失敗，跳過 session 檢查');
        continue;
      }

      // 注意：由於我們使用 redirect: 'manual'，無法獲取 cookies
      // 這是測試腳本的限制，但已經足夠診斷服務器端問題
      console.log('\n⚠️ 注意: 由於使用 redirect: "manual"，無法自動檢查 session');
      console.log('💡 如果看到 "🔐 Authorize 函數執行" 日誌，說明認證流程正常');
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('🎉 測試完成');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n💥 測試過程中發生錯誤:');
    console.error(error);
    process.exit(1);
  }
}

// 執行測試
main().catch(console.error);
