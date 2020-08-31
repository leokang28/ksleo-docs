# Chapter 10 - Functional Language Features: Iterators and Closures

Rust的灵感来自于现有的许多语言和技术，其中一个最重要的概念就是*函数式编程（functional programming）*。函数式编程包括，把函数当作参数传递给其他函数；从函数中返回一个函数；把函数赋值给变量延迟调用。

下面会介绍一些跟其他函数式语言类似的概念：
 - 闭包，结构类似于函数，可以存储在变量中。
 - 迭代器，处理一系列数据的一种方式。
 - 这两者的性能。

## Section 1 - Closures: Anonymous Functions that Can Capture Their Environment

Rust的闭包是一个匿名函数，你可以把它存进变量或者当作参数传给其他函数。闭包的定义和调用可以在不同时间点，不同上下文中。跟函数不同的是，闭包可以捕获他们定义所在上下文中的变量。

例如有这样一个场景：要开发一个app来为用户生成自定义的训练计划。后台使用Rust，生成算法考虑了很多因素，例如用户年龄，体重，运动经历，当前训练计划和用户自定义的强度指数等。假设这个算法需要运行几秒钟，我们只想在初始化的时候调用算法一次，免得让用户不必要的等待结果。

假设用函数`simulated_expensive_calculation`模拟算法调用：
```rust
use std::thread;
use std::time::Duration;

fn simulated_expensive_calculation(intensity: u32) -> u32 {
    println!("执行算法");
    thread::sleep(Duration::from_secs(2));
    intensity
}
```

接下来是`main`函数，包含了用户在调用训练计划时要执行的代码。*闭包（closure）*的使用和前端交互没啥关系，因此这里硬编码参数。
```rust
fn main() {
    let simulated_user_specified_value = 10;
    let simulated_random_number = 7;

    generate_workout(simulated_user_specified_value, simulated_random_number);
}
```

接下来模拟一下生成训练计划的算法函数`generate_workout`。
```rust
fn generate_workout(intensity: u32, random_number: u32) {
    if intensity < 25 {
        println!(
            "Today, do {} pushups!",
            simulated_expensive_calculation(intensity)
        );
        println!(
            "Next, do {} situps!",
            simulated_expensive_calculation(intensity)
        );
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated!");
        } else {
            println!(
                "Today, run for {} minutes!",
                simulated_expensive_calculation(intensity)
            );
        }
    }
}
```

这个代码已经实现了业务方的需求。假设大数据团队想要我们在以后修改`simulated_expensive_calculation`的调用方式。为了简化升级流程，需要重构代码，让`simulated_expensive_calculation`只执行一次。并且多次调用的地方也需要删除掉。

### Refactoring Using Functions

首先，可以将`simulated_expensive_calculation`函数的执行结果存储在变量中，需要的时候直接使用。

```rust
fn generate_workout(intensity: u32, random_number: u32) {
    let expensive_result = simulated_expensive_calculation(intensity);

    if intensity < 25 {
        println!("Today, do {} pushups!", expensive_result);
        println!("Next, do {} situps!", expensive_result);
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated!");
        } else {
            println!("Today, run for {} minutes!", expensive_result);
        }
    }
}
```

这个解决方式统一了`simulated_expensive_calculation`函数的调用，并且解决了`if`代码块中函数不必要的多次调用。但是，这种解决方案需要所有条件下的情况等待算法执行结果，哪怕最终我们不需要这个结果。

所以，我们想让代码只在需要结果的时候被调用一次。这个场景就很适用于*闭包（closure）*。

### Refactoring with Closures to Store Code

定义和储存闭包：
```rust
let expensive_closure = |num| {
    println!("calculating slowly...");
    thread::sleep(Duration::from_secs(2));
    num
};
```

闭包定义被赋值给变量`expensive_closure`。闭包定义又两个竖线`|`开头，竖线中间是传给闭包的参数。选择这种语法是因为它跟Smalltalk和Ruby相似。这个闭包有一个参数`num`，如果需要传多个参数，可以`|p1, p2, ...|`。

然后用花括号包住闭包体，可以看到就是函数中的内容。

现在`let`语句意味着`expensive_closure`变量包含一个匿名函数的定义，而不是函数的运行结果。也就是说需要在后面执行的代码存储在这个变量中。

接下来修改`generate_workout`函数中算法调用的部分。闭包调用和函数调用一样。
```rust
fn generate_workout(intensity: u32, random_number: u32) {
    let expensive_closure = |num| {
        println!("calculating slowly...");
        thread::sleep(Duration::from_secs(2));
        num
    };

    if intensity < 25 {
        println!("Today, do {} pushups!", expensive_closure(intensity));
        println!("Next, do {} situps!", expensive_closure(intensity));
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated!");
        } else {
            println!(
                "Today, run for {} minutes!",
                expensive_closure(intensity)
            );
        }
    }
}
```

