# 数组

数组是组成其他数据结构的基础结构之一（另外一个是链表）。数组是一段连续的空间，不可动态扩容（Vec是进行了封装）。数组和链表的异同在于：
 - 都是线性存储结构
 - 数组连续，链表不连续
 - 数组读取操作更快，链表插入、删除操作更快

基于数组的算法设计也有很多（滑动窗口、二分搜索、双指针技巧等）。
## 二分搜索

二分搜索用于有序表的搜索，可以提升搜索效率，主要思路是对半缩小搜索区间来查找元素。算法思路可以用伪代码来表示：
```js
function binarySearch(nums, target) {
    let left = 0
    let right = nums.length - 1 || 其他条件确定的边界值
    while(搜索条件) {
        let mid = left + (right - left) / 2
        if (nums[mid] === target) {
            执行搜索到结果的逻辑
        } else if (nums[mid] < target) {
            left = new_left // 在右半区间，left需要以某种逻辑去更新
        } else if (nums[mid] > target) {
            right = new_right // 在左搬区间，right需要以某种逻辑去更新
        }
    }
    return 结果
}
```

### 最基础的二分搜索，查找一个数

```js
function binarySearch(nums, target) {
    let left = 0
    let right = nums.length - 1 // ⚠️1
    while (left <= right) { // ⚠️2
        let mid = left + Math.floor((right - left) / 2)
        if (nums[mid] === target) {
            return mid
        } else if (nums[mid] > target) {
            right = mid - 1 // ⚠️3
        } else if (nums[mid] < target) {
            left = mid + 1 // ⚠️4
        }
    }
    return -1
}
```

有几个需要注意的地方：
1. `right`被赋值为数组的最后一个索引，这代表区间`[left, right]`是左右都闭合的。
2. 由于左右都闭合，所以当`left === right`时，代表此时还剩最后一个元素需要被检查。
3. 当前区间过大时，`right`被赋值为`mid - 1`而不是`mid`，这也是由于`[left, right]`区间左右都闭合，因此需要将`mid`从下一次查找中剔除
4. 跟第三点一样。

前两条主要针对于`while`条件的结束，后两条针对于左右区间的边界构造。这两点都需要根据具体的情况来决定，看你的搜索区间是`[left, right)`、`[left, right]`、`(left, right]`、`(left, right)`中的哪一种（一般不会考虑左开的写法）。

### 寻找左侧边界

有序列表中可能存在多个target，找出处于最左侧的元素。

```js
function leftBound(nums, target) {
    if (!nums.length) return -1
    let left = 0
    let right = nums.length // ⚠️1
    while(left < right) { // ⚠️2
        let mid = left + Math.floor((right - left) / 2)
        if (nums[mid] === target) {
            right = mid
        } else if (nums[mid] > target) {
            right = mid // ⚠️3
        } else if (nums[mid] < target) {
            left = mid + 1
        }
    }
    if (left >= nums.length || nums[left] !== target) return -1
    return left
}
```

这里有三个地方跟之前的写法不同，主要还是区间问题导致的：

1. `right`被赋值为`nums`的长度，此时`nums[right]`是越界的，因此右侧区间是开区间。
2. 由于区间右开，这就导致当`left === right`时，区间内是没有元素的。
3. 不需要赋值为`mid - 1`，因为右区间是开区间

最后还有基于结果值、越界的判断等。


### 寻找右侧边界

同上一个问题思路相同，只是需要向右区间逼近，所以需要做一些修改
```js
...
while(left < right) {
    ...
    if (nums[mid] === target) {
        left = mid + 1
    }
}

if (left === 0) return -1
nums[left - 1] === target ? left - 1 : -1

```

这里返回的值是`left - 1`，因为左区间是闭合的，当条件不符合时，左区间被多余移动了一步，因此需要做一下回退。

## 滑动窗口

滑动窗口相关可以看这里[滑动窗口](/数据结构与算法/slide-window.html)

## 数组删除相关

数组由于其连续性和不可动态扩容，在尾部增删时还是比较方便的，但是如果在中间进行增删，就比较麻烦了，因为需要对数据进行搬移，填补空白。这里主要说一种基于快慢指针的方法。

### 有序数组、有序链表去重

给定一个有序数组，去除重复的元素

数组

```js
function removeDuplicates(nums) {
    if (!nums.length) return 0;
    let slow = 0
    let fast = 0
    while(fast < nums.length) {
        if (nums[fast] != nums[slow]) {
            slow += 1
            nums[slow] = nums[fast]
        }
        fast += 1
    }
    return slow + 1
} 
```

链表
```js
function removeDuplicates(head) {
    if (!head) return null
    let slow = head
    let fast = head
    while(fast) {
        if (slow.val !== fast.val) {
            slow.next = fast
            slow = slow.next
        }
        fast = fast.next
    }
    slow.next = null
    return head
}
```

数组和链表两种结构的去重思路基本一致

### 删除数组中的指定元素

```js
function removeElement(nums, val) {
    let slow = 0
    let fast = 0

    while(fast < nums.length) {
        if (nums[fast] !== nums[slow]) {
            nums[slow] = nums[fast]
            slow += 1
        }
        fast += 1
    }
    return slow
}
```

## 双指针

双指针可以分为两类：快慢指针和左右指针。

其中快慢指针在链表中的应用比较多，例如：
 - 判断链表是否有环
 - 找到链表环入口
 - 寻找链表中点
 - 寻找倒数第n个节点
 - ...

左右指针在数组中应用比较多，例如：
 - 逆转数组
 - 二分搜索
 - 滑动窗口
 - ...

可以到具体笔记中查看这些算法更加细致的表述。
