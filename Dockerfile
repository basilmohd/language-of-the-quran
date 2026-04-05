FROM node:22.12.0-alpine

WORKDIR /app

# Install build dependencies required by Prisma
RUN apk add --no-cache python3 make g++ && echo "✓ Build dependencies installed"

# Copy package manifests for all workspaces
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY libs/api-types/package.json ./libs/api-types/
COPY libs/content/package.json ./libs/content/
COPY libs/db/package.json ./libs/db/
COPY libs/quran-data/package.json ./libs/quran-data/
COPY libs/srs/package.json ./libs/srs/
RUN echo "✓ Package manifests copied"

# Install all dependencies
RUN echo "→ Starting npm install..." && npm i && echo "✓ Dependencies installed successfully"

# Copy the rest of the source
COPY . .
RUN echo "✓ Source code copied"

# Generate Prisma client before build
RUN echo "→ Generating Prisma client..." && npm run prisma:generate && echo "✓ Prisma client generated"

# Build the API for production
RUN echo "→ Building API for production..." && npm exec nx run @org/api:build:production && echo "✓ API build completed"

EXPOSE 3001

CMD ["node", "apps/api/dist/apps/api/src/main.js"]
