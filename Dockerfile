FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD sh -c "npx prisma db push && node dist/index.js"
