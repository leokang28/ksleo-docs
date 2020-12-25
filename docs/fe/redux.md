# Redux源码阅读笔记

## 前言

之前对redux有一些简单的应用，并且大致理解redux的整体设计，出于深入了解的目的读一下源码。因此本文不设计任何redux的概念解释以及用法介绍，仅对源代码做一个逻辑整理。

## 目录结构

Redux的目录结构和代码都比较简洁。目录结构如下

    /src
    ├── applyMiddleware.ts
    ├── bindActionCreators.ts
    ├── combineReducers.ts
    ├── compose.ts
    ├── createStore.ts
    ├── index.ts
    ├── types
    │   ├── actions.ts
    │   ├── middleware.ts
    │   ├── reducers.ts
    │   └── store.ts
    └── utils
        ├── actionTypes.ts
        ├── isPlainObject.ts
        ├── symbol-observable.ts
        └── warning.ts

接着看一下rollup的配置文件，它配置了三种种模块输出：CommonJS、ES、UMD。rollup的使用不在这篇笔记的讨论范围内，这里主要用来查看一下入口文件在哪里。配置文件表明Redux的入口文件是`src/index.ts`。打开该文件看看里面的内容，发现它的主要作用是将其他文件中的模块进行整合然后统一导出。
```js
// types
// store
export {
  CombinedState,
  PreloadedState,
  Dispatch,
  Unsubscribe,
  Observable,
  Observer,
  Store,
  StoreCreator,
  StoreEnhancer,
  StoreEnhancerStoreCreator,
  ExtendState
} from './types/store'
// ...
```

`index.ts`的工作就是这些，整合并统一导出模块。

平时使用Redux时我们应该知道，我们使用最多的API是`createStore`、`combineReducers`、`applyMiddlewares`等。接下来一一查看这些API的源码。

### `createStore`

`createStore`用来创建一个store实例。它的函数签名如下：
```ts
function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S> | StoreEnhancer<Ext, StateExt>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
```

签名有些长，并且有重载定义。只拿出其中一个实现来看：
```ts
function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
```
`createStore`定义了四个范型变量，它们的含义分别是
 - S: 实例化的store存储的数据类型。
 - A: 实例化的store未来将要dispatch的action类型。
 - Ext: store enhancer返回的store扩展。
 - StateExt: store enhancer返回的state扩展。

这个store enhancer可以理解为给store额外添加一些功能，这些功能有可能会改变dispatch和reducer的工作流程。比如为redux注册中间件，就是enhancer。总之是返回一个功能扩展版本的store实例。

`createStore`接收两个参数。
 - reducer: reducer函数。是一个纯函数，更新store的逻辑写在这个函数中。
 - prelaodedState: 初始化的state。如果使用了`combineReducers`来生成`reducer`，那这个对象必须和`combineReducers`有一样的key。是可选参数
 - enhancer: 对store的增强扩展，是可选参数。

`createStore`返回一个`Store`和`Ext`的交叉类型。即我们最终得到的store实例的类型。

#### 函数逻辑

函数开头是一些参数的安全性检查。其中这一段比较重要：
```ts
if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
        throw new Error('Expected the enhancer to be a function.')
    }

    return enhancer(createStore)(
      reducer,
      preloadedState as PreloadedState<S>
    ) as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
}
```

检查`enhancer`参数的合法性，如果是一个合法的enhancer，则用它来生成最终的store实例。

接下来是一些`store`实例方法的定义。

##### `getState`

返回当前的state数据。这个函数中做了一个条件判断，如果当前有正在进行的dispatch操作，则抛出一个错误。

##### `subscribe`

用来订阅store的更新。当dispatch时，订阅方会被告知。该函数返回一个方法，用于当前订阅方的订阅解除。

##### `dispatch`

最重要的方法之一`dispatch`在这里定义。
```ts
function dispatch(action) {
    // ...
    try {
        isDispatching = true
        currentState = currentReducer(currentState, action)
    } finally {
        isDispatching = false
    }

    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i]
        listener()
    } 

    return action
}
```

首先将`isDispatching`标记为true，表示正在执行dispatch，其他操作都不可被执行，dispatch完毕后，再将其设置为false。接下来读取所有的listeners，并依次执行。最后将action返回。

##### `replaceReducer`

这个函数用来更新当前store实例的根reducer。

##### `observable`

可观测订阅方法的最简实现。用于监听store的变化，触发事件流。订阅者需要提供next方法才会订阅成功，可以看出是想通过一种类似于迭代器的功能实现订阅的自动发布。同时还使用到了Symbol对象上的observable属性。

```ts
function observable() {
    const outerSubscribe = subscribe // store实例方法上的subscribe
    return {
      subscribe(observer: unknown) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError('Expected the observer to be an object.')
        }

        function observeState() {
          const observerAsObserver = observer as Observer<S>
          if (observerAsObserver.next) {
            observerAsObserver.next(getState())
          }
        }

        observeState()
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      [$$observable]() {
        return this
      }
    }
  }
```

最后，`createStore`方法dispatch一个`init action`，然后把这些属性组合，返回store实例，`createStore`执行结束。
```ts
dispatch({ type: ActionTypes.INIT } as A)

    const store = ({
        dispatch: dispatch as Dispatch<A>,
        subscribe,
        getState,
        replaceReducer,
        [$$observable]: observable
    } as unknown) as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
return store
```

### `applyMiddleware`

之前在`createStore`函数中，有一个enhancer参数检测的逻辑，它可以对store进行功能扩展，并且将store实例的生成移交给它处理。而作为redux来说，它只提供了一种enhancer——`applyMiddleware`。

它的函数签名如下：

```ts
function applyMiddleware(...middlewares: Middleware[]): StoreEnhancer<any>
```

接收一个中间件数组，返回一个enhancer函数。这个函数我们会传给`createStore`，然后进入`createStore`内部的enhancer逻辑。