# 1. Use an official lightweight Node.js image
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /usr/src/app

# 3. Copy package files first (for better caching)
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of your application code
COPY . .

# 6. Expose the port the app runs on
EXPOSE 3000

# 7. Define the command to run your app
CMD ["node", "server.js"]