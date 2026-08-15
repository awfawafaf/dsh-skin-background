/** Custom-background row dictionaries. */
export declare const zh: {
    readonly title: "背景";
    readonly none: "未设置";
    readonly chooseAndSave: "选择图片并保存…";
    readonly importFromFolder: "从文件夹导入";
    readonly pickFolder: "选择文件夹…";
    readonly defaultFolder: "默认位置";
    readonly noNewImages: "文件夹里没有新图片";
    readonly importFailed: "导入失败，请检查图片文件夹";
    readonly pickFailed: "选择文件夹失败，请重试";
    readonly opacity: "透明度";
    readonly chromeOpacity: "边栏透明度";
    readonly saved: "已保存";
    readonly apply: "应用";
    readonly delete: "删除";
    readonly fileTooLarge: "图片太大(静态图限 12MB,动图限 15MB),请换一张更小的";
    readonly tooManyItems: "保存的图片数量已达上限(24 张),请先删除一些";
    readonly uploadFailed: "图片上传失败，请重试";
    readonly hint: "在「皮肤」中选择「自定义背景」即可生效；支持 GIF 动图；图片保存在本地，离线可用。";
};
export declare const en: {
    readonly title: "Background";
    readonly none: "Not set";
    readonly chooseAndSave: "Choose and save image…";
    readonly importFromFolder: "Import from folder";
    readonly pickFolder: "Choose folder…";
    readonly defaultFolder: "Default location";
    readonly noNewImages: "No new images in the folder";
    readonly importFailed: "Import failed; check the image folder";
    readonly pickFailed: "Could not pick the folder; try again";
    readonly opacity: "Opacity";
    readonly chromeOpacity: "Sidebar transparency";
    readonly saved: "Saved";
    readonly apply: "Apply";
    readonly delete: "Delete";
    readonly fileTooLarge: "Image too large (12MB for stills, 15MB for GIFs); pick a smaller one";
    readonly tooManyItems: "The library is full (24 images); delete some first";
    readonly uploadFailed: "Could not upload the image; try again";
    readonly hint: "Pick “Custom Background” in the Skin row to apply; animated GIFs work; images are stored locally and work offline.";
};
/** Locale keys for the background row. */
export type BackgroundKey = keyof typeof zh;
