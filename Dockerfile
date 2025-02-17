# Using Node.js to create a React application
FROM node:18 AS build

# Setup working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the project file
COPY . .

# Build React project
RUN npm run build:onrender

# Expose the port
EXPOSE 433

# Start Express server
CMD ["node", "server.js"]
