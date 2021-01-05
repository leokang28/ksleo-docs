# LRU（最近使用缓存策略）

LRU全称是Least Recently Used。是一种缓存淘汰机制，当内存不足时，需要通过一定的策略去释放内存。哪些内存应该被释放，哪些数据应该被保留，就是LRU策略来决定的。LRU认为最近使用的数据是有用的，很久没有被使用的内存数据应该被清理。就像手机app一样，打开后台app列表时，第一个永远是最近使用的那个，然后依次排列。

## 算法描述

加入指定一个最大容量，需要实现两个api：`put(k, v)`和`get(k, v)`，时间复杂度都要求是O(1)。下面用一个示例来说明：
```js
let cache = new LRUCache(2)

cache.put(1, 1)
// cache = [(1, 1)]

cache.put(2, 2)
// cache = [(2, 2), (1, 1)]

cache.get(1)
// cache = [(1, 1), (2, 2)] 最近访问的应该放在最前面
cache.put(3, 3)
// cache = [(3, 3), (1, 1)] 容量不够，删除访问时间比较老的

cache.put(1, 4)
// cache = [(1, 4), (3, 3)] key 1已经存在，直接覆盖，并且移到最前面
```

## 设计

增、删、查要同时做到O(1)的时间复杂度，单独使用某一种基础的数据结构很难达到，所以考虑用组合的方式，结合各种数据结构的特性。
查找可以使用哈希表，增删可以使用链表，所以可以考虑将这两者结合。

首先构造链表，这里我们采用双向链表，因为删除元素时还需要知道当前节点的前驱。
```js
class DoubleLinkedListNode {
    constructor(key, val) {
        this.key = key
        this.val = val
        this.next = null
        this.prev = null
    }
}
class DoubleLinkedList {
    constructor() {
        // 创建两个哨兵节点
        this.dummyHead = new DoubleLinkedListNode(-1, -1)
        this.dummyTail = new DoubleLinkedListNode(-1, -1)
        this.s = 0
        this.dummyHead.next = this.dummyTail
        this.dummyTail.prev = this.dummyHead
        
    }
    add(node) {
        node.prev = this.dummyTail.prev
        node.next = this.dummyTail
        this.dummyTail.prev.next = node
        this.dummyTail.prev = node
        this.s += 1
    }

    remove(node) {
        node.prev.next = node.next
        node.next.prev = node.prev
        this.s -= 1
    }

    removeOldest() {
        if (this.dummyHead.next === this.dummyTail) return null
        const oldest = this.dummyHead.next
        this.remove(oldest)
        return oldest
    }

    size() {
        return this.s
    }
}
```

然后是链表和哈希表的结合：
```js
class LRUCache {
    constructor(capacity = 5) {
        this.capacity = capacity
        this.hashMap = new Map()
        this.dll = new DoubleLinkedList()
    }

    get(key) {
        if (!this.hashMap.has(key)) return -1
        this.makeRecently(key)
        return this.hashMap.get(key)
    }

    put(key, val) {
        if (this.hashMap.has(key)) {
            const node = this.hashMap.get(key)
            node.val = val
            this.hashMap.set(key, node)
            this.makeRecently(key)
            return
        }
        this.addRecently(key, val)
    }

    makeRecently(key) {
        const node = this.hashMap.get(key)
        this.dll.remove(node)
        this.dll.add(node)
    }

    addRecently(key, val) {
        const node = new DoubleLinkedListNode(key, val)
        if (this.dll.size() === this.capacity) {
            const removedNode = this.dll.removeOldest()
            this.hashMap.delete(removedNode.key)
        }
        this.dll.add(node)
        this.hashMap.set(node.key, node)
    }
}
```

lru充分使用了哈希表快读和链表快写的特性，将所有操作时间复杂度都降到了O(1)。
