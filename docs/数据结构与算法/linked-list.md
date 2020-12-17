# 链表

## 链表定义
链表是一种物理存储单元非连续、非顺序的存储结构。它由多个节点构成，每个字节点存储了下一个节点的引用和当前节点的数据。

### 分类
 - 单向链表。基础链表，存储了后继节点的引用。
 - 双向链表。除了存储后继节点引用，还存储了前驱节点引用。
 - 循环链表。单向链表中，尾节点后继指向头节点。
 - 双向循环链表。双向链表中，头节点的前驱指向尾节点，尾节点的后继指向头节点

### 节点定义
```rust
struct ListNode {
    next: ListNode | null,
    prev: ListNode | null,
    value: any,
}
```

## 链表相关算法

### 新增节点

1. 将新增节点cur的后继，指向前驱节点prev的后继。
   ![add_step1](https://gitee.com/ksleo/source/raw/master/screen-shot-2018-04-25-at-163234.png)
2. 将前驱节点prev的后继，指向新增节点cur。
   ![add_step2](https://gitee.com/ksleo/source/raw/master/screen-shot-2018-04-25-at-163243.png)

### 删除节点

1. 将目标节点cur的前驱节点prev的后继，设置为目标节点的后继。
   ![delete_step1](https://gitee.com/ksleo/source/raw/master/screen-shot-2018-04-26-at-203640.png)

### 双指针操作

#### 判断链表是否有环

```js
let hasCycle = function(head) {
    let fast = head
    let slow = head
    while(fast && fast.next && fast.next.next) {
        fast = fast.next.next
        slow = slow.next
        if (fast === slow) return true
    }
    return false
};
```

快慢指针主要思路是，定义两个指针从头部开始遍历，快指针每次走两步，慢指针每次走一步。如果两个指针有一刻相遇，则链表中存在环。

#### 判断链表是否有环并给出环的入口节点
```js
let detectCycle = function(head) {
    let fast = head
    let slow = head
    while(fast && fast.next && fast.next.next) {
        fast = fast.next.next
        slow = slow.next
        if (fast === slow) {
            fast = head
            while(slow !== fast) {
                slow = slow.next
                fast = fast.next
            }
            return fast
        }
    }
    return null
};
```

思路：在之前相遇的基础上，将快指针指向头节点，此时快慢指针同时向前走，每次一步，当两指针再次相遇时，该节点即为环的入口处。

数学证明：
假设链表环外的长度是a，环的长度是b，快指针每次走n步，慢指针每次走m步，则有
 - `n = 2m`

当快慢指针第一次相遇时，快指针比慢指针多走了k个环的长度，即
 - `n = m + kb`

两式相减可得
 - `n = 2kb`
 - `m = kb`

即，快指针走了2k个环长的步数，慢指针走了k个环长的步数。
如果将从头节点开始走，走过的步数记为x，那么每次到环的入口处时，x应满足
 - `x = a + kb`

此时慢指针已经走了`kb`步，那么慢指针再走`a`步即可到达环的入口处。但是`a`具体不知道是多少，但是我们可以通过双指针的方式，在头节点和慢指针处同时遍历，头节点处走到环入口需要`a`步，慢指针走到环入口也需要`a`步。即，将走`a`步的条件，转化为双指针相遇，即可得到环入口节点。

#### 判断两个但链表是否交叉

```js
let getIntersectionNode = function(headA, headB) {
  if (!headA || !headB) return null
  let a = headA
  let b = headB
  while (a !== b) {
    a = a ? a.next : headB
    b = b ? b.next : headA
  }
  return a
};
```

思路：分别遍历两个单链表，当走到链表尾部时，将指针指向另一个链表的头部，继续遍历。如果两个指针在某刻相遇，则有交叉。

数学证明：
两链表若相交，则相交部分一定相等，设该段为k。相交之前A链表的长度设为a，B的长度设为b。则：

当每个链表遍历结束时，分别记走过的步数为m，n。即：
 - `m = a + k`
 - `n = b + k`
  
当前链表遍历结束后，将指针指向另外一个链表，如果有交叉点，则在交叉点处走过的步数分别是：
 - `m = a + k + b`
 - `n = b + k + a`

可以看出是相等的，即两指针会在交叉点处相遇。

#### 删除倒数第n个节点

```js
let removeNthFromEnd = function(head, n) {
    let slow = head
    let fast = head
    while (n && fast) {
      fast = fast.next
      n--
    }
    if (n) {
      throw new Error('out of range')
    }
    if (!fast) return head.next
    while (fast.next) {
      slow = slow.next
      fast = fast.next
    }
    slow.next = slow.next.next
    return head
};
```

思路：快慢指针，快指针先走n步，然后快慢指针同时前进，直到快指针走到最后一个节点处。此时慢指针的后驱即是要删除的节点。需要特殊处理删除的节点正好是头节点。

#### 逆转链表

##### 迭代：
```js
let reverseList = function(head) {
    let h = head
    while (h && h.next) {
        let next = h.next
        h.next = next.next
        next.next = head
        head = next
    }
    return head
};
```

##### 递归：
```js
let reverseListRecursively = function(head) {
    if (!head || !head.next) return head
    const last = reverseListRecursively(head.next)
    head.next.next = head
    head.next = null
    return last
}
```

#### 逆转前n个节点
```js
let next = null
let reverseListNRecursively = function(head, n) {
    if (n === 1) {
        next = head.next
        return head
    }
    const last = reverseListNRecursively(head.next, n - 1)
    head.next.next = head
    head.next = next
    return last
}
```

#### 逆转第m ~ n个节点
```js
let reverseBetween = function(head, m, n) {
    if (m === 1) {
        return reverseListNRecursively(head, n)
    }
    head.next = reverseBetween(head.next, m - 1, n - 1)
    return head
}
```


#### 回文链表
```js
let left;

isPalindrome(head) {
    left = head;
    return traverse(head);
}

traverse(right) {
    if (right == null) return true;
    boolean res = traverse(right.next);
    // 后序遍历，利用递归的堆栈
    res = res && (right.val === left.val);
    left = left.next;
    return res;
}
```
