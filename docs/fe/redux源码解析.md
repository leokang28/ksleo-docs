# Redux源码解析

## 前言

我自己对redux有一些简单的应用，并且大致理解redux的整体设计，出于深入了解的目的读一下源码。因此本文不设计任何redux的概念解释以及用法介绍，读本文之前需要对redux有一个基础的了解。

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
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
```
`createStore`定义了四个范型变量，它们的含义分别是
 - S: 实例化的store存储的数据类型。
 - A: 实例化的store未来将要dispatch的action类型。
 - Ext: store enhancer返回的store扩展。
 - StateExt: store enhancer返回的state扩展。

上面这个store enhancer不太好翻译。可以理解成为store额外添加的一些功能，这些功能有可能会改变dispatch和reducer的工作流程。总之是对store的功能强化。

接下来，`createStore`接收两个参数。
 - reducer: reducer函数。是一个纯函数，更新store的逻辑写在这个函数中。
 - enhancer: 对store的增强扩展，是可选参数。

最后，`createStore`返回一个`Store`类型。即我们最终得到的store实例的类型。

### 待续...