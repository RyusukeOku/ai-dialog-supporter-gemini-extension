// content_scripts/main.js (リファクタリング版 v6)

console.log("[AI Supporter][Content] Script Start (v6)");

// --- 定数定義 ---
const BUTTON_ID = 'aiSupporterImproveButton';
const SUGGESTIONS_CONTAINER_ID = 'aiSupporterSuggestionsContainer';
const LOADING_ELEMENT_ID = 'aiSupporterLoading'; // ローディング要素のIDも定義

// --- DOMユーティリティ ---

/**
 * Geminiのプロンプト入力エディタを見つける関数
 * @returns {HTMLElement|null} 見つかったエディタ要素、またはnull
 */
function findPromptEditor() {
  console.log("[AI Supporter][Content] findPromptEditor - Searching...");
  const selectors = [
    'div.ql-editor.new-input-ui:not(.ql-blank)', // 入力がある場合
    'div.ql-editor.new-input-ui.ql-blank',      // 入力が空の場合
    'div.ql-editor[role="textbox"]'             // 一般的なQuillエディタ
  ];

  for (const selector of selectors) {
    const editorDiv = document.querySelector(selector);
    if (editorDiv && editorDiv.hasAttribute('contenteditable')) {
      console.log(`[AI Supporter][Content] findPromptEditor - Found with selector "${selector}":`, editorDiv);
      return editorDiv;
    } else {
      if (editorDiv) {
        console.log(`[AI Supporter][Content] findPromptEditor - Found with selector "${selector}" but not suitable (e.g., not contenteditable).`);
      } else {
        // console.log(`[AI Supporter][Content] findPromptEditor - Not found with selector "${selector}"`);
      }
    }
  }
  
  console.warn("[AI Supporter][Content] findPromptEditor - Prompt editor (contenteditable div) not found after trying all selectors.");
  return null;
}

// --- UI生成・操作関連 ---

/**
 * 改善案表示用のUIコンテナを作成・表示する関数
 * @param {string[]} suggestions - 表示する改善案の文字列配列
 * @param {HTMLElement} mainEditor - メインのプロンプトエディタ要素
 */
function displaySuggestions(suggestions, mainEditor) {
  console.log("[AI Supporter][Content] displaySuggestions - Called with suggestions:", suggestions);
  removeSuggestionsContainer(); // 既存のコンテナがあれば削除

  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.id = SUGGESTIONS_CONTAINER_ID;
  // スタイルはCSSファイル (custom_styles.css) で指定することを推奨
  // ここでは例として残しているが、実際にはCSSクラスを付与してCSS側で管理する
  // suggestionsContainer.style.position = 'fixed'; ... (など)

  const title = document.createElement('h4');
  title.textContent = '改善プロンプト案:';
  suggestionsContainer.appendChild(title);

  if (suggestions && suggestions.length > 0) {
    const ul = document.createElement('ul');
    suggestions.forEach((promptText, index) => {
      const li = document.createElement('li');
      li.textContent = `${index + 1}. ${promptText}`;
      li.onclick = () => {
        if (mainEditor) {
          if (mainEditor.isContentEditable) {
            mainEditor.innerText = promptText;
          } else { // textareaなどの場合
            mainEditor.value = promptText;
          }
          console.log("[AI Supporter][Content] Suggestion selected and applied to main editor:", promptText);
          removeSuggestionsContainer(); // 選択したらコンテナを閉じる
        } else {
          console.warn("[AI Supporter][Content] Main editor not found when trying to apply suggestion.");
          alert("プロンプト入力欄が見つかりませんでした。");
        }
      };
      ul.appendChild(li);
    });
    suggestionsContainer.appendChild(ul);
  } else {
    const p = document.createElement('p');
    p.textContent = '改善案が見つかりませんでした。';
    suggestionsContainer.appendChild(p);
  }
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '× 閉じる';
  closeButton.className = 'ai-supporter-close-button'; // CSSクラスを付与
  closeButton.onclick = removeSuggestionsContainer;
  suggestionsContainer.appendChild(closeButton);

  document.body.appendChild(suggestionsContainer);
  console.log("[AI Supporter][Content] displaySuggestions - Suggestions container displayed.");
}

/**
 * 改善案表示コンテナを削除する関数
 */
function removeSuggestionsContainer() {
  const existingContainer = document.getElementById(SUGGESTIONS_CONTAINER_ID);
  if (existingContainer) {
    existingContainer.remove();
    console.log("[AI Supporter][Content] removeSuggestionsContainer - Suggestions container removed.");
  }
}

/**
 * ローディング表示を管理する関数
 * @param {boolean} show - trueなら表示、falseなら非表示
 * @param {HTMLElement} buttonElement - ローディング状態を反映するボタン要素
 */
