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

console.log(subStr('ADOBECODEBANC', 'AA'))