现在，又引入了多次调用的问题。昂贵的计算操作会被调用多次，用户等待的时长更久。我们可以在内部的`if`块中创建一个变量存储计算结果。但是闭包提供了更好的解决方案。稍后会介绍该方案。目前先套路一下为什么闭包定义没有类型声明，也没有相关的trait。

### Closure Type Inference and Annotation

闭包不会像函数一样要求你声明参数和返回值的类型。函数要求声明类型是因为它是显式接口的一部分。严格地定义接口能够保证所有的调用者都按照你的预期来传递参数和处理返回值。但是闭包不是用于对外接口的，它是给库内部用的。

我们也可以为闭包声明类型。
```rust
let expensive_closure = |num: u32| -> u32 {
    println!("calculating slowly...");
    thread::sleep(Duration::from_secs(2));
    num
};
```

增加了类型声明之后，闭包定义更接近函数定义了。下面是函数声明语法和闭包的一个垂直对比。
```rust
fn  add_one_v1   (x: u32) -> u32 { x + 1 }
let add_one_v2 = |x: u32| -> u32 { x + 1 };
let add_one_v3 = |x|             { x + 1 };
let add_one_v4 = |x|               x + 1  ;
```

第二行是完整声明定义，跟函数一样。第三行去掉了类型声明。第四行去掉了花括号，因为闭包内容只有一个表达式，此时可以将花括号也省略。这些声明都是有效的而且功能都是完全一致的。

闭包对参数和返回值都有具体的类型推断。当我们没有指定类型时，如果我们调用了两次闭包，第一次调用时候的类型，会被编译器锁定在闭包中，如果后续调用我们用其它类型的参数，编译器就报错。

### Storing Closures Using Generic Parameters and the Fn Traits

之前的例子中，闭包被多次调用。我们可以创建一个结构体来存储闭包和闭包的运行结果。只有当结构体中还没有缓存结果值时，才会运行闭包。这种模式称为备忘录或者懒加载。

结构体存储闭包时，闭包定义需要添加类型声明。因为结构体定义中，字段类型是必须的。每个闭包示例都有唯一的匿名类型，这意味着，就算两个闭包的类型定义都一致，编译器还是认为它们是不同的类型。在结构体，枚举和函数参数中定义闭包，需要用到泛型和trait绑定。

`Fn`trait由标准库提供。所有闭包至少需要实现`Fn`，`FnMut`，`FnOnce`trait之一。

在`Fn`trait绑定上声明类型，代表闭包的参数类型和返回值类型必须和该绑定。
```rust
struct Cacher<T>
where
    T: Fn(u32) -> u32,
{
    calculation: T,
    value: Option<u32>,
}
```

`Cacher`结构体有一个`T`类型的`calculation`字段。trait绑定在`T`类型上表示这个字段是实现了`Fn`trait的闭包。如果我们想要在这个字段上存储闭包，那么这个闭包必须符合一个`u32`参数和一个`u32`返回值的声明。

`Value`字段的类型是`Option<u32>`，初始值是`None`。当其他代码需要`Cacher`中存储的闭包的运算结果时，`Cacher`会运行它存储的闭包，并且将结果返回和缓存。当再次调用`Cacher`获取闭包运算结果时，就将之前的计算结果返回。
```rust
impl<T> Cacher<T>
where
    T: Fn(u32) -> u32,
{
    fn new(calculation: T) -> Cacher<T> {
        Cacher {
            calculation,
            value: None,
        }
    }

    fn value(&mut self, arg: u32) -> u32 {
        match self.value {
            Some(v) => v,
            None => {
                let v = (self.calculation)(arg);
                self.value = Some(v);
                v
            }
        }
    }
}
```

我们希望`Cacher`自身来管理字段值，而不是让外部代码去修改，因此这些字段都是私有的，通过方法返回。

然后再修改`generate_workout`函数。
```rust
fn generate_workout(intensity: u32, random_number: u32) {
    let mut expensive_result = Cacher::new(|num| {
        println!("calculating slowly...");
        thread::sleep(Duration::from_secs(2));
        num
    });

    if intensity < 25 {
        println!("Today, do {} pushups!", expensive_result.value(intensity));
        println!("Next, do {} situps!", expensive_result.value(intensity));
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated!");
        } else {
            println!(
                "Today, run for {} minutes!",
                expensive_result.value(intensity)
            );
        }
    }
}
```

### Limitations of the `Cacher` Implementation

目前这个`Cacher`实现还有两个问题。

第一个问题是，无论`Cacher`实例接收什么参数，都返回的是第一个参数计算的结果。比如下面的测试用例会失败
```rust
#[test]
fn call_with_different_values() {
    let mut c = Cacher::new(|a| a);

    let v1 = c.value(1);
    let v2 = c.value(2);

    assert_eq!(v2, 2);
}
```

