# 使用官方 Node.js 镜像作为基础镜像
FROM node:22-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有源代码（包括 .env 文件）
COPY . .

# 构建应用
RUN npm run build


# 启动应用
CMD ["npm", "start"] 