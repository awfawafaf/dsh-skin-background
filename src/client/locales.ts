/** Custom-background row dictionaries. */

export const zh = {
  title: '背景',
  none: '未设置',
  chooseAndSave: '选择图片并保存…',
  importFromFolder: '从文件夹导入',
  noNewImages: '文件夹里没有新图片',
  importFailed: '导入失败，请检查图片文件夹',
  opacity: '透明度',
  chromeOpacity: '边栏透明度',
  saved: '已保存',
  apply: '应用',
  delete: '删除',
  fileTooLarge: '图片太大(静态图限 12MB,动图限 15MB),请换一张更小的',
  tooManyItems: '保存的图片数量已达上限(24 张),请先删除一些',
  uploadFailed: '图片上传失败，请重试',
  hint: '在「皮肤」中选择「自定义背景」即可生效；支持 GIF 动图；图片保存在本地，离线可用。',
} as const

export const en = {
  title: 'Background',
  none: 'Not set',
  chooseAndSave: 'Choose and save image…',
  importFromFolder: 'Import from folder',
  noNewImages: 'No new images in the folder',
  importFailed: 'Import failed; check the image folder',
  opacity: 'Opacity',
  chromeOpacity: 'Sidebar transparency',
  saved: 'Saved',
  apply: 'Apply',
  delete: 'Delete',
  fileTooLarge: 'Image too large (12MB for stills, 15MB for GIFs); pick a smaller one',
  tooManyItems: 'The library is full (24 images); delete some first',
  uploadFailed: 'Could not upload the image; try again',
  hint: 'Pick “Custom Background” in the Skin row to apply; animated GIFs work; images are stored locally and work offline.',
} as const

/** Locale keys for the background row. */
export type BackgroundKey = keyof typeof zh
