FROM node:slim

# Install Python, build essentials, and python3-distutils for legacy node-gyp compilation
RUN apt-get update && apt-get install -y python3 python3-dev python3-distutils make g++

WORKDIR /app

COPY package.json ./
RUN npm install && npm cache clean --force

COPY . .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "index.js"]
