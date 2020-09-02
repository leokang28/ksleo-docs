# Chapter 5 - Managing Growing Projects with Packages, Crates, and Modules

当项目体积越来越大，良好的代码组织就变得很重要。因为只靠脑子记忆整个项目的代码逻辑是不可能的。

目前为止所写的一些示例程序都是一个模块一个文件下的。当项目体积增长，就可以将代码分割到不同模块不同文件中。一个*package（包）*可以包含多个可执行crate，并且可以选择性的包含一个库crate。当包体积变大，可以通过提取代码成一个独立的crate，将它转变为一个外部依赖。本章会涵盖所有这些技术。

除了分组功能，封装逻辑实现代码可以让代码复用：当你封装了一个操作，其他地方的代码可以通过接口直接使用这个功能，而不需要知道内部具体是如何实现的。封装代码哪部分是公用接口，哪部分是私有属性，这取决于封装实现的编码人员。

还有一个相关概念称之为*scope（域）*：这是一个嵌套结构的上下文环境。当读写编译代码时，编码人员和编译器都需要知道特定位置的一些特定名称代表的是一个变量、函数、结构体、模块还是一些其他的东西。你可以创建一个scope并指定哪些内容在这个scope中。在同一个scope中不允许出现两个名称一致的实体。有一些工具可以解决命名冲突。

Rust模块系统包括：
 - **Packages**：是Cargo的一个功能，可以用来创建、测试和发布crate。
 - **Crates**：一个导出可执行文件或者可执行文件的模块树。
 - **Modules**和**use**：用来控制*Paths*的组织、域和隐私。
 - **Paths**：命名实体的方式，例如给函数、结构体和模块命名。

接下来会依次覆盖这些内容。

## Section 1 - Packages and Crates

*crate*是一个可执行文件或者库。*crate root*是编译器开始编译并把你的crate打包成根模块的源文件。*package*是由一个或者多个提供了某些功能的crate组成的。一个package有一个描述如何构建这些crate的*Cargo.toml*文件。

一个package最多包含一个库crate，可以包含任意数量的可执行crate。但是至少要包含一个crate。

看一下使用`cargo new`创建新的package时发生了什么。

    $ cargo new my-project
        Created binary (application) `my-project` package
    $ ls my-project
    Cargo.toml
    src
    $ ls my-project/src
    main.rs


cargo生成一个package，创建了一个*cargo.toml*文件。看一下cargo.toml文件的内容，里面没有关于*src/main.rs*的信息，因为Rust遵循一个规定，*src/main.rs*文件是与package同名的可执行crate的入口文件。如果package下有一个*src/lib.rs*文件，则它是与package同名的库crate的入口文件。cargo将入口文件传给`rustc`构建库或者可执行文件。

我们刚生成的项目中，只有一个src/main.rs文件，意味着这个项目只有一个可执行crate。如果package中同时具有*src/main.rs*和*src/lib.rs*文件，则说明这个package有一个可执行crate和一个库crate，且都与package同名。如果package具有多个可执行crate，则对应的文件需要存放在*src/bin*目录下，每个文件都是一个独立的可执行crate。

一个crate最好将一些相关功能组织到一个scope里面，方便在项目之间复用。

将crate的功能保持在它的scope内，可以明确该功能是我们自己定义的还是该crate定义的，避免潜在冲突。比如，`rand`crate定义了一个trait叫做`Rng`。我们也可以自己定义一个结构体叫`Rng`。由于crate的功能被限定在自己的scope中，因此当我们引入rand的时候，编译器很明确`Rng`是指向何处的。在我们自己的crate中，`Rng`指向我们定义的结构体；当我们要使用`rand`中的`Rng`时，可以通过`rand::Rng`的方式访问。

## Section 2 - Defining Modules to Control Scope and Privacy

module让我们把代码组织管理，方便维护和复用。同时module还控制一个实体的隐私性，是外部可访问（public）还是不可访问（private）。

接下来写一个库crate作为例子。这些代码只定义函数声明而不实现函数体，因为现在需要将重点放在代码组织上。

我们模拟一个餐厅的状况。餐厅有*front of house*和*back of house*。前厅主要是客人吃饭，服务员送餐，下单等。后厅主要给厨师使用。

我们可以将功能函数通过嵌套模块的方式组织。使用`cargo run --lib restaurant`创建一个restaurant库crate，然后写入以下代码。
```rust
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}

        fn seat_at_table() {}
    }

    mod serving {
        fn take_order() {}

        fn serve_order() {}

        fn take_payment() {}
    }
}
```

我们用`mod`关键字创建了一个`front_of_house`模块，并且用花括号将其内容包裹。在这个模块中，可以定义其他的模块，比如`hosting`、`serving`，当然内部也可以定义其他的内容，比如结构体、枚举、函数、traits等。

