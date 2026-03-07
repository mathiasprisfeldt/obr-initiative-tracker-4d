FROM node:24-alpine

WORKDIR /app

COPY package.json yarn.lock* .yarnrc.yml ./
RUN corepack enable && yarn install --immutable

COPY dist/ ./dist/

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p /app/data && chown appuser:appgroup /app/data

USER appuser

ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
