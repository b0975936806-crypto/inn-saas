FROM node:20-alpine

WORKDIR /app

# 複製 package.json 和 lock 檔案
COPY package.json package-lock.json* ./

# 安裝依賴
RUN npm ci || npm install

# 複製原始碼
COPY . .

# 建置
RUN npm run build

# 暴露埠
EXPOSE 3000

# 啟動
CMD ["npm", "start"]
