# 从源码理解Koa洋葱模型

Koa框架的洋葱模型非常著名，但是之前只了解其概念，没有深入过代码细节。今天得空看了一下Koa中间件这部分的代码设计。不得感叹Koa的代码还真是精简。目测全部代码可能也就2000行左右的样子吧。废话不多说，先上一张经典洋葱模型图，然后再看源码。

## 中间件模型

![洋葱模型](https://gitee.com/ksleo/source/raw/master/yangcong.png)

从图上可以很直观的看出，koa中间件是先进后出的处理逻辑，跟栈是类似的。可以联想到比如调用栈、递归等。

koa中间件的定义是一个函数，可以是`async`函数或者普通函数。中间件函数签名、或者说范式如下
```js
async function middleWare(ctx: Object, next: Function) {
    // Do something
    await next();
    // Do something
}
```

中间件函数接受两个参数，第一个是koa在启动时创建好的上下文环境，里面包含了`req`,`res`等数据信息。第二个`next`函数是koa在调度中间件的时候传进来的一个函数，用来调用下一个中间件或结束中间件的递归调用。

## Koa注册中间件

中间件由koa提供的`use`方法来注册。
```js
import Koa from 'koa'

const app = new Koa()

function middleWare(ctx, next) {
    next()
}

app.use(middleWare)

app.listen(8080)
```

这样我们就算是启动了koa程序，并且注册了一个中间件。当然现在什么事都没有做。

在中间件函数体内部，我们可以在`next`函数调用前后分别做一些逻辑处理，`next`方法前的逻辑，是按中间件的注册顺序执行的，反之则是中间件注册的相反顺序。这是由于栈、或者说递归的特性导致的。

::: tip 个人思考
中间件函数体内部的逻辑，我认为跟树的遍历是类似的。不同之处在于，中间件做了一次流程控制，而树的遍历需要两次流程控制(左右子树)。
:::

为了证明这一点，我们注册三个中间件`mw1`，`mw2`，`mw3`，分别在`next`方法前后添加一些日志。
```js
function mw1(ctx, next) {
    console.log('mw1 start')
    next()
    console.log('mw1 end')
}

// mw2 mw3类似

app
    .use(mw1)
    .use(mw2)
    .use(mw3)

app.listen(8080)
```

浏览器打开本地8080端口，可以看到下面的log
![koa_mw](https://gitee.com/ksleo/source/raw/master/koa_mw.png)

这就是整个koa中间件整个洋葱模型的运行机制，下面进入koa源码看看，这种机制是怎么实现的。

## Koa中间件处理

Koa初始化App监听端口成功后，针对中间件有如下操作：
1. 初始化一个空数组，用来存放注册的中间件；
   
   ```js
   const Emitter = require('Event')
   class Appliction extends Emitter {
       constructor() {
           super()
           this.middleware = []
           // ...
       }
   }
   ```
   这个文件定义了Koa的app类，该类继承自node核心模块中的`Emitter`类。我们开发时常用的`use`、`listen`等方法都在这个类里定义。
   
   当app实例创建完毕。接下来可能会使用`use`方法进行中间件注册。
   ```js
   use(fn) {
        if (typeof fn !== 'function') throw new TypeError('middleware must be a function!');
        if (isGeneratorFunction(fn)) {
            deprecate('Support for generators will be removed in v3. ' +
                        'See the documentation for examples of how to convert old middleware ' +
                        'https://github.com/koajs/koa/blob/master/docs/migration.md');
            fn = convert(fn);
        }
        debug('use %s', fn._name || fn.name || '-');
        this.middleware.push(fn);
        return this;
    }
   ```

   函数逻辑很简单。中间件必须是一个函数，且v3版本之后不再支持generator函数作为中间件，这里会自动使用`convert`函数将generator函数转为async函数。最后将中间件注册到实例上并且将实例返回。
2. `App.listen`函数执行之后，将所有注册的中间件进行compose操作，返回一个新的函数，这个函数调用时，会起到递归调用中间件的效果；

    中间件注册完毕之后。接下来就是使用`listen`方法启动http服务，监听端口。
    ```js
    listen(...args) {
        debug('listen');
        const server = http.createServer(this.callback());
        return server.listen(...args);
    }
    ```
    `listen`使用node核心模块`http`起了一个http服务，并且调用了实例上的`callback`，其返回值作为`http.createServer`的参数。

    我们知道，`http.createServer`的回调函数即它的参数的签名如下
    ```js
    function fn(req, res) => {}
    ```

    因此。`callback`返回的应该也是一样的函数。下面看看`callback`函数做了什么。
    ```js
    callback() {
        const fn = compose(this.middleware);

        if (!this.listenerCount('error')) this.on('error', this.onerror);

        const handleRequest = (req, res) => {
            const ctx = this.createContext(req, res);
            return this.handleRequest(ctx, fn);
        };

        return handleRequest;
    }
    ```

    首先它返回一个`handleRequest`函数。这个函数就是作为`listen`函数的参数的。`callback`函数首先调用`compose`函数处理中间件注册列表。将执行结果和上下文一起作为请求监听函数的参数。

    ::: warning 注意
    这里有两个`handleRequest`函数。一个是实例方法，该方法监听处理http请求。一个是我们自己创建的局部函数，作为`http.createServer`的参数使用。
    :::

    接下来再深入到`compose`函数中，看看它对中间件做了什么样的处理。中间件是如何递归调用的。
    ```js
    function compose (middleware) {
        if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
        for (const fn of middleware) {
            if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
        }

        /**
        * @param {Object} context
        * @return {Promise}
        * @api public
        */

        return function (context, next) {
            // last called middleware #
            let index = -1
            return dispatch(0)
            function dispatch (i) {
                if (i <= index) return Promise.reject(new Error('next() called multiple times'))
                index = i
                let fn = middleware[i]
                if (i === middleware.length) fn = next
                if (!fn) return Promise.resolve()
                try {
                    return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
                } catch (err) {
                    return Promise.reject(err)
                }
            }
        }
    }
    ```
    这是`compose`函数的全部内容。逻辑还是比较长的，我们拆解开分析一下。

    首先最上面的部分，参数必须是一个`Function`类型的数组。否则直接结束。

    接下来是核心的逻辑部分。`compose`返回了一个函数匿名函数`fnMiddleware`。它是一个闭包，内部记录了当前请求发生时，中间件调用的位置。首先调用`dispatch(0)`，也就是开始调用第一个中间件。

    接下来是`dispatch`函数内部的逻辑。首先是参数`i`和外部变量`index`做了对比。这个放到之后再说。下面参数`i`的值赋给`index`。表示当前第`i`个中间件要被正式调用了。接下来将第`i`个中间件取出存入局部变量`fn`，并且对中间件读取做了越界检测。如果`fn`是空值，则代表中间件递归结束。接下来的`try catch`块中，中间件被调用，并且中间件调用的第二个参数是`dispatch`函数。由前面的逻辑可知，`dispatch`是用来执行中间件的，这里将`i`的值加1，表示dispatch下一个中间件。

    还记得中间件函数签名吗？
    ```js
    fn middleware(ctx, next) {}
    ```
    这里的第二个`next`参数，就是这里的`dispatch`函数。因此我们在中间件中调用`next()`，就等于是执行`dispatch(i+1)`。
    如果不小心在同一个中间件中调用了两次`next`函数。也就是`dispatch(i+1)`被执行了两次。此时`dispatch`函数开头部分的检测就会起到作用，它保证了每个中间件在每次调用链中都只调用一次。如果中间件是幂等的，多次调用倒也没什么功能方面的影响。但是为了避免任何出错的可能，koa只允许每个中间件调用一次。

3. `compose`返回的`fnMiddleware`函数，将作为实例上的`handleRequest`方法的参数。每次收到http请求时，都会调用`fnMiddleware`函数，即递归调用中间件。


这就是koa中间件模型中的整个流程了。源码方面还是比较简洁易懂。
