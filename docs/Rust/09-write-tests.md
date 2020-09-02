# Chapter 9 - Writing Automated Tests

程序的正确性是它按我们的预期运行的程度。Rust被设计为高度关注程序正确性的语言，但正确性很复杂而且不容易实现。Rust的类型系统承担了大部分的工作，但是类型系统不能够捕获所有可能的错误。因此，Rust支持编写自动测试用例。

## Section - 1 如何编写测试用例

测试用例是用来验证代码是否按预期设计运行的函数。测试用例通常包含三部分：
1. 初始化需要的数据和状态。
2. 运行需要测试的代码。
3. 断言结果是否正确。

接下来看一下Rust为编写测试用例特别提供的功能。包括`test`属性，一些宏和`should_panic`属性。

### The Anatomy of a Test Function

最简单的情况，Rust中一个测试用例就是一个带`test`属性的函数。属性是关于代码片段的元数据。在函数定义前加一行`#[test]`，这个函数就是测试用例函数。然后当你执行`cargo test`，Rust创建一个用来执行测试用例的可执行文件，这个文件会调用被`test`属性标记的函数，并且报告这些测试的结果是成功还是失败。

当我们使用`Cargo`创建库项目时，会自动生成一个测试模块，你可以自己添加其他的测试模块和函数。

首先创建一个库项目。`cargo new adder --lib`。然后可以看到默认创建好的测试模块和用例。
```rust
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
```

先把注意力集中到测试用例上。函数上面一行的`#[test]`表明这个函数是一个测试用例，test runner会在测试的时候执行这个函数。测试模块中也可以包含普通的函数，用于初始化或者提供普通的操作。因此需要在测试用例前用属性指明。

函数体中使用到了`assert_eq!`宏。这个断言是一个典型的测试用例。运行`cargo test`会得到以下输出信息。

    $ cargo test
    Compiling adder v0.1.0 (/Users/ksleo/private/rust_learn/adder)
     Finished test [unoptimized + debuginfo] target(s) in 0.57s
      Running target/debug/deps/adder-92948b65e88960b4

    running 1 test
    test tests::it_works ... ok

    test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

    Doc-tests adder

    running 0 tests

    test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

可以看到在`running 1 test`这一行下面，显示运行了一个测试用例`it_works`，并且运行结果是`ok`。测试用例的运行结果汇总统计在下面一行。`test result: ok`表示所有的测试用例都通过了测试，并且后面`1 passed; 0 failed;`统计了成功和失败的数量。

测试输出的下一个部分是`Doc-tests`，这个是文档测试的结果。我们这里没有文档测试，Rust能在API文档里生成示例代码。这个功能让代码和文档保持同步。

