function multiply(num1, num2) {
    if (num1 === '0' || num2 === '0') return '0'
    const res = Array(num1.length + num2.length).fill('0')
    for (let j = num2.length - 1; j >= 0; j--) {
        for (let i = num1.length - 1; i >= 0; i--) {
            const index = i + j + 1
            const index_p = index - 1
            const cur = (num1[i] * num2[j] + parseInt(res[index])) % 10
            const p = Math.floor((num1[i] * num2[j] + parseInt(res[index])) / 10)
            res[index] = cur.toString()
            res[index_p] = (p + parseInt(res[index_p])).toString()
        }
    }
    if (res[0] === '0') res.shift()
    return res.join('')
}

function add(num1, num2) {
    num1 = num1.split('').reverse()
    num2 = num2.split('').reverse()
    return doAdd(num1, num2)
}

function minor(num1, num2) {
    num1 = num1.split('').reverse()
    num2 = num2.split('').reverse().map(i => `${-parseInt(i)}`)
    const res = doAdd(num1, num2)
    const symbol = res.startsWith('-') ? '-' : ''
    return res.length ? `${symbol}${res.split('-').join('')}` : '0'
}

function doAdd(num1, num2) {
    const res = Array(Math.max(num1.length, num2.length) + 1).fill('0')
    let index = res.length - 1
    for (let i = 0; i < Math.min(num1.length, num2.length); i++) {
        const sum = +num1[i] + +num2[i] + parseInt(res[index])
        const cur = sum % 10
        const p = 0 | sum / 10
        res[index] = cur.toString()
        res[index - 1] = (p + parseInt(res[index - 1])).toString()
        index--
    }
    while(index) {
        const bigger = num1.length > num2.length ? num1 : num2
        res[index--] = bigger[bigger.length - index - 1]
    }
    while(res[0] === '0') {
        res.shift()
    }
    return res.join('')
}

console.log(minor('-12345', '-123'))

function f(current, l, years) {
    if (years === 1) {
        return current + current * l
    }
    const cur = f(current, l, years - 1)
    return cur + cur * l
}

console.log(f(1, 0.2, 20))