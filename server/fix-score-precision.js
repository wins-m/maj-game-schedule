/**
 * 修复现有选手数据中的浮点数精度问题
 * 将所有分数格式化为一位小数精度
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');

async function fixScorePrecision() {
    try {
        console.log('开始修复选手数据中的分数精度问题...');

        // 读取选手数据
        const playersData = await fs.readFile(PLAYERS_FILE, 'utf8');
        const players = JSON.parse(playersData);

        let fixedCount = 0;

        // 修复每个选手的分数数据
        players.forEach(player => {
            // 修复总分
            const originalTotalScore = player.totalScore;
            const fixedTotalScore = parseFloat(player.totalScore.toFixed(1));

            if (originalTotalScore !== fixedTotalScore) {
                player.totalScore = fixedTotalScore;
                fixedCount++;
                console.log(`修复选手 ${player.name} 的总分: ${originalTotalScore} -> ${fixedTotalScore}`);
            }

            // 修复每场分数
            if (player.scores && Array.isArray(player.scores)) {
                player.scores = player.scores.map(score => {
                    const originalScore = score;
                    const fixedScore = parseFloat(score.toFixed(1));

                    if (originalScore !== fixedScore) {
                        console.log(`修复选手 ${player.name} 的场次分数: ${originalScore} -> ${fixedScore}`);
                        return fixedScore;
                    }
                    return score;
                });
            }
        });

        if (fixedCount > 0) {
            // 保存修复后的数据
            await fs.writeFile(PLAYERS_FILE, JSON.stringify(players, null, 2), 'utf8');
            console.log(`成功修复了 ${fixedCount} 个选手的分数精度问题`);
        } else {
            console.log('没有发现需要修复的精度问题');
        }

    } catch (error) {
        console.error('修复分数精度时出错:', error);
        process.exit(1);
    }
}

// 如果直接运行此脚本，则执行修复
if (require.main === module) {
    fixScorePrecision();
}

module.exports = { fixScorePrecision };
