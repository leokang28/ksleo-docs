# Chapter 1 - Common Concepts

## Section 1 - Variables and Mutability

### 变量定义

Rust定义变量的方式
```rust
let x = 10
```
Rust的变量默认是Immutable，可通过`mut`关键字修改。
```rust
let x = 10
x = 20 //error: cannot assign twice to immutable variable

let mut x = 10
x = 20 //success
```
### Immutable与const的区别

Rust变量默认不可重复赋值，const常量同样也不允许重复赋值，这二者的区别在于：
 - 变量用`let`关键字，常量用`const`关键字。
 - 变量可以用`mut`关键字修饰，常量不行。
 - 常量初始化要带数据类型声明，例如：
 ```rust
 const NUM:i32 = 10
 ```
 - 常量可以在任何上下文中定义，变量不能在定义在全局上下文中。
 - 常量大部分情况下只用于常量赋值表达式，而不会用于赋值函数运算结果等运行时计算的表达式。

### 变量覆盖（Shadows）
let关键字可重复声明同一变量名，后声明的会覆盖之前声明的。
```rust
let x = 5;

let x = x + 1;

println!("The value of x is: {}", x);

let x = x * 2;

println!("The value of x is: {}", x);

// output
// The value of x is: 6
// The value of x is: 12
```
之前提到，设置一个变量mutable可以用关键字`mut`，可以对其进行重复赋值。变量覆盖看起来功能相似，但是它在改变了变量值的同时，保持了Rust的Immutable特性，其安全性没有降低。另外，变量覆盖本质上是定义了一个新的变量，因此我们可以用同一个变量名但是使用不同的数据类型。
```rust
let x = 5;

println!("{}", x);

let x = "string";

println!("{}", x);

//output
// 5
// string
```




## Section 2 - Data Types

### 整型（Integer）
Length|Signed|Unsigned
:-|:-|:-
8-bit|i8|u8
16-bit|i16|u16
32-bit|i32|u32
64-bit|i64|u64
128-bit|i128|u128
arch|isize|usize
无符号整型范围：0 ~ $2^n - 1$，有符号整型范围：$-2^{n-1}$ ~ $2^{n-1} - 1$

#### 整型字面量
Number|literals	Example
:-|:-
Decimal|98_222
Hex|0xff
Octal|0o77
Binary|0b1111_0000
Byte|(u8 only)	b'A'

:::tip 溢出（Integer Overflow）
当发生整型溢出，debug模式程序会报错退出，release编译模式会将高位截断（`u8`256 -> 0）。
:::

### 浮点（Floating—Point）
浮点数表示遵循IEEE-754标准，浮点数有两种基本类型`f32`单精度浮点和`f64`双精度浮点，Rust默认是`f64`，因为在现代cpu中，`f64`的运算速度和`f32`相当，同时具有更高的精度。

### 布尔（Boolean）
只有`true`和`false`两个值，大小为1byte。

### 字符（Character）
用单引号表示char类型（双引号是string），大小为4byte，为Unicode编码。

### 元组（Tuple）
元组是常用的将一组数字类型（浮点、整型）的数据组合的类型，不可动态扩容。解构元组时定义的变量要和元组的数据量对应，或者用`_`占位，也可以通过索引访问。
```rust
fn main() {
// tuple声明
let x = (1,2,3);
// 解构
let (a, b, c) = x;

let (a, _, _) = x;
let (_, b, _) = x;
let (_, _, c) = x;

let first = x.0;
let second = x.1;
let third = x.2;

//let (a, b) = x; error
}
```

### 数组（Array）
数组中的元素类型必须一致，不可动态扩容。与Vector不同，Vector是标准库提供的一种数据存储结构，支持动态扩容。

##### 数组定义方式
```rust
// 编译器推断类型和数量
let x = [1, 2, 3];
// 指定类型和数量
let x:[i32; 3] = [1, 2, 3];
// 所有元素都是相同的
let x:[3; 5]
```

#### 数组访问
通过下标的形式，不允许越界。
```rust
x[0]

x[5] //error bounds:
```

