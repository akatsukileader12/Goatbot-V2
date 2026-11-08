FROM node:slim

# Install Python and build tools for native packages like canvas
RUN apt-get update && apt-get install -y python3 make g++

WORKDIR /app

COPY package.json ./
RUN npm install && npm cache clean --force

COPY . .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "index.js"]
