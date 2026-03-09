FROM node:24-alpine

WORKDIR /app

COPY package.json yarn.lock* .yarnrc.yml ./
RUN corepack enable && yarn install --immutable

COPY dist/ ./dist/

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

USER appuser

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
