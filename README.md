# dsh-skin-background

自定义背景皮肤:在 DeepSeek Harness Web GUI 里作为**一个皮肤选项**与「经典」「深海女仆」并列 —— 选中即生效,切走即还原。

- **系统文件窗口选图**:点「选择图片并保存…」弹出系统原生「打开」对话框,选中的图片自动内嵌为 data URI 保存(离线可用、无需服务器);
- **保存库**:可随时「应用」历史图片或「删除」,单张上限 4MB;
- **透明度**:0–100%(步进 5),向主题底色渐变淡出;
- **跟随主题**:亮/暗切换时自动重画(未保存图片时用默认渐变:亮 = 鲸蓝天空,暗 = 深海军蓝);
- **完整还原**:切走皮肤时恢复之前的背景,不留痕迹。

## 安装

```sh
dsh plugin --profile web add dsh-skin-background
```

依赖同一个 profile 里的 `dsh-skin-manager`(皮肤管理器)。安装后**重启 dsh web**,然后在 设置 → 常规 → 「皮肤」选择「自定义背景」。

## 使用

1. 设置 → 常规 → 「皮肤」行选择「**自定义背景**」—— 立即生效(未保存图片时显示默认渐变);
2. 「背景」行点「选择图片并保存…」从系统文件窗口选图 —— 自动存入保存库并设为当前图;
3. 「已保存」列表可「应用」/「删除」;透明度滑杆即时生效;
4. 切回「经典」或「深海女仆」即还原原皮肤外观。

## 数据模型

设置命名空间 `skin-background`(Host settings 文档):

```ts
interface BackgroundSettings {
  activeId: string        // 当前应用的已保存图片 id;空 = 默认渐变
  opacity: number         // 0–100
  items: BackgroundItem[] // 保存库
}
interface BackgroundItem {
  id: string
  name: string            // 原文件名(仅显示)
  dataUrl: string         // 内嵌 data URI
}
```

皮肤激活状态本身由管理器持久化(`skin-manager.skin`)。

## 绘制方式

背景画在 `document.body` 的内联样式上 —— 与 maid-atelier 宫殿背景同一个已验证的绘制槽位(半透明面板之下可见)。透明度用「向 `--dsw-alias-bg-base` 底色渐变的渐变蒙层」实现,不需要额外图层,规避 z-index 层序风险。body 的 MutationObserver 在主题翻转或其它皮肤重写背景时自动重画(幂等,不会循环)。

## 开发

```sh
pnpm install
pnpm run typecheck && pnpm test && pnpm run build
```

产物:`lib/index.js`(host 半)+ `lib/client.js`(浏览器 bundle)+ `lib/types/`。`lib/` 提交进 git。

## 许可

MIT