再添加一个失败结果的测试用例。每一个测试用例都跑在单独的线程中，主线程如果发现有一个测试线程失败，就把测试结果标记为失败。

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn exploration() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    fn another() {
        panic!("Make this test fail");
    }
}
```

再运行测试用例，会得到如下输出。

    running 2 tests
    test tests::it_works ... ok
    test tests::another ... FAILED

    failures:

    ---- tests::another stdout ----
    thread 'tests::another' panicked at 'Make this test fail', src/lib.rs:10:9
    note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


    failures:
        tests::another

    test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out

    error: test failed, to rerun pass '--lib'

可以看到有两块`failures`内容是之前没有的。第一部分是失败用例的文件路径和产生错误的代码位置。第二块是失败的用例名列表，当失败的用例非常多时，这个列表就很有用了。我们可以通过单独运行某个用例获取更多的错误信息。

下面的摘要行显示，测试结果是`FAILED`。

### 用`assert!`宏断言结果

`assert!`宏是由标准库提供的，用于在测试中确定运行结果是否为真。`assert!`一个返回布尔值的表达式。如果返回值是`true`，它不会做任何特殊处理，并且该测试用例结果为`ok`。如果为`false`，它会调用`panic!`宏来让测试用例失败。使用`assert!`断言来检测函数是否按照我们的预期设计执行。

下面写一些测试用例，用来测试之前章节中定义的`Rectangle`结构体。
```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn larger_can_hold_smaller() {
        let larger = Rectangle {
            width: 8,
            height: 7,
        };
        let smaller = Rectangle {
            width: 5,
            height: 1,
        };

        assert!(larger.can_hold(&smaller));
    }

    #[test]
    fn smaller_cannot_hold_larger() {
        let larger = Rectangle {
            width: 8,
            height: 7,
        };
        let smaller = Rectangle {
            width: 5,
            height: 1,
        };

        assert!(!smaller.can_hold(&larger));
    }
}
```

注意在测试模块中引入了待测试模块的命名空间。测试模块跟普通模块一样，也要遵循命名空间规则。

### 使用`assert_eq!`和`assert_ne!`断言相等性

判断相等性可以在`assert!`宏中传入一个`==`表达式。但是由于这种判断是一个常用场景，因此标准库提供了专门用来判断相等性的宏。这两个宏接收两个参数来判断它们是否相等。断言失败时它们会打印出参数值，可以更清楚的知道测试用例为什么失败。而`assert!`宏的话，只能表示它的参数`==`表达式返回了一个`false`，而不能确定导致它失败的具体参数是什么。

比如写一个函数，将它的参数+2。
```rust
pub fn add_two(a:i32) -> i32 {
    a + 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_adds_two() {
        assert_eq!(4, add_two(2));
    }
    #[test]
    fn it_adds_three() {
        assert_eq!(5, add_two(2));
    }
}
```

测试用例运行结果为如下

    running 2 tests
    test tests::it_adds_two ... ok
    test tests::it_adds_three ... FAILED

    failures:

    ---- tests::it_adds_three stdout ----
    thread 'tests::it_adds_three' panicked at 'assertion failed: `(left == right)`
    left: `5`,
    right: `4`', src/lib.rs:16:9
    note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


    failures:
        tests::it_adds_three

    test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out

    error: test failed, to rerun pass '--lib'

第一个用例通过。第二个用例，由于我们断言传的参数`add_two`的结果为5，因此测试结果为失败。并且指出它的错误原因是左右值不想等，且`left`是5，`right`是4。一些测试框架和语言中，可能把相等性判断的两个参数称为`expected`和`actual`。Rust中称为`left`和`right`。参数传递的顺序对测试结果没有影响。

`assert_ne!`宏跟它的作用一样，逻辑相反。一般ne函数用于那些我们不确定结果是什么值，但是可以确定结果不该是某个值的情况下。

在接口底层，`assert_eq!`和`assert_ne!`分别使用的是`==`和`!=`运算符。当测试不通过时，这些宏通过debug格式化来打印参数信息，也就是说用于比较的参数值必须实现`PartialEq`和`Debug`两个trait。所有基础类型和大部分标准库提供的类型都实现了这两个trait。你自己定义的struct和enum，需要你自己实现`PartialEq`trait来定义相等性。如果你需要测试不通过时打印参数信息，你还需要实现`Debug`模块。由于这两个模块都是可派生模块，可以直接在自定义的struct和enum前面加`#[derive(PartialEq, Debug)]`。

### 添加自定义错误信息

使用`format!`宏语法，将错误信息加在断言函数的最后。
```rust
pub fn greeting(name: &str) -> String {
    String::from("Hello!")
}
// 省略
assert!(
    result.contains("Carol"),
    // 错误信息
    "Greeting did not contain name, value was `{}`",
    result
);
```

### Checking for Panics with should_panic

使用`should_panic`属性来检测，代码是不是按照预期发生了panic。
```rust
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            panic!("Guess value must be between 1 and 100, got {}.", value);
        }

        Guess { value }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]
    fn greater_than_100() {
        Guess::new(200);
    }
}
```

