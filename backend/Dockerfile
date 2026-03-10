FROM node:24-alpine AS base

WORKDIR /app

COPY package.json .yarnrc.yml yarn.lock ./
COPY backend/ ./backend/
COPY client/package.json ./client/
RUN corepack enable && yarn install --immutable

RUN yarn workspace obr-initiative-tracker-4d-backend build

FROM base

RUN yarn workspaces focus obr-initiative-tracker-4d-backend --production && yarn cache clean

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

USER appuser

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
