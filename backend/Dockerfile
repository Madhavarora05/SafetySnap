# Backend Dockerfile
FROM node:18-alpine

# Install system dependencies for canvas and sharp
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build process)
RUN npm install

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads
RUN mkdir -p data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]