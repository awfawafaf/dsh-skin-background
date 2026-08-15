// @vitest-environment jsdom
/**
 * BackgroundRow component tests: save through the native file input and
 * apply/delete over the saved library (the skin itself is selected in the
 * Skin row; this row manages the library).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BackgroundRow, type BackgroundRowComponentProps } from '../src/client/background-row.tsx'
import { zh } from '../src/client/locales.ts'
import { MAX_IMAGE_BYTES } from '../src/client/background-layer.ts'
import type { BackgroundItem, BackgroundSettings } from '../src/skin-settings.ts'

afterEach(cleanup)

const ITEMS: BackgroundItem[] = [
  { id: 'item-1', name: 'ocean.png', url: '/skin-background/assets/item-1.jpg' },
  { id: 'item-2', name: 'night.png', url: '/skin-background/assets/item-2.jpg' },
]

function makeProps(overrides: Partial<BackgroundRowComponentProps> = {}): BackgroundRowComponentProps {
  return {
    useStore: (selector: (state: BackgroundSettings) => unknown) =>
      selector({ activeId: '', opacity: 100, chromeOpacity: 40, assetDir: '', items: ITEMS }),
    t: (key: keyof typeof zh) => zh[key],
    update: vi.fn(),
    upload: vi.fn(),
    scanFolder: vi.fn(),
    pickFolder: vi.fn(),
    removeAsset: vi.fn(),
    applyItem: vi.fn(),
    previewOpacity: vi.fn(),
    previewChrome: vi.fn(),
    ...overrides,
  } as unknown as BackgroundRowComponentProps
}

function fileInput(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>('input[type="file"]')!
}

describe('BackgroundRow library management', () => {
  it('renders the picker and the saved library', () => {
    render(<BackgroundRow {...makeProps()} />)

    expect(screen.getByText('选择图片并保存…')).toBeTruthy()
    expect(screen.getByText('ocean.png')).toBeTruthy()
    expect(screen.getByText('night.png')).toBeTruthy()
    expect(screen.getAllByText('应用')).toHaveLength(2)
    expect(screen.getAllByText('删除')).toHaveLength(2)
  })

  it('saves a picked file: uploads, appends the item, and applies it instantly', async () => {
    const props = makeProps()
    props.upload.mockResolvedValue({ id: 'new-1', name: 'sea.png', url: '/skin-background/assets/new-1.png' })
    render(<BackgroundRow {...props} />)

    fireEvent.click(screen.getByText('选择图片并保存…'))
    const file = new File(['x'], 'sea.png', { type: 'image/png' })
    fireEvent.change(fileInput(), { target: { files: [file] } })

    await waitFor(() => {
      expect(props.upload).toHaveBeenCalledWith(file)
    })
    await waitFor(() => {
      expect(props.update).toHaveBeenCalledWith('items', [
        ...ITEMS,
        expect.objectContaining({ name: 'sea.png' }),
      ])
    })
    expect(props.applyItem).toHaveBeenCalledWith(expect.objectContaining({ name: 'sea.png' }))
  })

  it('rejects files above the size cap with a friendly message', () => {
    const props = makeProps()
    render(<BackgroundRow {...props} />)

    fireEvent.click(screen.getByText('选择图片并保存…'))
    const file = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'big.png', { type: 'image/png' })
    fireEvent.change(fileInput(), { target: { files: [file] } })

    expect(screen.getByText('图片太大(静态图限 12MB,动图限 15MB),请换一张更小的')).toBeTruthy()
    expect(props.update).not.toHaveBeenCalled()
  })

  it('accepts animated GIFs up to the larger cap', async () => {
    const props = makeProps()
    props.upload.mockResolvedValue({ id: 'new-2', name: 'animated.gif', url: '/skin-background/assets/new-2.gif' })
    render(<BackgroundRow {...props} />)

    fireEvent.click(screen.getByText('选择图片并保存…'))
    const gif = new File([new Uint8Array(5 * 1024 * 1024)], 'animated.gif', { type: 'image/gif' })
    fireEvent.change(fileInput(), { target: { files: [gif] } })

    await waitFor(() => {
      expect(props.update).toHaveBeenCalledWith('items', [
        ...ITEMS,
        expect.objectContaining({ name: 'animated.gif' }),
      ])
    })
    expect(props.applyItem).toHaveBeenCalledWith(expect.objectContaining({ name: 'animated.gif' }))
  })

  it('rejects GIFs above the animated cap', () => {
    const props = makeProps()
    render(<BackgroundRow {...props} />)

    fireEvent.click(screen.getByText('选择图片并保存…'))
    const gif = new File([new Uint8Array(15 * 1024 * 1024 + 1)], 'huge.gif', { type: 'image/gif' })
    fireEvent.change(fileInput(), { target: { files: [gif] } })

    expect(screen.getByText('图片太大(静态图限 12MB,动图限 15MB),请换一张更小的')).toBeTruthy()
    expect(props.update).not.toHaveBeenCalled()
  })

  it('rejects saves when the library hits the item cap', () => {
    const manyItems: BackgroundItem[] = Array.from({ length: 24 }, (_, index) => ({
      id: `item-${index}`, name: `img-${index}.png`, url: `/skin-background/assets/item-${index}.jpg`,
    }))
    const props = makeProps({
      useStore: (selector: (state: BackgroundSettings) => unknown) =>
        selector({ activeId: '', opacity: 100, chromeOpacity: 40, assetDir: '', items: manyItems }),
    })
    render(<BackgroundRow {...props} />)

    fireEvent.click(screen.getByText('选择图片并保存…'))
    fireEvent.change(fileInput(), { target: { files: [new File(['x'], 'extra.png', { type: 'image/png' })] } })

    expect(screen.getByText('保存的图片数量已达上限(24 张),请先删除一些')).toBeTruthy()
    expect(props.update).not.toHaveBeenCalled()
  })

  it('applies a saved item instantly through the Apply button', () => {
    const props = makeProps()
    render(<BackgroundRow {...props} />)

    fireEvent.click(screen.getAllByText('应用')[1]!)

    expect(props.applyItem).toHaveBeenCalledWith(ITEMS[1])
    expect(props.update).not.toHaveBeenCalled()
  })

  it('imports new files from the asset folder, skipping already-saved ones', async () => {
    const fresh: BackgroundItem = { id: 'item-3', name: '壁纸_人类之光.jpg', url: '/skin-background/assets/壁纸_人类之光.jpg' }
    const props = makeProps()
    props.scanFolder.mockResolvedValue([ITEMS[0], fresh])
    render(<BackgroundRow {...props} />)

    fireEvent.click(screen.getByText('从文件夹导入'))

    await waitFor(() => {
      expect(props.update).toHaveBeenCalledWith('items', [...ITEMS, fresh])
    })
  })

  it('hints when the asset folder holds nothing new', async () => {
    const props = makeProps()
    props.scanFolder.mockResolvedValue([...ITEMS])
    render(<BackgroundRow {...props} />)

    fireEvent.click(screen.getByText('从文件夹导入'))

    await waitFor(() => {
      expect(screen.getByText('文件夹里没有新图片')).toBeTruthy()
    })
    expect(props.update).not.toHaveBeenCalled()
  })

  it('persists the folder picked through the native dialog', async () => {
    const props = makeProps()
    props.pickFolder.mockResolvedValue('D:/ds_harness/plugins/bg')
    render(<BackgroundRow {...props} />)

    fireEvent.click(screen.getByText('选择文件夹…'))

    await waitFor(() => {
      expect(props.update).toHaveBeenCalledWith('assetDir', 'D:/ds_harness/plugins/bg')
    })
  })

  it('marks the active item and deletes items, clearing the active id when it was active', async () => {
    const props = makeProps({
      useStore: (selector: (state: BackgroundSettings) => unknown) =>
        selector({ activeId: 'item-1', opacity: 100, chromeOpacity: 40, assetDir: '', items: ITEMS }),
    })
    render(<BackgroundRow {...props} />)

    fireEvent.click(screen.getAllByText('删除')[0]!)

    await waitFor(() => {
      expect(props.update).toHaveBeenCalledWith('items', [ITEMS[1]])
    })
    await waitFor(() => {
      expect(props.update).toHaveBeenCalledWith('activeId', '')
    })
    expect(props.removeAsset).toHaveBeenCalledWith(ITEMS[0])
  })

  it('shows the slider values live while dragging', () => {
    const props = makeProps()
    render(<BackgroundRow {...props} />)
    const sliders = screen.getAllByRole('slider')

    fireEvent.change(sliders[0]!, { target: { value: '45' } })
    fireEvent.change(sliders[1]!, { target: { value: '70' } })

    expect(screen.getByText('透明度: 45%')).toBeTruthy()
    expect(screen.getByText('边栏透明度: 70%')).toBeTruthy()
  })

  it('previews the opacity live through the injected face', () => {
    const props = makeProps()
    render(<BackgroundRow {...props} />)

    fireEvent.change(screen.getAllByRole('slider')[0]!, { target: { value: '45' } })

    expect(props.previewOpacity).toHaveBeenCalledWith(45)
  })

  it('previews the sidebar transparency live and persists it debounced', async () => {
    const props = makeProps()
    render(<BackgroundRow {...props} />)
    const slider = screen.getAllByRole('slider')[1]!

    fireEvent.change(slider, { target: { value: '70' } })
    expect(props.previewChrome).toHaveBeenCalledWith(70)
    expect(props.update).not.toHaveBeenCalled()

    await waitFor(() => {
      expect(props.update).toHaveBeenCalledTimes(1)
    })
    expect(props.update).toHaveBeenCalledWith('chromeOpacity', 70)
  })

  it('debounces opacity writes so a drag burst commits one value', async () => {
    const props = makeProps()
    render(<BackgroundRow {...props} />)
    const slider = screen.getAllByRole('slider')[0]!

    fireEvent.change(slider, { target: { value: '60' } })
    fireEvent.change(slider, { target: { value: '55' } })
    expect(props.update).not.toHaveBeenCalled()

    await waitFor(() => {
      expect(props.update).toHaveBeenCalledTimes(1)
    })
    expect(props.update).toHaveBeenCalledWith('opacity', 55)
  })

  it('flushes the pending opacity write when the row unmounts', async () => {
    const props = makeProps()
    const view = render(<BackgroundRow {...props} />)

    fireEvent.change(screen.getAllByRole('slider')[0]!, { target: { value: '40' } })
    view.unmount()

    await waitFor(() => {
      expect(props.update).toHaveBeenCalledWith('opacity', 40)
    })
  })
})