将`value`字段改为哈希表类型，通过参数来映射计算值就能解决这个问题。

第二个问题是这个`Cacher`只能存储`u32`参数类型和`u32`返回值类型的闭包。但是我们可能想存储其他类型。为了解决这个问题，可以使用多个泛型类型参数。

### Capturing the Environment with Closures

之前的例子中，我们把闭包当作匿名函数使用。闭包还有一个函数不具备的功能：闭包可以捕获它定义所在的上下文并且可以访问变量。
```rust
fn main() {
    let x = 4;

    let equal_to_x = |z| z == x;

    let y = 4;

    assert!(equal_to_x(y));
}
```

这个例子中，`x`变量不是闭包的参数，但是仍然可以被闭包访问。因为`x`变量和闭包是定义在同一个上下文环境中的。

当闭包捕获上下文的变量时，会将这些变量存储到内存中使用。大多数情况下代码执行不需要捕获上下文变量，这种内存开销是不必要的。因为函数不允许捕获它的上下文，因此执行函数不会引起这些额外的内存开销。

闭包可以通过三种方式捕获上下文信息，跟函数获取参数的三种方式对应：获取所有权、可变引用和不可变引用。这三种方式分别封装在三种`Fn`trait中。
 - `FnOnce`消费捕获的变量时，必须获取上下文变量的所有权并且传递到闭包中。Once表示闭包不能对同一个变量获取两次及以上所有权。
 - `FnMut`能够改变能够改变上下文中的变量值。
 - `Fn`不可以改变上下文中的变量值。

创建闭包时，Rust会根据你使用变量的方式来推断你使用的是哪个trait。所有闭包都实现`FnOnce`因为至少可以被调用一次。不获取所有权的闭包实现`FnMut`trait。不改变外部变量的闭包实现`Fn`trait。

如果想要闭包强制获取所有权，可以在参数列表前使用`move`关键字。当把闭包传递给新线程，让新线程获取所有权时，这种方法很有用。

下面是一个强制传递vec数据所有权的例子。
```rust
fn main() {
    let x = vec![1, 2, 3];

    let equal_to_x = move |z| z == x;

    println!("can't use x here: {:?}", x);

    let y = vec![1, 2, 3];

    assert!(equal_to_x(y));
}
```

`x`的所有权被传递给了闭包，在`println!`中使用会报错。

## Section 2 - Processing a Series of Items with Iterators

迭代器模式可以让你在一个有序列表上依次执行一些任务。迭代器主要负责序列中每个项目要执行的操作和控制序列的退出。

Rust中迭代器是惰性的。意味着只要你不调用消费迭代器的方法，它就不会执行任何操作。比如这个代码就没有任何实际作用。
```rust
let v1 = vec![1, 2, 3];

let v1_iter = v1.iter();
```

当我们创建迭代器后，有许多方法可以去消费它。

通过`for`循环，在每个元素上执行一些操作。
```rust
let v1 = vec![1, 2, 3];

let v1_iter = v1.iter();

for val in v1_iter {
    println!("Got: {}", val);
}
```

迭代器可以让你更灵活的在不同序列上使用相同的逻辑，不光是在数组这样的数据结构上。

### `Iterator`Trait和`next` 方法

所有的迭代器都实现了标准库提供的`Iterator`trait。它的定义大致是：
```rust

pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;

    // methods with default implementations elided
}
```
有两个新语法`type Item`和`Self::Item`，它定义了一个trait的关联类型。因此，实现`Iterator`trait需要你定义一个`Item`类型，这个类型会在`next`方法的返回值类型中使用。也就是说，`Item`类型是迭代器的返回类型。

`Iterator`trait只有`next`方法是必须实现的，这个方法一次返回一个迭代器中的元素，用`Some`包裹；当迭代结束时，返回`None`。

可以直接通过迭代器调用`next`方法：
```rust
#[test]
fn iterator_demonstration() {
    let v1 = vec![1, 2, 3];

    let mut v1_iter = v1.iter();

    assert_eq!(v1_iter.next(), Some(&1));
    assert_eq!(v1_iter.next(), Some(&2));
    assert_eq!(v1_iter.next(), Some(&3));
    assert_eq!(v1_iter.next(), None);
}
```

使用`next`方法时，迭代器需要`mut`关键字定义。next方法会改变迭代器中用来追踪目前所迭代的位置状态，也可以说这是一种*消费（consumes）*行为。在`for`循环中，迭代器定义不需要`mut`关键字，因为`for`循环会获取迭代器的所有权，隐式地将其转为mutable的。