运行结果为ok。我们传的值是200，符合panic的条件，因此函数调用`panic!`宏。这个错误被`#[should_panic]`捕获到了，测试结果跟我们预期的一样，因此它是一个成功的测试用例。换句话说，`should_panic`只用来检测那些会panic的情况，如果没有发生panic，那么这个用例就是失败。

仅使用`should_panic`来检测panic不是很精确，因为可能代码中panic没有携带有用信息。`should_panic`可以接收参数，在panic发生时，这个参数会跟错误信息一起打印出来。

### 在测试用例中使用`Result<T, E>`

可以在测试用例中`Result`来替代断言宏。
```rust
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() -> Result<(), String> {
        if 2 + 2 == 4 {
            Ok(())
        } else {
            Err(String::from("two plus two does not equal four"))
        }
    }
}
```

这个测试用例返回一个`Result`。同时可以在测试用例内部使用问号操作符。当使用`Result`时，不能使用`should_panic`属性，此时必须显式地返回一个`Err`。

## Section 2 - Controlling How Tests Are Run

`cargo run`编译代码并且运行结果可执行文件，同样的，`cargo test`在测试模式编译代码然后运行测试用例可执行文件。你可以通过指定命令参数，来改变`cargo test`的默认行为。`cargo test`编译生成的可执行文件的默认行为是：并行运行所有测试用例，捕获测试用例的输出信息，并加工成跟测试用例相关联的，阅读友好的输出信息。

某些命令行参数是给`cargo test`执行的，而某些是给编译完的可执行文件执行的。为了区分这两种类型的参数，用于`cargo test`执行的参数跟在`--`后面，然后后面再跟的是给可执行文件执行的参数。

### 并行和串行

当执行多个测试用例，默认的行为是多线程并行执行。因此测试代码可以最快运行完毕并且输出测试反馈。由于每个测试用例是单独一个线程的，所以保证每个用例是独立的，没有共享状态或者共享环境等。比如多个测试用例是对一个文件进行读写，当并发进行时，有可能进程A在读的时候，文件被进程B覆盖了，导致进程A测试失败。然而这并不是由于逻辑代码引起的错误。解决方法是所有测试用例隔离测试环境，或者串行测试用例。

用参数`cargo test -- --test-threads=1`指定执行的线程数。

### 显示被测试函数的输出信息

默认情况下，Rust会将测试通过用例下的函数输出信息全部捕获，只输出测试通过的信息。而测试用例失败时，所有信息信息都会被输出。
```rust

fn prints_and_returns_10(a: i32) -> i32 {
    println!("I got the value {}", a);
    10
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn this_test_will_pass() {
        let value = prints_and_returns_10(4);
        assert_eq!(10, value);
    }

    #[test]
    fn this_test_will_fail() {
        let value = prints_and_returns_10(8);
        assert_eq!(5, value);
    }
}
```

默认测试上面的代码。输出以下信息

    running 2 tests
    test tests::this_test_will_fail ... FAILED
    test tests::this_test_will_pass ... ok

    failures:

    ---- tests::this_test_will_fail stdout ----
    I got the value 8
    thread 'main' panicked at 'assertion failed: `(left == right)`
    left: `5`,
    right: `10`', src/lib.rs:19:9
    note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace.


    failures:
        tests::this_test_will_fail

    test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out

    error: test failed, to rerun pass '--lib'

通过`cargo test -- --show-output`参数，输出测试用例信息以及函数本身的输出信息。

    running 2 tests
    test tests::this_test_will_fail ... FAILED
    test tests::this_test_will_pass ... ok

    successes:

    ---- tests::this_test_will_pass stdout ----
    I got the value 4


    successes:
        tests::this_test_will_pass

    failures:

    ---- tests::this_test_will_fail stdout ----
    I got the value 8
    thread 'main' panicked at 'assertion failed: `(left == right)`
    left: `5`,
    right: `10`', src/lib.rs:19:9
    note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace.


    failures:
        tests::this_test_will_fail

    test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out

    error: test failed, to rerun pass '--lib'

