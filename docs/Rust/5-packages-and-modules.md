# Chapter 5 - Managing Growing Projects with Packages, Crates, and Modules

当项目体积越来越大，良好的代码组织就变得很重要。因为只靠脑子记忆整个项目的代码逻辑是不可能的。

目前为止所写的一些示例程序都是一个模块一个文件下的。当项目体积增长，就可以将代码分割到不同模块不同文件中。一个*package（包）*可以包含多个二进制crate，并且可以选择性的包含一个库crate。当包体积变大，可以通过提取代码成一个独立的crate，将它转变为一个外部依赖。本章会涵盖所有这些技术。

除了分组功能，封装逻辑实现代码可以让代码复用：当你封装了一个操作，其他地方的代码可以通过接口直接使用这个功能，而不需要知道内部具体是如何实现的。封装代码哪部分是公用接口，哪部分是私有属性，这取决于封装实现的编码人员。

还有一个相关概念称之为*scope（域）*：这是一个嵌套结构的上下文环境。当读写编译代码时，编码人员和编译器都需要知道特定位置的一些特定名称代表的是一个变量、函数、结构体、模块还是一些其他的东西。你可以创建一个scope并指定哪些内容在这个scope中。在同一个scope中不允许出现两个名称一致的实体。有一些工具可以解决命名冲突。

Rust模块系统包括：
 - **Packages**：是Cargo的一个功能，可以用来创建、测试和发布crate。
 - **Crates**：一个导出二进制文件或者可执行文件的模块树。
 - **Modules**和**use**：用来控制*Paths*的组织、域和隐私。
 - **Paths**：命名实体的方式，例如给函数、结构体和模块命名。

接下来会依次覆盖这些内容。

## Section 1 - Packages and Crates

*crate*是一个二进制文件或者库。*crate root*是编译器开始编译并把你的crate打包成根模块的源文件。*package*是由一个或者多个提供了某些功能的crate组成的。一个package有一个描述如何构建这些crate的*Cargo.toml*文件。

一个package最多包含一个库crate，可以包含任意数量的二进制crate。但是至少要包含一个crate。

看一下使用`cargo new`创建新的package时发生了什么。

    $ cargo new my-project
        Created binary (application) `my-project` package
    $ ls my-project
    Cargo.toml
    src
    $ ls my-project/src
    main.rs


cargo生成一个package，创建了一个*cargo.toml*文件。看一下cargo.toml文件的内容，里面没有关于*src/main.rs*的信息，因为Rust遵循一个规定，*src/main.rs*文件是与package同名的二进制crate的入口文件。如果package下有一个*src/lib.rs*文件，则它是与package同名的库crate的入口文件。cargo将入口文件传给`rustc`构建库或者二进制文件。

我们刚生成的项目中，只有一个src/main.rs文件，意味着这个项目只有一个二进制crate。如果package中同时具有*src/main.rs*和*src/lib.rs*文件，则说明这个package有一个二进制crate和一个库crate，且都与package同名。如果package具有多个二进制crate，则对应的文件需要存放在*src/bin*目录下，每个文件都是一个独立的二进制crate。

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

如何导入模块中的内容使用，Rust使用和文件系统路径相似的概念。