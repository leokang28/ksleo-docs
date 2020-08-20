# Generic Types, Traits, and Lifetimes

每种语言都有针对概念抽象的有效工具。Rust中的工具之一是*generic（泛型）*。泛型是对类型或其他属性的抽象。在编码时，我们可以专注于表达泛型的行为或者与其他泛型之间的关系，而不用在意它在运行时代表的是什么类型的数据。函数也可以接收一些泛型参数而不是具体类型的参数。

### 抽象函数删除重复代码

在学习泛型之前，我们先看一下如何通过函数抽象来解决代码重复的问题，然后我们会将泛型参数再加入进来。

先看一个寻找数组中最大数的示例。
```rust
fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let mut largest = number_list[0];

    for number in number_list {
        if number > largest {
            largest = number;
        }
    }

    println!("The largest number is {}", largest);
}
```

如果我们要寻找另外一个数组中的最大数，可以重复这段代码。
```rust
fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let mut largest = number_list[0];

    for number in number_list {
        if number > largest {
            largest = number;
        }
    }

    println!("The largest number is {}", largest);

    let number_list = vec![102, 34, 6000, 89, 54, 2, 43, 8];

    let mut largest = number_list[0];

    for number in number_list {
        if number > largest {
            largest = number;
        }
    }

    println!("The largest number is {}", largest);
}
```

可以看出除了数组中的数据不同，其他地方的逻辑完全是一样的。这样写代码虽然可以得出正确的结果，但是显得太过啰嗦而且容易出错。如果我们要修改其中的逻辑，比如改成寻找最小的数字，那么就得将所有重复的代码都改一遍。

为了去除重复代码，我们可以通过抽象一个函数，把不变的逻辑部分封装起来，可变的部分（数组）通过参数传递。这让我们的代码更加简洁，表意清晰也易于维护。
```rust
fn largest(list: &[i32]) -> i32 {
    let mut largest = list[0];

    for &item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let result = largest(&number_list);
    println!("The largest number is {}", result);

    let number_list = vec![102, 34, 6000, 89, 54, 2, 43, 8];

    let result = largest(&number_list);
    println!("The largest number is {}", result);
}
```

## Section 1 - 泛型

泛型即通用类型，是在运行时才确定具体运算类型的技术。通过泛型声明函数和结构体，在调用时可以使用多种数据类型。首先看看如何通过泛型声明函数、结构体、枚举和方法等，之后再讨论一下泛型对于性能的影响。

### 函数声明

使用泛型声明函数时，我们使用泛型变量来替代参数和返回值的数据类型。
```rust
fn largest_i32(list: &[i32]) -> i32 {
    let mut largest = list[0];

    for &item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn largest_char(list: &[char]) -> char {
    let mut largest = list[0];

    for &item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let result = largest_i32(&number_list);
    println!("The largest number is {}", result);

    let char_list = vec!['y', 'm', 'a', 'q'];

    let result = largest_char(&char_list);
    println!("The largest char is {}", result);
}
```

上面分别有两个函数`largest_i32`和`largest_char`，它们接收不同的数据类型，但是内部所做的事是一样的逻辑。所以这两个函数可以通过泛型抽象成一个函数。

在函数中将类型参数化，需要对类型参数命名，就像对普通参数命名那样。可以用一个标识符来表示类型参数，习惯上我们会用`T`来表示，因为T是type的缩写。

在函数体中使用参数时，需要先在函数声明中对参数命名，好让编译器知道这个名称的含义是什么。同样的，当我们在函数声明中使用类型参数前，需要对其进行命名。类型参数需要用`<>`包起来，并且置于函数名和参数列表之间。
```rust
fn largest<T>(list: &[T]) -> T {
```

这个声明的含义是，`largest`函数接收一个泛型`T`，参数`list`是泛型`T`的切片，函数返回一个`T`类型的值。

接下来将`largest_i32`和`largest_char`函数通过泛型抽象为一个函数。
```rust
fn largest<T>(list: &[T]) -> T {
    let mut largest = list[0];

    for &item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}
fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let result = largest(&number_list);
    println!("The largest number is {}", result);

    let char_list = vec!['y', 'm', 'a', 'q'];

    let result = largest(&char_list);
    println!("The largest char is {}", result);
}
```

此时代码编译会提示一个错误
> error[E0369]: binary operation `>` cannot be applied to type `T`

这里的出现错误的原因是，`>`操作符不能在所有可能的数据类型上运算。为了进行比较运算，标准库提供了`std::cmp::PartialOrd`trait，类型实现它就可以获得进行比较运算的能力。这个在后续章节中会介绍到。

### 结构体声明

我们也可以使用泛型对结构体的字段进行声明。跟函数声明没什么不同。
```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let integer = Point { x: 5, y: 10 };
    let float = Point { x: 1.0, y: 4.0 };
}
```
可以使用多个泛型参数来代表多种不同的类型。
```rust
struct Point<T, U> {
    x: T,
    y: U,
}

fn main() {
    let integer = Point { x: 5, y: 10.0 };
    let float = Point { x: 1.0, y: 4 };
}
```
但是泛型参数的数量不宜过多，否则代码可读性会变差。当你需要使用到多个泛型变量时，说明你的代码需要重构到更细颗粒度。

### 枚举声明

