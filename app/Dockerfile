FROM node:24.1.0

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY ./ ./

CMD ["npm", "run", "watch:js"]