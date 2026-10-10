FROM node:22-alpine AS base

WORKDIR /usr/src/app


FROM base AS dependencies

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci


FROM dependencies AS development

ENV NODE_ENV=development

COPY . .

USER node

EXPOSE 3048

CMD ["npm", "run", "start:dev"]


FROM dependencies AS builder

COPY . .

RUN npm run build

RUN npm prune --omit=dev


FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN chown -R node:node /usr/src/app

USER node

COPY --chown=node:node --from=builder /usr/src/app/package*.json ./
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

EXPOSE 3048

CMD ["node", "dist/main.js"]
