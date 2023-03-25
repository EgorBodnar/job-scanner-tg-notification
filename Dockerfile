FROM node:alpine

WORKDIR /job_scanner

COPY . .

RUN npm install

ENTRYPOINT ["npm", "run"]

CMD [ "pm2:bot:start" ]
