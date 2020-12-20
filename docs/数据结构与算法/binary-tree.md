# 二叉树

## 定义

树结构是在链表结构上扩展出来的，每个节点可以存储多个节点的指针信息，且节点不相交，不闭环。二叉树是树的特殊情形，每个节点存储的节点指针数不大于2。

## 一些特殊的二叉树

### 满二叉树（Full binary tree）
除了叶子节点之外，其余节点都存在左右子树，且叶子结点都在同一层。
![满二叉树](https://gitee.com/ksleo/source/raw/master/FullBinary.jpg)

### 完全二叉树（Complete binary tree）
除了最后一层外，每一层都被完全填满。若最后一层不满，其所有节点也是完全向左靠拢。
![完全二叉树](https://gitee.com/ksleo/source/raw/master/CompleteBinary.jpg)

::: tip 满二叉树和完全二叉树的关系
满二叉树一定是完全二叉树，完全二叉树不一定是满二叉树。满二叉树是完全二叉树的子集。
:::

### 二叉搜索树（Binary search tree）
若左子树不为空，左子树节点上的值都小于根节点。若右子树不为空，右子树节点上的值都大于根节点。

### 平衡二叉树（Balanced binary tree）
若树不为空，则它的左右子树高度差绝对值不大于1。

## 二叉树的重要性和算法思想的通用性

我们用快速排序和归并排序做一个类比。如果说快速排序和归并排序有什么区别，其实可以认为：快速排序类似于二叉树的前序遍历，归并排序类似于二叉树的后序遍历。下面写一下排序算法的主要逻辑代码：

快速排序：
```js
function sort(arr, low, high) {
    // 选取基准点，获取基准下标的逻辑
    const p = partition(arr, left, right)

    sort(arr, left, p - 1)
    sort(arr, p + 1, right)
}
```

归并排序：
```js
function sort(arr) {
    const mid =  arr.length / 2
    if (arr.length < 2) return arr
    const left = arr.slice(0, middle)
    const right = arr.slice(middle)
    // 先sort递归，最后merge
    return merge(sort(left), sort(right))
}
```

这里看到其实就是递归遍历，分解问题最后汇总，也就是常说的分治。

::: tip 关于递归
这里引入递归算法的一个关键点。明确递归函数的定义，用定义推导结果，不要深入递归细节，人脑能压几层栈啊。例如，统计一棵树的节点个数：
```js
function count(root) {
    if (!root) return 0
    // 根节点 + 左子树个数 + 右子树个数 = 总数
    return 1 + count(root.left) + count(root.right)
}
```
:::

## 二叉树的基本操作和相关算法

### 遍历
二叉树遍历分为前中后序三种，区别在于根节点的遍历位置。
```js
function traverse(root) {
    // 前序
    traverse(root.left)
    // 中序
    traverse(root.right)
    // 后序
}
```

### 翻转

```js
function reverse(root) {
    if (!root) return root
    const left = reverse(root.left)
    const right = reverse(root.right)
    let temp = root.left
    root.left = root.right
    root.right = temp
    return root
}
```

### 将满二叉树每一层的节点都指向其右侧
```js
function connect(root) {
    if (!root) return root
    connectTwoNodes(root.left, root.right)
    return root
}
function connectTwoNodes(left, right) {
    if (!left || !right) return
    left.next = right
    connectTwoNodes(left.left, left.right)
    connectTwoNodes(right.left, right.right)
    connectTwoNodes(left.right, right.left)
}
```


### 构造二叉树
构造二叉树的问题，主要工作是构造根节点。然后递归左右子树。

#### 通过中序遍历和后序遍历构造二叉树
```js
function buildTree(inorder, postorder) {
    // 通过后序遍历找到根节点，再利用中序遍历找到左右子树
    if (!inorder.length || !postorder.length) return null
    
    // 后序遍历的根节点一定是最后一个元素
    const rootVal = postorder.pop()
    // 找到根节点在中序遍历中的位置
    const rootIndex = inorder.indexOf(rootVal)
    // 左右子数
    const leftTree = inorder.slice(0, rootIndex)
    const rightTree = inorder.slice(rootIndex + 1, inorder.length)
    const root = new TreeNode(rootVal)
    // 递归左右子树
    root.left = buildTree(leftTree, postorder.slice(0, leftTree.length))
    root.right = buildTree(rightTree, postorder.slice(leftTree.length, postorder.length))
    return root
}
```

### 寻找重复子树

 - 问题1：如何知道子树结构？

    可以通过序列化树的方式，将它的结构拍平，即可知道树的结构信息。无论是前中后序何种遍历顺序，任意序列化方法，只要能描述树结构即可。
 - 问题2：如何知道当前子树是否重复？

    可以使用映射表记录序列化信息，如果某个节点的序列化信息已经存在于表中，说明该子树重复。

```js
let memo = new Set()
let result = []
function findDuplicateSubtrees(root) {
    traverse(root)
    return result
}

function traverse(root) {
    if (!root) return 'null'
    const left = traverse(root.left)
    const right = traverse(root.right)
    
    const encode_str = `${left},${right},${root.val}`
    if (memo.has(encode_str)) {
        result.push(root)
    } else {
        memo.add(encode_str)
    }
    return encode_str
}
```

### 二叉搜索树相关
二叉搜索树在二叉树的性质之上，多了一条：二叉搜索树的中序遍历是有序的。

#### 二叉搜索树的合法性验证
```js
function isValidBST(root) {
    if (!root) return true
    if (root.left && root.left.val > root.val) return false
    if (root.right && root.right.val < root.val) return false

    return isValidBST(root.left) && isValidBST(root.right)
}
```
上面这个写法是有问题的：root只比较了自己的左右子节点，而没有跟整个左右子树做比较，所以，我们需要一种机制将限制条件渗透到它的子树当中去。
```js
function isValidBST(root) {
    return isValid(root, null, null)
}

function isValid(root, max, min) {
    if (!root) return true
    if (min && min.val > root.val) return false
    if (max && max.val < root.val) return false

    return isValid(root.left, root, min) && isValid(root.right, max, root)
}
```

#### 在二叉搜索树中查找元素
```js
function isInBST(root, target) {
    if (!root) return false
    if (root.val === target) return true
    return isInBST(root.left, target) || isInBST(root.right, target)
}
```

这段代码功能上没有问题，但是没有使用到BST左小右大的性质，可以更有效率的进行查找。

```js
function isInBST(root, target) {
    if (!root) return false
    if (root.val === target) return true
    if (root.val > target) return isInBST(root.left, target)
    if (root.val < target) return isInBST(root.right, target)
}
```

#### 在二叉搜索树中插入元素

```js
function insertIntoBST(root, val) {
    if (root == null) return new TreeNode(val)
    if (root.val > val) {
        root.left = insertIntoBST(root.left, val)
    }
    if (root.val < val) {
        root.right = insertIntoBST(root.right, val)
    }
    return root
}
```

二叉搜索树中一般不会存在相同的元素。因此一定存在一个空位置给新插入的元素。

#### 在二叉搜索树中删除元素
```js
function deleteNode(root, val) {
    if (!root) return root
    if (root.val === val) {
        // 叶子节点
        if (!root.left && !root.right) return null
        // 只有一个子节点
        if (!root.left) return root.right
        if (!root.right) return root.left
        // 存在左右子节点
        const _node = getMin(root.right)
        root.val = _node.val
        root.right = deleteNode(root.right, _node.val)
    } else if (root.val > val) {
        root.left = deleteNode(root.left, val)
    } else if (root.val < val) {
        root.right = deleteNode(root.right, val)
    }
    return root
}

function getMin(root) {
    let slow = root
    while(root.left) {
        if (root.left.left) slow = slow.left
        root = root.left
    }
    slow.left = null
    return root
}
```

删除操作相对复杂，需要考虑删除的节点是叶子节点、有一个子节点、有两个子节点三种情况。
 - 叶子节点
  
    直接删除即可。
 - 只有一个子节点
  
    需要把它的子节点接到父节点上去。
 - 有两个自己点
  
    为了保证搜索树的特性，需要找到左子树中最大的节点，或者右子树中最小的节点来替换自己的位置。

#### 序列化和反序列化二叉树

在一般给出的二叉树列表中，不会记录空节点信息，这种情况需要知道中序遍历、前后序中的一种才可反序列化。而当遍历信息中，存储了空节点时，就可以通过一种遍历信息来反序列化。但是中序遍历还是行不通，因为前后序都可以确定根节点的位置，但是中序遍历的根节点索引无法确认。

```js
/**
 * Encodes a tree to a single string.
 *
 * @param {TreeNode} root
 * @return {string}
 */
var serialize = function (root) {
    if (!root) return '#'
    const left = serialize(root.left)
    const right = serialize(root.right)
    return `${root.val},${left},${right}`
}

/**
 * Decodes your encoded data to tree.
 *
 * @param {string} data
 * @return {TreeNode}
 */
var deserialize = function (data) {
    return des(data.split(','))
};

function des(data_arr) {
    let val = data_arr.shift()
    if (val === '#') {
        return null
    }
    let root = new TreeNode(val)
    root.left = des(data_arr)
    root.right = des(data_arr)
    return root
}
```

上面展示的是通过前序遍历序列化和反序列化二叉树的操作。通过后序遍历只需要稍加后序逻辑即可。

当使用BFS的方式序列化二叉树时，需要将节点信息全部存储，包括空节点。

#### 最近公共祖先
```js
var lowestCommonAncestor = function(root, p, q) {
    // base case
    if (!root || root === p || root === q) return root
    const left = lowestCommonAncestor(root.left, p, q)
    const right = lowestCommonAncestor(root.right, p, q)

    // 如果都没找到，说明不在树中
    if (!left && !right) return null
    // 如果都返回了，说明该层的root是最近公共祖先
    if (left && right) return root
    // 如果只返回了一个，该节点就是最近公共祖先
    return left || right
};
```

#### 计算完全二叉树的节点数

```js
function countNodes(root) {
    let lh = 0
    let rh = 0
    let l = root
    let r = root
    while(l) {
        lh += 1
        l = l.left
    }
    while(r) {
        rh += 1
        r = r.right
    }
    if (lh === rh) {
        return 2**lh - 1
    }
    return 1 + countNodes(root.left) + countNodes(root.right)
};
```

完全二叉树结合了普通二叉树和满二叉树的计数方法。
