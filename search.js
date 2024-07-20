class LogSearcher {
    constructor(logData) {
        this.logData = logData;
    }

    // ログから複数の正規表現パターンにマッチする行を取得
    searchByPatterns(patterns) {
        const results = {};
        patterns.forEach(pattern => {
            results[pattern] = this.logData.filter(line => new RegExp(pattern).test(line));
        });
        return results;
    }

    // MCIDごとにログをグループ化
    groupByMCID() {
        const mcidGroups = {};
        this.logData.forEach(line => {
            const mcid = this.extractMCID(line);
            if (mcid) {
                if (!mcidGroups[mcid]) {
                    mcidGroups[mcid] = [];
                }
                mcidGroups[mcid].push(line);
            }
        });
        return mcidGroups;
    }

    // 時間ごとにログをグループ化
    groupByTime() {
        const timeGroups = {};
        this.logData.forEach(line => {
            const time = this.extractTime(line);
            if (time) {
                if (!timeGroups[time]) {
                    timeGroups[time] = [];
                }
                timeGroups[time].push(line);
            }
        });
        return timeGroups;
    }

    // 行からMCIDを抽出するヘルパー関数（具体的なパターンに応じて修正）
    extractMCID(line) {
        const match = line.match(/\[MCID:([^\]]+)\]/); // 例: [MCID:username]
        return match ? match[1] : null;
    }

    // 行から時間を抽出するヘルパー関数（具体的なパターンに応じて修正）
    extractTime(line) {
        const match = line.match(/\[([0-9:]+)\]/); // 例: [12:34:56]
        return match ? match[1] : null;
    }
}

module.exports = LogSearcher;
