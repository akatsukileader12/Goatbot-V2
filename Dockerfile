FROM node:slim

# Install Python, pip, setuptools (provides distutils), and build tools
RUN apt-get update && apt-get install -y python3 python3-dev python3-pip python3-setuptools make g++

WORKDIR /app

COPY package.json ./
RUN npm install && npm cache clean --force

COPY . .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "index.js"]