`next`方法返回的数据是原序列中元素的不可变引用。`iter`在不可变引用上生成迭代器。如果我们想创建一个拥有原序列所有权的迭代器，可以调用`into_iter`。如果想创建一个迭代器的可变引用，可以调用`iter_mut`。

### 消费迭代器的方法

标准库默认为`Iterator`trait提供了许多方法。有些方法内部会调用`next`方法，因此在实现`Iterator`trait时，必须实现`next`方法。

调用`next`方法的那些方法称为*消费型适配器（consuming adaptors）*，因为它们在消耗迭代器。例如`sum`方法：
```rust
#[test]
fn iterator_sum() {
    let v1 = vec![1, 2, 3];

    let v1_iter = v1.iter();

    let total: i32 = v1_iter.sum();

    assert_eq!(total, 6);
}
```

### 产生新迭代器的方法

还有一些`Iterator`trait上定义方法，称之为*迭代器适配器（iterator adaptors）*，这些方法可以把迭代器转换成其他类型的迭代器。迭代器适配器可以链式调用，这样可以提高一组复杂操作的可读性。由于迭代器是惰性的，因此你最终需要调用消费适配器，这一组操作才会真正起作用。
```rust
let v1: Vec<i32> = vec![1, 2, 3];

v1.iter().map(|x| x + 1);
```
上面的代码编译器会给出一个警告：`iterators are lazy and do nothing unless consumed`。也就是说这个代码不会起任何作用，定义的闭包也根本没有被执行。我们可以通过调用消费适配器，比如`collect`方法来解决这个问题。
```rust
let v1: Vec<i32> = vec![1, 2, 3];

let v2: Vec<_> = v1.iter().map(|x| x + 1).collect();

assert_eq!(v2, vec![2, 3, 4]);
```

### 使用闭包捕获上下文

下面通过使用`filter`迭代适配器来演示一个闭包捕获上下文的基本用法。`filter`方法接收一个闭包，这个闭包的参数是迭代器中的元素，返回值是一个布尔值。如果闭包返回`true`，则该元素会被包含在`filter`方法返回的迭代器中，反之亦然。
```rust
#[derive(PartialEq, Debug)]
struct Shoe {
    size: u32,
    style: String,
}

fn shoes_in_my_size(shoes: Vec<Shoe>, shoe_size: u32) -> Vec<Shoe> {
    shoes.into_iter().filter(|s| s.size == shoe_size).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn filters_by_size() {
        let shoes = vec![
            Shoe {
                size: 10,
                style: String::from("sneaker"),
            },
            Shoe {
                size: 13,
                style: String::from("sandal"),
            },
            Shoe {
                size: 10,
                style: String::from("boot"),
            },
        ];

        let in_my_size = shoes_in_my_size(shoes, 10);

        assert_eq!(
            in_my_size,
            vec![
                Shoe {
                    size: 10,
                    style: String::from("sneaker")
                },
                Shoe {
                    size: 10,
                    style: String::from("boot")
                },
            ]
        );
    }
}

fn main() {}
```

### 使用`Iterator`trait实现自定义迭代器

之前的例子中，可以通过调用Vec类型上的`iter`，`iter_mut`，`into_iter`来生成一个迭代器。你也可以为标准库中的其他类型来创建迭代器，例如哈希表。也可以在你自己的类型上，实现`Iterator`trait，从而实现任何你想要的功能。唯一必须要被实现的方法是`next`方法，当你实现`next`方法后，就可以调用其他`Iterator`trait实现的默认方法。

实现一个从1累加到5的迭代器来演示一下。
```rust
struct Counter {
    count: u32,
}

impl Counter {
    fn new() -> Counter {
        Counter { count: 0 }
    }
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.count < 5 {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}

#[test]
fn calling_next_directly() {
    let mut counter = Counter::new();

    assert_eq!(counter.next(), Some(1));
    assert_eq!(counter.next(), Some(2));
    assert_eq!(counter.next(), Some(3));
    assert_eq!(counter.next(), Some(4));
    assert_eq!(counter.next(), Some(5));
    assert_eq!(counter.next(), None);
}

fn main() {}
```

#### 使用`Iterator`trait的其他方法

我们实现`Iterator`trait，也定义了`next`方法，因此我们可以调用`Iterator`trait上，由标准库默认实现的任意方法，因为它们使用的都是`next`方法的功能。
```rust
#[test]
fn using_other_iterator_trait_methods() {
    let sum: u32 = Counter::new()
        .zip(Counter::new().skip(1))
        .map(|(a, b)| a * b)
        .filter(|x| x % 3 == 0)
        .sum();
    assert_eq!(18, sum);
}
```

上面的代码将两个Counter迭代器组合为元组数组，并且第二个Counter的第一个元素被跳过，因此最后一组元组是`(5, None)`。`zip`方法不会返回元组中带有`None`的元素。

## Section 3 - 循环和迭代器的性能对比



