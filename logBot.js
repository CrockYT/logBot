const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('./config.json');
const LogSearcher = require('./search.js');

let lastLine = '';
let sentMessages = new Set();

function checkLogFile() {
    const filePath = path.join(__dirname, config.logFilePath);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) throw err;

        const lines = data.split('\n');
        const newLines = lastLine ? lines.slice(lines.indexOf(lastLine) + 1) : lines;

        if (newLines.length > 0) {
            lastLine = lines[lines.length - 2];

            // LogSearcherでログを検索・フィルタリング
            const logSearcher = new LogSearcher(newLines);

            // 特定のログメッセージを検索
            const searchPatterns = [
                'For help, type "help"',  // サーバー起動ログの例
                'joined the game',        // プレイヤー参加ログ
                'left the game',          // プレイヤー退出ログ
                'Stopping the server',    // サーバー終了ログ
                'ERROR'                   // エラーログ
            ];

            const patternResults = logSearcher.searchByPatterns(searchPatterns);

            // 検索結果をDiscordに送信
            Object.keys(patternResults).forEach(pattern => {
                patternResults[pattern].forEach(line => {
                    if (!sentMessages.has(line)) {
                        let title = '';
                        if (pattern.includes('For help')) {
                            title = 'サーバーが起動しました';
                        } else if (pattern.includes('joined the game')) {
                            title = 'プレイヤーが参加しました';
                        } else if (pattern.includes('left the game')) {
                            title = 'プレイヤーが退出しました';
                        } else if (pattern.includes('Stopping the server')) {
                            title = 'サーバーが終了しました';
                        } else if (pattern.includes('ERROR')) {
                            title = 'エラーが発生しました';
                        }
                        sendToDiscord(line, title);
                        sentMessages.add(line);
                    }
                });
            });
        }
    });
}

function sendToDiscord(message, title) {
    const embed = {
        title: title,
        description: message,
        color: 3066993 // 青色
    };

    return axios.post(config.webhookURL, {
        embeds: [embed]
    })
    .then(response => {
        console.log('Embed message sent to Discord:', response.data);
    })
    .catch(error => {
        console.error('Error sending embed message to Discord:', error);
    });
}

// 初回実行時に監視開始メッセージを送信
function startMonitoring() {
    const filePath = path.join(__dirname, config.logFilePath);
    const message = `監視を開始しました。監視ファイル: ${filePath}`;

    sendToDiscord(message, '監視開始');

    // 初回実行とその後の定期実行
    checkLogFile();
    setInterval(checkLogFile, config.checkInterval);
}

// プロセス終了時に監視終了メッセージを送信
function endMonitoring() {
    const message = '監視を終了しました。';

    sendToDiscord(message, '監視終了').then(() => {
        process.exit();
    });
}

// 終了時のハンドラを設定
process.on('SIGINT', () => {
    endMonitoring();
});

process.on('SIGTERM', () => {
    endMonitoring();
});

// 監視開始
startMonitoring();
