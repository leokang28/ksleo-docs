# 这是标题

## 问题记录

- https://github.com/expressjs/express/issues/3559#issuecomment-365312933

## 可能拦截到 timeout 的拦截器

- LoggerInterceptor
- ExceptionInterceptor
- TimeoutInterceptor

拦截器太多。。无法准确定位具体是哪里出来的 error

error 流向 ExceptionInterceptor -> LoggerInterceptor -> 外部兜底

抛出的错误先到 ExceptionInterceptor，经过一层转发到 LoggerInterceptor，由于 rxjs 定义的 TimeoutError 只要经过 ExceptionInterceptor，就会被转为自定义的 TimeoutError 类型，而不会输出日志上的'Timeout has occurred'这种内容，因此这个错误来源应该不是代码层面（ExceptionInterceptor 没有拦截到并转其类型），而且 LoggerInterceptor 还会再将 rxjs 定义的 TimeoutError 转成自定义错误（与 ExceptionInterceptor 逻辑一致）。因此无论如何，代码层面 throw 的 TimeoutError 都不会输出![image-20191106194944011](/Users/ksleo/Library/Application Support/typora-user-images/image-20191106194944011.png)这样的错误体

```js
```
