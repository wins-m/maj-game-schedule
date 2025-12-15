/**
 * 麻将比赛管理系统 - 后端服务器
 * Node.js + Express
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 1414;
const DATA_DIR = path.join(__dirname, 'data');

// 中间件
app.use(cors());
app.use(express.json());

// 确保数据目录存在
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        console.error('创建数据目录失败:', error);
    }
}

// 读取数据文件
async function readDataFile(filename) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // 文件不存在，返回默认值
            return null;
        }
        throw error;
    }
}

// 写入数据文件
async function writeDataFile(filename, data) {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ========== API 路由 ==========

// 获取所有选手
app.get('/api/players', async (req, res) => {
    try {
        const players = await readDataFile('players.json');
        res.json(players || []);
    } catch (error) {
        console.error('读取选手数据失败:', error);
        res.status(500).json({ error: '读取数据失败' });
    }
});

// 保存所有选手
app.post('/api/players', async (req, res) => {
    try {
        await writeDataFile('players.json', req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('保存选手数据失败:', error);
        res.status(500).json({ error: '保存数据失败' });
    }
});

// 获取所有比赛
app.get('/api/games', async (req, res) => {
    try {
        const games = await readDataFile('games.json');
        res.json(games || []);
    } catch (error) {
        console.error('读取比赛数据失败:', error);
        res.status(500).json({ error: '读取数据失败' });
    }
});

// 保存所有比赛
app.post('/api/games', async (req, res) => {
    try {
        await writeDataFile('games.json', req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('保存比赛数据失败:', error);
        res.status(500).json({ error: '保存数据失败' });
    }
});

// 获取所有时间表
app.get('/api/schedules', async (req, res) => {
    try {
        const schedules = await readDataFile('schedules.json');
        res.json(schedules || []);
    } catch (error) {
        console.error('读取时间表数据失败:', error);
        res.status(500).json({ error: '读取数据失败' });
    }
});

// 保存所有时间表
app.post('/api/schedules', async (req, res) => {
    try {
        await writeDataFile('schedules.json', req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('保存时间表数据失败:', error);
        res.status(500).json({ error: '保存数据失败' });
    }
});

// 获取当前场次
app.get('/api/current-round', async (req, res) => {
    try {
        const currentRound = await readDataFile('current-round.json');
        res.json({ round: currentRound || 1 });
    } catch (error) {
        console.error('读取当前场次失败:', error);
        res.status(500).json({ error: '读取数据失败' });
    }
});

// 保存当前场次
app.post('/api/current-round', async (req, res) => {
    try {
        await writeDataFile('current-round.json', req.body.round);
        res.json({ success: true });
    } catch (error) {
        console.error('保存当前场次失败:', error);
        res.status(500).json({ error: '保存数据失败' });
    }
});

// 导出所有数据
app.get('/api/export', async (req, res) => {
    try {
        const players = await readDataFile('players.json') || [];
        const games = await readDataFile('games.json') || [];
        const schedules = await readDataFile('schedules.json') || [];
        const currentRound = await readDataFile('current-round.json') || 1;
        
        const exportData = {
            players,
            games,
            schedules,
            currentRound,
            exportTime: new Date().toISOString()
        };
        
        res.json(exportData);
    } catch (error) {
        console.error('导出数据失败:', error);
        res.status(500).json({ error: '导出数据失败' });
    }
});

// 导入所有数据
app.post('/api/import', async (req, res) => {
    try {
        const data = req.body;
        
        if (data.players) {
            await writeDataFile('players.json', data.players);
        }
        if (data.games) {
            await writeDataFile('games.json', data.games);
        }
        if (data.schedules) {
            await writeDataFile('schedules.json', data.schedules);
        }
        if (data.currentRound) {
            await writeDataFile('current-round.json', data.currentRound);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('导入数据失败:', error);
        res.status(500).json({ error: '导入数据失败' });
    }
});

// 重置所有数据
app.post('/api/reset', async (req, res) => {
    try {
        const files = ['players.json', 'games.json', 'schedules.json', 'current-round.json'];
        for (const file of files) {
            try {
                await fs.unlink(path.join(DATA_DIR, file));
            } catch (error) {
                // 文件不存在，忽略错误
            }
        }
        res.json({ success: true });
    } catch (error) {
        console.error('重置数据失败:', error);
        res.status(500).json({ error: '重置数据失败' });
    }
});

// 保存时间表备份文件
app.post('/api/backup-schedule', async (req, res) => {
    try {
        const backupData = req.body;
        
        // 确保数据目录存在
        await ensureDataDir();
        
        // 生成文件名：时间表备份_YYYY-MM-DD_HH-mm-ss.json
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        const filename = `schedule-backup_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.json`;
        const filePath = path.join(DATA_DIR, filename);
        
        // 保存备份文件
        await fs.writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf8');
        
        console.log(`时间表备份已保存: ${filename}`);
        res.json({ 
            success: true, 
            filename: filename,
            message: '备份文件已保存到服务器'
        });
    } catch (error) {
        console.error('保存备份文件失败:', error);
        res.status(500).json({ 
            success: false,
            error: '保存备份文件失败',
            details: error.message 
        });
    }
});

// 静态文件服务（放在最后，作为fallback）
app.use(express.static(path.join(__dirname, '../')));

// 启动服务器
async function startServer() {
    await ensureDataDir();
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
        console.log(`本地访问: http://localhost:${PORT}`);
        console.log(`数据目录: ${DATA_DIR}`);
        console.log(`静态文件目录: ${path.join(__dirname, '../')}`);
    });
}

startServer();