通过模块可以将相关的定义组织在一起。编码人员想阅读或者扩展这个模块时，都能很方便的找到，且不破坏其组织性。

之前有提到*src/main.rs*和*src/lib.rs*被称作crate的入口文件。之所以叫他们入口文件是因为，这两个文件中的内容都会生成一个根结点为crate的模块树。

    crate
    └── front_of_house
        ├── hosting
        │   ├── add_to_waitlist
        │   └── seat_at_table
        └── serving
            ├── take_order
            ├── serve_order
            └── take_payment

这棵树展示了模块的嵌套关系。可以看出这棵树上的一些模块是兄弟节点，这说明他们定义在同一个模块里。这里的概念和数据结构树中的兄弟子父节点的概念是类似的。整个模块的父节点是crate隐式节点。

## Section 3 - Paths for Referring to an Item in the Module Tree

如何导入模块中的内容使用，Rust使用和文件系统路径相似的概念。调用一个外部方法的时候需要知道它的路径。

路径有两种形式：

 - 从crate根节点开始的绝对路径。
 - 从当前模块开始的相对路径，在当前模块中调用`self`、`super`或者其他关键字和名称。

绝对路径和相对路径都是一组通过`::`符号分隔的标识符组成。

回到之前的例子，应该如何调用`add_to_waitlist`这个函数呢？或者说，这个函数的路径是什么？下面的代码用两种方式来调用该方法。
```rust
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // abs path
    crate::front_of_house::hosting::add_to_waitlist();
    // relative path
    front_of_house::hosting::add_to_waitlist();
}
```

第一种方式使用绝对路径调用函数。`add_to_waitlist`函数和`eat_at_restaurant`函数定义在同一个crate中，因此可以使用`crate`关键字作为绝对路径的开头。紧接着引入连续的模块名直到该函数的位置，和文件系统路径很相似。

第二种方式使用相对路径调用函数。路径是以`front_of_house`开头的，`front_of_house`模块和`eat_at_restaurant`函数定义在同一层级。这和文件系统中，使用相同层级文件的引入方式类似。

具体使用哪种方式调用模块取决于你的项目结构。通常倾向于使用绝对路径，这种调用方式下，代码定义和模块引用更加独立。

目前这个代码还是编译不通过的，编译器此时会报错说hosting模块是private的。此时我们的调用路径没有错，但是我们并没有该模块的访问权限。

模块不光能很好的组织代码，它同时具有定义*privacy boundary*权限界限的功能。具体的实现代码不允许外部代码访问，调用和依赖。如果你想让你的某些内容变为私有，将它封装到一个模块里就行。

Rust权限系统默认所有实体（方法、结构体、变量、枚举等）都是私有的。父模块中不能调用子模块的内容，但是子模块可以调用父模块的内容。原因在于子模块隐藏了自己的实现细节，但是它可以访问自己定义所在的上下文环境。

### Exposing Paths with the pub Keyword

我们可以使用`pub`关键字将默认私有的内容对外暴露。
```rust
mod front_of_house {
    pub mod hosting {
        fn add_to_waitlist() {}
    }
}
```

此时编译代码，编译器依旧报错，此时错误是函数`add_to_waitlist`是私有的。`pub`模块对外暴露模块时，它里面的内容依旧默认是私有的。

因此把`add_to_waitlist`函数也用`pub`关键字修饰。
```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}
```

我们再通过绝对路径和相对路径回顾一下引用过程。

在绝对路径中，路径用模块树的根节点`crate`开头。然后是定义在根节点中的`front_of_house`模块。`front_of_house`是私有模块，但是由于`eat_at_restaurant`模块是跟它定义在同一个模块中的，因此在他们之间可以调用。接下来是`hosting`公共模块，最后是`ad_to_waitlist`公共方法，此时函数调用生效。

在相对路径中，除了第一步以外。其余逻辑和绝对路径中是一样的。相对路径中使用`front_of_house`作为路径的开头。`front_of_house`和`eat_at_restaurant`是定义在同一个模块中的，因此以它们的父模块作为相对路径的开始是正常的。

### Starting Relative Paths with super

我们可以使用`super`关键字来代表父模块。这个关键字和文件系统中的`..`语法类似。
```rust
fn serve_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::serve_order();
    }

    fn cook_order() {}
}
```

`fix_incorrect_order`函数定义在`back_of_house`模块中。可以使用`super`进入到它的父模块`crate`，也就是根模块中。在根模块中就可以引用到`serve_order`方法了。

### Making Structs and Enums Public