function setLoadingState(show, buttonElement) {
  const originalButtonText = '改善案を取得 (v6)'; // ボタンのデフォルトテキスト (バージョン更新)
  const loadingText = '改善案を取得中...';

  if (show) {
    console.log("[AI Supporter][Content] setLoadingState - Showing loading state.");
    if (buttonElement) {
      buttonElement.textContent = loadingText;
      buttonElement.disabled = true;
    }
    // 必要であれば、専用のローディングインジケータ表示処理をここに追加
    // (例: displaySuggestions 内にローディング専用の表示を作るか、
    //  ボタンの隣にスピナーを表示するなど)
  } else {
    console.log("[AI Supporter][Content] setLoadingState - Hiding loading state.");
    if (buttonElement) {
      buttonElement.textContent = originalButtonText;
      buttonElement.disabled = false;
    }
    // ローディングインジケータ非表示処理
  }
}


/**
 * 「改善案を取得」ボタンをページに追加するメインの関数
 */
function addImproveButtonToPage() {
  console.log("[AI Supporter][Content] addImproveButtonToPage - Function called.");

  const promptEditor = findPromptEditor();
  if (!promptEditor) {
    console.warn("[AI Supporter][Content] addImproveButtonToPage - Prompt editor not found, cannot add button.");
    return;
  }
  console.log("[AI Supporter][Content] addImproveButtonToPage - Prompt editor found:", promptEditor);

  if (document.getElementById(BUTTON_ID)) {
    console.log(`[AI Supporter][Content] addImproveButtonToPage - Button with ID '${BUTTON_ID}' already exists. Aborting.`);
    return;
  }
  console.log(`[AI Supporter][Content] addImproveButtonToPage - Button with ID '${BUTTON_ID}' does not exist. Creating new one.`);

  const buttonElement = document.createElement('button');
  buttonElement.id = BUTTON_ID;
  buttonElement.textContent = '改善案を取得 (v6)'; // バージョン更新
  // スタイルはCSSファイル (custom_styles.css) で指定することを推奨
  // buttonElement.style.marginLeft = '10px'; ... (など)
  // 重要なスタイルや、CSSで管理しにくいものはJSで設定しても良い
  buttonElement.classList.add('ai-supporter-button'); // CSSクラスを付与

  console.log("[AI Supporter][Content] addImproveButtonToPage - Button element created:", buttonElement);
  console.log("[AI Supporter][Content] addImproveButtonToPage - Adding click listener to the button.");
  
  buttonElement.addEventListener('click', async () => { // async を追加
    console.log('[AI Supporter][Content] ★★★ Button Click Event Fired (v6) ★★★');
    console.log('[AI Supporter][Content] Clicked button ID:', buttonElement.id);

    // クリック時に再度エディタを探索 (DOMが変化している可能性があるため)
    const currentEditor = findPromptEditor(); 
    if (!currentEditor) {
        console.warn('[AI Supporter][Content] Click Handler - Prompt editor not found on click.');
        alert('エラー: プロンプト入力欄が見つかりません。ページをリロードしてみてください。');
        return;
    }

    let currentPromptText = "";
    if (typeof currentEditor.innerText !== 'undefined') { 
        currentPromptText = currentEditor.innerText;
    } else if (typeof currentEditor.value !== 'undefined') { // フォールバックでtextareaなども考慮
        currentPromptText = currentEditor.value;
    }
    
    if (!currentPromptText || !currentPromptText.trim()) {
      alert('プロンプトが入力されていません。');
      console.log('[AI Supporter][Content] Click Handler - Prompt is empty.');
      return;
    }
    console.log('[AI Supporter][Content] Click Handler - Current prompt text:', `「${currentPromptText.trim()}」`);

    setLoadingState(true, buttonElement); // ローディング開始

    const messagePayload = { 
      action: "improvePrompt", 
      prompt: currentPromptText.trim() 
    };
    console.log('[AI Supporter][Content] Click Handler - Sending message to background:', messagePayload);

    try {
      const response = await chrome.runtime.sendMessage(messagePayload); // Promiseベースで待機
      console.log('[AI Supporter][Content] Click Handler - Received response from background:', response);

      setLoadingState(false, buttonElement); // ローディング終了

      if (chrome.runtime.lastError) { // sendMessage自体が失敗した場合など
        console.error('[AI Supporter][Content] Click Handler - sendMessage failed:', chrome.runtime.lastError.message, chrome.runtime.lastError);
        alert(`エラー: バックグラウンド処理の呼び出しに失敗しました。\n詳細: ${chrome.runtime.lastError.message}`);
        return;
      }

      if (response === undefined) {
        console.warn('[AI Supporter][Content] Click Handler - No response from background (response is undefined).');
        alert('バックグラウンドスクリプトから応答がありませんでした。');
        return;
      }

      if (response.success && response.improved_prompts) {
        console.log('[AI Supporter][Content] Click Handler - Suggestions received:', response.improved_prompts);
        displaySuggestions(response.improved_prompts, currentEditor); // currentEditor を渡す
      } else {
        console.error('[AI Supporter][Content] Click Handler - Error reported from background:', response.error);
        alert(`改善案の取得に失敗しました。\nエラー: ${response.error || "詳細不明"}`);
        if(response.raw_response) {
            console.log('[AI Supporter][Content] Click Handler - Raw response from Gemini (on error):', response.raw_response);
        }
      }
    } catch (error) {
      console.error('[AI Supporter][Content] Click Handler - Error during sendMessage or processing response:', error);
      setLoadingState(false, buttonElement); // エラー時もローディング終了
      alert(`内部エラーが発生しました: ${error.message}`);
    }
  });
  console.log("[AI Supporter][Content] addImproveButtonToPage - Click listener added successfully.");

  // ボタンの挿入ロジック
  let insertionPoint = null;
  let parent = promptEditor.parentElement;
  console.log("[AI Supporter][Content] addImproveButtonToPage - Finding insertion point. Initial parent:", parent);

  for (let i = 0; i < 5 && parent; i++) {
      const sendButton = parent.querySelector('button[aria-label*="送信"], button[data-testid*="send-button"], button[aria-label*="Send message"], button[data-test-id="send-button"]'); // さらにセレクタ追加
      if (sendButton) {
          insertionPoint = sendButton.parentElement; 
          console.log("[AI Supporter][Content] addImproveButtonToPage - Found send button's parent as insertion point:", insertionPoint);
          break;
      }
      // 特定のコンテナクラス名で判断する場合 (サイトの構造に依存)
      const knownContainers = ['input-area-v2__action-buttons', 'send-button-container', 'input-box__buttons', 'chat-input__buttons-container']; // 例
      if (knownContainers.some(cls => parent.classList.contains(cls))) {
          insertionPoint = parent;
          console.log("[AI Supporter][Content] addImproveButtonToPage - Found known container class as insertion point:", insertionPoint);
          break;
      }
      parent = parent.parentElement;
  }
  
  if (insertionPoint) {
    const sendButtonInPoint = insertionPoint.querySelector('button[aria-label*="送信"], button[data-testid*="send-button"], button[aria-label*="Send message"], button[data-test-id="send-button"]');
    if (sendButtonInPoint && sendButtonInPoint.parentElement === insertionPoint) {
        insertionPoint.insertBefore(buttonElement, sendButtonInPoint);
        console.log("[AI Supporter][Content] addImproveButtonToPage - Button inserted before send button.");
    } else {
        insertionPoint.appendChild(buttonElement);
        console.log("[AI Supporter][Content] addImproveButtonToPage - Button appended to found insertion point container.");
    }
  } else if (promptEditor.parentElement) {
      promptEditor.parentElement.appendChild(buttonElement);
      console.log("[AI Supporter][Content] addImproveButtonToPage - Button appended to promptEditor's parentElement (fallback).");
  } else {
    console.warn("[AI Supporter][Content] addImproveButtonToPage - Could not find a suitable place to insert the button.");
  }
  console.log("[AI Supporter][Content] addImproveButtonToPage - Function finished.");
}

