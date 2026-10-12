FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

# TEMP-SEED: تشغيل بذور الإنتاج مرة واحدة عند الإقلاع ثم تشغيل الخادم (يُعاد بعد التحقق)
CMD ["sh", "-c", "npm run db:seed && npm run db:seed:admin-team && npm run db:seed:store-demo && npm run db:seed:story-qa && npm run db:seed:marketing && node src/server.js"]