跟结构体声明一样，没有什么特别。比如之前多次使用到的`Option<T>`和`Result<T, E>`枚举。
```rust
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

当你的代码出现多个相似的结构体和枚举，这些结构体和枚举仅仅只有数据类型不同时，就可以使用泛型对其进行抽象。

### 方法声明
```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

fn main() {
    let p = Point { x: 5, y: 10 };

    println!("p.x = {}", p.x());
}
```

泛型参数`T`被置于`impl`关键字之后，方法名之后的泛型参数就可以省略不写。

```rust
impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```
这段代码的含义是，`Point<f32>`上实现了一个方法`distance_from_origin`，对于泛型`Point<T>`，当`T`是`f32`以外的类型时，则它不具有`distance_from_origin`方法。

结构体的泛型参数不一定会被方法定义时全部使用。可以在方法上指定一些其他的泛型参数，这些泛型参数仅仅在该方法上生效。
```rust
struct Point<T, U> {
    x: T,
    y: U,
}

impl<T, U> Point<T, U> {
    fn mixup<V, W>(self, other: Point<V, W>) -> Point<T, W> {
        Point {
            x: self.x,
            y: other.y,
        }
    }
}

fn main() {
    let p1 = Point { x: 5, y: 10.4 };
    let p2 = Point { x: "Hello", y: 'c' };

    let p3 = p1.mixup(p2);

    println!("p3.x = {}, p3.y = {}", p3.x, p3.y);
}
```

### 使用泛型的代码性能

你可能会怀疑使用泛型会在运行时有一定的性能损耗。但是Rust在中使用泛型和特定的数据类型，在性能上没有任何区别。

Rust通过在编译阶段对使用了泛型的代码执行*monomorphization*来完成性能优化。*monomorphization*是在编译阶段将泛型替换成具体数据类型的进程。在这个进程中编译器执行与创建泛型函数相反的操作，编译器查看所有调用了泛型声明的代码，并且生成对应的具体数据类型的代码。

我们通过一个例子来看看它的工作原理
```rust
let integer = Some(5);
let float = Some(5.0);
```
当Rust编译这段代码，它会执行monomorphization。编译器发现有两处代码调用了`Option<T>`枚举的实体，编译器会针对这两处代码的类型分别生成对应的`Option`枚举。可以看成是抽象代码的一个逆操作
```rust
enum Option_i32 {
    Some(i32),
    None,
}

enum Option_f64 {
    Some(f64),
    None,
}

fn main() {
    let integer = Option_i32::Some(5);
    let float = Option_f64::Some(5.0);
}
```
由于Rust在编译阶段生成了相应的代码，因此在运行时就没有性能损耗了。

## Section 2 - Traits: Defining Shared Behavior

*trait*告诉编译器特定的类型下具有什么功能，并且是否对外暴露。
>trait与其他类型的`interface`概念类似，但不完全相同。

### 定义Trait

类型的行为取决于我们能在该类型上调用的方法。如果多种不同类型都可以调用同一个方法，那么它们就具有相同的行为。trait就是将这些相同方法组织在一起，定义一个行为的集合。

例如，有一些结构体能够存储一些类型和数量的文本，`NewsArticle`可以存储一个新闻内容；`Tweet`可以存储至多280个字符的文本内容，和标识它是新推文、转推还是回复其他推文的一些元数据。

我们想做一个媒体聚合库，用来展示`NewsArticle`或者`Tweet`实例的摘要内容。因此，这两种类型中都必须要有摘要数据，然后通过调用`summarize`方法来获取实例上的摘要数据。
```rust
pub trait Summary {
    fn summarize(&self) -> String;
}
```

这里用`trait`关键字定义了一个trait。在trait内部，声明了一个方法，实现这个trait的类型可以调用这个方法。

在方法声明后，没有方法体，而是用分号结束。任何实现了这个trait的类型都必须自己实现这个方法的方法体。编译器会强制限定类型中实现的方法和trait中的方法声明是完全一致的。

trait可以声明多个方法，每个方法占一行并以分号结束。

### 类型实现trait

```rust
pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool,
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}
```

在类型上实现trait和普通的方法扩展类似。不同之处在于，在`impl`之后需要加上trait名称，然后在加上`for`关键字，最后是类型名称。在`impl`代码块里有和trait一样的方法声明，但是此时需要实现方法体。

在实现trait后，就可以在`NewsArticle`和`Tweet`类型的实例上调用实现的方法了，调用方式和普通的方法一样。
```rust
let tweet = Tweet {
    username: String::from("horse_ebooks"),
    content: String::from(
        "of course, as you probably already know, people",
    ),
    reply: false,
    retweet: false,
};

println!("1 new tweet: {}", tweet.summarize());
```

注意由于我们所有代码写在一个文件中，因此我们可以直接使用，当其他人实现这个trait时，则需要通过之前章节讲的模块规则，把trait先引入然后才能使用。

trait实现的一条限制是，当被实现的trait或者要实现的类型是我们crate的本地trait或类型时，才可以进行实现。例如，可以在`Tweet`上实现标准库的`Display`trait，因为`Tweet`是我们的本地类型；也可以在`Vec<T>`上实现`Summary`trait，因为`Summary`trait是我们的本地trait。

但是我们不能在外部类型上实现外部trait，例如在`Vec<T>`上实现`Display`。这个限制是程序属性之一称之为*连贯性（coherence）*，更准确的说应该称之为*孤儿规则（orphan rule）*，之所以这样命名是因为父类型不存在。

