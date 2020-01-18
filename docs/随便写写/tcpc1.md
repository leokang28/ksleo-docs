# tcp/ip详解卷一 第一章习题

## 1、请计算最多有多少个A类、B类和C类网络号
```js
A类 2^(8-1) - 1 = 127
b类 2^(16-2) - 1 = 16384
c类 2^(24-3) - 1 = 2097152
```

## 4、获取一份最新的赋值RFC拷贝。“quote of the day”协议的有名端口号是什么？哪个RFC对该协议进行了定义？
  [ASSIGNED NUMBERS](https://www.rfc-editor.org/rfc/rfc1340.html)中定义该端口号为17。
  [Quote of the Day Protocol](https://www.rfc-editor.org/rfc/rfc865.html)定义了该协议。
## 6、获取一份RFC 1000的拷贝，了解RFC这个术语从何而来。
  [THE REQUEST FOR COMMENTS REFERENCE GUIDE](https://www.rfc-editor.org/rfc/rfc1000.html)
  几位最初的研究人员（Elmer Shapiro,Jeff Rulifson,Ron Stoughton,Steve Carr, Stephen D. Crocker[writer]）在有一些研究成果后，准备将其记录发表，但是不知道该写谁的名字作为官方协议设计者（怕得罪人之类的。。），然后Stephen D. Crocker提出了一个基本原则--任何东西都是非官方的，任何人都可以对其进行评论。为了庚凸显这个原则，Stephen D. Crocker把他们整理的论文笔记标记为"Request for Comments"，即RFC。
