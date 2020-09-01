# Chapter 11 - 关于Cargo和Crates.io

目前为止我们只使用到cargo创建、运行、测试、构建等基础功能。本章会介绍它的其他功能。包括：
 - 使用配置文件定制构建
 - 在[crates.io](https://crates.io/)发布库
 - 使用工作空间管理大型项目
 - 安装[crates.io](https://crates.io/)上的二进制文件
 - 定制化命令扩展cargo

可以在[cargo官方文档](https://doc.rust-lang.org/cargo/)查看全部功能说明。

## Section 1 - 使用配置文件定制构建

Rust中，*配置文件（release profiles）*是预定义的、可自定义的文件，不同的配置选项可以对代码编译进行控制。每个文件的配置都是独立的。

cargo有两个主要的配置文件
 - `dev`配置文件。`cargo build`命令会使用这个配置文件。包含针对开发环境的默认配置
 - `release`配置文件。`cargo build --release`命令会使用这个配置文件。包含针对发布环境的默认配置。

当*Cargo.toml*文件中没有`[profile.*]`声明时，cargo会使用默认配置。对想要修改的配置文件加`[profile.*]`声明，就可以对默认配置进行覆盖和定制化。例如：
```toml
[profile.dev]
opt-level = 0

[profile.release]
opt-level = 3
```
分别对`dev`和`release`配置文件，针对`opt-level`配置进行了定制化。

## Section 2 - 发布Crate到Crates.io

Rust和Cargo有很多功能，辅助包发布和查找。首先介绍三个功能然后再介绍如何发布自己的包。

### 有用的文档注释

准确描述你的包有助于让其他人更容易地了解如何使用、何时使用你的包，所以有用的文档很有必要。代码注释时使用双斜线`//`，Rust也有专门针对文档的注释，称之为*文档注释（documentation comment）*，文档注释会用来生成html页面。html展示了你对公开API的介绍，文档内容应当是介绍如何使用你的API，而不是描述你如何实现的这些API。

文档注释使用三斜线`///`，并且支持md语法。文档注释放置于被描述对象之前。例如我们创建一个`my_crate`库，里面包含一个`add_one`函数。
```rust
/// Adds one to the number given.
///
/// # Examples
///
/// ```
/// let arg = 5;
/// let answer = my_crate::add_one(arg);
///
/// assert_eq!(6, answer);
/// ```
pub fn add_one(x: i32) -> i32 {
    x + 1
}
```

我们描述了`add_one`函数的功能是什么，然后`Examples`下面是一个示例代码块。`cargo doc`命令可以基于这些描述生成html文档。这个命令运行了Rust提供的`rustdoc`工具，并且将生成的html文件放置于*target/doc*目录下。

使用`--open`参数会在文档创建完成之后打开浏览器，效果如下：
![rust doc](https://gitee.com/ksleo/source/raw/master/QQ20200901-165110@2x.png)

#### 常用模块

我们已经使用`# Examples`md语法，创建了一个示例代码模块，下面还有一些常用的模块：
 - **Panics**：会导致代码出错的场景。
 - **Errors**：如果函数返回的是一个`Result`，描述一下返回的错误类型，以及如何处理这些错误。
 - **Safety**：如果这个函数调用是`unsafe`的，应当描述函数为何是`unsale`，以及涵盖希望由调用者维护的不变性（invariants）。

#### 文档注释测试用例

`cargo test`命令会将文档注释中examples模块下的示例代码作为测试用例运行。这会保证你的代码和示例代码是同步的，因为当你修改其中任意部分时，如果出错文档测试会捕获到。

#### 目录性描述

对crate包含内容的一个总体描述。
```rust
//! # My Crate
//!
//! `my_crate` is a collection of utilities to make performing certain
//! calculations more convenient.

/// Adds one to the number given.
```

![rust doc](https://gitee.com/ksleo/source/raw/master/QQ20200901-171515@2x.png)

### 使用`pub use`导出公有API

在写代码时，你的代码结构可能自己比较清楚，但对于使用者来说可能不是特别方便。在组织代码时，可能进行了很深的模块嵌套，但是当使用者想要使用一个定义的很深的API时，找到它就比较费劲了。例如：`use my_crate::some_module::another_module::UsefulType;`。显然`use my_crate::UsefulType`对调用者更加的友好。

因此当发布包时，API的结构是首先要考虑的问题。因为使用者不会像你一样熟悉你的代码结构。

当一个API对调用者不太友好时，你不需要修改你的代码组织，你可以使用`pub use`二次导出。`pub use`导入一个共有API，并且将其再对外公开暴露。

创建一个`art`包，它的内容如下所示：
```rust
//! # Art
//!
//! A library for modeling artistic concepts.

pub mod kinds {
    /// The primary colors according to the RYB color model.
    pub enum PrimaryColor {
        Red,
        Yellow,
        Blue,
    }

    /// The secondary colors according to the RYB color model.
    pub enum SecondaryColor {
        Orange,
        Green,
        Purple,
    }
}

pub mod utils {
    use crate::kinds::*;

    /// Combines two primary colors in equal amounts to create
    /// a secondary color.
    pub fn mix(c1: PrimaryColor, c2: PrimaryColor) -> SecondaryColor {
        // --snip--
    }
}
```

查看它的文档：
![rust doc](https://gitee.com/ksleo/source/raw/master/QQ20200901-173414@2x.png)

`PrimaryColor`、`SecondaryColor`和`mix`都没有在首页展示出来，需要我们手动点入这些模块。并且其他模块调用我们的包时，引用的链路特别长：
```rust
use art::kinds::PrimaryColor;
use art::utils::mix;

fn main() {
    let red = PrimaryColor::Red;
    let yellow = PrimaryColor::Yellow;
    mix(red, yellow);
}
```

为了移除这个调用者冗长的调用链路，我们可以在自己的包中，将这些API进行二次导出：
```rust
pub use self::kinds::PrimaryColor;
pub use self::kinds::SecondaryColor;
pub use self::utils::mix;
```
`PrimaryColor`、`SecondaryColor`和`mix`都更容易找到了，文档如下：
![rust doc](https://gitee.com/ksleo/source/raw/master/QQ20200901-174144@2x.png)

并且调用者在引用代码，代码量也更少：
```rust
use art::PrimaryColor;
use art::mix;
```


### 创建Crates.io账号

首先去[crates.io](https://crates.io/)注册一个账号，验证邮箱之后，获取API token。然后在终端使用token登陆。
    
    cargo login abcdefghijklmnopqrstuvwxyz012345

token会被存储在*~/.cargo/credentials.*文件下。注意不要将token分享出去。

### 为新包添加元数据

发布之前需要在*Cargo.toml*文件的[package]模块下追加一些元数据。

注意你的包名必须是唯一的。当你在本地开发时，跟目录名称可以随意，但是在发布时，元数据当中的包名称必须是唯一的，不能跟别人的包名称冲突。因此在发布之前可以去网站上先搜索一下你的名字有没有被使用。

*Cargo.toml*文件下的[package]模块中定义包名称：
```toml
[package]
name = "ksleo_public_test"
```

当你选好唯一的名称之后，使用`cargo publish`发布，会出现一个错误
>error: api errors (status 200 OK): missing or empty metadata fields: description, license. Please see https://doc.rust-lang.org/cargo/reference/manifest.html for how to upload metadata

因为你的项目还缺少一些关键信息：描述和证书。描述你的包是做什么用，并且你的包是基于什么证书给别人使用的。
```toml
[package]
license = "MIT"
description = "just for pub test"
```

在[package]模块下加入这些内容后，就可以成功发布了。

### 发布新版本

修改*Cargo.toml*文件下的版本号，重新发布即可。

### 使用`cargo yank`禁用版本

cargo不支持删除某个历史版本，但可以将历史版本禁用，防止其他人将该版本加入依赖。

yanking只能防止新项目将该版本作为依赖，已存在的项目依旧可以下载该版本。

下面的命令就将1.0.1版本禁用了，任何新项目都不能再依赖该版本

>$ cargo yank --vers 1.0.1

如果要撤销某个版本的禁用，可以使用`--undo`参数
>$ cargo yank --vers 1.0.1 --undo

## Section 3 - Cargo工作空间




