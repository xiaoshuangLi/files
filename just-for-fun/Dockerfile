FROM ubuntu:16.04

WORKDIR /root/app

COPY . /root/app

RUN apt-get update
RUN apt-get install -y git nodejs npm nginx libpng-dev curl bash python openssl
RUN npm install n -g
RUN n 6.10.0

RUN git config --global http.postbuffer 524288000
RUN git clone git@github.com:xiaoshuangLi/just-for-fun.git
RUN git clone git@github.com:diafygi/acme-tiny.git

RUN cp -rf ./just-for-fun/* /root/app
RUN cp ./just-for-fun/.babelrc /root/app

RUN npm install
RUN npm run build
RUN npm run start

RUN npm install -g autoprefixer postcss-cli@2.6.0
RUN postcss -c postcss.json

RUN 0 0 1 * * /root/app/ssl/.web.sh

# EXPOSE 80:8111

EXPOSE 80
EXPOSE 443

CMD ["bash", "/root/app/ssl/.web.sh"]
