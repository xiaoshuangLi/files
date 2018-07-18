#!/bin/bash

mkdir /root/app/challenges

openssl genrsa 4096 > /root/app/acme-tiny/account.key
openssl genrsa 4096 > /root/app/acme-tiny/domain.key
openssl req -new -sha256 -key /root/app/acme-tiny/domain.key -subj "/" -reqexts SAN -config <(cat /etc/ssl/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:xiaodifang.club,DNS:www.xiaodifang.club,DNS:xiaoxiaodifang.com,DNS:www.xiaoxiaodifang.com")) > /root/app/acme-tiny/domain.csr

touch /root/app/acme-tiny/chained.pem
mv /root/app/nginx/nginx.conf /etc/nginx/
mv /root/app/nginx/jff /etc/nginx/sites-enabled/
nginx
rm /root/app/acme-tiny/chained.pem

python /root/app/acme-tiny/acme_tiny.py --account-key /root/app/acme-tiny/account.key --csr /root/app/acme-tiny/domain.csr --acme-dir /root/app/challenges/ > /tmp/signed.crt || exit
wget -O - https://letsencrypt.org/certs/lets-encrypt-x3-cross-signed.pem > intermediate.pem
cat /tmp/signed.crt intermediate.pem > /root/app/acme-tiny/chained.pem

nginx
nginx -s reload
service nginx restart