#!/usr/bin/env sh

git add .
git commit -m 'update'
git push

cd ./docs/.vuepress/dist
git add .
git commit -m 'update'
git push