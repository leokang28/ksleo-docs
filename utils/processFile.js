const fs = require('fs')
const readline = require('readline')
const path = require('path')
const stream = require('stream')

const INNER_PATH_REG = /\/docs\/(.+)/

module.exports = function(dirPath, callback) {
  const result = []

  const dirEmpty = {
    title: 'nothing yet',
    inner_path: '/'
  }
  if (!fs.lstatSync(dirPath).isDirectory()) {
    // callback(result)
    return null
  }
  const dirs = fs.readdirSync(dirPath)

  // console.log('dirname', dirPath)
  if (!dirs || dirs.length < 1) {
    result.push(dirEmpty)
    return result
  }

  for (const filepath of dirs) {
    const apath = path.resolve(dirPath, filepath)

    const file = fs.readFileSync(apath)
    const title_line = file.toString().split('\n')[0]
    const title = title_line && title_line.substr(2)

    const inner_path = `/${apath.match(INNER_PATH_REG)[1]}`
    // console.log(inner_path)
    // console.log(data.toString().split('\n')[0])
    result.push({ title, inner_path })
  }

  // const filepath = path.resolve(dirPath)

  // console.log('result', result)
  return result
  // await fs.readFile()
  // return result
}
