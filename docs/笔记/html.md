# html个人笔记

 - ## script、script async和script defer的区别

    ![png](https://gitee.com/ksleo/source/raw/master/68747470733a2f2f63646e2e6e6c61726b2e636f6d2f79757175652f302f323032302f706e672f3237353937302f313538333035333939303933392d64373239393664302d336532362d343533312d383832322d6361633336363730396335332e706e67.png)

    script
    ![script](https://gitee.com/ksleo/source/raw/master/68747470733a2f2f63646e2e6e6c61726b2e636f6d2f79757175652f302f323032302f706e672f3237353937302f313538333035343037313738342d30653264386337332d646435372d346563632d626339332d6234316265623332343235662e706e67.png)
    
    script async
    ![script async](https://gitee.com/ksleo/source/raw/master/68747470733a2f2f63646e2e6e6c61726b2e636f6d2f79757175652f302f323032302f706e672f3237353937302f313538333035343137313033392d62656336316664382d333130642d343132642d393364382d3162343162613062333530612e706e67.png)
    
    script defer
    ![script defer](https://gitee.com/ksleo/source/raw/master/68747470733a2f2f63646e2e6e6c61726b2e636f6d2f79757175652f302f323032302f706e672f3237353937302f313538333035343235313738362d30643264356330662d666334322d343936622d616137302d6234626138353437646366382e706e67.png)

 - ## 页面导入样式时，使用link和@import有什么区别？

    区别：
    1. link是HTML标签，@import是css提供的。
    2. link引入的样式页面加载时同时加载，@import引入的样式需等页面加载完成后再加载。
    3. link没有兼容性问题，@import不兼容ie5以下。
    4. link可以通过js操作DOM动态引入样式表改变样式，而@import不可以。

 - ## HTML全局属性(global attribute)有哪些（包含H5）？

    属性|解释
    |:-|:-|
    accesskey|设置快捷键
    class|为元素设置类标识
    contenteditable|指定元素内容是否可编辑
    contextmenu|自定义鼠标右键弹出上下文菜单内容（仅firefox支持）
    data-*|为元素增加自定义属性
    dir|设置元素文本方向（默认ltr；rtl）
    draggable|设置元素是否可拖拽
    dropzone|设置元素拖放类型（copy|move|link,H5新属性，主流均不支持）
    hidden|规定元素仍未或不在相关
    id|元素id，文档内唯一
    lang|元素内容的语言
    spellcheck|是否启动拼写和语法检查
    style|行内css样式
    tabindex|设置元素可以获得焦点，通过tab导航
    title|规定元素有关的额外信息
    translate|元素和子孙节点内容是否需要本地化（均不支持）

 - ##  HTML5的文件离线储存怎么使用，工作原理是什么？
    ### 优点:
    没有网络时可以浏览,加快资源的加载速度,减少服务器负载

    ### 使用:
    只需要在页面头部加入,然后创建manifest.appcache文件

    ### manifest.appcache文件配置
    1. CACHE MANIFEST放在第一行
    2. CACHE:表示需要离线存储的资源列表,由于包含manifest文件的页面将被自动离线存储,所以不需要列出来
    3. NETWORK:表示在线才能访问的资源列表,如果CACHE列表里也存在,则CACHE优先级更高
    4. FALLBACK:表示如果访问第一个资源失败，那么使用第二个资源来替换它
    5. demo

            CACHE MANIFEST
            # 2020-08-01 v1.0.0
            /index.css
            /index.html
            NETWORK
            signin.js
            FALLBACK
            /html/ /offline.html


    ### 浏览器如何解析manifest
    1. 在线情况:浏览器发现html头部有manifest属性,他会请求manifest文件,如果是第一次访问,那么浏览器会根据manifest文件的内容下载相应的资源并且进行离线存储.如果已经访问过并存储,那么浏览器使用 离线的资源价值,然后对比新的文件,如果没有发生改变就不做任何操作,如果文件改变了,那么就会重新下载文件中的资源并进行离线存储
    2. 离线情况:浏览器就直接使用离线存储资源

    ### 与传统浏览器的区别
    1. 离线缓存是针对整个应用,浏览器缓存是单个文件
    2. 离线缓存可以主动通知浏览器更新资源

    ### 状态 window.applicationCache对象的status属性
     - 0.无缓存
     - 1:闲置
     - 2.检查中,正在下载描述文件并检查更新
     - 3:下载中
     - 4:更新完成
     - 5:废弃,应用缓存的描述文件已经不存在了,因此页面无法再访问应用缓存

    ### 事件 window.applicationCache对象的相关事件
    1. oncached:当离线资源存储完成之后就触发这个事件
    2. onchecking:当浏览器对离线存储资源进行更新检查的时候触发
    3. ondounloading:当浏览器开始下载离线资源的时候会触发
    4. onprogress:当浏览器在下载每一个资源的时候会触发
    5. onupdateready:当浏览器对离线资源更新完成之后触发
    6. onnoupdate:当浏览器检查更新之后发现没有这个资源时触发

    ### 注意事项
     - 站点离线存储的容量限制是5M
     - 如果manifest文件,或者内部列举的某一个文件不能正常下载,整个更新过程将视为失败,浏览器继续全部使用老的缓存
     - 引用manifest的html必须与manifest文件同源,在同一个域下
     - 在manifest中使用的相对路径,相对参照物为manifest文件
     - CACHE MANIFEST字符串硬在第一行,且必不可少
     - 系统会自动缓存引用清单文件的HTML文件
     - manifest文件中CACHE则与NETWORK，FALLBACK的位置顺序没有关系，如果是隐式声明需要在最前面
     - FALLBACK中的资源必须和manifest文件同源
     - 当一个资源被缓存后，该浏览器直接请求这个绝对路径也会访问缓存中的资源。
     - 站点中的其他页面即使没有设置manifest属性，请求的资源如果在缓存中也从缓存中访问
     - 当manifest文件发生改变时，资源请求本身也会触发更新

 - ## viewport常见设置

    设置|解释
    |:-|:-|
    width|设置 layout viewport 的宽度，为一个正整数，或字符串"width-device"
    initial-scale|设置页面的初始缩放值，为一个数字，可以带小数
    minimum-scale|允许用户的最小缩放值，为一个数字，可以带小数
    maximum-scale|允许用户的最大缩放值，为一个数字，可以带小数
    height|设置 layout viewport 的高度，这个属性对我们并不重要，很少使用
    user-scalable|是否允许用户进行缩放，值为"no"或"yes", no 代表不允许，yes 代表允许

 - ## 为什么HTML5只需要写<!DOCTYPE HTML>就可以？

    因为 HTML5 与 HTML4 基于的基准不同。HTML4 基于 SGML 因此需要除了 DOCTYPE 外还需要引入 DTD 来告诉浏览器用什么标准进行渲染。DTD 还分为标准模式、严格模式。如果什么都不写，就完全让浏览器自我发挥，会变成怪异模式。
    
    HTML5 不基于 SGML，因此后面就不要跟 DTD，但是需要 DOCTYPE 来规范浏览器的渲染行为。
    
    注：SGML 是通用标记语言的集合。其中有 HTML、XML，因此需要用 DTD 来指定使用那种规范。

 - ## form-data、x-www-form-urlencoded、raw、binary

     - multipart/form-data 其请求内容格式为Content-Type: multipart/form-data,用来指定请求内容的数据编码格式，一般用来文件上传。
     - application/x-www-form-urlencoded 是post的默认格式，使用js中URLencode转码方法。
     - raw 可上传任意格式的文本，可以上传text、json、xml、html等各种文本类型。
     - binary 等同于Content-Type:application/octet-stream，只可上传二进制数据。