### Running a Subset of Tests by Name

通过指定测试用例名称来运行特定的测试用例。
```rust
pub fn add_two(a: i32) -> i32 {
    a + 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_two_and_two() {
        assert_eq!(4, add_two(2));
    }

    #[test]
    fn add_three_and_two() {
        assert_eq!(5, add_two(3));
    }

    #[test]
    fn one_hundred() {
        assert_eq!(102, add_two(100));
    }
}
```

默认运行测试用例`cargo test`时，所有的用例都会被执行：

    running 3 tests
    test tests::add_three_and_two ... ok
    test tests::add_two_and_two ... ok
    test tests::one_hundred ... ok

    test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

    Doc-tests adder

    running 0 tests

    test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

#### 运行单个测试

`cargo test [test_name]`，例如`cargo test one_hundred`。

    running 1 test
    test tests::one_hundred ... ok

    test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 2 filtered out

可以看到输出信息中说明`2 filtered out`，有两个用例被过滤掉了。

#### 运行多个测试

我们可以在指定测试用例名称时，只指定其中的一部分名称。Rust会运行所有名称包含我们参数的测试用例。例如`cargo test add`

    running 2 tests
    test tests::add_three_and_two ... ok
    test tests::add_two_and_two ... ok

    test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out

有两个用例名称包含add，所以他们都被运行了。

### 默认过滤某些用例除非明确指定

在测试用例前加`ignore`参数来默认跳过该用例。
```rust
#[test]
fn it_works() {
    assert_eq!(2 + 2, 4);
}

#[test]
#[ignore]
fn expensive_test() {
    // code that takes an hour to run
}
```
运行`cargo test`时，输出如下

    running 2 tests
    test expensive_test ... ignored
    test it_works ... ok

    test result: ok. 1 passed; 0 failed; 1 ignored; 0 measured; 0 filtered out

    Doc-tests adder

    running 0 tests

    test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

可以看出`expensive_test`显示被跳过了。

增加`cargo test -- --ignore`参数，运行有`ignore`属性的测试用例。

    running 1 test
    test expensive_test ... ok

    test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out

    Doc-tests adder

    running 0 tests

    test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

可以将一些耗时任务标记为`ignore`单独执行。

## Section 3 - Test Organization

Rust社区认为测试主要分为：单元测试和集成测试。单元测试更小更集中，同一时间只隔离测试一个模块，并且可以测试私有接口。集成测试更系统化，包含范围可能延展到我们整个库，且仅测试公有接口。

### 单元测试

单元测试的目的是为了在隔离环境下快速地测试某个单一模块是否能按预期运行。单元测试放在src目录下的每个文件中，里面包含要测试的代码。最方便的方法是每个文件中都创建一个test模块，并且带测试模块前加`#[cfg(test)]`注释。

#### The Tests Module and #[cfg(test)]

`#[cfg(test)]`注释告诉编译器，只有当运行`cargo test`命令时，才进行这些测试用例，`cargo build`的时候不运行这些测试用例。这样可以缩短编译时间，而且不包含测试用例代码，也控制了编译结果文件的大小。由于集成测试在其他的目录中，所以不需要这个注释。由于单元测试和逻辑代码是在一起的，因此需要将他们标记，不要构建到最终的结果中。

之前我们新建lib项目时，cargo自动生成了一个测试模块。
```rust
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
```

`cfg`代表配置并且告诉编译器下面的内容只有满足了该配置时，才会被编译。在这个例子中，模块配置是`test`，这是Rust提供的用来编译和执行测试用例的。只有当我们运行`cargo test`时Cargo才会编译该测试代码。除了测试模块下的测试用例不会被编译，其他的一些帮助函数也不会被编译。

#### Testing Private Functions

社区一直有争论，私有接口应不应该直接去测试私有接口。其他语言测试私有接口是很困难的。不论你持何种观念，Rust私有规则都允许你直接测试私有接口。

