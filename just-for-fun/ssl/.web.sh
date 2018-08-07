#!/bin/bash

mv /root/jff/nginx/nginx.conf /etc/nginx/
mv /root/jff/nginx/base /etc/nginx/sites-enabled/

mkdir /root/jff/challenges

openssl genrsa 4096 > /root/jff/account.key
openssl genrsa 4096 > /root/jff/domain.key
openssl req -new -sha256 -key /root/jff/domain.key -subj "/" -reqexts SAN -config <(cat /etc/ssl/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:xiaodifang.club,DNS:www.xiaodifang.club,DNS:xiaoxiaodifang.com,DNS:www.xiaoxiaodifang.com")) > /root/jff/domain.csr

touch /root/jff/chained.pem
rm /root/jff/chained.pem

python /root/jff/acme_tiny.py --account-key /root/jff/account.key --csr /root/jff/domain.csr --acme-dir /root/jff/challenges/ > /tmp/signed.crt || exit
wget -O - https://letsencrypt.org/certs/lets-encrypt-x3-cross-signed.pem > intermediate.pem
cat /tmp/signed.crt intermediate.pem > /root/jff/chained.pem

mv /root/jff/nginx/jff /etc/nginx/sites-enabled/
nginx
nginx -s reload
service nginx restart
cd ../
npm run start
