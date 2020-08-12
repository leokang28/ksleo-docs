# Chapter 4 - Enums and Pattern Matching

*enumerations枚举*定义一个类型，用来穷举所有可能的数据。很多语言都有枚举类型，但它们的含义和用法有些差别。Rust更接近于函数式编程语言中的枚举类型，*algebraic data types*。

## Section 1 - 定义一个枚举
先考虑一个场景，在这个场景下枚举比结构体更适合，比如需要做一个IP地址相关的功能。目前IP地址有个两个版本在使用中，V4和V6。所有IP地址只可能是这两个版本其中之一，所以我们可以用枚举穷举所有可能性。

IP地址这种确定性（只能在这两个版本中，总的集合确定）和互斥性（只能是其中之一）是枚举类型最好的使用场景。而且不管是哪个版本，归根结底它都是IP地址，它们属于同一类型，所以在编码过程中需要把它们当作同一个类型去操作。

下面用代码说明，首先创建一个IP地址枚举类型。
```rust
enum IpAddrKind {
    V4,
    V6,
}
```

### 枚举值
实例化枚举值
```rust
let v4 = IpAddrKind::V4;
let v6 = IpAddrKind::V6;
```
注意这两个值都是在`IpAddrKind`命名空间下的。这表示V4和V6都是同一类型的值，这种方式是很有用的，在后续处理中可以把它们都当作`IpAddrKind`类型来处理。比如定义一个函数接受`IpAddrKind`类型的数据。
```rust
fn route(address: IpAddrKind) {}
```
这个函数可以这样调用：
```rust
route(IpAddrKind::V4);
route(IpAddrKind::V6);
```

使用枚举还有很多其他好处。比如，我们在存储IP地址时，不知道它是V4还是V6版本的，只知道是一个IP地址，也就是说我们只知道它的类型。我们使用之前的结构体来写一下代码。
```rust
enum IpAddrKind {
    V4,
    V6,
}

struct IpAddr {
    type: IpAddrKind,
    address: String,
}

let home = IpAddr {
    type: IpAddrKind::V4,
    address: String::from("127.0.0.1"),
}

let loopback = IpAddr {
    type: IpAddrKind::V6,
    address: String::from("::1"),
}
```

这里定义了一个`IpAddr`类型来存储IP地址数据，它有两个字段：`type`是`IpAddrKind`类型的IP地址版本，`address`是`String`类型的IP地址数据。

有一种更简洁的方式，仅用枚举类型来表示，而不需要结构体嵌套枚举类型。这种方式是将数据直接存入枚举变体的实例中。`IpAddrKind`枚举的定义也需要更改一下。
```rust
enum IpAddrKind {
    V4(String),
    V6(String),
}

let home = IpAddrKind::V4(String::from("127.0.0.1"));
let loopback = IpAddrKind::V6(String::from("::1"));
```

此外还有一种方式。枚举类型变体可以拥有不同的类型和数据量，因此我们可以将`V4`类型定义成由4个整型数据组成的。
```rust
enum IpAddrKind {
    V4(u8, u8, u8, u8)
}
let home = IpAddrKind::V4(127, 0, 0, 1);
```

IP地址的存取是一个非常常用的功能，因此标准库已经实现了相关定义，编码人员可以直接使用。可以看看标准库是如何实现IP地址数据的定义的。
```rust
struct Ipv4Addr {
    
}

struct Ipv6Addr {

}

enum IpAddr {
    V4(Ipv4Addr),
    V6(Ipv6Addr),
}
```

再来看另外一个例子，这个枚举类型下面有更多的字段和数据类型。
```rust
enum Message {
    Quit,
    Move {x: i32, y: i32},
    Write(String),
    ChangeColor(i32,i32,i32),
}
```
这些字段都有不同的数据类型：
 - `Quit`没有数据与它关联。
 - `Move`包含了一个匿名结构。
 - `Write`包含了一个字符串。
 - `ChangeColor`包含了3个`i32`整数。

这种方式与定义4个不同的结构体相似，不同点在于，枚举将他们都涵盖在了同一个类型`Message`下。下面都结构体定义可以与枚举变体存储一样都数据。
```rust
struct QuitMessage; // unit struct
struct MoveMessage {
    x: i32,
    y: i32,
}
struct WriteMessage(String); // tuple struct
struct ChangeColorMessage(i32, i32, i32); // tuple struct
```

枚举和结构体还有一个相似之处，都可以通过`impl`关键字对其进行方法扩展。
```rust
impl Message {
    fn call(&self) {
        // method body would be defined here
    }
}

let m = Message::Write(String::from("hello"));
m.call();
```
接下来再看另外一个标准库中很常用的枚举类：`Option`。

### `Option`枚举类及它对`Null`的优势

