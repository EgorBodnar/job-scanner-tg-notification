FROM node:alpine

WORKDIR /job_scanner

COPY . .

RUN npm install

CMD [ "node", "index.js" ]
