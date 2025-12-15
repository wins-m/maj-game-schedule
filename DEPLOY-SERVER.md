# 群晖NAS部署指南 - 服务器端版本

## 概述

本版本使用服务器端存储，数据保存在NAS上，支持多设备、多浏览器同步访问。

## 前置要求

### 需要安装的群晖套件

1. **Docker**（推荐）或 **Node.js** 套件
   - Docker方式：安装"Container Manager"（原Docker套件）
   - Node.js方式：安装"Node.js v18"套件

## 部署方式

### 方式1：Docker部署（推荐）

#### 1. 准备文件

将所有项目文件上传到群晖NAS的某个目录，例如 `/docker/majgame/`

#### 2. 安装依赖

在群晖NAS的SSH终端或通过File Station，进入项目目录的 `server` 文件夹，执行：

```bash
cd /docker/majgame/server
npm install
```

或者如果使用Docker，可以跳过此步骤（Docker会自动安装）。

#### 3. Docker部署

**方法A：使用Docker Compose（推荐）**

1. 在群晖的Container Manager中，选择"项目"标签
2. 点击"新增" -> "从文件创建"
3. 选择项目目录中的 `docker-compose.yml` 文件
4. 配置项目名称（如 `majgame`）
5. 点击"创建"并启动

**方法B：使用Docker命令**

```bash
cd /docker/majgame
docker build -t majgame .
docker run -d \
  --name majgame \
  -p 3000:3000 \
  -v /docker/majgame/server/data:/app/server/data \
  -v /docker/majgame/index.html:/app/index.html \
  -v /docker/majgame/player-schedule.html:/app/player-schedule.html \
  -v /docker/majgame/css:/app/css \
  -v /docker/majgame/js:/app/js \
  --restart unless-stopped \
  majgame
```

#### 4. 访问应用

- 通过 `http://你的NAS-IP:1414` 访问
- 或配置反向代理，使用自定义端口/域名

### 方式2：Node.js套件部署

#### 1. 安装Node.js套件

在套件中心安装"Node.js v18"

#### 2. 上传文件

将所有项目文件上传到 `/web/majgame/` 目录

#### 3. 安装依赖

通过SSH连接到NAS，执行：

```bash
cd /web/majgame/server
npm install --production
```

#### 4. 配置启动脚本

创建启动脚本 `/web/majgame/start.sh`：

```bash
#!/bin/sh
cd /web/majgame/server
/usr/local/bin/node app.js
```

设置执行权限：

```bash
chmod +x /web/majgame/start.sh
```

#### 5. 启动服务器

**方法A：直接运行（仅用于测试，不推荐生产环境）**

```bash
cd /web/majgame/server
sudo node app.js
```

**注意**：此方法在关闭SSH连接后进程会停止，不适用于生产环境。

**方法B：使用PM2管理进程（推荐，生产环境）**

PM2是Node.js进程管理器，可以确保进程在SSH关闭后持续运行，并支持自动重启和开机自启。

**步骤1：安装PM2**

```bash
sudo npm install -g pm2
```

**步骤2：启动应用**

```bash
cd /web/majgame/server
sudo pm2 start app.js --name majgame
```

**步骤3：保存进程列表**

保存当前运行的进程列表，以便系统重启后自动恢复：

```bash
sudo pm2 save
```

**步骤4：配置开机自启**

配置PM2在系统启动时自动启动应用：

```bash
sudo pm2 startup
```

执行此命令后，PM2会显示一个需要以root权限执行的命令，类似：

```bash
sudo env PATH=$PATH:/usr/local/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u 你的用户名 --hp /home/你的用户名
```

**请复制并执行显示的命令**，这样PM2就会在系统启动时自动运行。

**步骤5：验证进程运行**

```bash
# 查看所有PM2管理的进程
sudo pm2 list

# 查看应用日志
sudo pm2 logs majgame

# 查看进程详细信息
sudo pm2 info majgame
```

**常用PM2管理命令：**

```bash
# 停止应用
sudo pm2 stop majgame

# 重启应用
sudo pm2 restart majgame

# 删除应用（从PM2列表中移除）
sudo pm2 delete majgame

# 查看实时日志
sudo pm2 logs majgame --lines 50

# 监控面板（显示CPU、内存使用情况）
sudo pm2 monit

# 重新加载应用（零停机重启）
sudo pm2 reload majgame

# 查看所有进程状态
sudo pm2 status
```

**验证进程持久化：**

1. 使用PM2启动应用后，关闭SSH连接
2. 重新SSH连接到NAS
3. 执行 `sudo pm2 list`，应该能看到 `majgame` 进程仍在运行
4. 访问应用，确认功能正常

