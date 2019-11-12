#!/usr/bin/env sh

git add .
git commit -m 'update'
git push

cd ./docs/.vuepress/dist
git init
git add .
git commit -m 'update'
# git push

git push -f git@github.com:leokang28/leokang28.github.io.git master