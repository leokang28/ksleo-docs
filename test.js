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

console.log(leftBound([1,2,4,5,5,5,6], 9))