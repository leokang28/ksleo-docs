const fs = require('fs')

// setInterval(() => {
//   setImmediate(() => {
//     console.log('immediate')
//   })

//   setTimeout(() => {
//     console.log('timer')
//   }, 0)
//   console.log('immediate code first------')
// }, 1000)
console.log('start')

// setTimeout(function a() {
//   setTimeout(function b() {
//     console.log('b')
//   }, 0)
//   setImmediate(function c() {
//     console.log('c')
//   })
//   Promise.resolve().then(function d() {
//     console.log('d')
//   })
//   console.log('a')
// }, 0)

// fs.readFile('', function e(err, data) {
//   Promise.resolve().then(function f() {
//     console.log('f')
//   })
//   console.log('e')
// })

// Promise.resolve().then(function g() {
//   console.log('g')
// })

// setInterval(() => {
//   Promise.resolve().then(() => {
//     console.log('promise')
//   })
//   process.nextTick(() => {
//     console.log('next tick')
//   })
//   console.log('interval')
// }, 2000)
function fibonacci(n) {
  console.time('fibonacci')

  var last = 1
  var last2 = 0
  var current = last2
  for (var i = 1; i <= n; i++) {
    last2 = last
    last = current
    current = last + last2
  }
  console.timeEnd('fibonacci')

  return current
}

process.nextTick(() => {
  setImmediate(() => {
    console.log('immediate')
  })
  setTimeout(() => {
    console.log('timer')
  }, 0)
  fibonacci(500000)
})

// const fd = fs.openSync('./package.json')

// setImmediate(() => {
//   console.log('immediate')
//   Promise.resolve().then(() => console.log('promise in immediate'))
//   process.nextTick(() => console.log('nexttick in immediate'))
// })

// fs.readFile(fd, (err, data) => {
//   fs.close(fd, () => {
//     console.log('close')
//     Promise.resolve().then(() => console.log('promise in close event'))
//     process.nextTick(() => console.log('nexttick in close event'))
//   })
// })

// setTimeout(() => {
//   console.log('timer')
//   Promise.resolve().then(() => console.log('promise in timer'))
//   process.nextTick(() => console.log('nexttick in timer'))
// }, 0)

// fibonacci(50000)

// Promise.resolve().then(() => {
//   console.log('promise1')
// })
// Promise.resolve().then(() => console.log('promise2'))

// process.nextTick(() => console.log('nexttick1'))
// process.nextTick(() => console.log('nexttick2'))

