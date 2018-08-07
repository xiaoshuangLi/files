#!/bin/bash

BASE='/home/ubuntu/GitRepo/files/just-for-fun'

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

0 0 1 * * $BASE/ssl/.all.sh 2>> /var/log/acme_tiny.log