```rust
pub fn add_two(a: i32) -> i32 {
    internal_adder(a, 2)
}

fn internal_adder(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn internal() {
        assert_eq!(4, internal_adder(2, 2));
    }
}
```

`internal_adder`函数没有`pub`关键字，但是依然可以在`tests`模块中引入测试。Rust不强制测试私有接口。

### 集成测试

Rust中的集成测试代码完全处于你的库之外。集成测试调用库的方式和其他代码一样，也就是说集成测试可以只调用部分API。集成测试的目的是检测你的库中多个模块一起工作时正确与否。即使单元测试通过，集成测试有可能也会出现问题。创建集成测试首先需要创建*tests*目录。

#### tests目录

在于*src*目录同级的根目录下创建*tests*目录，Cargo会在这个目录下查找集成测试文件。然后可以任意在这个目录下添加测试文件，Cargo会将这些文件编译成独立的crate。

让我们来创建一个集成测试目录，并创建一个新文件*tests/integration_test.rs*。
```rust
use adder;

#[test]
fn it_adds_two() {
    assert_eq!(4, adder::add_two(2));
}
```
这个文件中的代码不需要用`#[cfg(test)]`标注，Rust会对*tests*目录下的文件特殊处理，只有运行`cargo test`的时候才会编译这个目录下的文件。运行`cargo test`看下效果。

      Compiling adder v0.1.0 (/Users/ksleo/private/rust_learn/adder)
       Finished test [unoptimized + debuginfo] target(s) in 1.07s
        Running target/debug/deps/adder-9d658908b5cc4b63

    running 1 test
    test tests::internal ... ok

    test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

        Running target/debug/deps/integration_test-48170a4e87fe33c4

    running 1 test
    test it_adds_two ... ok

    test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

        Doc-tests adder

    running 0 tests

    test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

可以看到有三块内容输出：单元测试、集成测试和文档测试。使用`--test <testname>`可以仅执行某部分集成测试。

### Submodules in Integration Tests

当你的集成测试越来越多时，你可能想要把这些测试组织到*test*目录下不同的文件中。比如，可以按照测试的函数功能来组织测试用例。之前已经提到过，集成测试会被编译成单独的crate。

把集成测试当作独立的crate，有助于创建独立的作用域，让集成测试的场景更接近其他用户调用你的crate的真实场景。

当我们在*tests*目录下，想抽象一些通用代码供各个集成测试调用时，Rust会把这写通用代码也当作集成测试编译成单独的crate。例如，创建*tests/common.rs*文件，并写入一个`setup`函数。
```rust
fn setup() {
    // something
}
```

在运行`cargo test`时，会发现测试结果输出多了一块。

        Running target/debug/deps/common-7064e1b6d2e271be

    running 0 tests

    test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

*common.rs*中的内容被当作测试用例执行和打印不是我们想要的结果。我们只想它里面的代码供其他测试用例调用。可以通过创建*tests/mod/common.rs*来代替，Rust不会将这个目录下的文件当作集成测试来处理。此时，测试结果输出中也不会包含相应的内容了。

当我们创建这个通用代码之后，就可以在其他集成测试文件中调用。例如：
```rust
use adder;

mod common;

#[test]
fn it_adds_two() {
    common::setup();
    assert_eq!(4, adder::add_two(2));
}
```

>注意`mod common;`的写法，之前讲过分号结尾是将该模块引入。

### Integration Tests for Binary Crates

如果你的项目只有*src/main.rs*，即你的项目是一个可执行crate，此时不能创建集成测试。只有库crate才能创建集成测试，库crate导出的方法才能被其他crate用use导入和使用。可执行crate导出的函数只能内部使用。

这也是Rust项目在*src/main.rs*文件中只调用*src/lib.rs*逻辑的原因之一。使用这种架构的话，集成测试来测试占绝大部分比例的库crate代码中的功能，而*src/main.rs*中极少比例且几乎不含功能逻辑的调用代码不需要测试，仅需要阅读就可以判断其是否正确运行。