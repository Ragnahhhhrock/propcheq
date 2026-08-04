FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Vite inlines VITE_* vars at build time; Railway passes service variables as build args
ARG VITE_APP_ID
ARG VITE_KIMI_AUTH_URL
ENV VITE_APP_ID=$VITE_APP_ID VITE_KIMI_AUTH_URL=$VITE_KIMI_AUTH_URL
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/api ./api
COPY --from=build /app/db ./db
COPY --from=build /app/contracts ./contracts
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/tsconfig.json /app/tsconfig.server.json ./
# uploads/ and .env are intentionally not copied: uploads/ is git-ignored and
# created at runtime; env vars come from the host (Railway), not a file.
EXPOSE 3000
CMD ["sh", "-c", "npm run db:push && npx tsx db/seed.ts && npm start"]
