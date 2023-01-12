FROM node:18

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install

COPY ./index.ts .
COPY ./src .

EXPOSE 9000
CMD ["npm", "run", "prod"]