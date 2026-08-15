/** Custom-background row dictionaries. */
export declare const zh: {
    readonly title: "背景";
    readonly none: "未设置";
    readonly chooseAndSave: "选择图片并保存…";
    readonly opacity: "透明度";
    readonly chromeOpacity: "边栏透明度";
    readonly saved: "已保存";
    readonly apply: "应用";
    readonly delete: "删除";
    readonly fileTooLarge: "图片太大(静态图限 4MB,动图限 15MB),请换一张更小的";
    readonly readFailed: "图片读取失败，请重试";
    readonly hint: "在「皮肤」中选择「自定义背景」即可生效；支持 GIF 动图；图片内嵌保存，离线可用。";
};
export declare const en: {
    readonly title: "Background";
    readonly none: "Not set";
    readonly chooseAndSave: "Choose and save image…";
    readonly opacity: "Opacity";
    readonly chromeOpacity: "Sidebar transparency";
    readonly saved: "Saved";
    readonly apply: "Apply";
    readonly delete: "Delete";
    readonly fileTooLarge: "Image too large (4MB for stills, 15MB for GIFs); pick a smaller one";
    readonly readFailed: "Could not read the image; try again";
    readonly hint: "Pick “Custom Background” in the Skin row to apply; animated GIFs work; images are embedded and work offline.";
};
/** Locale keys for the background row. */
export type BackgroundKey = keyof typeof zh;
