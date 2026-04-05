FROM node:22.12.0-alpine

WORKDIR /app

# Install build dependencies required by Prisma
RUN apk add --no-cache python3 make g++

# Copy package manifests for all workspaces
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY libs/api-types/package.json ./libs/api-types/
COPY libs/content/package.json ./libs/content/
COPY libs/db/package.json ./libs/db/
COPY libs/quran-data/package.json ./libs/quran-data/
COPY libs/srs/package.json ./libs/srs/

# Install all dependencies
RUN npm ci

# Copy the rest of the source
COPY . .

# Build the API for production
RUN npm exec nx run @org/api:build:production

EXPOSE 3001

CMD ["node", "apps/api/dist/apps/api/src/main.js"]
