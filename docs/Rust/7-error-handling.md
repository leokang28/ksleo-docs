# Chapter 7 - Error Handling

Rust的可靠性之一就在于它的错误处理。在很多情况下，Rust要求你在代码编译之前对所有可能的错误情况进行处理。在部署到生产环境之前确保发现并处理错误，这让你的代码健壮性更强。

Rust将错误分为两个大类：*recoverable*和*unrecoverable*。前者例如读取不存在的文件，将该错误上报并且重试这个操作是合理的行为。后者一半是由于代码逻辑bug，例如数组越界访问。

大多数语言不会对这两个大类进行区分，一般都是采用同一套解决方式，例如异常机制。Rust没有异常机制，Rust用`Result<U,E>`处理recoverable类型的错误，用`panic!`宏处理unrecoverable类型的错误。

## Section 1 - Unrecoverable Errors with panic!

当出现一些意料之外的错误，并且没有后续的处理逻辑或者不知道该如何处理时，Rust有`panic!`宏。当`panic!`宏调用时，打印出错误信息，然后释放清空堆栈内存退出程序。

:::details Unwinding the Stack or Aborting in Response to a Panic
一般来说，当panic发生后，Rust会进入*unwinding*阶段，它需要到堆栈顶部，开始遍历堆栈清空数据和函数，这是一个很费时的操作。另一种方案是*abort*，即程序退出时Rust不会清空堆栈，而将这个操作交给操作系统。如果你需要你的项目编译结果尽可能小，你可以通过设置*Cargo.toml*文件来让你的程序为abort模式。
```rust
[profile.release]
panic = 'abort'
```
:::

下面简单调用一下`panic!`宏来看一看它的输出。
```rust
fn main() {
    panic!("crash");
}
// thread 'main' panicked at 'crash', src/main.rs:17:9
// note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

```

可以看到`panic!`输出了两行信息，第一行是错误信息和错误在源代码在文件中的位置。

在这个例子中，我们可以跟踪代码在对应的位置找到导致`panic!`宏调用的代码。

### Using a `panic!` Backtrace

我们可以设置`RUST_BACKTRACE`环境变量来获取发生错误的完整调用链路。它是一个函数的调用堆栈列表，从栈顶开始一直到我们自己的代码文件。这个链路中可能包含核心文件、标准库文件、其他你使用到的第三方模块代码。你所在文件那一行上面的内容是你的代码调用的文件，下面的内容是调用你代码的文件。

    stack backtrace:
        0: backtrace::backtrace::libunwind::trace
                    at /Users/runner/.cargo/registry/src/github.com-1ecc6299db9ec823/backtrace-0.3.46/src/backtrace/libunwind.rs:86
        1: backtrace::backtrace::trace_unsynchronized
                    at /Users/runner/.cargo/registry/src/github.com-1ecc6299db9ec823/backtrace-0.3.46/src/backtrace/mod.rs:66
        2: std::sys_common::backtrace::_print_fmt
                    at src/libstd/sys_common/backtrace.rs:78
        3: <std::sys_common::backtrace::_print::DisplayBacktrace as core::fmt::Display>::fmt
                    at src/libstd/sys_common/backtrace.rs:59
        4: core::fmt::write
                    at src/libcore/fmt/mod.rs:1076
        5: std::io::Write::write_fmt
                    at src/libstd/io/mod.rs:1537
        6: std::sys_common::backtrace::_print
                    at src/libstd/sys_common/backtrace.rs:62
        7: std::sys_common::backtrace::print
                    at src/libstd/sys_common/backtrace.rs:49
        8: std::panicking::default_hook::{{closure}}
                    at src/libstd/panicking.rs:198
        9: std::panicking::default_hook
                    at src/libstd/panicking.rs:218
        10: std::panicking::rust_panic_with_hook
                    at src/libstd/panicking.rs:486
        11: rust_begin_unwind
                    at src/libstd/panicking.rs:388
        12: core::panicking::panic_fmt
                    at src/libcore/panicking.rs:101
        13: core::panicking::panic_bounds_check
                    at src/libcore/panicking.rs:73
        14: <usize as core::slice::SliceIndex<[T]>>::index
                    at /Users/ksleo/.rustup/toolchains/stable-x86_64-apple-darwin/lib/rustlib/src/rust/src/libcore/slice/mod.rs:2872
        15: core::slice::<impl core::ops::index::Index<I> for [T]>::index
                    at /Users/ksleo/.rustup/toolchains/stable-x86_64-apple-darwin/lib/rustlib/src/rust/src/libcore/slice/mod.rs:2732
        16: <alloc::vec::Vec<T> as core::ops::index::Index<I>>::index
                    at /Users/ksleo/.rustup/toolchains/stable-x86_64-apple-darwin/lib/rustlib/src/rust/src/liballoc/vec.rs:1942
        17: p::main
                    at src/main.rs:5
        18: std::rt::lang_start::{{closure}}
                    at /Users/ksleo/.rustup/toolchains/stable-x86_64-apple-darwin/lib/rustlib/src/rust/src/libstd/rt.rs:67
        19: std::rt::lang_start_internal::{{closure}}
                    at src/libstd/rt.rs:52
        20: std::panicking::try::do_call
                    at src/libstd/panicking.rs:297
        21: std::panicking::try
                    at src/libstd/panicking.rs:274
        22: std::panic::catch_unwind
                    at src/libstd/panic.rs:394
        23: std::rt::lang_start_internal
                    at src/libstd/rt.rs:51
        24: std::rt::lang_start
                    at /Users/ksleo/.rustup/toolchains/stable-x86_64-apple-darwin/lib/rustlib/src/rust/src/libstd/rt.rs:67
        25: main