Option枚举类在很多地方都会用到，因为它编码了一个很常见的情景：对变量的空值判断。用类型系统涵盖这个概念，代表编译器帮我们做了空值检查，可以在编译阶段就抛出错误，避免运行时bug。并且Rust没有其他语言中`null`的功能。

null值的问题在于，当你把null作为一个非null变量使用时，会抛出一个类型错误。因为变量的空和非空是很常见的场景，很容易导致bug。但是null却描述了一个很有用的概念：一个变量因为某些原因此时不可用或不存在。

所以真正的问题不在于概念本身，而在于它的实现。因此Rust没有null值，取而代之是标准库实现的枚举类型用来描述值是否存在。这个枚举类型是`Option<T>`，它的定义如下
```rust
enum Option<T> {
    Some<T>,
    None,
}
```

`Option`是默认引入的，不需要手动引入命名空间，它的枚举变体也是默认引入的，调用时不需要加`Option::`前缀。`<T>`是一个范型参数，它可以代表任何类型，表示`Some`可以存储任何类型的数据。下面是一些使用的例子
```rust
let some_number = Some(5);
let some_str = Some("a string");

let absent_num: Option<i32> = None;
```
当使用`None`时，需要指定范型是哪种数据类型，因为编译器无法通过`None`去推断`Some`的正确类型。

为何使用`Option<T>`要优于使用null值？简单来说，`Option<T>`和`T`不是同一类型，编译器不会让我们使用`Option<T>`类型的值，就算它是一个有效值。
```rust
let x:i8 = 5;
let y:Option<i8> = Some(10);
let sum = x + y;

// error[E0277]: cannot add `std::option::Option<i8>` to `i8`
```

如果运行这段代码，编译器会直接抛错。编译器不知道如何将`i8`类型和`Option<i8>`类型的数据作加法计算。当变量是`i8`类型时，编译器可以保证此时一定是一个有效值，所以不需要担心值不存在。当使用`Option<T>`类型的变量时，我们需要考虑值不存在的情况，编译器需要确保我们对这种情况做了处理。

也就是说，在使用之前，需要先将`Option<T>`转换成`T`类型。在这个过程中可以捕获最常见的值为空但被错误使用的错误情况。

如果一个值可能为空，首先必须手动指定该值为`Option<T>`类型。然后在使用该值时，处理值为空的逻辑是必须的。所以任何非`Option<T>`类型的数据，都可以被认为是非null的。这是Rust刻意的设计，为了限制代码中null值泛滥，增强代码的安全性。`Option<T>`有很多的方法扩展，可以读一下它的[文档](https://doc.rust-lang.org/std/option/enum.Option.html)。熟悉`Option<T>`的内部方法对学习Rust很有好处。

通常为了使用`Option<T>`内部的`T`值，你的代码需要覆盖所有的枚举变体。某些代码仅在`Some<T>`运行，此时代码能够访问到内部的`T`数据。某些代码仅在`None`运行，作空值逻辑处理。`match`表达式是可以实现上述需求的一个控制流程。

## `match`流程控制表达式

`match`可以通过许多的*patterns（匹配模型）*去对比，并在相应的匹配模型命中的情况下执行某些代码。匹配模型可以是字面量值、变量、通配符等等。`match`流程控制强大之处在于丰富的匹配模型，以及编译器可以确认所有的可能情况都被涵盖。

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> i8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```
分析一下这段代码。`match`后紧跟一个表达式，在这里是变量`coin`。这里跟`if`有点类似，但是`if`后的表达式需要返回`bool`值，而`match`后可以返回任何类型的数据。

接下来是*match arms*。每个arm由两个部分组成：一个匹配模型、一部分代码，两部分用`=>`操作符分割。arm之间使用逗号分割。

当`match`表达式执行时，首先将结果值和匹配模型对比，如果某个匹配模型被命中，则它后面的代码会被执行，否则进入下一个arm进行对比。

每个arm要执行的代码是一个表达式，其返回值作为`match`表达式的返回值。如果需要执行多行代码，可以用花括号组成代码块。

### 匹配模型绑定的数据

`match`表达式的匹配模型可以绑定一些数据，这也是提取枚举变体中数据的方式。修改一下代码
```rust
#[derive(Debug)]
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("State quarter from {:?}!", state);
            25
        }
    }
}
```

上面的代码在`Coin::Quarter`匹配模型中绑定了一个变量`state`，当该匹配模型命中时，`state`变量会绑定`Quarter`枚举变体中存储的数据，并且在该匹配模型后面的代码中，我们可以通过`state`变量使用这个数据。

假如调用`value_in_cents(Coin::Quarter(UsState::Alabama));`，变量`coin`的值为`Coin::Quarter(UsState::Alabama)`。在match表达式中，最后一个匹配模型会命中，此时`state`变量绑定的值将会是`UsState::Alabama`，然后可以在`println!`表达式中使用该匹配模型内部绑定的状态值。

### Matching with Option<T>

