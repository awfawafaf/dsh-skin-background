/**
 * Custom-background row registered into the Appearance section item slot:
 * save/apply/delete over a persisted image library, plus the image-opacity
 * and sidebar-glass sliders. The background skin itself is selected in the
 * Skin row above; this row manages its library. Images are picked through
 * the native system file dialog (a hidden `<input type="file">`) and
 * embedded as data URIs.
 */
import { useEffect, useRef, useState, type ChangeEvent, type ReactElement } from 'react'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { BackgroundKey } from './locales.ts'
import type { createBackgroundRowStore } from './settings-store.ts'
import type { BackgroundItem, BackgroundSettings } from '../skin-settings.ts'
import { MAX_LIBRARY_ITEMS, sizeCapForFile } from './background-layer.ts'
import css from './background-row.module.css'

/** Injected business face: the settings write (t rides the standard locale seat). */
export interface BackgroundRowInjected {
  /** Write one background settings field; resolves when the write commits. */
  update: (field: keyof BackgroundSettings, value: BackgroundSettings[keyof BackgroundSettings]) => Promise<void>
  /** Upload the picked file to the host asset store; resolves with the item. */
  upload: (file: File) => Promise<BackgroundItem>
  /** Best-effort cleanup of the stored file behind a deleted item. */
  removeAsset: (item: BackgroundItem) => void
  /** Apply an item instantly, like a skin switch; the write persists it. */
  applyItem: (item: BackgroundItem) => void
  /** Paint the slider's live value immediately (real-time dimming preview). */
  previewOpacity: (value: number) => void
  /** Paint the sidebar glass transparency live. */
  previewChrome: (value: number) => void
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type BackgroundRowComponentProps =
  PropsRuntime<'settings.appearance.item'> & PropsStore<ReturnType<typeof createBackgroundRowStore>>
  & PropsLocale<'settings.skin-background'> & BackgroundRowInjected

/**
 * Slider state machine: an instant local draft that previews live, and a
 * debounced persisted write — a drag burst of raw writes would all carry
 * the same settings revision and every write after the first would be
 * refused (the host enforces expectedRevision). Flushes the pending value
 * on unmount so closing the panel mid-debounce still persists it.
 * @param committed - the committed value the draft follows when not dragging.
 * @param preview - the live preview callback.
 * @param write - the persisted write callback.
 * @returns the draft and its change handler.
 */
function useSliderWrite(
  committed: number,
  preview: (value: number) => void,
  write: (value: number) => Promise<void>,
) {
  const [draft, setDraft] = useState(committed)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pending = useRef<number | undefined>(undefined)
  const dragging = useRef(false)
  // Stable refs: the flush effect must run exactly once, on unmount — the
  // callback props change identity on every render.
  const writeRef = useRef(write)
  writeRef.current = write
  useEffect(() => {
    // The commit echo must not fight a drag in progress.
    if (!dragging.current) setDraft(committed)
  }, [committed])
  useEffect(() => () => {
    if (timer.current !== undefined) clearTimeout(timer.current)
    if (pending.current !== undefined) void writeRef.current(pending.current)
  }, [])
  const onChange = (value: number): void => {
    setDraft(value)
    dragging.current = true
    pending.current = value
    preview(value)
    if (timer.current !== undefined) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = undefined
      const resolved = pending.current
      pending.current = undefined
      dragging.current = false
      if (resolved !== undefined) void writeRef.current(resolved)
    }, 150)
  }
  return { draft, onChange }
}

/**
 * Render the background row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export function BackgroundRow({
  t, useStore, update, upload, removeAsset, applyItem, previewOpacity, previewChrome,
}: BackgroundRowComponentProps) {
  const settings = useStore(s => s)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | undefined>()
  const opacity = useSliderWrite(settings.opacity, previewOpacity, value => update('opacity', value))
  const chrome = useSliderWrite(settings.chromeOpacity, previewChrome, value => update('chromeOpacity', value))
  const active = settings.items.find(item => item.id === settings.activeId)

  const onFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    // Reset so picking the same file again still fires change.
    event.target.value = ''
    if (file === undefined) return
    if (file.size > sizeCapForFile(file)) {
      setError(t('fileTooLarge'))
      return
    }
    try {
      if (settings.items.length >= MAX_LIBRARY_ITEMS) {
        setError(t('tooManyItems'))
        return
      }
      // Upload to the host asset store; the settings document holds only
      // the served URL, so it never grows with the image payloads.
      const item = await upload(file)
      // Serialize: a burst of concurrent writes can lose later fields.
      await update('items', [...settings.items, item])
      // Apply the fresh image instantly (skin-switch style).
      applyItem(item)
    } catch {
      setError(t('uploadFailed'))
    }
  }

  const removeItem = async (item: BackgroundItem): Promise<void> => {
    await update('items', settings.items.filter(candidate => candidate.id !== item.id))
    if (settings.activeId === item.id) await update('activeId', '')
    removeAsset(item)
  }

  const itemRow = (item: BackgroundItem): ReactElement => (
    <div key={item.id} className={css.itemRow}>
      <span className={css.itemName} title={item.name}>{item.name}</span>
      <button
        type="button"
        className={settings.activeId === item.id ? `${css.fileButton} ${css.activeItem}` : css.fileButton}
        onClick={() => { applyItem(item) }}
      >
        {t('apply')}
      </button>
      <button type="button" className={css.fileButton} onClick={() => { removeItem(item) }}>
        {t('delete')}
      </button>
    </div>
  )

  return (
    <div className={css.group}>
      <div className={css.title}>{t('title')}</div>
      <div className={css.fileRow}>
        <span className={css.fileValue}>{active?.name ?? t('none')}</span>
        <button type="button" className={css.fileButton} onClick={() => { fileInputRef.current?.click() }}>
          {t('chooseAndSave')}
        </button>
      </div>
      <label className={css.field}>
        <span>{t('opacity')}: {opacity.draft}%</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={opacity.draft}
          onChange={event => { opacity.onChange(Number(event.target.value)) }}
        />
      </label>
      <label className={css.field}>
        <span>{t('chromeOpacity')}: {chrome.draft}%</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={chrome.draft}
          onChange={event => { chrome.onChange(Number(event.target.value)) }}
        />
      </label>
      {settings.items.length > 0 && (
        <div className={css.list}>
          <div className={css.listTitle}>{t('saved')}</div>
          {settings.items.map(itemRow)}
        </div>
      )}
      {error !== undefined && <div className={css.error}>{error}</div>}
      <div className={css.hint}>{t('hint')}</div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={css.hiddenFileInput}
        tabIndex={-1}
        onChange={(event) => { void onFile(event) }}
      />
    </div>
  )
}
