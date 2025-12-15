# 群晖NAS部署指南

## 前置要求

### 需要安装的群晖套件

1. **Web Station**（必需）
   - 在群晖DSM的"套件中心"搜索并安装 "Web Station"
   - 这是群晖的Web服务器套件，用于托管静态网站
   - 安装后会自动启用Apache或Nginx服务

## 部署步骤

### 1. 安装Web Station

1. 登录群晖DSM管理界面
2. 打开"套件中心"
3. 搜索"Web Station"
4. 点击"安装"并等待安装完成

### 2. 配置虚拟主机

1. 打开已安装的"Web Station"应用
2. 点击"虚拟主机"标签
3. 点击"新增"创建新的虚拟主机
4. 配置如下：
   - **主机名称**：`majgame`（可自定义）
   - **文档根目录**：选择或创建文件夹，例如 `/web/majgame/`
   - **HTTP后端服务器**：选择 Apache 或 Nginx（默认即可）
   - **端口**：使用默认端口（通常是80或8080）
5. 点击"确定"保存配置

### 3. 上传项目文件

1. 使用以下任一方式上传文件到 `/web/majgame/` 目录：
   - **File Station**：通过网页界面上传
   - **FTP/SFTP**：使用FTP客户端上传
   - **SMB共享**：通过Windows/Mac网络共享上传

2. 确保上传以下所有文件和文件夹：
   ```
   majgame/
   ├── index.html
   ├── player-schedule.html
   ├── css/
   │   ├── style.css
   │   └── schedule.css
   └── js/
       ├── app.js
       ├── game.js
       ├── schedule.js
       ├── storage.js
       └── utils.js
   ```

### 4. 设置文件权限

1. 打开"File Station"
2. 找到 `/web/majgame/` 文件夹
3. 右键点击文件夹，选择"属性"
4. 在"权限"标签中，确保Web Station有读取权限
5. 通常Web Station使用 `http` 用户，确保该用户有读取权限

### 5. 访问应用

1. 在浏览器中输入以下地址之一：
   - `http://你的NAS-IP/majgame/`
   - `http://你的NAS-IP:端口/majgame/`
   - 如果配置了域名：`http://你的域名/majgame/`

2. 首次访问会自动初始化8位默认选手

## 可选配置

### 配置HTTPS（推荐）

1. 在Web Station中配置SSL证书
2. 可以通过Let's Encrypt免费获取证书
3. 配置后使用 `https://` 访问

### 配置域名

1. 在Web Station的虚拟主机设置中配置域名
2. 确保DNS解析指向你的NAS IP
3. 使用域名访问更便捷

## 数据管理

### 数据存储位置

- 数据存储在浏览器的 **LocalStorage** 中
- 每个设备/浏览器独立存储
- 换设备需要重新填写

### 数据备份

1. 使用应用内的"导出数据"功能
2. 导出的JSON文件可以保存到NAS
3. 需要时使用"导入数据"功能恢复

### 数据重置

- 使用应用内的"重置比赛"功能
- 或清除浏览器LocalStorage

## 故障排查

### 无法访问

1. 检查Web Station是否已启动
2. 检查文件是否已正确上传
3. 检查文件权限设置
4. 检查防火墙设置

### 页面显示异常

1. 检查浏览器控制台是否有错误
2. 确认所有文件都已上传
3. 清除浏览器缓存后重试

### 数据丢失

- LocalStorage数据在清除浏览器数据时会丢失
- 建议定期使用"导出数据"功能备份

## 技术支持

如遇到问题，请检查：
1. Web Station服务状态
2. 文件权限设置
3. 浏览器控制台错误信息
4. 网络连接状态

