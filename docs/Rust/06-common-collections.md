# Chapter 6 - Common Collections

Rust标准库提供了很丰富的数据集合类。大多数数据结构通常只能存储一条数据，而集合可以存储多条数据。跟数组和元组不同，集合的数据存储在heap上，这意味着它存储的数据可以不用在编译阶段确定大小和内容，可以在运行时自由操作。这里介绍使用频率最高的三种集合类型：
 - Vector
 - String
 - HashMap

## Section 1 - Vector

首先介绍集合`Vec<T>`，vector允许你在单个数据结构里存储多个值，这些值存储在内存中相邻的位置。Vector只能存储相同类型的数据，当你有一个类型列表时Vector非常适用。

### Creating a New Vector

通过`Vec::new`方法新建一个vector。
```rust
let v:Vec<i32> = Vec::new();
```

Vector是基于泛型实现的，创建vector时如果没有初始化值，则需要指定类型。

在一些应用场景中，Rust可以根据指定的初始化值推断vector的类型，所以一半很少通过类型变量指定类型。创建vector时进行初始化是比较常见的方式，Rust提供了`vec!`宏来初始化并创建vector。

```rust
let v = vec![1, 2, 3];
```

由于我们使用`i32`类型的数据初始化vector，因此Rust可以推断出这个vector是`i32`类型的。

### Updating a Vector

使用`push`方法在vector实例上追加数据。

```rust
let mut v = Vec::new();

v.push(5);
v.push(6);
v.push(7);
v.push(8);
```

vector类型的变量要更改时也需要使用`mut`关键字声明。由于push的数据都是`i32`类型的，因此Rust将此类型推断为vector的类型，因此可以不用指定其类型。

### Dropping a Vector Drops Its Elements

跟其他结构体一样，vector所在的上下文结束时，它将被释放（没有发生所有权转移）。当vector被释放时，它内部的数据也将被删除。这听起来似乎简单合理，但是当开始引用vector内的数据时，情况将变得复杂。

### Reading Elements of Vectors

有两种方式引用vector中存储的数据。

```rust
 let v = vec![1, 2, 3, 4, 5];

let third: &i32 = &v[2];
println!("The third element is {}", third);

match v.get(2) {
    Some(third) => println!("The third element is {}", third),
    None => println!("There is no third element."),
}
```

第一种方式通过`&[]`返回一个引用，然后使用下标访问vector中的数据，下标从0开始，与数组类似。第二种方式通过vector实例上的`get`方法，它返回一个`Option<&T>`。

由于有两种访问方式，所以当发生越界访问时，需要针对不同的访问方式做不同的处理。

```rust
let v = vec![1, 2, 3];

let num = &v[100];

let num = v.get(100);
```

第一种访问方式会导致程序报错，当你希望发生越界时程序终止运行，可以使用这种方式。

当使用`get`方法时，如果发生越界访问，它会返回`None`，后续应当有处理`Some(&i32)`和`None`的逻辑。这种方式相比程序终止，有更好的用户体验。

