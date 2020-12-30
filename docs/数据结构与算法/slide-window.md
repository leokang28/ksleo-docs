# 滑动窗口

滑动窗口算法属于双指针的一种，一般逻辑是维护一个动态窗口，向后移动，然后更新结果。滑动窗口思想应用比较广泛，比如tcp中就有基于滑动窗口的拥塞控制策略。

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

        // console.log(window, valid)

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