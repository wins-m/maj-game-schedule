FROM node:18-alpine

WORKDIR /app

# 复制package.json并安装依赖
COPY server/package.json ./server/
RUN cd server && npm install --production

# 复制服务器代码
COPY server/app.js ./server/

# 复制前端文件
COPY index.html .
COPY player-schedule.html .
COPY css ./css
COPY js ./js

# 创建数据目录
RUN mkdir -p /app/server/data

# 暴露端口
EXPOSE 1414

# 启动服务器
CMD ["node", "server/app.js"]