**故障排查：**

如果进程在SSH关闭后停止：
1. 确认执行了 `sudo pm2 save`
2. 确认执行了 `sudo pm2 startup` 并执行了显示的配置命令
3. 检查PM2日志：`sudo pm2 logs majgame`
4. 查看系统日志：`sudo journalctl -u pm2-你的用户名`

#### 6. 访问应用

**方式A：直接访问（推荐，简单）**
- 通过 `http://你的NAS-IP:1414` 访问
- 例如：`http://192.168.1.100:1414`
- 优点：配置简单，无需额外设置
- 缺点：需要记住端口号

**方式B：通过Web Station反向代理（推荐，专业）**
配置后可以通过 `http://你的NAS-IP/majgame/` 访问（无需端口号）

**配置步骤：**

1. **打开Web Station**
   - 登录DSM管理界面
   - 打开"Web Station"应用

2. **创建虚拟主机**
   - 点击"虚拟主机"标签
   - 点击"新增"按钮
   - 配置如下：
     - **主机名称**：`majgame`（可自定义）
     - **文档根目录**：`/web/majgame`（项目文件所在目录）
     - **HTTP后端服务器**：选择 `Node.js` 或 `反向代理服务器`
     - **端口**：80（默认）或自定义端口

3. **配置反向代理**
   - 在虚拟主机列表中，找到刚创建的 `majgame`
   - 点击"编辑"或"设置"
   - 找到"反向代理"或"Proxy"设置
   - 配置如下：
     - **目标URL**：`http://localhost:1414`
     - **目标路径**：`/`（根路径）
     - **保留主机头**：是（推荐）
     - **保留原始请求**：是（推荐）

4. **保存配置**
   - 点击"确定"或"应用"保存配置

5. **访问应用**
   - 通过 `http://你的NAS-IP/majgame/` 访问
   - 或配置域名后通过 `http://你的域名/majgame/` 访问

**注意事项：**
- 确保Node.js服务器正在运行（端口1414）
- 如果使用自定义端口，需要在防火墙中开放该端口
- 反向代理配置可能需要重启Web Station服务才能生效

## 数据存储

### 数据位置

数据文件存储在 `server/data/` 目录下：
- `players.json` - 选手数据
- `games.json` - 比赛数据
- `schedules.json` - 时间表数据
- `current-round.json` - 当前场次

### 数据备份

定期备份 `server/data/` 目录即可，建议：
1. 使用群晖的备份工具定期备份
2. 或使用导出功能导出JSON文件

## 配置说明

### 端口配置

默认端口为 `1414`，可以在以下位置修改：

- **Docker方式**：修改 `docker-compose.yml` 中的端口映射
- **Node.js方式**：设置环境变量 `PORT=1414`，或修改 `server/app.js` 中的端口号

### 数据目录权限

确保Node.js进程有读写 `server/data/` 目录的权限：

```bash
chmod -R 755 /docker/majgame/server/data
# 或
chmod -R 755 /web/majgame/server/data
```

## 故障排查

### 无法访问

1. **检查容器/进程是否运行**
   - Docker方式：在Container Manager中查看容器状态
   - Node.js方式：执行 `sudo pm2 list` 查看进程状态
   - 或执行 `sudo ps aux | grep "node app.js"` 查看进程

2. **检查端口是否被占用**
   ```bash
   sudo netstat -tuln | grep 1414
   # 或
   sudo lsof -i :1414
   ```

3. **检查防火墙设置**
   - 在DSM的"控制面板" -> "安全性" -> "防火墙"中，确保端口1414已开放

4. **查看日志**
   - Docker方式：`sudo docker logs majgame`
   - PM2方式：`sudo pm2 logs majgame`
   - 查看最近50行日志：`sudo pm2 logs majgame --lines 50`

### 数据无法保存

1. 检查 `server/data/` 目录权限
2. 检查磁盘空间
3. 查看服务器日志

### 跨设备数据不同步

1. 确认所有设备访问的是同一个服务器地址
2. 检查浏览器缓存，尝试强制刷新（Ctrl+F5）
3. 查看服务器日志确认API请求是否成功

## 升级说明

### 从LocalStorage版本升级

1. 导出旧版本的数据（使用导出功能）
2. 部署新版本服务器
3. 使用导入功能导入数据

## 安全建议

1. **配置HTTPS**：使用Let's Encrypt免费证书
2. **访问控制**：通过群晖的用户权限系统限制访问
3. **定期备份**：设置自动备份任务
4. **防火墙**：只开放必要的端口

## 技术支持

如遇到问题，请检查：
1. 服务器日志
2. 浏览器控制台错误
3. 网络连接状态
4. 文件权限设置

