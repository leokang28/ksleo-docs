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
满二叉树一定是完全二叉树，完全二叉树不一定是满二叉树。完全二叉树是满二叉树的子集。
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