为了获取这个输出，debug标识必须是enable的，在运行`cargo build`或者`cargo run`的并且不带`--release`选项的时候，该标识默认是enable的。具体的输出内容和你的操作系统以及Rust版本有关。

## Section 2 - Recoverable Errors with `Result`

大多数错误抛出的时候，都没有必要将程序退出。比如，当读取的文件不存在时，可以考虑创建该文件而不是终止进程。

`Result`枚举有两个值，`Ok`和`Err`。
```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```
T和E是泛型变量。T代表成功情况下返回值的类型，E代表失败情况下错误的返回类型。

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");
}
```

如何知道`File::open`函数返回的是一个`Result`枚举呢？一种方式是查看标准库API文档，另外一种方式是给变量`f`指定一个其他的数据类型。然后编译代码，编译器会给出类型不匹配的错误信息。

这里泛型变量`T`会被填充为成功值的类型，在这里是一个`std::fs::File`类型的文件句柄，`E`则是`std::io::Error`类型。这意味着`File::open`函数可能会返回一个文件句柄，可以用来进行读写。或者可能返回一个io错误。

因此我们需要用`match`表达式对`Result`的所有情况进行覆盖。
```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => panic!("Problem opening the file: {:?}", error),
    };
}
```

### Matching on Different Errors

上面的代码，当打开文件出错时，不论何种错误都会调用`panic!`宏然后退出程序。而我们的期望时根据不同的错误类型，有不同的处理方案。比如因为文件不存在，我们希望创建文件；如果是因为没有权限，则调用`panic!`宏退出程序。
```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Problem creating the file: {:?}", e),
            },
            other_error => {
                panic!("Problem opening the file: {:?}", other_error)
            }
        },
    };
}
```

`File::open`函数返回的是一个标准库提供的`io::Error`类型的错误。这个类型上有一个`kind`方法用来获取`io::ErrorKind`类型的值。这个类型也由标准库提供，枚举了一些io操作可能出现的错误类型。我们想要在`ErrorKind::NotFound`错误类型出现时，创建一个新文件。由于`File::create`方法也有可能失败，所以也需要用`match`表达式覆盖可能出现的情况。

但是这里出现了太多的`match`表达式嵌套。后面会介绍*闭包（closure）*的用法。

### Shortcuts for Panic on Error: `unwrap` and `expect`

`match`表达式能够满足需求。但是太多的`match`显得太啰嗦，表意也不够清晰。`Result<T, E>`上有许多工具函数，其中一个叫做`unwrap`的函数可以作为`match`表达式的语法糖使用。如果是成功状态，`unwrap`方法会返回值；如果是失败状态，`unwrap`会调用`panic!`宏。
```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt").unwrap();
}
```

另外一个`expect`方法，作用和`unwrap`一样，但是可以让我们指定错误输出信息。可以表达我们想表达的错误信息，在错误追踪时也比较容易。
```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt").expect("Failed to open hello.txt");
}
```

### Propagating Errors

当你实现一个函数时，它的实现可能会抛出某些错误，与其在你的函数中捕获这个错误，不如把这个错误传递给调用者，好让调用者决定如何处理这个错误。这个被称为错误的*传递（propgation）*，这给了调用者更多的控制权，它内部也许有更完善的信息和逻辑来处理错误。

例如，我们要写一个函数，在一个文件中读取一些内容，如果读取错误，将这个错误抛给调用者。
```rust
use std::fs::File;
use std::io;
use std::io::Read;

fn read_username_from_file() -> Result<String, io::Error> {
    let f = File::open("hello.txt");

    let mut f = match f {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut s = String::new();

    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(e) => Err(e),
    }
}
```

#### A Shortcut for Propagating Errors: the ? Operator

```rust
use std::fs::File;
use std::io;
use std::io::Read;

fn read_username_from_file() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}
```
`?`操作符跟在`Result<T, E>`类型之后，当`Result`值是`Ok`时，它的值会作为表达式的值返回；当值是`Err`时，会将这个错误作为整个函数的返回值抛出。

`match`表达式和`?`操作符还有一点不同：`?`操作符抛出的错误会经过一个由标准库`From`trait提供的，名称为`from`的函数处理，它将原始的错误类型转换成我们当前函数声明中定义的错误类型。只要错误类型实现了`from`方法，`?`操作符就会调用它来进行错误类型转换。

`?`操作符使函数体更加简洁，上面这个例子还可以更加简洁。
```rust
use std::fs::File;
use std::io;
use std::io::Read;

fn read_username_from_file() -> Result<String, io::Error> {
    let mut s = String::new();
    File::open("hello.txt")?.read_to_string(&mut s)?;
    Ok(s)
}
```