## Section 3 - Functions
函数由`fn`关键字、函数名、参数列表（parameters）、返回类型、作用域块组成。
```rust
fn main() {
println!("Hello, world!");

another_function();
}

fn another_function() {
println!("Another function.");
}

// output
// Hello, world!
// Another function.
```
Rust对声明顺序不敏感，调用的函数只要有声明就行。

### 函数参数

函数的参数列表是函数声明的一部分，参数列表多个参数用逗号分割。形参（parameters），实参（arguments）。函数参数列表（parameters）必须指明参数类型

### 函数体

函数体由表达式（expression）结尾的一系列语句（statement）组成。statement表示执行某些操作，不会返回值；expression会进行计算并返回值。

```rust
let x = (let y = 6);
```
以上代码会报错，`let y = 6`是一个声明语句（statement），statement是不能作为赋值语句的右值的，因为赋值语句的右值必须能返回值赋给左值。

函数调用和作用域块都是表达式。
```rust
// function invoke
let y = func();

// block scope
let y = {
let x = 3;
x + 1
};
```
注意x + 1后面没有分号，这也是表达式和语句的区别，语句都以分号结尾，而表达式不包含分号。表达式加分号会成为语句。

:::tip tip
Rust中有一个空类型`()`，所有语句和没有返回值的函数，Rust会自动返回空类型。
:::

### 函数返回值
函数返回类型定义在参数列表（parameters）之后。
```rust
fn func() -> i32 {
1
}
```
Rust在函数体最后可以用表达式代替return关键字返回值（该表达式不能加分号，否则会变成语句，且该表达式只能位于函数体最后）。

## Section 4 - Comments

注释，对代码加以说明，起辅助作用，给人读的内容而不是机器。用`//`开头，不能跨行。
```rust
// 一行注释
let a = 10;
```

## Section 5 - Control Flow

### if条件表达式
由关键字`if`开始，后面紧跟一个条件表达式，该表达式返回值只能是`boolean`类型。之后跟一个作用域块，条件不匹配时使用`else`关键字，后面接一个作用域块。
```rust
let number = 3;

if number < 5 {
println!("condition was true");
} else {
println!("condition was false");
}
```
#### 多条件时用`else if`
```rust
let number = 6;

if number % 4 == 0 {
println!("number is divisible by 4");
} else if number % 3 == 0 {
println!("number is divisible by 3");
} else if number % 2 == 0 {
println!("number is divisible by 2");
} else {
println!("number is not divisible by 4, 3, or 2");
}
```
#### 在`let`语句中使用if表达式
由于if是一个表达式，所以它可以用于let语句的右值。这种情况下，if表达式各条件分支返回的数据类型必须一致，这是因为在编译阶段Rust必须确定变量的类型，编译器不支持运行时动态确定变量类型，这样会使编译器更加复杂并且安全性降低。
```rust
let condition = true;
let number = if condition { 5 } else { 6 };

let number = if condition { 5 } else { "six" };
// error if and else have incompatible types
```

### 循环
Rust有三种执行循环的方式，`loop`,`while`和`for`。

#### loop
```rust
loop {
// do something
if condition {
break //something
}
}
```
`loop`循环执行同一段代码块。可以通过break关键字从`loop`循环中返回一个值。

#### while
```rust
fn main() {
let mut number = 3;

while number != 0 {
println!("{}!", number);

number -= 1;
}

println!("LIFTOFF!!!");
}
```
`while`循环整合了`loop`、`if`、`else`、`break`的功能，让代码块更清晰，没有很深的嵌套。

##### for
```rust
fn main() {
let a = [10, 20, 30, 40, 50];

for element in a.iter() {
println!("the value is: {}", element);
}
}
```
`for`用来遍历集合中的元素。同`while`通过下标访问的方式相比，`for`更快更安全，原因在于：
 - 编译器会加入runtime代码，在每次`while`循环时检查循环条件。
 - 通过下标访问难免出现越界和遗漏等bug。
基于以上优点，`for`循环使用的频率最高，就算在非遍历集合的场景下。
```rust
fn main() {
for number in (1..4).rev() {
println!("{}!", number);
}
println!("LIFTOFF!!!");
}
// 3!
// 2!
// 1!
// LIFTOFF!!!
```
上面代码中`(1..4)`是标准库中的`Range`类型。按顺序生成**左闭右开**的集合序列，可以通过`rev`方法进行逆转。