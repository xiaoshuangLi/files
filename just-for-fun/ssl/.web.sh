#!/bin/bash

BASE='/home/ubuntu/GitRepo/files/just-for-fun'

cp $BASE/nginx/nginx.conf /etc/nginx/
cp $BASE/nginx/base /etc/nginx/sites-enabled/

mkdir /just-for-fun
mkdir /just-for-fun/jff
mkdir /just-for-fun/jff/challenges

git clone https://github.com/diafygi/acme-tiny.git
cp -rf acme-tiny $BASE

openssl genrsa 4096 > /just-for-fun/jff/account.key
openssl genrsa 4096 > /just-for-fun/jff/domain.key
openssl req -new -sha256 -key /just-for-fun/jff/domain.key -subj "/" -reqexts SAN -config <(cat /etc/ssl/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:xiaodifang.club,DNS:www.xiaodifang.club,DNS:xiaoxiaodifang.com,DNS:www.xiaoxiaodifang.com")) > /just-for-fun/jff/domain.csr

touch /just-for-fun/jff/chained.pem
rm /just-for-fun/jff/chained.pem

python $BASE/acme-tiny/acme_tiny.py --account-key /just-for-fun/jff/account.key --csr /just-for-fun/jff/domain.csr --acme-dir /just-for-fun/jff/challenges/ > /tmp/signed.crt || exit
wget -O - https://letsencrypt.org/certs/lets-encrypt-x3-cross-signed.pem > intermediate.pem
cat /tmp/signed.crt intermediate.pem > /just-for-fun/jff/chained.pem

cp $BASE/nginx/jff /etc/nginx/sites-enabled/
nginx
nginx -s reload
service nginx restart
