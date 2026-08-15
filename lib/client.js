window.__ModuleLoader__.load({
	id: "dsh-skin-background",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		//#region src/client/background-layer.ts
		/** Maximum accepted still-image file size (4K wallpapers fit). */
		const MAX_IMAGE_BYTES = 12582912;
		/** Maximum accepted animated GIF size — frames make them larger than stills. */
		const MAX_GIF_BYTES = 15728640;
		/** The size cap for a picked file, by its type. */
		function sizeCapForFile(file) {
			return file.type === "image/gif" ? MAX_GIF_BYTES : MAX_IMAGE_BYTES;
		}
		/** Fallback light gradient (soft whale-blue sky) when no image is saved. */
		const LIGHT_FALLBACK_GRADIENT = "linear-gradient(180deg, #dbe6fb 0%, #f4f7ff 55%, #e9effc 100%)";
		/** Fallback dark gradient (deep atelier navy) when no image is saved. */
		const DARK_FALLBACK_GRADIENT = "linear-gradient(180deg, #0b193f 0%, #14265c 55%, #0a1636 100%)";
		/** Resolve the active saved item, if any. */
		function activeBackgroundItem(settings) {
			return settings.items.find((item) => item.id === settings.activeId);
		}
		//#endregion
		//#region \0dsh-css:src/client/background-row.module.css.mjs
		const css = ".muv0la_group{border-bottom:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:8px;padding:16px 0;display:flex}.muv0la_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}.muv0la_checkField{color:var(--dsw-alias-label-primary);cursor:pointer;align-items:center;gap:8px;font-size:13px;line-height:20px;display:flex}.muv0la_checkField input{accent-color:var(--dsw-alias-brand-primary)}.muv0la_field{color:var(--dsw-alias-label-secondary);flex-direction:column;gap:4px;font-size:13px;line-height:20px;display:flex}.muv0la_fileRow{align-items:center;gap:8px;display:flex}.muv0la_fileValue{text-overflow:ellipsis;white-space:nowrap;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);min-width:0;color:var(--dsw-alias-label-primary);border-radius:6px;flex:auto;padding:5px 8px;font-size:12px;overflow:hidden}.muv0la_fileButton{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;border-radius:8px;flex:none;padding:6px 14px;font-size:13px;line-height:20px}.muv0la_fileButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.muv0la_activeItem{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}.muv0la_list{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;flex-direction:column;gap:6px;padding:10px;display:flex}.muv0la_listTitle{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.muv0la_itemRow{align-items:center;gap:8px;display:flex}.muv0la_itemName{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-primary);flex:auto;font-size:13px;line-height:20px;overflow:hidden}.muv0la_error{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}.muv0la_field input[type=range]{width:100%;accent-color:var(--dsw-alias-brand-primary)}.muv0la_hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.muv0la_hiddenFileInput{display:none}";
		const tagId = "dsh-skin-background/background-row.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-skin-background";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var background_row_module_css_default = {
			"activeItem": "muv0la_activeItem",
			"checkField": "muv0la_checkField",
			"error": "muv0la_error",
			"field": "muv0la_field",
			"fileButton": "muv0la_fileButton",
			"fileRow": "muv0la_fileRow",
			"fileValue": "muv0la_fileValue",
			"group": "muv0la_group",
			"hiddenFileInput": "muv0la_hiddenFileInput",
			"hint": "muv0la_hint",
			"itemName": "muv0la_itemName",
			"itemRow": "muv0la_itemRow",
			"list": "muv0la_list",
			"listTitle": "muv0la_listTitle",
			"title": "muv0la_title"
		};
		//#endregion
		//#region src/client/background-row.tsx
		/**
		* Custom-background row registered into the Appearance section item slot:
		* save/apply/delete over a persisted image library, plus the image-opacity
		* and sidebar-glass sliders. The background skin itself is selected in the
		* Skin row above; this row manages its library. Images are picked through
		* the native system file dialog (a hidden `<input type="file">`) and
		* embedded as data URIs.
		*/
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
		function useSliderWrite(committed, preview, write) {
			const [draft, setDraft] = (0, react.useState)(committed);
			const timer = (0, react.useRef)(void 0);
			const pending = (0, react.useRef)(void 0);
			const dragging = (0, react.useRef)(false);
			const writeRef = (0, react.useRef)(write);
			writeRef.current = write;
			(0, react.useEffect)(() => {
				if (!dragging.current) setDraft(committed);
			}, [committed]);
			(0, react.useEffect)(() => () => {
				if (timer.current !== void 0) clearTimeout(timer.current);
				if (pending.current !== void 0) writeRef.current(pending.current);
			}, []);
			const onChange = (value) => {
				setDraft(value);
				dragging.current = true;
				pending.current = value;
				preview(value);
				if (timer.current !== void 0) clearTimeout(timer.current);
				timer.current = setTimeout(() => {
					timer.current = void 0;
					const resolved = pending.current;
					pending.current = void 0;
					dragging.current = false;
					if (resolved !== void 0) writeRef.current(resolved);
				}, 150);
			};
			return {
				draft,
				onChange
			};
		}
		/**
		* Render the background row.
		* @param props - composed slot props.
		* @returns the row element tree.
		*/
		function BackgroundRow({ t, useStore, update, upload, scanFolder, pickFolder, removeAsset, applyItem, previewOpacity, previewChrome }) {
			const settings = useStore((s) => s);
			const fileInputRef = (0, react.useRef)(null);
			const [error, setError] = (0, react.useState)();
			const opacity = useSliderWrite(settings.opacity, previewOpacity, (value) => update("opacity", value));
			const chrome = useSliderWrite(settings.chromeOpacity, previewChrome, (value) => update("chromeOpacity", value));
			const active = settings.items.find((item) => item.id === settings.activeId);
			const onPickFolder = async () => {
				try {
					const path = await pickFolder();
					if (path !== null && path.trim() !== "") await update("assetDir", path);
				} catch {
					setError(t("pickFailed"));
				}
			};
			const onFile = async (event) => {
				const file = event.target.files?.[0];
				event.target.value = "";
				if (file === void 0) return;
				if (file.size > sizeCapForFile(file)) {
					setError(t("fileTooLarge"));
					return;
				}
				try {
					if (settings.items.length >= 24) {
						setError(t("tooManyItems"));
						return;
					}
					const item = await upload(file);
					await update("items", [...settings.items, item]);
					applyItem(item);
				} catch {
					setError(t("uploadFailed"));
				}
			};
			const removeItem = async (item) => {
				await update("items", settings.items.filter((candidate) => candidate.id !== item.id));
				if (settings.activeId === item.id) await update("activeId", "");
				removeAsset(item);
			};
			const onImportFolder = async () => {
				try {
					const listed = await scanFolder();
					const known = new Set(settings.items.map((item) => item.id));
					const fresh = listed.filter((item) => !known.has(item.id));
					if (fresh.length === 0) {
						setError(t("noNewImages"));
						return;
					}
					await update("items", [...settings.items, ...fresh]);
					setError(void 0);
				} catch {
					setError(t("importFailed"));
				}
			};
			const itemRow = (item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: background_row_module_css_default.itemRow,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: background_row_module_css_default.itemName,
						title: item.name,
						children: item.name
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: settings.activeId === item.id ? `${background_row_module_css_default.fileButton} ${background_row_module_css_default.activeItem}` : background_row_module_css_default.fileButton,
						onClick: () => {
							applyItem(item);
						},
						children: t("apply")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: background_row_module_css_default.fileButton,
						onClick: () => {
							removeItem(item);
						},
						children: t("delete")
					})
				]
			}, item.id);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: background_row_module_css_default.group,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: background_row_module_css_default.title,
						children: t("title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: background_row_module_css_default.fileRow,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: background_row_module_css_default.fileValue,
								children: active?.name ?? t("none")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: background_row_module_css_default.fileButton,
								onClick: () => {
									fileInputRef.current?.click();
								},
								children: t("chooseAndSave")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: background_row_module_css_default.fileButton,
								onClick: () => {
									onImportFolder();
								},
								children: t("importFromFolder")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: background_row_module_css_default.fileRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: background_row_module_css_default.fileValue,
							children: settings.assetDir !== "" ? settings.assetDir : t("defaultFolder")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: background_row_module_css_default.fileButton,
							onClick: () => {
								onPickFolder();
							},
							children: t("pickFolder")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: background_row_module_css_default.field,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
							t("opacity"),
							": ",
							opacity.draft,
							"%"
						] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "range",
							min: 0,
							max: 100,
							step: 5,
							value: opacity.draft,
							onChange: (event) => {
								opacity.onChange(Number(event.target.value));
							}
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: background_row_module_css_default.field,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
							t("chromeOpacity"),
							": ",
							chrome.draft,
							"%"
						] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "range",
							min: 0,
							max: 100,
							step: 5,
							value: chrome.draft,
							onChange: (event) => {
								chrome.onChange(Number(event.target.value));
							}
						})]
					}),
					settings.items.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: background_row_module_css_default.list,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: background_row_module_css_default.listTitle,
							children: t("saved")
						}), settings.items.map(itemRow)]
					}),
					error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: background_row_module_css_default.error,
						children: error
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: background_row_module_css_default.hint,
						children: t("hint")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						ref: fileInputRef,
						type: "file",
						accept: "image/*",
						className: background_row_module_css_default.hiddenFileInput,
						tabIndex: -1,
						onChange: (event) => {
							onFile(event);
						}
					})
				]
			});
		}
		//#endregion
		//#region src/client/settings-store.ts
		/**
		* Background row slot store: a mirror of the bound settings section. The
		* plugin's apply-world settings listener is the only writer; the row
		* component reads via props.useStore.
		*/
		/**
		* Declares the background row state and write surface.
		* @returns the store handle.
		*/
		function createBackgroundRowStore() {
			return (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					activeId: "",
					opacity: 100,
					chromeOpacity: 40,
					assetDir: "",
					items: []
				}),
				actions: { sync: (d, settings) => {
					d.activeId = settings.activeId;
					d.opacity = settings.opacity;
					d.chromeOpacity = settings.chromeOpacity;
					d.assetDir = settings.assetDir;
					d.items = settings.items;
				} }
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** Custom-background row dictionaries. */
		const zh = {
			title: "背景",
			none: "未设置",
			chooseAndSave: "选择图片并保存…",
			importFromFolder: "从文件夹导入",
			pickFolder: "选择文件夹…",
			defaultFolder: "默认位置",
			noNewImages: "文件夹里没有新图片",
			importFailed: "导入失败，请检查图片文件夹",
			pickFailed: "选择文件夹失败，请重试",
			opacity: "透明度",
			chromeOpacity: "边栏透明度",
			saved: "已保存",
			apply: "应用",
			delete: "删除",
			fileTooLarge: "图片太大(静态图限 12MB,动图限 15MB),请换一张更小的",
			tooManyItems: "保存的图片数量已达上限(24 张),请先删除一些",
			uploadFailed: "图片上传失败，请重试",
			hint: "在「皮肤」中选择「自定义背景」即可生效；支持 GIF 动图；图片保存在本地，离线可用。"
		};
		const en = {
			title: "Background",
			none: "Not set",
			chooseAndSave: "Choose and save image…",
			importFromFolder: "Import from folder",
			pickFolder: "Choose folder…",
			defaultFolder: "Default location",
			noNewImages: "No new images in the folder",
			importFailed: "Import failed; check the image folder",
			pickFailed: "Could not pick the folder; try again",
			opacity: "Opacity",
			chromeOpacity: "Sidebar transparency",
			saved: "Saved",
			apply: "Apply",
			delete: "Delete",
			fileTooLarge: "Image too large (12MB for stills, 15MB for GIFs); pick a smaller one",
			tooManyItems: "The library is full (24 images); delete some first",
			uploadFailed: "Could not upload the image; try again",
			hint: "Pick “Custom Background” in the Skin row to apply; animated GIFs work; images are stored locally and work offline."
		};
		//#endregion
		//#region node_modules/.pnpm/@deepseek-ai+cosmokit@1.8.2/node_modules/@deepseek-ai/cosmokit/lib/index.js
		/** Return true when a value is `null` or `undefined`. */
		function isNullable(value) {
			return value === null || value === void 0;
		}
		/** Return true for non-array object values. */
		function isPlainObject(data) {
			return data && typeof data === "object" && !Array.isArray(data);
		}
		/** Filter object entries and return a new object. */
		function filterKeys(object, filter) {
			return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
		}
		/** Map object values while preserving the original key set. */
		function mapValues(object, transform) {
			return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
		}
		/** Pick selected keys from an object, optionally including `undefined` values. */
		function pick(source, keys, forced) {
			if (!keys) return { ...source };
			const result = {};
			for (const key of keys) if (forced || source[key] !== void 0) result[key] = source[key];
			return result;
		}
		/** Test values using `instanceof` with a `toStringTag` fallback. */
		function is(type, value) {
			if (arguments.length === 1) return (value) => is(type, value);
			return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
		}
		function isArrayBufferLike(value) {
			return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
		}
		function isArrayBufferSource(value) {
			return isArrayBufferLike(value) || ArrayBuffer.isView(value);
		}
		/** Binary source detection and base64/hex conversion helpers. */
		var Binary;
		(function(Binary) {
			Binary.is = isArrayBufferLike;
			Binary.isSource = isArrayBufferSource;
			function fromSource(source) {
				if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
				else return source;
			}
			Binary.fromSource = fromSource;
			function toBase64(source) {
				source = fromSource(source);
				if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
				let binary = "";
				const bytes = new Uint8Array(source);
				for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
				return btoa(binary);
			}
			Binary.toBase64 = toBase64;
			function fromBase64(source) {
				if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
				return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
			}
			Binary.fromBase64 = fromBase64;
			function toHex(source) {
				source = fromSource(source);
				if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
				return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
			}
			Binary.toHex = toHex;
			function fromHex(source) {
				if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
				const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
				const buffer = [];
				for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
				return Uint8Array.from(buffer).buffer;
			}
			Binary.fromHex = fromHex;
		})(Binary || (Binary = {}));
		Binary.fromBase64;
		Binary.toBase64;
		Binary.fromHex;
		Binary.toHex;
		/** Deep-clone common JavaScript values while preserving prototypes and cycles. */
		function clone(source, refs = /* @__PURE__ */ new Map()) {
			if (!source || typeof source !== "object") return source;
			if (is("Date", source)) return new Date(source.valueOf());
			if (is("RegExp", source)) return new RegExp(source.source, source.flags);
			if (isArrayBufferLike(source)) return source.slice(0);
			if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
			const cached = refs.get(source);
			if (cached) return cached;
			if (Array.isArray(source)) {
				const result = [];
				refs.set(source, result);
				source.forEach((value, index) => {
					result[index] = Reflect.apply(clone, null, [value, refs]);
				});
				return result;
			}
			const result = Object.create(Object.getPrototypeOf(source));
			refs.set(source, result);
			for (const key of Reflect.ownKeys(source)) {
				const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
				if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
				Reflect.defineProperty(result, key, descriptor);
			}
			return result;
		}
		/** Deeply compare arrays, dates, regexps, buffers, and plain object fields. */
		function deepEqual(a, b, strict) {
			if (a === b) return true;
			if (!strict && isNullable(a) && isNullable(b)) return true;
			if (typeof a !== typeof b) return false;
			if (typeof a !== "object") return false;
			if (!a || !b) return false;
			function check(test, then) {
				return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : void 0;
			}
			return check(Array.isArray, (a, b) => a.length === b.length && a.every((item, index) => deepEqual(item, b[index]))) ?? check(is("Date"), (a, b) => a.valueOf() === b.valueOf()) ?? check(is("RegExp"), (a, b) => a.source === b.source && a.flags === b.flags) ?? check(isArrayBufferLike, (a, b) => {
				if (a.byteLength !== b.byteLength) return false;
				const viewA = new Uint8Array(a);
				const viewB = new Uint8Array(b);
				for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
				return true;
			}) ?? Object.keys({
				...a,
				...b
			}).every((key) => deepEqual(a[key], b[key], strict));
		}
		/** Time constants plus parsing and formatting helpers. */
		var Time;
		(function(Time) {
			Time.millisecond = 1;
			Time.second = 1e3;
			Time.minute = Time.second * 60;
			Time.hour = Time.minute * 60;
			Time.day = Time.hour * 24;
			Time.week = Time.day * 7;
			let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
			function setTimezoneOffset(offset) {
				timezoneOffset = offset;
			}
			Time.setTimezoneOffset = setTimezoneOffset;
			function getTimezoneOffset() {
				return timezoneOffset;
			}
			Time.getTimezoneOffset = getTimezoneOffset;
			function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
				if (typeof date === "number") date = new Date(date);
				if (offset === void 0) offset = timezoneOffset;
				return Math.floor((date.valueOf() / Time.minute - offset) / 1440);
			}
			Time.getDateNumber = getDateNumber;
			function fromDateNumber(value, offset) {
				const date = new Date(value * Time.day);
				if (offset === void 0) offset = timezoneOffset;
				return new Date(+date + offset * Time.minute);
			}
			Time.fromDateNumber = fromDateNumber;
			const numeric = /\d+(?:\.\d+)?/.source;
			const timeRegExp = new RegExp(`^${[
				"w(?:eek(?:s)?)?",
				"d(?:ay(?:s)?)?",
				"h(?:our(?:s)?)?",
				"m(?:in(?:ute)?(?:s)?)?",
				"s(?:ec(?:ond)?(?:s)?)?"
			].map((unit) => `(${numeric}${unit})?`).join("")}$`);
			function parseTime(source) {
				const capture = timeRegExp.exec(source);
				if (!capture) return 0;
				return (parseFloat(capture[1]) * Time.week || 0) + (parseFloat(capture[2]) * Time.day || 0) + (parseFloat(capture[3]) * Time.hour || 0) + (parseFloat(capture[4]) * Time.minute || 0) + (parseFloat(capture[5]) * Time.second || 0);
			}
			Time.parseTime = parseTime;
			function parseDate(date) {
				const parsed = parseTime(date);
				if (parsed) date = Date.now() + parsed;
				else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
				else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
				return date ? new Date(date) : /* @__PURE__ */ new Date();
			}
			Time.parseDate = parseDate;
			function format(ms) {
				const abs = Math.abs(ms);
				if (abs >= Time.day - Time.hour / 2) return Math.round(ms / Time.day) + "d";
				else if (abs >= Time.hour - Time.minute / 2) return Math.round(ms / Time.hour) + "h";
				else if (abs >= Time.minute - Time.second / 2) return Math.round(ms / Time.minute) + "m";
				else if (abs >= Time.second) return Math.round(ms / Time.second) + "s";
				return ms + "ms";
			}
			Time.format = format;
			function toDigits(source, length = 2) {
				return source.toString().padStart(length, "0");
			}
			Time.toDigits = toDigits;
			function template(template, time = /* @__PURE__ */ new Date()) {
				return template.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
			}
			Time.template = template;
		})(Time || (Time = {}));
		//#endregion
		//#region node_modules/.pnpm/@deepseek-ai+schemastery@3.18.1/node_modules/@deepseek-ai/schemastery/lib/index.mjs
		const kSchema = Symbol.for("schemastery");
		const kValidationError = Symbol.for("ValidationError");
		globalThis.__schemastery_index__ ??= 0;
		globalThis.__schemastery_refs__ = void 0;
		var ValidationError = class extends TypeError {
			options;
			name = "ValidationError";
			constructor(message, options) {
				let prefix = "$";
				for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
				else if (typeof segment === "number") prefix += "[" + segment + "]";
				else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
				if (prefix.startsWith(".")) prefix = prefix.slice(1);
				super((prefix === "$" ? "" : `${prefix} `) + message);
				this.options = options;
			}
			static is(error) {
				return !!error?.[kValidationError];
			}
		};
		Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
		const Schema = function(options) {
			const schema = function(data, options = {}) {
				return Schema.resolve(data, schema, options)[0];
			};
			if (options.refs) {
				const refs = mapValues(options.refs, (options) => new Schema(options));
				const getRef = (uid) => refs[uid];
				for (const key in refs) {
					const options = refs[key];
					options.sKey = getRef(options.sKey);
					options.inner = getRef(options.inner);
					options.list = options.list && options.list.map(getRef);
					options.dict = options.dict && mapValues(options.dict, getRef);
				}
				return refs[options.uid];
			}
			Object.assign(schema, options);
			if (typeof schema.callback === "string") try {
				schema.callback = new Function("return " + schema.callback)();
			} catch {}
			Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
			Object.setPrototypeOf(schema, Schema.prototype);
			schema.meta ||= {};
			schema.toString = schema.toString.bind(schema);
			return schema;
		};
		Schema.prototype = Object.create(Function.prototype);
		Schema.prototype[kSchema] = true;
		Object.defineProperty(Schema.prototype, "~standard", { get() {
			return {
				version: 1,
				vendor: "schemastery",
				validate: (value) => {
					try {
						return { value: Schema.resolve(value, this, {})[0] };
					} catch (error) {
						if (ValidationError.is(error)) return { issues: [{
							message: error.message,
							path: error.options.path
						}] };
						throw error;
					}
				}
			};
		} });
		Schema.ValidationError = ValidationError;
		Schema.prototype.toJSON = function toJSON() {
			if (globalThis.__schemastery_refs__) {
				globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
				return this.uid;
			}
			globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
			globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
			const result = {
				uid: this.uid,
				refs: globalThis.__schemastery_refs__
			};
			globalThis.__schemastery_refs__ = void 0;
			return result;
		};
		Schema.prototype.set = function set(key, value) {
			this.dict[key] = value;
			return this;
		};
		Schema.prototype.push = function push(value) {
			this.list.push(value);
			return this;
		};
		function mergeDesc(original, messages) {
			const result = typeof original === "string" ? { "": original } : { ...original };
			for (const locale in messages) {
				const value = messages[locale];
				if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
				else if (typeof value === "string") result[locale] = value;
			}
			return result;
		}
		function getInner(value) {
			return value?.$value ?? value?.$inner;
		}
		function extractKeys(data) {
			return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
		}
		Schema.prototype.i18n = function i18n(messages) {
			const schema = Schema(this);
			const desc = mergeDesc(schema.meta.description, messages);
			if (Object.keys(desc).length) schema.meta.description = desc;
			if (schema.dict) schema.dict = mapValues(schema.dict, (inner, key) => {
				return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
			});
			if (schema.list) schema.list = schema.list.map((inner, index) => {
				return inner.i18n(mapValues(messages, (data = {}) => {
					if (Array.isArray(getInner(data))) return getInner(data)[index];
					if (Array.isArray(data)) return data[index];
					return extractKeys(data);
				}));
			});
			if (schema.inner) schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
				if (getInner(data)) return getInner(data);
				return extractKeys(data);
			}));
			if (schema.sKey) schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
			return schema;
		};
		Schema.prototype.extra = function extra(key, value) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		};
		for (const key of [
			"required",
			"disabled",
			"collapse",
			"hidden",
			"loose"
		]) Object.assign(Schema.prototype, { [key](value = true) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		} });
		Schema.prototype.deprecated = function deprecated() {
			const schema = Schema(this);
			schema.meta.badges ||= [];
			schema.meta.badges.push({
				text: "deprecated",
				type: "danger"
			});
			return schema;
		};
		Schema.prototype.experimental = function experimental() {
			const schema = Schema(this);
			schema.meta.badges ||= [];
			schema.meta.badges.push({
				text: "experimental",
				type: "warning"
			});
			return schema;
		};
		Schema.prototype.pattern = function pattern(regexp) {
			const schema = Schema(this);
			const pattern = pick(regexp, ["source", "flags"]);
			schema.meta = {
				...schema.meta,
				pattern
			};
			return schema;
		};
		Schema.prototype.simplify = function simplify(value) {
			if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
			if (isNullable(value)) return value;
			if (this.type === "object" || this.type === "dict") {
				const result = {};
				for (const key in value) {
					const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
					if (this.type === "dict" || !isNullable(item)) result[key] = item;
				}
				if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
				return result;
			} else if (this.type === "array" || this.type === "tuple") {
				const result = [];
				value.forEach((value, index) => {
					const schema = this.type === "array" ? this.inner : this.list[index];
					const item = schema ? schema.simplify(value) : value;
					result.push(item);
				});
				return result;
			} else if (this.type === "intersect") {
				const result = {};
				for (const item of this.list) Object.assign(result, item.simplify(value));
				return result;
			} else if (this.type === "union") for (const schema of this.list) try {
				Schema.resolve(value, schema, {});
				return schema.simplify(value);
			} catch {}
			return value;
		};
		Schema.prototype.toString = function toString(inline) {
			return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
		};
		Schema.prototype.role = function role(role, extra) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				role,
				extra
			};
			return schema;
		};
		for (const key of [
			"default",
			"link",
			"comment",
			"description",
			"max",
			"min",
			"step"
		]) Object.assign(Schema.prototype, { [key](value) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		} });
		const resolvers = {};
		Schema.extend = function extend(type, resolve) {
			resolvers[type] = resolve;
		};
		Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
			if (!schema) return [data];
			if (options.ignore?.(data, schema)) return [data];
			if (isNullable(data) && schema.type !== "lazy") {
				if (schema.meta.required) throw new ValidationError(`missing required value`, options);
				let current = schema;
				let fallback = schema.meta.default;
				while (current?.type === "intersect" && isNullable(fallback)) {
					current = current.list[0];
					fallback = current?.meta.default;
				}
				if (isNullable(fallback)) return [data];
				data = clone(fallback);
			}
			const callback = resolvers[schema.type];
			if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
			try {
				return callback(data, schema, options, strict);
			} catch (error) {
				if (!schema.meta.loose) throw error;
				return [schema.meta.default];
			}
		};
		Schema.from = function from(source) {
			if (isNullable(source)) return Schema.any();
			else if ([
				"string",
				"number",
				"boolean"
			].includes(typeof source)) return Schema.const(source).required();
			else if (source[kSchema]) return source;
			else if (typeof source === "function") switch (source) {
				case String: return Schema.string().required();
				case Number: return Schema.number().required();
				case Boolean: return Schema.boolean().required();
				case Function: return Schema.function().required();
				default: return Schema.is(source).required();
			}
			else throw new TypeError(`cannot infer schema from ${source}`);
		};
		Schema.lazy = function lazy(builder) {
			const toJSON = () => {
				if (!schema.inner[kSchema]) {
					schema.inner = schema.builder();
					schema.inner.meta = {
						...schema.meta,
						...schema.inner.meta
					};
				}
				return schema.inner.toJSON();
			};
			const schema = new Schema({
				type: "lazy",
				builder,
				inner: { toJSON }
			});
			return schema;
		};
		Schema.natural = function natural() {
			return Schema.number().step(1).min(0);
		};
		Schema.percent = function percent() {
			return Schema.number().step(.01).min(0).max(1).role("slider");
		};
		Schema.date = function date() {
			return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
				const date = new Date(value);
				if (isNaN(+date)) throw new ValidationError(`invalid date "${value}"`, options);
				return date;
			}, true)]);
		};
		Schema.regExp = function regExp(flag = "") {
			return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
				try {
					return new RegExp(value, flag);
				} catch (e) {
					throw new ValidationError(e.message, options);
				}
			}, true)]);
		};
		Schema.arrayBuffer = function arrayBuffer(encoding) {
			return Schema.union([
				Schema.is(ArrayBuffer),
				Schema.is(SharedArrayBuffer),
				Schema.transform(Schema.any(), (value, options) => {
					if (Binary.isSource(value)) return Binary.fromSource(value);
					throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
				}, true),
				...encoding ? [Schema.transform(Schema.string(), (value, options) => {
					try {
						return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
					} catch (e) {
						throw new ValidationError(e.message, options);
					}
				}, true)] : []
			]);
		};
		Schema.extend("lazy", (data, schema, options, strict) => {
			if (!schema.inner[kSchema]) {
				schema.inner = schema.builder();
				schema.inner.meta = {
					...schema.meta,
					...schema.inner.meta
				};
			}
			return Schema.resolve(data, schema.inner, options, strict);
		});
		Schema.extend("any", (data) => {
			return [data];
		});
		Schema.extend("never", (data, _, options) => {
			throw new ValidationError(`expected nullable but got ${data}`, options);
		});
		Schema.extend("const", (data, { value }, options) => {
			if (deepEqual(data, value)) return [value];
			throw new ValidationError(`expected ${value} but got ${data}`, options);
		});
		function checkWithinRange(data, meta, description, options, skipMin = false) {
			const { max = Infinity, min = -Infinity } = meta;
			if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
			if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
		}
		Schema.extend("string", (data, { meta }, options) => {
			if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
			if (meta.pattern) {
				const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
				if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
			}
			checkWithinRange(data.length, meta, "string length", options);
			return [data];
		});
		function decimalShift(data, digits) {
			const str = data.toString();
			if (str.includes("e")) return data * Math.pow(10, digits);
			const index = str.indexOf(".");
			if (index === -1) return data * Math.pow(10, digits);
			const frac = str.slice(index + 1);
			const integer = str.slice(0, index);
			if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
			return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
		}
		function isMultipleOf(data, min, step) {
			step = Math.abs(step);
			if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
			const index = step.toString().indexOf(".");
			const digits = step.toString().slice(index + 1).length;
			return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
		}
		Schema.extend("number", (data, { meta }, options) => {
			if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
			checkWithinRange(data, meta, "number", options);
			const { step } = meta;
			if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
			return [data];
		});
		Schema.extend("boolean", (data, _, options) => {
			if (typeof data === "boolean") return [data];
			throw new ValidationError(`expected boolean but got ${data}`, options);
		});
		Schema.extend("bitset", (data, { bits, meta }, options) => {
			let value = 0, keys = [];
			if (typeof data === "number") {
				value = data;
				for (const key in bits) if (data & bits[key]) keys.push(key);
			} else if (Array.isArray(data)) {
				keys = data;
				for (const key of keys) {
					if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
					if (key in bits) value |= bits[key];
				}
			} else throw new ValidationError(`expected number or array but got ${data}`, options);
			if (value === meta.default) return [value];
			return [value, keys];
		});
		Schema.extend("function", (data, _, options) => {
			if (typeof data === "function") return [data];
			throw new ValidationError(`expected function but got ${data}`, options);
		});
		Schema.extend("is", (data, { constructor }, options) => {
			if (typeof constructor === "function") {
				if (data instanceof constructor) return [data];
				throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
			} else {
				if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
				let prototype = Object.getPrototypeOf(data);
				while (prototype) {
					if (prototype.constructor?.name === constructor) return [data];
					prototype = Object.getPrototypeOf(prototype);
				}
				throw new ValidationError(`expected ${constructor} but got ${data}`, options);
			}
		});
		function property(data, key, schema, options) {
			try {
				const [value, adapted] = Schema.resolve(data[key], schema, {
					...options,
					path: [...options.path || [], key]
				});
				if (adapted !== void 0) data[key] = adapted;
				return value;
			} catch (e) {
				if (!options?.autofix) throw e;
				delete data[key];
				return schema.meta.default;
			}
		}
		Schema.extend("array", (data, { inner, meta }, options) => {
			if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
			checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
			return [data.map((_, index) => property(data, index, inner, options))];
		});
		Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
			if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
			const result = {};
			for (const key in data) {
				let rKey;
				try {
					rKey = Schema.resolve(key, sKey, options)[0];
				} catch (error) {
					if (strict) continue;
					throw error;
				}
				result[rKey] = property(data, key, inner, options);
				data[rKey] = data[key];
				if (key !== rKey) delete data[key];
			}
			return [result];
		});
		Schema.extend("tuple", (data, { list }, options, strict) => {
			if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
			const result = list.map((inner, index) => property(data, index, inner, options));
			if (strict) return [result];
			result.push(...data.slice(list.length));
			return [result];
		});
		function merge(result, data) {
			for (const key in data) {
				if (key in result) continue;
				result[key] = data[key];
			}
		}
		Schema.extend("object", (data, { dict }, options, strict) => {
			if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
			const result = {};
			for (const key in dict) {
				const value = property(data, key, dict[key], options);
				if (!isNullable(value) || key in data) result[key] = value;
			}
			if (!strict) merge(result, data);
			return [result];
		});
		Schema.extend("union", (data, { list, toString }, options, strict) => {
			const messages = [];
			for (const inner of list) try {
				return Schema.resolve(data, inner, options, strict);
			} catch (error) {
				messages.push(error);
			}
			throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
		});
		Schema.extend("intersect", (data, { list, toString }, options, strict) => {
			if (!list.length) return [data];
			let result;
			for (const inner of list) {
				const value = Schema.resolve(data, inner, options, true)[0];
				if (isNullable(value)) continue;
				if (isNullable(result)) result = value;
				else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
				else if (typeof value === "object") merge(result ??= {}, value);
				else if (result !== value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
			}
			if (!strict && isPlainObject(data)) merge(result, data);
			return [result];
		});
		Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
			const [result, adapted = data] = Schema.resolve(data, inner, options, true);
			if (preserve) return [callback(result)];
			else return [callback(result), callback(adapted)];
		});
		const formatters = {};
		function defineMethod(name, keys, format) {
			formatters[name] = format;
			Object.assign(Schema, { [name](...args) {
				const schema = new Schema({ type: name });
				keys.forEach((key, index) => {
					switch (key) {
						case "sKey":
							schema.sKey = args[index] ?? Schema.string();
							break;
						case "inner":
							schema.inner = Schema.from(args[index]);
							break;
						case "list":
							schema.list = args[index].map(Schema.from);
							break;
						case "dict":
							schema.dict = mapValues(args[index], Schema.from);
							break;
						case "bits":
							schema.bits = {};
							for (const key in args[index]) {
								if (typeof args[index][key] !== "number") continue;
								schema.bits[key] = args[index][key];
							}
							break;
						case "callback": {
							const callback = schema.callback = args[index];
							callback["toJSON"] ||= () => callback.toString();
							break;
						}
						case "constructor": {
							const constructor = schema.constructor = args[index];
							if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
							break;
						}
						default: schema[key] = args[index];
					}
				});
				if (name === "object" || name === "dict") schema.meta.default = {};
				else if (name === "array" || name === "tuple") schema.meta.default = [];
				else if (name === "bitset") schema.meta.default = 0;
				return schema;
			} });
		}
		defineMethod("is", ["constructor"], ({ constructor }) => {
			if (typeof constructor === "function") return constructor.name;
			else return constructor;
		});
		defineMethod("any", [], () => "any");
		defineMethod("never", [], () => "never");
		defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
		defineMethod("string", [], () => "string");
		defineMethod("number", [], () => "number");
		defineMethod("boolean", [], () => "boolean");
		defineMethod("bitset", ["bits"], () => "bitset");
		defineMethod("function", [], () => "function");
		defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
		defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
		defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
		defineMethod("object", ["dict"], ({ dict }) => {
			if (Object.keys(dict).length === 0) return "{}";
			return `{ ${Object.entries(dict).map(([key, inner]) => {
				return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
			}).join(", ")} }`;
		});
		defineMethod("union", ["list"], ({ list }, inline) => {
			const result = list.map(({ toString: format }) => format()).join(" | ");
			return inline ? `(${result})` : result;
		});
		defineMethod("intersect", ["list"], ({ list }) => {
			return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
		});
		defineMethod("transform", [
			"inner",
			"callback",
			"preserve"
		], ({ inner }, isInner) => inner.toString(isInner));
		//#endregion
		//#region src/skin-settings.ts
		/** Custom-background skin settings stored in the Host user-settings document. */
		/** Settings namespace owned by the custom-background skin. */
		const BACKGROUND_SETTINGS_NAMESPACE = "skin-background";
		/** Fallback values when the settings document has no override. */
		const DEFAULT_BACKGROUND_SETTINGS = {
			activeId: "",
			opacity: 100,
			chromeOpacity: 40,
			assetDir: "",
			items: []
		};
		Schema.object({
			activeId: Schema.string().default(""),
			opacity: Schema.number().min(0).max(100).step(5).default(100),
			chromeOpacity: Schema.number().min(0).max(100).step(5).default(40),
			assetDir: Schema.string().default(""),
			items: Schema.array(Schema.object({
				id: Schema.string(),
				name: Schema.string(),
				url: Schema.string()
			})).default([])
		});
		//#endregion
		//#region src/client/index.ts
		/** Namespace owning this feature's settings-row copy. */
		const SETTINGS_NS = "settings.skin-background";
		/** The CSS variable every painted surface reads its wallpaper from. */
		const ART_VARIABLE = "--dsh-bg-art";
		/** The CSS variable holding the dimming veil strength (a percentage). */
		const VEIL_STRENGTH_VARIABLE = "--dsh-bg-veil-strength";
		/** The CSS variable holding the sidebar glass transparency (a percentage). */
		const CHROME_TRANSPARENCY_VARIABLE = "--dsh-chrome-transparency";
		/**
		* Wallpaper painting declarations: the veil layer (a theme-base gradient at
		* `--dsh-bg-veil-strength`) dims bright images on top of the art, and the
		* fixed/cover block anchors the whole stack to the viewport.
		*/
		const WALLPAPER_BLOCK = [
			"background-image: linear-gradient(color-mix(in srgb, var(--dsw-alias-bg-base) var(--dsh-bg-veil-strength, 0%), transparent), color-mix(in srgb, var(--dsw-alias-bg-base) var(--dsh-bg-veil-strength, 0%), transparent)), var(--dsh-bg-art) !important",
			"background-position: center center !important",
			"background-size: cover !important",
			"background-attachment: fixed !important",
			"background-repeat: no-repeat !important"
		].join("; ");
		/** The base surfaces that carry the wallpaper (stable selectors only). */
		const WALLPAPER_RULES = [
			`body { ${WALLPAPER_BLOCK} }`,
			`[data-phase='hero'], [data-phase='active'] { ${WALLPAPER_BLOCK} }`,
			`[class*='frame'] { ${WALLPAPER_BLOCK} }`,
			`body[data-ds-dark-theme] { --dsw-specific-sidebar-fill: color-mix(in srgb, var(--dsw-static-neutral-bluish-900) calc(100% - var(--dsh-chrome-transparency, 40%)), transparent) !important; }`,
			`body:not([data-ds-dark-theme]) { --dsw-specific-sidebar-fill: color-mix(in srgb, var(--dsw-static-neutral-bluish-50) calc(100% - var(--dsh-chrome-transparency, 40%)), transparent) !important; }`,
			`[class*='detailsCol'] [data-slot='details'], [class*='detailsCol'] [data-slot='details'] > * { background-color: color-mix(in srgb, var(--dsw-alias-bg-base) calc(100% - var(--dsh-chrome-transparency, 40%)), transparent) !important; }`,
			`[class*='composerSeat'] { background-image: linear-gradient(180deg, transparent 0px, color-mix(in srgb, var(--dsw-alias-bg-base) calc(100% - var(--dsh-chrome-transparency, 40%)), transparent) 36px) !important; }`
		];
		/** Required services: skin manager, settings transport, slots/locale, and
		* the workspace service (the native folder picker). */
		const inject = [
			"skinManager",
			"slots",
			"locale",
			"connection",
			"remote",
			"settingsScope",
			"workspaces"
		];
		/**
		* Client plugin body: register the background skin and its settings row.
		* @param ctx - client cordis context.
		*/
		function apply(ctx) {
			const host = ctx.settingsScope.bind({ namespace: BACKGROUND_SETTINGS_NAMESPACE });
			let bound;
			let active = false;
			let armed = false;
			let sheet;
			const current = () => host.getSnapshot().value ?? DEFAULT_BACKGROUND_SETTINGS;
			/** The image value (served asset URL or theme-matched gradient). */
			const imageValue = (item) => item !== void 0 ? `url("${item.url}")` : document.body.hasAttribute("data-ds-dark-theme") ? DARK_FALLBACK_GRADIENT : LIGHT_FALLBACK_GRADIENT;
			/** The item the user most recently applied; its optimistic paint outlives
			* the persist round-trip so a failed/conflicting write cannot revert the
			* wallpaper (the adoption re-sync always prefers this id). */
			let pendingItemId;
			/** The item whose wallpaper is currently painted. */
			const paintedItem = () => {
				const settings = current();
				return activeBackgroundItem(settings) ?? (pendingItemId !== void 0 ? settings.items.find((item) => item.id === pendingItemId) : void 0);
			};
			/** The veil strength percentage (100 = fully dimmed toward the base). */
			const veilStrength = (opacity) => `${100 - Math.min(100, Math.max(0, opacity))}%`;
			/** The chrome transparency percentage (100 = fully clear glass). */
			const chromeTransparency = (value) => `${Math.min(100, Math.max(0, value))}%`;
			/** Write the current wallpaper, veil, and glass into the CSS variables. */
			const syncArt = () => {
				if (!armed) return;
				document.body.style.setProperty(ART_VARIABLE, imageValue(paintedItem()));
				document.body.style.setProperty(VEIL_STRENGTH_VARIABLE, veilStrength(current().opacity));
				document.body.style.setProperty(CHROME_TRANSPARENCY_VARIABLE, chromeTransparency(current().chromeOpacity));
			};
			/**
			* Install the wallpaper stylesheet and first art value. Deferred until the
			* settings document has loaded so boot never flashes the fallback gradient
			* over the chosen image (the maid paints instantly only because its art is
			* compiled in, not settings-driven); once installed, CSS applies the
			* wallpaper to every surface continuously — no per-surface repainting.
			*/
			const setup = () => {
				if (!active || armed) return;
				armed = true;
				sheet = document.createElement("style");
				sheet.dataset.skinChrome = "background-style";
				document.head.append(sheet);
				for (const rule of WALLPAPER_RULES) sheet.sheet.insertRule(rule);
				syncArt();
			};
			const teardownSkin = () => {
				active = false;
				armed = false;
				sheet?.remove();
				sheet = void 0;
				document.body.style.removeProperty(ART_VARIABLE);
				document.body.style.removeProperty(VEIL_STRENGTH_VARIABLE);
				document.body.style.removeProperty(CHROME_TRANSPARENCY_VARIABLE);
			};
			const skin = {
				id: "background",
				label: "自定义背景",
				labelEn: "Custom Background",
				accent: "#4a7bd4",
				order: 6,
				apply: () => {
					active = true;
					if (host.getSnapshot().value !== void 0) setup();
					return teardownSkin;
				}
			};
			ctx.effect(() => ctx.skinManager.register(skin), "dsh-skin-background: register skin");
			ctx.effect(() => host.subscribe(() => {
				bound?.sync(current());
				if (active && !armed) setup();
				else syncArt();
			}), "dsh-skin-background: settings adoption");
			ctx.effect(() => {
				const observer = new MutationObserver(() => {
					syncArt();
				});
				observer.observe(document.body, {
					attributes: true,
					attributeFilter: ["data-ds-dark-theme"]
				});
				return () => {
					observer.disconnect();
				};
			}, "dsh-skin-background: theme observer");
			ctx.effect(() => () => {
				teardownSkin();
			}, "dsh-skin-background: background teardown");
			ctx.effect(() => ctx.locale.register(SETTINGS_NS, {
				zh,
				en
			}), "dsh-skin-background: settings row dictionaries");
			const store = createBackgroundRowStore();
			const injected = (actions) => {
				bound = actions;
				bound.sync(current());
				return {
					update: (field, value) => host.set(field, value).then(() => {
						syncArt();
					}),
					upload: async (file) => {
						const response = await fetch("/skin-background/upload", {
							method: "POST",
							body: file
						});
						if (!response.ok) throw new Error(`upload failed: ${response.status}`);
						const saved = await response.json();
						return {
							id: saved.id,
							name: file.name,
							url: saved.url
						};
					},
					scanFolder: async () => {
						const response = await fetch("/skin-background/list");
						if (!response.ok) throw new Error(`list failed: ${response.status}`);
						return await response.json();
					},
					pickFolder: () => ctx.workspaces.pickDirectory(),
					removeAsset: (item) => {
						fetch(item.url, { method: "DELETE" });
					},
					applyItem: (item) => {
						if (!armed) return;
						pendingItemId = item.id;
						document.body.style.setProperty(ART_VARIABLE, imageValue(item));
						bound?.sync({
							...current(),
							activeId: item.id
						});
						host.set("activeId", item.id).then(() => {
							if (pendingItemId === item.id) pendingItemId = void 0;
						});
					},
					previewOpacity: (value) => {
						if (!armed) return;
						document.body.style.setProperty(VEIL_STRENGTH_VARIABLE, veilStrength(value));
					},
					previewChrome: (value) => {
						if (!armed) return;
						document.body.style.setProperty(CHROME_TRANSPARENCY_VARIABLE, chromeTransparency(value));
					}
				};
			};
			ctx.slots.inject("settings.appearance.item", () => ctx.slots.register({
				name: "settings.appearance.item",
				id: "skin-background",
				order: 30,
				store,
				locale: SETTINGS_NS,
				inject: injected
			}, BackgroundRow));
		}
		//#endregion
		exports.SETTINGS_NS = SETTINGS_NS;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map