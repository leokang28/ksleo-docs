# Nodejs setTimeout(fn, 0) 和 setImmediate 哪个先执行以及延伸思考

不论面试还是闲来看博客，基本都遇到过关于这个问题的讨论。某一天心血来潮做了一系列的代码实验和资料查阅，可能不是很全面，但应该能说明问题，而且纯个人见解，读到这篇文章的大佬如果有不同的看法，或者认为我哪个部分理解有问题导致错误，可以讨论并帮我指正。

## setTimeout(fn, 0) vs setImmediate

- 这里有一个 stackoverflow 的解答，但我的个人结论跟他不太一样。
  [NodeJS - setTimeout(fn,0) vs setImmediate(fn)](https://stackoverflow.com/questions/24117267/nodejs-settimeoutfn-0-vs-setimmediatefn)

- 自己的结论

  ~~setTimeout 和 setImmediate 两个事件注册之后（在同步代码或者同一轮事件循环中注册的），重点在于 setTimeout 注册之后~~

  经过又一次测试，发现之前的描述不是很恰当。新的结论为：执行顺序与两种时间的注册位置和注册之后的同步代码耗时有关。

   - 在同步代码中注册，或者在微任务中注册（`process.nextTick`或者`Promise.then`）。总之，在事件检查队列开始之前注册：

      1. 有耗时的同步代码，并且耗时超过了 Timeout 设定的时间，那么前者先执行；否则后者先执行。
      2. 没有耗时的同步代码，那么执行顺序将不确定。
  
   - 在其他异步事件中注册(setInterval, 异步io回调等)：

      无论如何都是后者先执行

- 测试代码 1（执行斐波那契计算，增加同步耗时）

  ```js
  process.nextTick(() => {
    setImmediate(() => {
      console.log('immediate')
    })
    setTimeout(() => {
      console.log('timer')
    }, 0)
    fibonacci(500000)
  })
  ```

  执行结果

  ![https://gitee.com/ksleo/source/raw/master/WeWork%20Helper20191112014007.png](https://gitee.com/ksleo/source/raw/master/QQ20200805-235203@2x.png)

部分斐波那契计算没有超过 <span style="color: red;">1ms</span> 却还是 timer 先执行了，我这里没有列出。是因为除了我们自己的同步任务，node 还有自己的同步流程需要耗时，这些时间要一起考虑。

- 测试代码 2（没有自己的同步代码执行，耗时主要在 node 自己的同步流程中）

  ```js
  setInterval(() => {
    setTimeout(() => {
      console.log('timer')
    }, 0)

    setImmediate(() => {
      console.log('immediate')
    })
  }, 500)
  ```

  执行结果

  ![https://gitee.com/ksleo/source/master/3DAC55C6-A0BB-4D93-BFD2-2B2A4672881B.png](https://gitee.com/ksleo/source/raw/master/QQ20200805-235141@2x.png)

可以看出执行顺序不确定了，因此我认为是因为 node 内部的同步耗时不确定导致。

上面提到一个时间：1ms。引发一个问题：我们定义的 timer 是 0ms，跟 1ms 有什么关系？这涉及到了 setTimeout 的具体实现。
[Timer 对象](https://github.com/nodejs/node/blob/e66a2acc4cb9fc09fc32d1833b89ae56468a0931/lib/internal/timers.js#L152)。setTimeout 执行时，我们设置的延迟时间会被 Timer 校验，而 0 是一个非法参数，Timer 会自动将其设成 1。这就是我们上面 1ms 的由来，所以 `setTimeout(fn, 0)`实际上是 `setTimeout(fn, 1)`

所以以上就是我对这个问题的解答了。

## 延伸

我后续查阅了许多内容，想从更深入的角度理解为什么是这样？node 的 Event Loop 是什么样的逻辑？

### libuv

关于 node 中 Event Loop 和 libuv 的细节和概念，主要参考了文章[Event Loop and the Big Picture — NodeJS Event Loop Part 1](https://blog.insiderattack.net/event-loop-and-the-big-picture-nodejs-event-loop-part-1-1cb67a182810)。

#### 概览

一切 I/O 请求会生成一个失败/成功或者其他触发器，这个触发器就是事件（Event），事件的执行由一个算法管理，算法大致流程如下描述：

1. 事件收发器（Event demultiplexr） I/O 请求并交给对应的硬件执行（网络、硬盘等）
2. 一旦上述请求执行完毕，事件收发器会为该请求注册相对应的回调，压入事件队列等待被执行。这些回调就是事件（event），事件被压入的队列就是事件队列（Event Queue）
3. 事件队列中的回调会按注册顺序依次执行，知道队列清空。
4. 事件队列中全部执行完毕或者事件收发器没有接收新请求，结束流程，否则从第一步继续循环。

管理和调度这整个机制的程序就是事件循环（Event Loop）。

![event loop](https://gitee.com/ksleo/source/raw/master/1_3fzASvL5gFrSC64hHKzQOQ.jpeg)

这只是对 node 的一个宏观概览，内部细节要复杂很多。

#### Event demultiplexr

这是一个设计模式中的抽象概念，在不同的系统中有不同的实现（Linux 下的 epoll、windows 下的 IOCP 等）。Node 对不同平台的差异化在底层做了处理，对 Node 的上层调用者暴露统一的接口。

就算在统一操作系统下，不同类型的 I/O 处理起来的逻辑也会有很大区别，比如一些 I/O 硬件层面就实现了异步功能，而某些类型 I/O 原生就不支持异步，Node 为此引入了 Thread Pool 的解决方案。并且将所有的解决方案整合，最终成为 Node 的异步 I/O 模型。
::: tip 提示
某些开发者会有一个误解：Node 中的异步 I/O 全部是通过线程池的方式实现的。
文件IO走线程池，通过pipe和主线程epoll建立联系。
其余IO则是直接epoll监听
:::

要管理这些流程，并且抹平跨平台的差异，暴露统一接口，Node 引入了一个抽象中间层，libuv。libuv 提供了整个 Node 的事件循环功能。

#### Event Queue

上面已经提到 demultiplexr 会把回调压入事件队列，这个事件队列就是由 libuv 提供的一个数据结构，并且由 Event Loop 去调度这个队列。

::: tip 提示
Event Queue 不是简单的一个队列，它包括很多的子队列，这些子队列的执行顺序也有明确定义。
:::

libuv Event Loop 提供了四种主要的队列。

- <span style="font-weight: bold;">Expired timers and intervals queue</span> - setTimeout 和 setInterval 注册的事件
- <span style="font-weight: bold;">IO Events Queue</span> - 纯 IO 事件
- <span style="font-weight: bold;">Immediates Queue</span> - setImmediate 注册的事件
- <span style="font-weight: bold;">Close Handlers Queue</span> - 任意的 close 事件

除了这四种主要的队列，还有两个事件队列。

- <span style="font-weight: bold;">Next Ticks Queue</span> - `process.nextTick`
- <span style="font-weight: bold;">Other Microtasks Queue</span> - 例如 Promise.resolve

##### 队列的执行顺序

上面列出的参考文章提到，事件循环总是由 Expired timers and intervals queue 开始检查，上面四种主要队列，每一个队列被称之为 Event Loop 的一个阶段（phase）。在一个阶段执行完毕后，会去检查 nextTick 和 microtask 队列。也就是说在一个阶段执行完毕进入下一阶段之前，nextTick 和 microtask 队列都会被检查一遍，并且 nextTick queue 优先执行。

![event queue](https://gitee.com/ksleo/source/raw/master/1_aU5dr98pxTsZ4AMfnA6lNA.png)

::: warning
bluebird 等库实现的 Promise 由于其内部的实现方式，不适用此逻辑
:::

但经我代码测试，从结果来看，该参考文章描述不太准确。不太准确的点在于`事件循环从Expired timers and intervals queue开始，进入下一阶段之前检查nextTick和microTask`。而我测试结果显示，事件循环的顺序应该是`进入每一个阶段之前都进行nextTick和microTask检查`。也就是说，程序一开始进入 Expired timers and intervals queue 时就会先进行一次 nextTick 和 microTask 检查，后面会给出关于这个结论的测试代码。

::: warning
上面是我自己代码测试然后对比参考文章得出的不同结论，我没有研究 libuv 的源码（能力有限），所以该结论可能会与其他人有出入，若有错误感谢指正。
:::

到此位置 Event Loop 的逻辑已经算是理的差不多了。下面针对我的结论和原文有出入的地方，给出测试代码和执行结果。

```js
const fd = fs.openSync('./package.json')

setImmediate(() => {
  console.log('immediate')
  Promise.resolve().then(() => console.log('promise in immediate'))
  process.nextTick(() => console.log('nexttick in immediate'))
})

fs.readFile(fd, (err, data) => {
  fs.close(fd, () => {
    console.log('close')
    Promise.resolve().then(() => console.log('promise in close event'))
    process.nextTick(() => console.log('nexttick in close event'))
  })
})

setTimeout(() => {
  console.log('timer')
  Promise.resolve().then(() => console.log('promise in timer'))
  process.nextTick(() => console.log('nexttick in timer'))
}, 0)

fibonacci(50000)

Promise.resolve().then(() => {
  console.log('promise1')
})
Promise.resolve().then(() => console.log('promise2'))

process.nextTick(() => console.log('nexttick1'))
process.nextTick(() => console.log('nexttick2'))

```

::: tip 说明
这里 timer 注册后我加入了一段斐波那契计算，主要是为了证明，timer 后执行并不是因为同步耗时没有到超时时间，而的确是 nextTick 和 microtask 先执行了。
:::

执行结果

![event loop test code](https://gitee.com/ksleo/source/raw/master/QQ20200805-234908@2x.png)

#### 其他问题

- 如果改变了上面代码的顺序，会不会有不同的结果呢？

  不会。因为 setTimeout 等代码只是在注册回调而已（事件进队）。具体的逻辑是在回调（Event）当中定义的，运行得到的结果也是回调返回的结果，而回调执行的顺序严格按照 libuv Event Loop 的定义。
