const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

const processFiles = require('./processFile')

const DIRECTORY_ROOT = path.resolve(__dirname, '../docs')

const log = console.log

/**
 * TODO: 递归遍历目录
 */
fs.readdir(DIRECTORY_ROOT, (err, data) => {
  log(chalk.green('开始解析目录...'))
  const map = new Map()
  // console.log(data)
  const directorys = Array.from(data)
  if (!directorys || directorys.length < 1) {
    return
  }
  directorys.splice(directorys.indexOf('.vuepress'), 1)
  directorys.map(dir => {
    const dirs = processFiles(path.resolve(DIRECTORY_ROOT, dir))
    dirs !== null && map.set(dir, dirs)
    // console.log('dirsForMd', dirsForMd)
  })
  // console.log(map)

  const writeStream = fs.createWriteStream(
    path.resolve(__dirname, '../docs/directory.md')
  )
  // arr.forEach(dir => {
  // writeStream.write(`## ${}`)
  // })
  for (const item of map) {
    writeStream.write(`## ${item[0]}\n`)
    // writeStream.write(`
    // - [${}]
    // `)
    item[1].forEach(ele => {
      writeStream.write(`- [${ele.title}](${ele.inner_path})\n`)
    })
  }
  writeStream.close()
  log(chalk.blueBright('目录文件已写入🎉'))
  // console.log(arr)
})
