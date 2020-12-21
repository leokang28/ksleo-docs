# 回溯（深度优先遍历）

回溯算法跟多叉树的遍历有些相似。回溯问题的三个关键点在于：
1. 已遍历路径

    已遍历路径是到当前节点为止，走过的节点记录信息.
2. 可选择列表

    在当前节点，可以选择哪些节点作为下一步。

3. 结束条件（base case）

    到达底层，无法再进一步；或者是已经满足了条件。开始回溯。

可以写伪代码来描述一下这个过程
```js
let result = []
function backtrace(path, list) {
    if (满足条件 || 到达底部) {
        result.push(path)
        return
    }
    for (p of list) {
        // 使用当前节点做判断
        backtrace(path, another_list)
        // 回溯撤销当前节点
    }
}
```

重点在于进入递归之前，需要使用当前节点做选择；在递归跳出之后，需要将当前的节点从路径result中删除。

### 全排列问题

通过全排列问题来看一下回溯算法的整体流程。
```js
// 输入一组数字，返回他们的全排列
function main(nums) {
    let result = []
    let track = []
    backtrack(nums, track, result)
    return result
}

function backtrack(nums, track, result) {
    if (nums.length === track.length) {
        return result.push([...track])
    }
    for (const i of nums) {
        if (track.indexOf(i) > -1) {
            continue
        }
        track.push(i)
        backtrack(new_nums, track)
        track.pop()
    }
}
```

这个算法其实还可以优化，把`continue`语句的条件判断优化掉，通过动态的删除nums元素来实现剪枝。回溯方法可以写成下面的样子。
```js
function backtrack(nums, track, result, basecase) {
    if (basecase === track.length) {
        return result.push([...track])
    }
    // if (nums.length === track.length) {
    //     return result.push([...track])
    // }
    for (const i in nums) {
        track.push(nums[i])
        nums.splice(i, 1)
        backtrack(nums, track, result, basecase)
        nums.splice(i, 0, track.pop())
    }
}
```

优化前后的区别在于:
1. backtrace的第一个参数不再是一成不变的了。每次都会将当前进入`track`的元素从`nums`中剔除，从而减少下一次递归的遍历次数。
2. `main`方法中的调用也需要加上新的参数`basecase`。这是由于我们的basecase是跟`nums`的初始属性相关的，因此需要在第一次调用时锁定这个条件，否则如果后序递归也传递`nums.length`参数，由于我们的增删操作，这个参数会变化，导致算法运行结果出错。

### N皇后

N皇后问题作为leetcode上难度为hard的问题之一，其实懂了回溯的算法思路，这个问题也不难解决。
```js
function main(n) {
    const res = [] //存储结果
    const board = initBoard(n)
    backtrack(board, 0, res)
    return res
}

function initBoard(n) {
    return [...Array(n)].map(_ => [...Array(n)].map(_ => '.').join(''))
}

function backtrack(board, row, res) {
    if (row === board.length) { // 棋盘遍历完毕
        return res.push([...board])
    }
    const cols = board[row].length
    for (let i = 0; i < cols; i++) {
        if (!check(board, row, i)) {
            continue
        }
        replace(board, row, i, 'Q')
        backtrack(board, row + 1, res)
        replace(board, row, i, '.')
    }
}

function replace(board, row, i, rep) {
    let str = board[row]
    str = str.split('')
    str[i] = rep
    return str.join('')
}

function check(board, row, col) {
    const n = board.length

    // 检查列
    for (let i = 0; i < n; i++) {
        if (board[i][col] === 'Q') {
            return false
        }
    }

    // 检查右上方
    for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
        if (board[i][j] === 'Q') {
            return false
        }
    }

    // 检查左上方
    for (let i = row - 1, j = col - 1; i >= 0 && j >= 0) {
        if (board[i][j] === 'Q') {
            return false
        }
    }
    return true
}
```

`check`函数就是对一个二维数组的检查，并且只检查了列、左上方和右上方，这个跟递归的逻辑有关。因为每次递归进入的都是一个新行，并且棋盘下半部分肯定是没有棋子的，所以都不用检查。

### 子集

子集问题可以分解为求子集的子集，最后求空集的子集，然后通过回溯，将结果合并。

```js
function subsets(nums) {
    let res = []
    backtrack(nums, [], res)
    return res
}
function backtrack(nums, track, res) {
    for(const i of nums) {
        track.push(i)
        backtrack(nums.slice(nums.indexOf(i) + 1), track, res)
        track.pop()
    }
    res.push([...track])
}
```

### 组合
```js
function combine(n, k) {
    let result = []
    backtrack(n, k, 1, [], result)
    return result
}

function backtrack(n, k, start, track, result) {
    if (k === track.length) {
        return result.push([...track])
    }

    for(let i = start; i <= n; i++) {
        track.push(i)
        backtrack(n, k, i + 1, track, result)
        track.pop()
    }
}
```

### 括号生成

一组合法的括号应该有如下特性：
1. 左括号数量等于右括号数量
2. 从左边开始的任意长度组合，左括号数量一定不少于右括号数量

```js
function generateParenthesis(n) {
    let result = []
    backtrack(n, n, [], result)
    return result
}

function backtrack(left, right, track, result) {
    if (left > right) return
    if (left < 0 || right < 0) return
    if (left === 0 && right === 0) {
        return result.push([...track].join(''))
    }
    track.push('(')
    backtrack(left - 1, right, track, result)
    track.pop()

    track.push(')')
    backtrack(left, right - 1, track, result)
    track.pop()
}
```