`pub`关键字也可以用来修饰结构体和枚举，但是另外有一些细节需要注意。`pub`关键字修饰的结构体，它的字段依旧是私有的。
```rust
mod back_of_house {
    pub struct Breakfast {
        pub toast: String,

        seasonal_fruit: String,
    }

    impl Breakfast {
        pub fn summer(toast: &str) -> Beakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }
}

pub fn eat_at_restaurant() {
    let mut meal = back_of_house::Breakfast::summer("Rye");

    meal.toast = String::from("Wheat");

    println!("I'd like {} toast please", meal.toast);
}
```

在`eat_at_restaurant`函数中可以访问`back_of_house::Breakfast`的`toast`字段，因为它是公开的，但是我们不能访问`seasonal_fruit`字段，因为字段默认都是私有的。同时，由于`back_of_house::Breakfast`具有一个私有字段，因此这个结构体需要提供一个作用类似于工厂函数的方法，用来创建实例，这里是`summer`方法。如果结构体没有提供这样的方法，那么我们将无法实例化它，因为在外部无法对私有字段进行赋值。

在枚举类型中，`pub`字段修饰的枚举类型，它下面的字段同时也都是公开的。
```rust
mod back_of_house {
    pub enum Appetizer {
        Soup,
        Salad,
    }

    pub fn eat_at_restaurant() {
        let order1 = back_of_house::Appetizer::Soup;
        let order2 = back_of_house::APpetizer::Salad;
    }
}
```

如果`enum`里的字段是私有的，那么这个enum就没有任何的意义，所有当`enum`被修饰为`pub`时，它内部的字段都自动转为公开。

## Section 4 - Bringing Paths into Scope with the use Keyword

之前的例子中，我们写的模块引用代码中，模块路径很长而且很多内容都是重复的。使用`use`关键字将模块路径导入到当前模块中，可以解决这个问题。

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

使用`use`关键字和一个路径名称，类似于文件系统中创建一个符号链接。也可以通过`use`关键字引入一个相对路径：`use self::front_of_house::hosting;`。

### Creating Idiomatic use Paths

思考一个问题——为什么要通过`use crate::front_of_house::hosting`引入模块然后再通过`hosting`模块调用`eat_at_restaurant`方法。而不是直接引入`eat_at_restaurant`方法进行调用呢？引入要调用函数的父模块是惯用的方式，因为这样能让我们在调用时清楚的知道这个函数的归属。而引入结构体、枚举以及一些其他内容时，惯用的方式是直接引入全部的路径。
```rust
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert(1, 2);
}
```

这里没有强制性的要求，只不过这种方式是Rust代码惯用的方式。

有一种例外情况是，我们引入了两个模块中名称相同的两个内容，此时需要明确其父模块，因为Rust是不允许同名的。
```rust
use std::fmt;
use std::io;

fn function1() -> fmt::Result{}

fn function2() -> io::Result{}
```

### Providing New Names with the as Keyword

引入不同模块的同名内容的另一个解决方案是通过`as`关键字对其重新命名一个本地使用名称，或者说是别名。

```rust
use std::fmt::Result;
use std::io::Result as IoResult;

fn function1() -> Result{}

fn function2() -> IoResult<()>{}
```

### Re-exporting Names with pub use

当我们使用`use`关键字引入一个模块时，它仅在当前模块中是可用的。为了让调用我们自己模块的代码也能够使用这个模块名称，我们可以通过`pub use`关键字对其进行二次导出。
```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

### Using Nested Paths to Clean Up Large use Lists

如果我们引入一个模块中的多个内容，每行引入一个模块会让我们的文件内容变得很长。例如：
```rust
use std::cmp::Ordering;
use std::io;
```

可以通过嵌套的方式引入同一个模块中的多个内容。
```rust
use std::{cmp::Ordering, io};
```

在大型项目中，这种方式能有效减少use语句的数量。同时嵌套引用允许我们在任意的层级进行嵌套。
```rust
use std::io::{self, Write};
```

### The Glob Operator

如果想要引入模块下的所有`pub`的内容，可以使用通配符`*`。
```rust
use std::collections::*;
```
这种方式需要谨慎使用，因为有可能会跟你本地的一些名称冲突。这种引入方式一般用在测试模块中。

## Section 5 - Separating Modules into Different Files

当模块越来越大，你就需要分别将这些代码分割到不同的文件中去了。

src/lib.rs
```rust
mod front_of_house;

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

src/front_of_house.rs
```rust
pub mod hosting {
    pub fn add_to_waitlist() {}
}
```

在`mod front_of_house`后接一个分号，此时Rust会加载跟这个模块名称相同的文件内容。我们可以将front_of_house文件再分割。

src/front_of_house.rs
```rust
pub mod hosting;
```

src/front_of_house/hosting.rs
```rust
pub fn add_to_waitlist() {}
```
