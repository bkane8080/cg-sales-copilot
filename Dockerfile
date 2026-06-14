FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY apps/field-sales/package.json apps/field-sales/package-lock.json ./
RUN npm ci
COPY apps/field-sales/ ./
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --production
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./frontend/build
EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "server.js"]
