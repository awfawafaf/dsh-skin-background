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
  { id: 'item-1', name: 'ocean.png', dataUrl: 'data:image/png;base64,AAA=' },
  { id: 'item-2', name: 'night.png', dataUrl: 'data:image/png;base64,BBB=' },
]

function makeProps(overrides: Partial<BackgroundRowComponentProps> = {}): BackgroundRowComponentProps {
  return {
    useStore: (selector: (state: BackgroundSettings) => unknown) =>
      selector({ activeId: '', opacity: 100, chromeOpacity: 40, items: ITEMS }),
    t: (key: keyof typeof zh) => zh[key],
    update: vi.fn(),
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

  it('saves a picked file: appends the item and applies it instantly', async () => {
    const props = makeProps()
    render(<BackgroundRow {...props} />)

    fireEvent.click(screen.getByText('选择图片并保存…'))
    const file = new File(['x'], 'sea.png', { type: 'image/png' })
    fireEvent.change(fileInput(), { target: { files: [file] } })

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

    expect(screen.getByText('图片太大(静态图限 4MB,动图限 15MB),请换一张更小的')).toBeTruthy()
    expect(props.update).not.toHaveBeenCalled()
  })

  it('accepts animated GIFs up to the larger cap', async () => {
    const props = makeProps()
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

    expect(screen.getByText('图片太大(静态图限 4MB,动图限 15MB),请换一张更小的')).toBeTruthy()
    expect(props.update).not.toHaveBeenCalled()
  })

  it('applies a saved item instantly through the Apply button', () => {
    const props = makeProps()
    render(<BackgroundRow {...props} />)

    fireEvent.click(screen.getAllByText('应用')[1]!)

    expect(props.applyItem).toHaveBeenCalledWith(ITEMS[1])
    expect(props.update).not.toHaveBeenCalled()
  })

  it('marks the active item and deletes items, clearing the active id when it was active', async () => {
    const props = makeProps({
      useStore: (selector: (state: BackgroundSettings) => unknown) =>
        selector({ activeId: 'item-1', opacity: 100, chromeOpacity: 40, items: ITEMS }),
    })
    render(<BackgroundRow {...props} />)

    fireEvent.click(screen.getAllByText('删除')[0]!)

    await waitFor(() => {
      expect(props.update).toHaveBeenCalledWith('items', [ITEMS[1]])
    })
    await waitFor(() => {
      expect(props.update).toHaveBeenCalledWith('activeId', '')
    })
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
