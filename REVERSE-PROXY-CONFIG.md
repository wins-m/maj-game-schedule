# 群晖Web Station反向代理配置详细指南

## 概述

通过配置反向代理，可以让用户通过标准的HTTP端口（80/443）访问应用，而不需要记住端口号1414。

## 配置方法

### 方法1：通过Web Station图形界面配置（推荐）

#### 步骤1：打开Web Station

1. 登录群晖DSM管理界面
2. 打开"套件中心"，确保已安装"Web Station"
3. 打开"Web Station"应用

#### 步骤2：创建虚拟主机

1. 在Web Station中，点击"虚拟主机"标签
2. 点击"新增"按钮
3. 填写配置信息：

   **基本信息：**
   - **主机名称**：`majgame`（可自定义，建议使用英文）
   - **端口**：`80`（HTTP）或 `443`（HTTPS，需要SSL证书）
   - **文档根目录**：`/web/majgame`（你的项目文件所在目录）

   **HTTP后端服务器：**
   - 选择"反向代理服务器"或"Node.js"
   - 如果选择"反向代理服务器"，继续下一步配置

#### 步骤3：配置反向代理

1. 在虚拟主机编辑页面，找到"反向代理"或"Proxy"设置区域
2. 点击"新增反向代理"或"添加代理规则"
3. 配置代理规则：

   **代理规则配置：**
   ```
   源路径：/（根路径，匹配所有请求）
   目标协议：http
   目标主机：localhost（或127.0.0.1）
   目标端口：1414
   目标路径：/（保持原路径）
   ```

   **高级选项（可选）：**
   - **保留主机头**：是（推荐）
   - **保留原始请求**：是（推荐）
   - **WebSocket支持**：否（本应用不需要）

4. 点击"确定"保存配置

#### 步骤4：保存并应用

1. 点击虚拟主机配置页面的"确定"或"应用"按钮
2. 等待配置生效（可能需要几秒钟）
3. 如果配置不生效，可以尝试重启Web Station服务

#### 步骤5：测试访问

1. 确保Node.js服务器正在运行（端口1414）
2. 在浏览器中访问：`http://你的NAS-IP/majgame/`
3. 应该能看到应用正常加载

### 方法2：手动编辑Nginx配置文件（高级）

如果Web Station使用Nginx作为后端服务器，也可以直接编辑配置文件：

#### 步骤1：找到Nginx配置目录

通常位于：`/usr/local/etc/nginx/conf.d/` 或 `/etc/nginx/conf.d/`

#### 步骤2：创建配置文件

创建文件：`/usr/local/etc/nginx/conf.d/majgame.conf`

内容如下：

```nginx
server {
    listen 80;
    server_name _;  # 或你的域名
    
    location /majgame/ {
        proxy_pass http://localhost:1414/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 支持WebSocket（如果需要）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### 步骤3：重载Nginx配置

```bash
sudo nginx -t  # 测试配置
sudo nginx -s reload  # 重载配置
```

### 方法3：使用Apache配置（如果使用Apache）

如果Web Station使用Apache，编辑Apache配置文件：

```apache
<VirtualHost *:80>
    ServerName your-nas-ip
    DocumentRoot /web/majgame
    
    ProxyPreserveHost On
    ProxyPass /majgame/ http://localhost:1414/
    ProxyPassReverse /majgame/ http://localhost:1414/
</VirtualHost>
```

## 配置示例

### 示例1：使用子路径访问

**访问地址**：`http://192.168.1.100/majgame/`

**反向代理配置：**
- 源路径：`/majgame/`
- 目标URL：`http://localhost:1414/`

### 示例2：使用根路径访问

**访问地址**：`http://192.168.1.100/`

**反向代理配置：**
- 源路径：`/`
- 目标URL：`http://localhost:1414/`

**注意**：这种方式需要将应用设置为默认虚拟主机。

### 示例3：使用自定义端口

**访问地址**：`http://192.168.1.100:8080/majgame/`

**虚拟主机配置：**
- 端口：`8080`
- 反向代理目标：`http://localhost:1414/`

## 常见问题

### Q1: 配置后无法访问，显示502错误

**原因**：Node.js服务器未运行或端口不正确

**解决方法**：
1. 检查Node.js服务器是否运行：`ps aux | grep node`
2. 检查端口1414是否监听：`netstat -tuln | grep 1414`
3. 重启Node.js服务器

### Q2: 配置后显示404错误

**原因**：反向代理路径配置不正确

**解决方法**：
1. 检查源路径和目标路径是否匹配
2. 确保目标URL末尾有斜杠（`/`）
3. 检查文档根目录是否正确

### Q3: 静态资源（CSS/JS）无法加载

**原因**：路径重写问题

**解决方法**：
1. 确保反向代理配置中保留了原始路径
2. 检查静态文件的路径是否正确
3. 在浏览器开发者工具中查看资源加载错误

### Q4: API请求失败

**原因**：API路径被错误代理

**解决方法**：
1. 确保API路径（`/api/*`）也被正确代理
2. 检查服务器日志，查看请求是否到达Node.js服务器

## 验证配置

### 检查反向代理是否生效

1. **查看Web Station日志**
   - 在Web Station中查看访问日志
   - 确认请求被正确转发

2. **测试API端点**
   - 访问：`http://你的NAS-IP/majgame/api/players`
   - 应该返回JSON数据

3. **检查浏览器网络请求**
   - 打开浏览器开发者工具（F12）
   - 查看Network标签
   - 确认请求路径正确

## 安全建议

1. **使用HTTPS**：配置SSL证书，使用HTTPS访问
2. **访问控制**：通过群晖的用户权限系统限制访问
3. **防火墙**：只开放必要的端口
4. **定期更新**：保持系统和套件更新

## 总结

配置反向代理后，用户可以：
- 通过标准HTTP端口访问（无需记住1414端口）
- 使用域名访问（如果配置了DNS）
- 使用HTTPS加密访问（如果配置了SSL）

推荐使用**方法1（Web Station图形界面）**，最简单且不容易出错。

