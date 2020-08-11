# Chapter 3 - Using Structs to Structure Related Data
结构体是一个编码者自定义的数据类型，可以让编码者自己命名，组织一些数据形成一个有特殊意义的集合。跟面向对象概念中的对象概念类似。结构体和枚举是创建新类型的基础，以致能够充分利用Rust编译器做类型检查。

## Section 1 - 结构体的定义和实例化

结构体跟元组有些类似，它内部的数据也可以是不同的类型。与元组不同的地方是，你可以对每个数据命名，便于理解这些数据具体代表的是什么含义。由于有了这些名称，你不再需要像元组一样按顺序访问内部元素。

`struct`关键字后加一个名称就定义了一个结构体。结构体的自定义名称应该是充分语义化的，能够传达内部数据为何要组织在一起。在花括号中，定义了每个元素的名称和类型，这些内部元素称之为*fields（字段）*。
```rust
struct User {
    username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}
```

通过结构体生成的变量称之为*instance（实例）*。创建一个实例需要指明使用的结构体名称，并且以*key-value*的形式填充每一个字段。key是在结构体中定义好的字段名称，value是我们想要在对应的字段中存储的数据。实例化的时候，字段顺序不需要和结构体定义的顺序一致。
```rust
let user1 = User {
    email: String::from("someone@example.com"),
    username: String::from("someusername123"),
    active: true,
    sign_in_count: 1,
};
```

获取实例中的数据可以通过点操作符，例如`user1.email`。只要该实例是mutable的，我们就可以对它上面的字段数据做修改，例如`user1.mail = String::from("anotheremail@example.com");`。需要注意，在改变数据时，实例本身需要是mutable的，Rust不允许仅其中某些字段为mutable。

与其他表达式一样，可以在函数最后实例化一个结构体并将其作为函数返回值。
```rust
fn build_user(email: String, username: String) -> User {
    User {
        email: email,
        username: username,
        active: true,
        sign_in_count: 1,
    }
}
```

### 实例化简写
因为参数名和字段名是完全相等的，可以通过字段初始化简写语法来创建实例。
```rust
fn build_user(email: String, username: String) -> User {
    User {
        email,
        username,
        active: true,
        sign_in_count: 1,
    }
}
```

### 通过其他实例创建新实例
通过已经存在的实例创建新实例是一个非常便捷的方法，并且可以使用结构体更新语法。先看一下使用普通方法的例子
```rust
let user2 = User {
    email: String::from("another@example.com"),
    username: String::from("anotherusername567"),
    active: user1.active,
    sign_in_count: user1.sign_in_count,
};
```
创建一个新实例`user2`，并且`active`和`sign_in_count`这两个字段是从`user1`取值的。使用结构体更新语法可以使代码量更少。
```rust
let user2 = User {
    email: String::from("another@example.com"),
    username: String::from("anotherusername567"),
    ..user1
};
```

### 使用元组和结构体构造新类型
我们可以定义一些像元组一样的结构体，称之为元组结构体。元组结构体具有语义化的名称，但是没有字段名，也就是说只有字段类型。元组结构体在给元组命名和与其他元组做区分时特别有用。

元组结构体的定义：`struct`关键字加一个名称，后面再跟一个括号，里面是字段类型列表。
```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

let black = Color(0, 0, 0);
let origin = Point(0, 0, 0);
```
`black`和`origin`是不同的变量，因为他们结构体的名称不同，哪怕他们内部的字段类型列表是完全一致的。元组结构体的实例和普通的元组在操作上没有任何区别。

### Unit-Like Structs Without Any Fields
结构体定义时也可以没有任何的字段，这种结构体称为*unit-like struct（类单元结构）*，因为他们的表现跟单元类型`()`相似。当你需要在某个类型上实现某些trait，但又不想存储任何数据时，类单元结构很有用。


## Section 2 - 一个结构体示例程序
写一个计算矩形面积的程序，从普通的变量开始。
```rust
fn main() {
    let width1 = 50;
    let height1 = 30;

    println!("area is {}", area(width1, height1));
}

fn area(width:u32, height:u32) -> u32 {
    width * height
}
```

矩形的高度和宽度是两个关联的变量，因为他们构成了一个矩形，但是目前在程序中看不到任何关联性，可读性太差。


### 使用元组重构
```rust
fn main() {
    let rect1 = (50, 30);

    println!("area is {}", area(rect1));
}

fn area(rect: (u32, u32)) -> u32 {
    rect.0 * rect.1
}
```
使用元组稍微有了一些结构性，但是在可读性还是不够好，因为元组不能够对字段进行命名。

### 使用结构体重构
```rust
struct Rect {
    width: u32,
    height: u32,
}
fn main() {
    let rect1= Rect {
        width: 50,
        height: 30,
    };

    println!("area is {}", area(rect1));
}

fn area(rect: Rect) -> u32 {
    rect.width * rect.height
}
```

定义一个矩形类型之后，代码目前可读性和抽象都比较好。

## Section 3 - 方法语法
方法和函数的唯一区别在于，方法是定义在类型中的，有它特定的执行上下文。方法的第一个参数永远是`self`，是一个当前调用它的实例。

### 方法定义
使用`impl`关键字。
```rust
struct Rect {
    width: u32,
    height: u32,
}

// 方法定义
impl Rect {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}
fn main() {
    let rect1= Rect {
        width: 50,
        height: 30,
    };

    println!("area is {}", rect1.area());
}
```

:::details ->和.
在C/C++中，方法的调用有两种操作符，分别是`->`和`.`。当直接在实例上调用方法时使用`.`操作符，当使用指针调用方法时使用`->`操作符。也就是说当`obj`是一个指针时，`obj->func()`和`(*obj).func()`是一样的。

Rust中没有和`->`等同的操作符，Rust的方案是自动引用和解析引用。当你通过`obj.func()`调用方法时，Rust会自动加上`&`、`&mut`和`*`，让`obj`能够跟函数声明匹配。
:::

### 多个参数的方法

```rust
fn main() {
    let rect1 = Rect {
        width: 30,
        height: 50,
    };
    let rect2 = Rect {
        width: 10,
        height: 40,
    };
    let rect3 = Rect {
        width: 60,
        height: 45,
    };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2));
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3));
}

impl Rect {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn can_hold(&self, other: &Rect) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

### 多个`impl`代码块
Rust是允许多个`impl`代码块的，例如
```rust
impl Rect {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

impl Rect {
    fn can_hold(&self, other: &Rect) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```