FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
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
COPY --from=build /app/uploads ./uploads
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/tsconfig.json /app/tsconfig.server.json ./
COPY --from=build /app/.env ./.env
EXPOSE 3000
CMD ["sh", "-c", "npm run db:push && npx tsx db/seed.ts && npm start"]
