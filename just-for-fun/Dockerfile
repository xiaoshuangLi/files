FROM ubuntu:16.04

WORKDIR /root/app

COPY . /root/app

RUN apt-get update
RUN apt-get install -y git nodejs npm libpng-dev curl bash
RUN npm install n npm@3.10.10 -g
RUN n 6.10.0

RUN git config --global http.postbuffer 524288000
RUN git clone https://github.com/xiaoshuangLi/just-for-fun.git

RUN cp -rf ./just-for-fun/* /root/app
RUN cp ./just-for-fun/.babelrc /root/app
RUN cp ./just-for-fun/.env /root/app

RUN npm install
RUN npm run build

RUN npm install -g autoprefixer postcss-cli@2.6.0
RUN postcss -c postcss.json

EXPOSE 8111

CMD ["npm", "start"]