// --- 初期化処理 ---

let observer = null; 

/**
 * MutationObserverを開始する関数
 */
function startObserver() {
  if (observer) {
    observer.disconnect();
    console.log("[AI Supporter][Content] startObserver - Disconnected existing observer.");
  }
  observer = new MutationObserver((mutationsList, observerInstance) => {
    // console.log("[AI Supporter][Content] MutationObserver - DOM change detected."); // ログが多すぎる場合はコメントアウト
    if (!document.getElementById(BUTTON_ID)) { // ボタンがまだなければ追加試行
      // console.log("[AI Supporter][Content] MutationObserver - Button not found, attempting to add.");
      if (findPromptEditor()) {
        addImproveButtonToPage();
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  console.log("[AI Supporter][Content] startObserver - MutationObserver started observing document.body.");

  // 初期チェック: 既に要素が存在する場合、またはObserverが間に合わない場合のため
  setTimeout(() => {
    console.log("[AI Supporter][Content] Initial check (1s timeout): Checking if button needs to be added.");
    if (!document.getElementById(BUTTON_ID) && findPromptEditor()) {
      console.log("[AI Supporter][Content] Initial check - Button not found and editor found. Calling addImproveButtonToPage.");
      addImproveButtonToPage();
    } else if (document.getElementById(BUTTON_ID)) {
      // console.log("[AI Supporter][Content] Initial check - Button already exists.");
    } else {
      // console.log("[AI Supporter][Content] Initial check - Button and editor not found.");
    }
  }, 1000); // 1秒待って試す。サイトの読み込み速度によって調整。
}

// 実行開始
if (document.readyState === 'loading') {
  console.log("[AI Supporter][Content] DOM is loading. Adding DOMContentLoaded listener.");
  document.addEventListener('DOMContentLoaded', startObserver);
} else {
  console.log("[AI Supporter][Content] DOM already loaded. Calling startObserver directly.");
  startObserver();
}