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
