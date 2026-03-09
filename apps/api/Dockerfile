FROM node:20-alpine

WORKDIR /app

# 安裝系統相依套件 (Prisma 需要)
RUN apk add --no-cache openssl

# 複製 package.json 和 lock 檔案
COPY package.json package-lock.json* ./

# 安裝依賴
RUN npm ci || npm install

# 複製 Prisma schema
COPY prisma ./prisma/

# 產生 Prisma Client
RUN npx prisma generate

# 複製原始碼
COPY . .

# 建置
RUN npm run build

# 暴露埠
EXPOSE 3000

# 啟動
CMD ["npm", "start"]