当创建了一个有效引用，borrow checker会强制执行所有权和[引用规则](/Rust/2-ownership.html#the-rules-of-references)检查来确保当前引用和其他指向vector内容的引用也是有效的。

```rust
let mut v = vec![1, 2, 3, 4, 5];

let first = &v[0];

v.push(6);

println!("The first element is: {}", first);
```

这个代码在编译阶段会报错，因为在同一个上下文环境中，对同一个数据存在immutable引用时，不能有mubable类型的引用。这段代码看上去应该是可以运行的，为什么对vector头部的引用和vector尾部的push操作会发生冲突呢？因为追加数据时有可能存在当前内存不足，在heap上重新分配内存，而此时旧的引用还指向之前被释放的内存，此时不符合引用规则中所有引用都必须有效的那一条，因此编译器会直接报错。

### Iterating over the Values in a Vector

使用`for`循环遍历vector，获取内部每一条数据的一个immutable引用。

```rust
let v = vec![1, 2, 3];

for &i in &v {
    println!("{}", i);
}
```

也可以通过遍历mutable引用来修改vector中的数据。

```rust
let mut v = vec![1, 2 ,3];
for &i in &mut v {
    i *= 2;
}
```

### Using an Enum to Store Multiple Types

之前说过vector只能存储相同类型的数据，这个限制很不方便，因为有很多的场景需要存储不同类型的数据列表。我们可以通过定义枚举来满足这种场景需求。

比如我们需要读取一个电子表格的一行数据，其类型可能是数字、字符串等。
```rust
enum SpreadsheetCell {
    Int(i32),
    Float(f64),
    Text(String),
}

let row = vec![
    SpreadsheetCell::Int(3),
    SpreadsheetCell::Text(String::from("blue")),
    SpreadsheetCell::Float(10.12),
];
```

Rust在编译阶段需要知道vector存储何种数据类型，方便在heap上分配每个元素所需要的内存大小。第二个好处是可以明确指定这个vector存储的是何种类型。

在编写过程中，如果你不能确定枚举下的所有类型，这种方式则不适用。此时可以用trait对象作为替代，后面的章节中会介绍到trait对象。

## Section 2 - String

许多Rust新手对String会在理解上有一些吃力，基于一下三个可能的原因：
 - Rust倾向于抛出任何可能的错误。
 - String是一个比许多程序员所理解的更加复杂的数据类型。
 - UTF8。
  
将String放在集合这一章讨论，是由于String类型是基于字节的集合实现的，并且添加了一些实用功能，这些字节在String类型中会被解析为文本。下面会讨论String类型和其他集合类型的相同之处，如creating，updating，reading等操作。还将讨论String和其他集合类型的不同之处——Stirng类型上操作的复杂化，由于人和机器对文本的解释方式不同。

### What Is a String?

首先定义一下*string*的含义。Rust语言核心中只有一种字符串类型，即字符串切片`str`。之前介绍过字符串切片，是对一些utf8编码数据的引用。保存在二进制文件中的字符串字面量也是`str`。

而`String`类型，是由Rust标准库提供而非写在Rust语言核心中，是一种可扩展、可修改、utf8编码的字符串类型。当在Rust中提到字符串类型时，一般指的是这两种类型而非其中一种。

### Creating a New String

`String`类型上的方法大多数都是和`Vec<T>`类型相似的。比如新建方法`new`。
```rust
let mut s = String::new();
```

这里新建了一个空的字符串`s`，之后可以在它上面存储文本数据。但是通常在新建字符串时都会有初始化的值。可以使用`to_string`方法将字面量或者`str`数据转换成`String`类型。也可以使用`String::from`方法来创建，跟`to_string`方法效果是一样的。
```rust
let data = "initial data";

let s = data.to_string();
let s = "initial data".to_string();

let s = String::from("initial data");
```

`String`类型是utf8编码的，因此它可以存储任何utf8编码范围内的文本数据，以下都是有效的字符串数据。
```rust
let hello = String::from("السلام عليكم");
let hello = String::from("Dobrý den");
let hello = String::from("Hello");
let hello = String::from("שָׁלוֹם");
let hello = String::from("नमस्ते");
let hello = String::from("こんにちは");
let hello = String::from("안녕하세요");
let hello = String::from("你好");
let hello = String::from("Olá");
let hello = String::from("Здравствуйте");
let hello = String::from("Hola");
```

### Updating a String

`String`类型大小、内容都可以改变，可以像`Vec<T>`一样用push的方式追加数据。此外，也可以通过`+`运算符或者`format!`宏来进行字符串拼接。

#### Appending to a String with `push_str` and `push`

`push_str`方法追加一个字符串切片。
```rust
let mut s = String::from("foo");

s.push_str("bar");
```

`push`方法追加单个字符。
```rust
s.push('a');
```

#### Concatenation with the + Operator or the format! Macro

`+`运算符拼接字符串
```rust
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2; // 这里s1的所有权发生了转移
```

加运算执行完毕后`s1`不再有效的原因，和为什么要使用`s2`的引用进行加运算的原因，在于执行`+`运算时所调用的方法。该方法的声明类似于：
```rust
fn add(self, s: &str) -> String
```

标准库中的`add`方法是通过泛型声明的。这里我们使用`String`类型作为说明。

首先`s2`变量之前有`&`修饰符，说明这里是一个`s2`的引用。由于`add`方法的声明，只能将一个第二个字符串的引用作为参数和第一个字符串做合并。也不能合并两个`String`类型的数据。但是，`&s2`是一个`&String`类型而非`&str`类型，为什么编译器没有报错？

因为编译器可以将`&String`类型*coerce（强转换）*为`&str`类型。调用`add`方法时，Rust进行了deref coercion（隐式强转换），在这个例子中，`&s2`将返回`&s2[..]`。由于`add`方法没有获取参数`s`的所有权，因此`s2`变量在计算之后依然是有效的。

其次，`add`方法获取了`self`的所有权。这意味着`s1`变量在进行计算之后不再有效。`s3 = s1 + &s2;`看起来是进行了值的复制和拼接，并且创建了新的变量。实际上是对`s1`进行内容追加后转移了的所有权。看似进行了许多复制和变量的新建，实际上要比这更有效率。

而在多个字符串进行拼接时，`+`运算符看起来会比较啰嗦。此时使用`format!`宏代替是比较好的方案。
```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = format!("{}-{}-{}", s1, s2, s3);
```
`format!`宏的方法比`+`运算符可读性更好，并且它不会获取任何参数的所有权。

### Indexing into Strings

在其他语言中，使用索引访问字符串中的某个字符是常见的操作。但是在Rust中会报错，Rust不支持数字索引，要解释这个问题，需要讨论Rust如何在内存中存储String数据。

#### Internal Representation

`String`类型是对`Vec<u8>`类型的一层封装。来看一些utf8编码的字符串示例
```rust
let mut s = String::from("hola");
```

在这个示例中，`s`的长度是4，意思是vector存储的“hola”有4字节长，每个字母占1字节。但是在其他字符数据的情况下呢？
```rust
let hello = "Здравствуйте";
// 注意这是西里尔字母З，而不是阿拉伯数字3
let answer = &hello[0];
```
这个例子中，`answer`会是`З`吗？在utf8编码中，3的第一个字节是`208`，第二个字节是`151`，所以`answer`的值是`208`，而`208`不是一个有效字符。这跟用户期望返回第一个字符不一致，但Rust在0索引处存储的值就是`208`的16进制。用户通常不希望获得字节类型的数据，哪怕字符串全部是由拉丁字母组成的。如果`&"hello"[0]`是一个合法的索引，那么它也只会返回`104`而不是`h`。因此，Rust不允许使用索引访问字符串中的字符，在编译阶段就抛出错误，以免在开发阶段对代码的执行产生误解。

#### Bytes and Scalar Values and Grapheme Clusters

从Rust的视角来看，有三种相关的方式查看String中的数据：*Bytes（二进制）*，*scalar values（标量）*，*grapheme clusters（词组）*（最接近人类字符的概念）。

用梵文写的印地语"नमस्ते"，在`Vec<u8>`中存储的数据是
> `[224, 164, 168, 224, 164, 174, 224, 164, 184, 224, 165, 141, 224, 164, 164, 224, 165, 135]`。

这18个16进制数据就是计算机最终存储的数据。如果从unicode标量的角度看，也是Rust中的`char`类型。这些字节串可以看作
> `['न', 'म', 'स', '्', 'त', 'े']`

其中有6个char字符，其中第四个和第六个是变音符号，不具备表意功能。最后，如果从词组的角度看，就可以得到一个人类阅读友好的组成单词的四个字母。
> `["न", "म", "स्", "ते"]`

Rust提供了多种方式来解释计算机存储的原始字符数据，满足不同程序的数据需求，而不用关心具体使用的是哪种人类语言。

Rust不允许使用索引访问字符串数据的最后一个原因是，索引操作要求数据量不会影响读取的时间复杂度（O(1)）。但是这在String类型的性能上是不能够保证的，因为Rust需要从头遍历到索引位置处，找出其中有效的字符。

### Slicing Strings

索引访问String不是一个好的方案，原因还在于索引访问的返回值不清晰，是应该返回二进制数据，还是字符，还是词组，还是字符串切片呢？因此，Rust需要编码者在使用索引创建字符串切片时更加准确的定义返回值。为了更具体的索引，请使用`[]`和范围语法创建字符串切片，而不是在`[]`中使用单个数字。
```rust
let hello = "Здравствуйте";

let s = &hello[0..4];
```

这里`s`是一个`&str`，由于每个西里尔字符使用2字节编码，因此`s`的值应该是Зд。如果把`s`变量改成`&hello[0..3]`，程序会在运行时崩溃——当前索引不在正确的字符边界处。在使用range创建字符串切片时需要小心，因为有可能会让程序崩溃。

### Methods for Iterating Over Strings

如果需要在每个单独的unicode字符标量上执行某些操作，可以通过String的`chars`方法来遍历每个字符标量，它返回的是`char`类型。
```rust
for c in "नमस्ते".chars() {
    println!("{}", c);
}
```

`bytes`方法返回原始的字节数据。
```rust
for b in "नमस्ते".bytes() {
    println!("{}", b);
}
```
请记住有效的unicode字符标量是有1个或以上的字节所组成的。

由于返回词组的方法比较复杂，因此标准库并没有提供相关功能。有需要可以上[crates.io](https://crates.io/)查看。

### Strings Are Not So Simple

Rust将正确的处理字符串数据作为所有程序的默认行为，因此编码者需要在前期投入精力去思考如何正确的处理utf8数据。代价则是相比其他编程语言，Rust暴露了更多的复杂性给编码者，但同时能够让你避免类似于非ASCII字符的错误。

## Section 3 - HashMap

最后一个要介绍的常见集合是*hash map*。`HashMap<K, V>`类型存储的是`K`类型与`V`类型之间的键值对映射关系。通过*hashing function*来实现，这个函数确定了键和值如何在内存中存储。这个功能很多编程语言都提供了，只不过叫法有差异，比如哈希表、对象、map、字典等等。

当你想通过非数字索引的方式查看数据时，哈希表是很实用的，它使用的是任意数据类型的键来检索数据。

我们仅列举一些常用的API，在标准库`HashMap<K, V>`中定义了许多实用的方法，具体查阅标准库文档。

### Creating a New Hash Map

通过`new`方法新建，`insert`方法插入数据。
```rust
use std::colloctions::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);
```

首先需要引入`HashMap`模块。在介绍的三种集合中，HashMap是使用频率最低的，因此它没有被默认包含到上下文中。标准库对HashMap的支持也很少，比如没有宏来构建HashMap。

跟vectors一样，哈希表的数据存储在heap上。上面的代码定义了一个键为`String`类型，值为`i32`类型的哈希表。哈市表跟vector一样是同质的，即键是同一种数据类型，值也是同一种数据类型。

另外一种创建哈希表的方式是通过迭代器和元组组成的vector上的`collect`方法，其中每个元组包含哈希表的键和值。`collect`方法将数据收集到多种集合类型中，包括哈希表。`zip`方法可以用来创建元组组成的vector。
```rust
use std::collections::HashMap;

let teams = vec![String::from("Blue"), String::from("Yellow")];
let initial_scores = vec![10, 50];

let mut scores: HashMap<_, _> =
    teams.into_iter().zip(initial_scores.into_iter()).collect();
```

类型声明`HashMap<_, _>`是必须的，因为`collect`方法会把数据收集到许多种集合中，除非你指定，否则Rust不知道你需要的是哪一种。键和值的类型参数使用下划线占位，此时Rust可以通过返回值来推断键和值的类型。

### Hash Maps and Ownership

对于实现了`Copy`trait的类型来说，比如`i32`，值是拷贝进哈希表的。对于owned的数据类型来说，比如`String`，所有权会被转移到哈希表上。
```rust
use std::collections::HashMap;

let field_name = String::from("Favorite color");
let field_value = String::from("Blue");

let mut map = HashMap::new();
map.insert(field_name, field_value);

// error[E0382]: borrow of moved value: `field_name`
```

在这个例子中，当`field_name`和`field_value`被添加到map之后，我们是不能使用这个值的，因为所有权被传递到了map中。

如果我们使用引用插入到哈希表中，那么所有权将不会被移动到哈希表中。但是，此时需要保证引用的有效时间至少要和哈希表一致。

### Accessing Values in a Hash Map

`get`方法获取哈希表的值。`get`方法返回`Option<&V>`。
```rust
use std::collection::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

let team_name = String::from("Blue");
let score = scores.get(&team_name);
```

使用`for`循环遍历键值对
```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

for (key, value) in &scores {
    println!("{}: {}", key, value);
}
```

### Updating a Hash Map

键值对的数量是可以增加的，但是每个键只能关联到一个值。当你需要修改哈希表的值时，需要考虑到值已经关联了值的情况，覆盖、舍弃还是合并。

#### Overwriting a Value

如果在插入值之后，重新对同一个键进行了插值，那么新值会将旧值覆盖。
```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Blue"), 25);

println!("{:?}", scores);
// 25
```

#### Only Inserting a Value If the Key Has No Value

检查键是否关联了值，如果没有就给他它关联一个新值，这是很常见的逻辑。哈希表对这种情况提供了一个特殊的API`entry`，它的参数是你需要检查的键，返回一个`Entry`枚举，代表一个值是否存在。
```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);

scores.entry(String::from("Yellow")).or_insert(50);
scores.entry(String::from("Blue")).or_insert(50);

println!("{:?}", scores);
// {"Yellow": 50, "Blue": 10}
```

`or_insert`方法当键存在时，返回一个该键值的可变引用。如果不存在，则把参数当作值插入到哈希表中然后返回一个可变引用。

#### Updating a Value Based on the Old Value

另一种常见场景是使用旧值更新哈希表的新值。
```rust
use std::collections::HashMap;

let text = "hello world wonderful world";

let mut map = HashMap::new();

for word in text.split_whitespace() {
    let count = map.entry(word).or_insert(0);
    *count += 1;
}

println!("{:?}", map);
// {"world": 2, "hello": 1, "wonderful": 1}
```

### Hashing Functions

`HashMap`默认使用*[cryptographically strong](https://www.131002.net/siphash/siphash.pdf)*散列函数。它对DoS攻击有很好对抵抗性。这个算法不是最快的，但是从安全性的角度考虑，舍弃这点性能是值得的。如果你想自己指定散列函数，你可以指定一个*hasher*来自己切换散列函数。hasher是一个实现了`BuildHasher`trait的类型。
