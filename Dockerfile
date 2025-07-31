# ---- Stage 1: Build ----
# Use a Node.js image that includes build tools
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the SvelteKit application for production
# This is the line you are replacing.
RUN --mount=type=secret,id=env_secret \
    set -a && . /run/secrets/env_secret && set +a && npm run build


# ---- Stage 2: Production ----
# Use a lightweight Node.js image for the final container
FROM node:18-alpine

WORKDIR /app

# Copy only the production dependencies from the 'builder' stage
COPY --from=builder /app/node_modules ./node_modules
# Copy the built application from the 'builder' stage
COPY --from=builder /app/build ./build
# Copy the package.json for the runner
COPY package.json .

# Expose the port the app will run on (SvelteKit adapter-node defaults to 3000)
EXPOSE 3000

# Set the command to start the production server
CMD [ "node", "build/index.js" ]