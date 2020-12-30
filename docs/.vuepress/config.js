module.exports = {
  title: 'KSLEO',
  description: 'Just playing around',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }] // 增加一个自定义的 favicon(网页标签的图标)
  ],
  base: '/', // 这是部署到github相关的配置 下面会讲
  markdown: {
    lineNumbers: true // 代码块显示行号
  },
  themeConfig: {
    nav: [
      { text: '笔记📒', link: '/directory/' }, // 内部链接 以docs为根目录
      { text: '博客🔗', link: 'http://leokang28.github.io' } // 外部链接
      // 下拉列表
      // {
      //   text: 'test',
      //   items: [
      //     { text: 'test1', link: '/' },
      //     {
      //       text: 'test2',
      //       link: '/'
      //     }
      //   ]
      // }
    ],
    sidebarDepth: 2, // e'b将同时提取markdown中h2 和 h3 标题，显示在侧边栏上。
    // lastUpdated: 'Last Updated' // 文档更新时间：每个文件git最后提交的时间
  },
  plugins: [
    [
      'vuepress-plugin-mathjax',
      {
        target: 'svg',
        macros: {
          '*': '\\times',
        },
      },
    ],
  ],
}
