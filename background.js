// SDKのインポート部分は変更なし
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from './lib/index.mjs'; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // ★★★ コールバック関数の開始を明確にログ ★★★
  console.log('[Background] onMessage LISTENER FUNCTION STARTED.'); 

  try {
    console.log('[Background] Log Point 1: Inside try block.');

    // request オブジェクトの存在と型を確認
    console.log('[Background] typeof request:', typeof request);
    if (request) {
      console.log('[Background] request object is truthy.');
      // actionプロパティの存在と型を確認
      console.log('[Background] typeof request.action:', typeof request.action);
      console.log('[Background] request.action value:', request.action);
    } else {
      console.log('[Background] request object is falsy (e.g., undefined, null).');
    }

    console.log('[Background] Log Point 2: Before checking request.action.');

    if (request && request.action === "improvePrompt") {
      console.log('[Background] "improvePrompt" action recognized. Prompt:', request.prompt);

      // APIキー取得とGemini API呼び出し処理 (ここは前回と同様のロジック)
      chrome.storage.sync.get(['geminiApiKey'], async (result) => {
        console.log('[Background] Log Point 3: Inside storage.sync.get callback.');
        if (chrome.runtime.lastError) {
            console.error('[Background] Storage get error:', chrome.runtime.lastError.message);
            sendResponse({ success: false, error: `Storage get error: ${chrome.runtime.lastError.message}` });
            return; // true は返さない
        }
        
        if (result.geminiApiKey) {
          const apiKey = result.geminiApiKey;
          console.log('[Background] API Key successfully retrieved.');
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
          const userPrompt = request.prompt;
          const metaPrompt = `以下のユーザープロンプトについて、3つの異なる改善案を提案してください。
それぞれの改善案は、より明確で、具体的で、AIが意図を正確に理解しやすく、質の高い独自の応答を引き出せるように考慮してください。
各改善案は独立しており、他の説明や前置きなしで、提案されたプロンプトのみを提示してください。
各提案は改行で区切り、以下のように番号付きリストの形式で出力してください。

例:
1. 提案されたプロンプトA
2. 提案されたプロンプトB
3. 提案されたプロンプトC

ユーザープロンプト:
"${userPrompt}"

改善案:
`;
          try {
            console.log('[Background] Log Point 4: Attempting to call Gemini API...');
            const generationResult = await model.generateContent(metaPrompt);
            const response = await generationResult.response;
            const improvedText = response.text();
            console.log('[Background] Gemini API raw response:', improvedText);

            const improvedPromptsList = [];
            if (improvedText) {
              improvedText.trim().split('\n').forEach(line => {
                line = line.trim();
                if (!line) return;
                const match = line.match(/^\d+\.\s*(.*)/);
                if (match && match[1]) {
                  improvedPromptsList.push(match[1].trim());
                } else if (line.length > 5 && !/^\d+$/.test(line) && !/^\s*$/.test(line)) {
                  improvedPromptsList.push(line);
                }
              });
            }
            console.log('[Background] Parsed improved prompts list:', improvedPromptsList);

            if (improvedPromptsList.length > 0) {
              sendResponse({ success: true, improved_prompts: improvedPromptsList });
            } else {
              sendResponse({ success: false, error: "改善案リストが空、またはパース失敗。", raw_response: improvedText });
            }
          } catch (error) {
            console.error('[Background] Gemini API call error:', error);
            sendResponse({ success: false, error: `API call error: ${error.message || String(error)}` });
          }
        } else {
          console.error('[Background] API Key is not set.');
          sendResponse({ success: false, error: "APIキーが設定されていません。" });
        }
      });
      console.log('[Background] Log Point 5: Exiting "improvePrompt" block, returning true.');
      return true; // 非同期処理のため true を返す
    } else {
      console.warn('[Background] Received unknown action or invalid request. request.action:', request ? request.action : 'request_is_falsy');
      // sendResponse({ success: false, error: "Unknown action" }); // アクションがない場合は応答しないか、エラー応答
    }
  } catch (e) {
    // ★★★ コールバック関数全体で予期せぬエラーが発生した場合 ★★★
    console.error('[Background] UNEXPECTED ERROR in onMessage listener:', e);
    // sendResponse({ success: false, error: "バックグラウンドで予期せぬエラーが発生しました。" }); // エラー応答を試みる
  }
  console.log('[Background] onMessage LISTENER FUNCTION ENDED.'); // ★★★ コールバック関数の終了を明確にログ ★★★
  // 非同期のsendResponseが呼ばれなかった場合、ここでreturn false (または何も返さない)
  // "improvePrompt" 以外のアクションの場合は、sendResponseは呼ばれないので、これでOK
});

console.log("[Background] スクリプトがロードされました。onMessageリスナーが正常に登録されました。(v3)"); // バージョン更新