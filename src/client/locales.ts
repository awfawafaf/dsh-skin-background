/** Custom-background row dictionaries. */

export const zh = {
  title: '背景',
  none: '未设置',
  chooseAndSave: '选择图片并保存…',
  opacity: '透明度',
  chromeOpacity: '边栏透明度',
  saved: '已保存',
  apply: '应用',
  delete: '删除',
  fileTooLarge: '图片太大(静态图限 12MB,动图限 15MB),请换一张更小的',
  tooManyItems: '保存的图片数量已达上限(24 张),请先删除一些',
  libraryTooLarge: '保存库总大小已达上限(60MB),请先删除一些图片',
  readFailed: '图片读取失败，请重试',
  hint: '在「皮肤」中选择「自定义背景」即可生效；支持 GIF 动图；图片内嵌保存，离线可用。',
} as const

export const en = {
  title: 'Background',
  none: 'Not set',
  chooseAndSave: 'Choose and save image…',
  opacity: 'Opacity',
  chromeOpacity: 'Sidebar transparency',
  saved: 'Saved',
  apply: 'Apply',
  delete: 'Delete',
  fileTooLarge: 'Image too large (12MB for stills, 15MB for GIFs); pick a smaller one',
  tooManyItems: 'The library is full (24 images); delete some first',
  libraryTooLarge: 'The library is at its size cap (60MB); delete some images first',
  readFailed: 'Could not read the image; try again',
  hint: 'Pick “Custom Background” in the Skin row to apply; animated GIFs work; images are embedded and work offline.',
} as const

/** Locale keys for the background row. */
export type BackgroundKey = keyof typeof zh
