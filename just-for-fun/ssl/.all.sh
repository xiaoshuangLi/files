#!/bin/bash

BASE='/home/ubuntu/GitRepo/files/just-for-fun'

apt-get install -y git nginx curl bash python openssl docker docker.io

docker pull xiaoshuang/jff
docker run -p 8111:8111 xiaoshuang/jff

mkdir /var/log
touch /var/log/acme_tiny.log

cp $BASE/nginx/nginx.conf /etc/nginx/
cp $BASE/nginx/base /etc/nginx/sites-enabled/
nginx
rm /etc/nginx/sites-enabled/base

git clone https://github.com/diafygi/acme-tiny.git
cp -rf acme-tiny $BASE

mkdir /just-for-fun
mkdir /just-for-fun/jff
mkdir /just-for-fun/jff/challenges

bash $BASE/ssl/.web.sh

0 0 1 * * $BASE/ssl/.web.sh 2>> /var/log/acme_tiny.log