# leihou
雷猴

## 雷猴橱窗

一个纯静态的橱窗售卖网站：一条夜街上陈列着不同小店的橱窗，点开橱窗看商品、放进购物袋、生成订单。

- 在线地址：https://leihou-31d.pages.dev/
- 本地预览：直接双击打开 `index.html`

### 改内容

所有橱窗和商品都在 `windows.js` 里，改完后重新运行下面的发布命令。

| 字段 | 含义 |
| --- | --- |
| `name` / `tag` / `story` / `hours` | 店名、一句话介绍、店铺故事、营业时间 |
| `cat` | 分类，页面顶部的筛选按钮按它自动生成 |
| `color` | 遮阳篷和店铺页头的颜色 |
| `items[].n / e / p / d / stock` | 商品名、图标、价格（元）、描述、库存（0 即已售出） |

### 说明

店铺与商品均为虚构示例。购物袋存在浏览器本地，「去下单」只生成一张可复制的订单文本，没有接入支付。

### 发布

托管在 Cloudflare Pages（项目名 `leihou`）。只上传四个站点文件：

```bash
mkdir -p /tmp/leihou-site && cp index.html style.css app.js windows.js /tmp/leihou-site/ && npx wrangler@3 pages deploy /tmp/leihou-site --project-name leihou --branch main
```
