# Chapter 2 - Ownership
Ownership是Rust最重要的功能之一，它在没有[gc](https://en.wikipedia.org/wiki/Garbage_collection_(computer_science))的前提下保证了内存读写安全。

## Section 1 - 什么是Ownership
*ownership*是Rust的核心功能，虽然这个概念很容易解释，但是对于其他语言而言是一个很陌生的概念。

所有程序都有内存调度的方式，比如很常见的gc，不断的收集没有在使用的内存碎片。很多语言都需要明确的分配和释放内存，Rust则使用外的方式：通过ownership下的一组规则，在编译阶段对内存进行检查，对运行时的性能没有任何影响。

:::details Stack和Heap
stack和heap都是在程序运行时可以使用的一部分内存，但是他们的结构不一样。栈是先进先出（FILO）的调度策略，数据入栈操作称*push*，出栈称为*pop*。

所有在stack上存储的数据，其大小都必须是已知和固定的。数据大小在编译阶段无法确定，或者可能会在运行时扩容的数据，都必须存储heap。堆的组织性比较差，首先需要在堆内存中请求一块空间。内存调度器会找一块大小合适的空内存并把它打上标记，表示已被使用，然返回一个*指针（pointer）*。指针代表的是该内存区域的地址。这个过程称为*allocating*。由于指针是大小确定且固定的数据，因此针可以存储在stack上。

stack存储比heap要快，因为不需要内存调度器分配内存，stack的指针始终在其顶部。相比之下，heap内存分配需要内存调度寻找大小和据匹配的内存，并且还需要为下一次分配做一些前置工作比如内存标记等。

stack访问也比heap快，因为heap需要先根据存储在stack上的指针寻址。在多个指针跳转时，这些指针如果相隔太远，也会让访问更慢。

在调用函数时，参数（可能是heap上数据的指针）和函数的内部变量会被存进stack。函数执行结束时这些数据会从stack中清除。

保持对heap数据使用的监控，最小化这些heap上的数据内存大小，减少重复数据内容，清空没有使用的内存已确保不会内存溢出。这些都ownership解决的问题
:::

### Ownership Rules
 - Rust中每个值都有一个变量作为它的owner
 - 每个值只能有一个owner
 - 当owner超出作用域块，值将被删除

### Variable scope
变量在定义的那一刻有效，直到定义该变量的作用域执行完毕。
```rust
{ // s is not valid here, it’s not yet declared
  let s = "hello"; // s is valid from this point forward
  // do stuff with s
} // this scope is now over, and s is no longer valid
```

### `String`类型
为了说明ownership的作用机制，需要一个比Chapter1中的基础数据类型稍微复杂一些的数据，之前介绍的数据全都是存储在stack上的，但是目前我们需要存储在heap上的数据，用来解释Rust如何决策释放heap内存的时机。

这里用`String`类型举例，专注于它和ownership相关的部分，这些特性在其他复杂数据类型也适用，不论是标准库导出的还是你自己定义的。

之前的代码块使用了字符串字面量，这种方式很便捷，但是在大部分场景下这种方式不太适用。一方面是因为字符串字面量是immutable的，其次是因为大部分情况下我们并不知道要存储的数据是什么，比如存储用户输入。因此Rust还有另外一种字符串类型，`String`。这种类型是分配在heap上的，因此能够任意修改和存储任意大小的数据。`String`类型可以通过标准库导出的`from`方法来创建
```rust
  let s = String::from("hello");
```
这种string数据可以修改
```rust
  s.push_str(", world!"); // push_str() appends a literal to a String

  println!("{}", s)
```
为什么字面量不可以修改而String却可以？主要区别在于这两种类型的内存处理方式。

### Memory and Allocation
字符串字面量在编译截断是知道其内容的，因此它直接被hardcode到可执行文件中，因此它更快更有效率。这些特性也只有在数据不变时才有效。但是对于大小、数据在编译阶段都不确定，运行时会改变其内容的数据来说，无法在二进制文件中为这些数据插入blob内存。

`String`类型为了支持数据可变、内存可扩容，在编译阶段无法确定数据内容，在heap上分配了一定数量的内存出来。这意味着：
   - 内存必须在运行时由内存调度器分配。
   - 需要一种在内存使用完毕时，将内存交还给内存调度器的方法。

第一点由编码人员控制：当执行`String::from`方法时，它会去请求所需要的内存大小。这在大多数语言里都差不多。

第二点Rust与其他语言有些差异。在有gc机制的语言中，gc会持续检查内存，回收没有使用的内存碎片。但是在没有gc机制的语言中，内存回收就是编码人员的职责，此时我们需要显式调用释放内存，就像申请内存时调用`String::from`方法一样。内存管理一直都是一个难题，如果编码人员忘记回收内存，就会造成内存泄露；如果回收的太早，又会导致程序拿到一个悬空指针；如果对同一块内存释放了两次，同样也是个bug。编码人员必须保证一次申请匹配一次释放。

Rust使用了一种不同的方式：当owner变量所在的作用域执行结束时，其内存会被自动回收。
```rust
{
    let s = String::from("hello"); // s is valid from this point forward

    // do stuff with s
}   // this scope is now over, and s is no longer valid
```
当作用域结束时，Rust会调用一个特殊方法`drop`。
:::tip Node:
在C++中，这种在生命周期结束时重新分配资源的模式被称作*Resource Acquisition Is Initialization (RAII)*。如果你对这种模式比较熟悉，Rust的`drop`方法同样也很容易理解。
:::

#### Ways Variables and Data Interact: Move

在Rust中多个变量对相同数据的交互方式有多种。
```rust
let x = 5;
let y = x;
```
这个例子很好理解，将5绑定到变量`x`上，创建一份变量`x`的值的拷贝并绑定在变量`y`上。整型数字是数据已知、大小确定的，在stack上会存储两份数据。

```rust
let s1 = String::from("hello");
let s2 = s1;
```

这个例子在写法上和上面的例子看起来一致，但是在行为上有很大的差别。下图说明了`String`类型底层所做的逻辑。`String`类型由左侧三部分组成：一个指向heap的内存地址，表示长度的值，表示容量的值，这组数据存储在stack上。右侧是heap上存储数据的内存。
<!-- ![img4-1](https://gitee.com/ksleo/source/raw/master/trpl04-01.svg) -->
<img src='https://gitee.com/ksleo/source/raw/master/trpl04-01.svg' style='display:block' width=350 height='auto'>
length是指数据具体使用的内存字节长度，capacity是`String`类型从内存调度器申请到的内存字节长度。

当把`s1`赋值给`s2`时，`String`数据被复制了，也就是指针、长度和容量这个数据结构被复制了，而具体存储在heap上的数据并没有被复制。
<img src='https://gitee.com/ksleo/source/raw/master/trpl04-02.svg' style='display:block' width=350 height='auto'>

如果`s2 = s1`这段代码执行heap复制，如果在heap上的数据量过大，这将会是一个很昂贵的操作，性能带来损耗并且双倍的内存占用。
<img src='https://gitee.com/ksleo/source/raw/master/trpl04-03.svg' style='display:block' width=350 height='auto'>

之前提到变量所在作用域执行结束时，Rust会自动调用`drop`方法释放该段内存。但是在上面的例子中会出现问题：作用域结束时，`s1`和`s2`都执行释放操作，但是这两个指针指向的是同一个地址，这就会引起*多次释放同一内存*的问题。为了确保内存安全，Rust在这种情况下有其他一些细节：Rust不会去复制heap内存，而是认为`s1`已经是一个无效引用，在作用域执行结束时，Rust不会执行任何与`s1`相关的释放操作。

```rust
let s1 = String::from("hello");
let s2 = s1;

println!("{}", s1);

// error[E0382]: borrow of moved value: `s1`
```
执行以上代码，编译器会抛出错误。

如果你熟悉深复制和浅复制的概念，之前`String`类型下复制指针、长度和容量数据结构的操作，就可以认为是浅复制。但是由于Rust同时又让第一个值`s1`失效了，因此在Rust中称为*move*而不是*shallow copy*。在刚才的例子中，可以认为`s1`*move*到了`s2`。
<img src='https://gitee.com/ksleo/source/raw/master/trpl04-04.svg' style='display:block' width=350 height='auto'>

#### Ways Variables and Data Interact: Clone

如果我们执行heap数据深复制，而不仅仅是stack浅复制，可以调用`clone`方法。
```rust
let s1 = String::from("hello");
let s2 = s1.clone();

println!("s1 = {}, s2 = {}", s1, s2);
```

#### Stack-Only Data: Copy

```rust
let x = 5;
let y = x;

println!("x = {}, y = {}", x, y);
```
这段代码执行不会有任何问题。但这与刚刚得到到结论出现了分歧：在没有调用clone得情况下，`x`仍然是有效的，看似没有发生*move*。

原因在于整型变量是编译时大小固定的，存储在stack上，并且其值很容易复制。也就是说没有必要在`y`创建后，将`x`标记为失效。也就是说在这种情况下，浅复制和深复制没有任何区别，所以就算调用`clone`方法，也不会与浅复制在行为上有任何的不同。

Rust有一个特殊的标记被称作`Copy` trait。一切在stack上存储的数据类型都可以理解为存在这个`Copy` trait。如果一个类型有`Copy` trait，旧的变量被分配给新的变量后仍然是有效的。Rust不允许我们给任何实现，或者其任何一部分实现了`Drop` trait的类型做`Copy` trait标记。

任何基础数据类型的组合是`Copy`的，凡是不需要分配或属于某种形式的资源的，都是`Copy`。下面是一些`Copy`类型举例：
   - 所有整型，例如`u32`。
   - 所有浮点，例如`f64`。
   - `bool`。
   - `char`。
   - 只包含`Copy`类型的tuples。比如`(u32, u64)`是`Copy`，`(u32, String)`不是。

### Ownership and Functions
把值传递给函数参数和传递给变量，在语义上是相似的，比如都会执行*move*或者复制。用一个例子说明
```rust
fn main() {
    let s = String::from("hello");  // s comes into scope
    
    takes_ownership(s); // s's value moves into the function 
                                     // and so is no longer valid here

    let x = 5;                  // x comes into scope

    makes_copy(x);     // x would move into the function,
                                     // but i32 is Copy, so it’s okay to still
                                     // use x afterward

} // Here, x goes out of scope, then s. But because s's value was moved, nothing
  // special happens.

fn takes_ownership(some_string: String) { // some_string comes into scope
    println!("{}", some_string);
} // Here, some_string goes out of scope and `drop` is called. The backing
  // memory is freed.

fn makes_copy(some_integer: i32) { // some_integer comes into scope
    println!("{}", some_integer);
} // Here, some_integer goes out of scope. Nothing special happens.
```

### Return Values and Scope
函数返回值也会使ownership发生转移。
```rust
fn main() {
    let s1 = gives_ownership();         // gives_ownership moves its return
                                        // value into s1

    let s2 = String::from("hello");     // s2 comes into scope

    let s3 = takes_and_gives_back(s2);  // s2 is moved into
                                        // takes_and_gives_back, which also
                                        // moves its return value into s3
} // Here, s3 goes out of scope and is dropped. s2 goes out of scope but was
  // moved, so nothing happens. s1 goes out of scope and is dropped.

fn gives_ownership() -> String {             // gives_ownership will move its
                                             // return value into the function
                                             // that calls it

    let some_string = String::from("hello"); // some_string comes into scope

    some_string                              // some_string is returned and
                                             // moves out to the calling
                                             // function
}

// takes_and_gives_back will take a String and return one
fn takes_and_gives_back(a_string: String) -> String { // a_string comes into
                                                      // scope

    a_string  // a_string is returned and moves out to the calling function
}
```
变量的ownership遵循同一套模式：赋值给其他变量，ownership就会转移。当一个变量的数据存储在heap上时，它所在的作用域在执行完毕后，该变量的heap空间就会被释放，除非它把ownership转移给其他变量。

如果我们只想在函数中使用变量而不想转移其ownership呢？想一想除了要把函数主体逻辑的结果返回，还要要把传进函数的ownership再传出去，这也太操蛋了。我们可以通过`Tuple`实现这个需求。
```rust
fn main() {
    let s1 = String::from("hello");

    let (s2, len) = calculate_length(s1);

    println!("The length of '{}' is {}.", s2, len);
}

fn calculate_length(s: String) -> (String, usize) {
    let length = s.len(); // len() returns the length of a String

    (s, length)
}
```
对于一个常见的概念来说，不应该做这么多大量的额外工作。好在Rust已经实现了这个功能，称之为*references*。

## Section 2 - References and Borrowing
之前我们在`calculate_length`中返回了一个元组用于返回函数结果和ownership，以便我们在函数调用完成后可以继续使用`s1`变量。因为之前提过，传参和赋值在行为上差不多是一致的，`s1`变量传参进入`calculate_length`函数后，其ownership也被转移到了函数内部，`s1`此时是不可用的了。

下面是一个通过传入一个变量的reference，来控制ownership不被传递到函数内部的例子。
```rust
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1);

    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize { // s is a reference to a String
    s.len()
} // Here, s goes out of scope. But because it does not have ownership of what
  // it refers to, nothing happens.
```
首先Tuple被删除了，其次参数的定义和传递都加了一个`&`符号，这个符号代表的就是*references*，引用可以只读变量的值而不转移其所有权。
<img src='https://gitee.com/ksleo/source/raw/master/trpl04-05.svg' style='display:block' width=500 height='auto'>
:::tip Note
与*reference*相对的操作称为*dereference*，运算符是`*`。
:::

`&s1`这种语法创建了一个引用，指向被引用的值，但是不转移原变量的所有权。因为没有所有权，所以函数结束时，它指向的heap区域不会被释放。当函数参数以引用方式传递时，函数不再需要显式的返回所有权，因为所有权一开始就没有发生转移。

引用作为函数参数称之为*borrowing*。如果我们尝试改变引用，编译器会报错。
```rust
fn main() {
    let s = String::from("hello");

    change(&s);
}

fn change(some_string: &String) {
    some_string.push_str(", world");
}

// error[E0596]: cannot borrow `*some_string` as mutable, as it is behind a `&` reference
```
和变量的默认行为相同，引用也是immutable的。

### Mutable Reference
只需要进行一个改动，就可以获取一个mutable的引用。即在函数定义和调用的时候，在`&`操作符后加上`mut`关键字。
```rust
fn main() {
    let s = String::from("hello");

    change(&mut s);
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}
```
可变引用有一个限制，同一个作用域下，对同一个数据只能有一个可变引用。
```rust
let mut s = String::from("hello");

let r1 = &mut s;
let r2 = &mut s;

println!("{}, {}", r1, r2);
// error[E0499]: cannot borrow `s` as mutable more than once at a time
```

这样做的好处在于避免在编译阶段造成数据竞争。数据竞争和竞态条件相似，在以下三个行为发生时会引发竞态：
 - 两个以上指针同时访问同一资源。
 - 至少一个指针正在被用于写操作。
 - 没有用于同步访问数据的机制。

数据竞争在运行时调试时很难找出问题并且解决它。Rust中不会发生这种情况，因为代码有可能引发竞态时，编译阶段就不会通过。

```rust
let mut s = String::from("hello");

let r1 = &s; // no problem
let r2 = &s; // no problem
let r3 = &mut s; // BIG PROBLEM

println!("{}, {}, and {}", r1, r2, r3);

// error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable
```
当存在immutable的引用时，不可以创建mutable的引用。可以存在多个immutable引用，因为仅仅读数据并不会造成脏读。

引用的生命周期从定义它开始，到最后一次使用它结束，下面的代码编译是可以通过的，因为在mutable引用创建之前，immutable引用的生命周期就结束了。

```rust
let mut s = String::from("hello");

let r1 = &s; // no problem
let r2 = &s; // no problem
println!("{}, {}", r1, r2);
let r3 = &mut s; // no problem

println!("{}", r3);

// error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable
```
尽管这类编译错误非常令人烦躁，但是在编译阶段明确指出问题所在总好过在运行时出错。

### Dangling References

悬空指针是指针指向的地址，被其他操作释放掉了。Rust编译器保证不会出现悬空指针：如果有一个指针指向一块内存区域，编译器会保证在这块内存区域的数据被使用前，该指针所在的作用域不会结束。

下面是一个创建悬空指针的例子。
```rust
fn main() {
    let s = dangle();
}

fn dangle() -> &String {
    let str = String::from("hello");

    &str
}
```
这段代码编译器会报错，其中有这样一条帮助信息：
> this function's return type contains a borrowed value, but there is no value for it to be borrowed from

因为`s`是在`dangle`函数中创建的，当`dangle`函数执行结束，`s`指向的内存区域也被释放了，意味着我们返回了一个不合法的`String`引用，Rust编译器是不会允许此类情况发生的。

解决方法是直接返回原变量，也就是转移所有权，这样在函数结束后相关内存就不会被释放，因为所有权被转移到了外部变量。
```rust
fn dangle() -> String {
    let str = String::from("hello");

    str
}
```

### The Rules of References

 - 任何情况下都只能有一个mutable引用或多个immutable引用。
 - 引用必须是有效的。

## Section 3 - The Slice Type

另外一种没有所有权的数据类型是切片，切片引用一段集合上连续的元素。

引入一个小例子：写一个函数，接受一个String作为参数，返回它里面的第一个词。如果String中没有匹配到空格，说明传入的是一个词，此时返回原参数。

考虑一下这个函数的声明该怎么写
```rust
fn first_word(s: &String) -> ?
```

这个方法中我们不想要获取所有权，所以传入一个引用。但是它应该返回什么类型？第一种方案可以返回结果的最后一个字母的下标。
```rust
fn first_word(s: &String) -> usize {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().emumrate() {
        if item == b' ' {
            return i;
        }
    }
    s.len()
}
```
这个方法的问题在于，它返回的下标仅在`&String`上下文中有意义，如果该引用的值被修改了，则之前的运算值也不正确了。如果我们返回的是前后两个下标`fn second_word(s: &String) -> (usize, usize) {`，那么这种方式就更加脆弱，此时已经有三个不相关的变量需要保持数据同步了。

### String Slices

字符串切片是字符串其中一段内容的引用。字符串切片可以使用下面的方法创建
```rust
let s = String::from("hello world");

let hello = &s[0..5];
let world = &s[6..11];
```

切片和引用是类似的，不过是用`[start_index..end_index]`这种方式截断了字符串的一部分，该区间是左闭右开的。切片内部实现存储的是首地址和切片长度。
<img src='https://gitee.com/ksleo/source/raw/master/trpl04-06.svg' style='display:block' width=500 height='auto'>

Rust的`..`范围语法，如果定义的范围从0开始，那么0可以不写。所以，下面两种写法是一样的。
```rust
let s = String::from("hello");

let slice = &s[0..2];
let slice = &s[..2];
```
如果范围是从头部到尾部，那么两边的数字都可以省略掉。
```rust
let s = String::from("hello");

let len = s.len();

let slice = &s[0..len];
let slice = &s[..];
```
:::warning 注意
字符串切片下标必须是在合法的utf8字符边界处，如果下标处于多字节字符之中，程序会抛出错误。
:::

有了这些相关概念，之前的`first_word`函数可以做一些修改。
```rust
fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if (item == b' ') {
            return &s[0..i];
        }
    }
    &s[..]
}
```

之前的函数，在调用之后清空原来的string，编译阶段不会出错，但是在运行时会引发bug。现在经过改造之后的方法，在编译阶段就会指出问题所在。
```rust
fn main() {
    let mut s = String::from("hello world");

    let word = first_word(&s);

    s.clear(); // error!

    println!("the first word is: {}", word);
}

// error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable
```
回顾之前的规则，当存在immutable的引用时，不能同时存在mutable的引用。`clear`方法需要清空原字符串，所以它需要一个mutable的引用，Rust是不允许的并在编译阶段直接抛错。Rust编译器不光让自定义API更加易用，并且在编译阶段排除了许多潜在bug。

#### 字符串字面量是切片类型

之前提到，字符串字面量直接存储在二进制文件中。
```rust
let s = "hello";
```
这里变量`s`的类型是`&str`，它是一个切片，指一个向二进制文件中字面量存储位置的指针。这就是为什么字符串字面量不可以修改了，因为`&str`是一个immutable引用。

#### 字符串切片作为函数参数

之前的`first_word`函数，有一个更好的定义方式是
```rust
fn first_word(s: &str) -> &str
```
此时我们可以传`&String`类型或者`&str`类型。

```rust
fn main() {
    let my_string = String::from("hello world");

    // first_word works on slices of `String`s
    let word = first_word(&my_string[..]);

    let my_string_literal = "hello world";

    // first_word works on slices of string literals
    let word = first_word(&my_string_literal[..]);

    // Because string literals *are* string slices already,
    // this works too, without the slice syntax!
    let word = first_word(&my_string);
}
```

### 其他切片类型

数组切片
```rust
let arr = [1,2,3,4,5];
let arr_slice = &[0..2];
```
`arr_slice`是`&[i32]`类型的，它跟`&str`的表现没有任何区别：存储一个头指针和内容长度。
