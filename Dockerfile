FROM node:5.9.1

RUN mkdir -p /opt/app
WORKDIR /opt/app

ADD package.json ./package.json
RUN npm install --production -q

ADD . /opt/app

EXPOSE 3000
