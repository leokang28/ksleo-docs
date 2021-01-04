# 滑动窗口

滑动窗口算法属于双指针的一种，一般逻辑是维护一个动态窗口，向后移动，然后更新结果。滑动窗口思想应用比较广泛，比如tcp中就有基于滑动窗口的拥塞控制策略。

滑动窗口的关键点在于，窗口滑动时，窗口内的数据更新：
 - 哪些内容应该被加入窗口，添加后该做什么
 - 哪些内容应该从窗口删除，删除前该做什么

上述两个流程分别处于滑动窗口扩大和缩小时，基本可以认为是一个镜像操作。

滑动窗口的整体思路是，从头开始控制两个指针，快指针首先往前走（增大窗口），如果命中了某些判断条件，则慢指针往前走（缩小窗口）。下面用伪代码表示一下大体思路：
```js
let left = right = 0

while(right < arr.length) {
    window.add(arr[right])
    right += 1

    while (窗口需要缩小) {
        window.shift()
        left += 1
    }
}
```

### 最小覆盖子串

给定一个字符串s，一个字符串t，在s中找出包含t所有字母的最小子串

```js
function subStr(s, t) {
    const total = new Map()
    const window = new Map()
    let left = right = 0
    let valid = 0

    let start = 0
    let len = s.length + 1
    for(const char of t) {
        add(total, char)
    }

    while(right <= s.length) {
        const d = s[right]
        right++
        if (total.has(d)) {
            add(window, d)
            if (window.get(d) === total.get(d)) {
                valid++
            }
        }

        while(valid === total.size) {
            console.log(window, valid)
            if (right - left < len) {
                start = left
                len = right - left
            }
            const l = s[left]
            left++
            if (total.has(l)) {
                if (window.get(l) === total.get(l)) {
                    valid--
                }
                sub(window, l)
            }
        }
    }
    return len === s.length + 1 ? '' : s.substr(start, len)
}

function add(m, k) {
    if (m.has(k)) {
        m.set(k, m.get(k) + 1)
    } else {
        m.set(k, 1)
    }
}

function sub(m, k) {
    const v = m.get(k)
    if (v && v > 0) {
        m.set(k, v - 1)
    } else {
        m.set(k, 0)
    }
}
```

### 字符串排列

其实就是子串，跟上一题的区别在于不包含其他多余的字符。所以只需要修改一下窗口滑动的条件即可：
```js
...
while(right - left >= t.length) {
    if (valid === need.size) {
        // 找到之后直接返回，因为精确匹配不存在最大最小值
        return true
    }
}
```

### 找到所有字母异位词

本质还是排列问题，只是在上一个问题的基础上，多了一个`找到所有符合条件的子串`这个条件。所以只需要将`return`语句改为结果更新即可
```js
...
if (valid === need.size) {
    res.push(left)
}
```

### 最长不重复子串

```js
function lengthOfLongestSubstring(s) {
    const window = new Map()
    let left = 0 
    let right = 0
    let res = 0
    while(right < s.length) {
        const c = s[right]
        right += 1
        if (window.has(c)) {
            window.set(c, window.get(c) + 1)
        } else {
            window.set(c, 1)
        }

        while(window.get(c) > 1) {
            const d = s[left]
            left += 1

            window.set(d, window.get(d) - 1)
        }

        res = Math.max(res, right - left)
    }
    return res
}
```

这里需要修改窗口缩小条件，当窗口中出现重复字符时，说明窗口该缩小了，并且将当前符合条件的字符串长度与之前的结果取最大值。
