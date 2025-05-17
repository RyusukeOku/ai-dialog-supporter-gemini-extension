document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyButton = document.getElementById('saveApiKeyButton');
    const statusDiv = document.getElementById('status');
    const currentApiKeyDisplay = document.getElementById('currentApiKeyDisplay');

    // ポップアップ表示時に保存されているAPIキーを読み込んで表示（末尾のみ）
    chrome.storage.sync.get(['geminiApiKey'], function(result) {
        if (result.geminiApiKey) {
            // apiKeyInput.value = result.geminiApiKey; // フルで表示する場合はこちら
            currentApiKeyDisplay.textContent = `...${result.geminiApiKey.slice(-5)}`;
            console.log('APIキーが読み込まれました。');
        } else {
            currentApiKeyDisplay.textContent = '未設定';
            console.log('APIキーはまだ保存されていません。');
        }
    });

    // 保存ボタンがクリックされたときの処理
    saveApiKeyButton.addEventListener('click', function() {
        const apiKey = apiKeyInput.value;
        if (apiKey && apiKey.trim() !== '') {
            chrome.storage.sync.set({ 'geminiApiKey': apiKey }, function() {
                statusDiv.textContent = 'APIキーが保存されました！';
                currentApiKeyDisplay.textContent = `...${apiKey.slice(-5)}`;
                apiKeyInput.value = ''; // 入力欄をクリア
                console.log('APIキーを保存しました。');
                setTimeout(() => {
                    statusDiv.textContent = '';
                }, 2000); // 2秒後にメッセージを消す
            });
        } else {
            statusDiv.textContent = 'APIキーを入力してください。';
            statusDiv.style.color = 'red';
             setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.style.color = 'green'; // 色を戻す
            }, 2000);
        }
    });
});