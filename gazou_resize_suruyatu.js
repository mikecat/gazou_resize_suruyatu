"use strict";

window.addEventListener("DOMContentLoaded", () => {
	const elems = {};
	document.querySelectorAll("[id]").forEach((elem) => elems[elem.id] = elem);

	const applyOperationSelection = () => {
		const operation = elems.operationSelector.value;
		elems.loadsaveArea.style.display = operation === "loadsave" ? "block" : "none";
		elems.resizeArea.style.display = operation === "resize" ? "block" : "none";
		elems.cropArea.style.display = operation === "crop" ? "block" : "none";
		elems.paintArea.style.display = operation === "paint" ? "block" : "none";
	};
	elems.operationSelector.addEventListener("change", applyOperationSelection);
	applyOperationSelection();

	const updateSizeInfo = () => {
		elems.imageSizeArea.textContent = `${elems.imageCanvas.width}×${elems.imageCanvas.height}`;
	};

	let resizeToWidth = 1280, resizeToHeight = 1280;
	const updateResizeToSize = () => {
		const currentWidth = elems.imageCanvas.width, currentHeight = elems.imageCanvas.height;
		const targetWidth = parseInt(elems.resizeTargetWidth.value, 10);
		const targetHeight = parseInt(elems.resizeTargetHeight.value, 10);
		let newWidth, newHeight;
		if (isNaN(targetWidth) || isNaN(targetHeight) || targetWidth <= 0 || targetHeight <= 0) return;
		const unit = elems.resizeToMultipleOf8.checked ? 8 : 1;
		// 通常通りサイズを求める
		switch (elems.resizeMode.value) {
			case "contain":
				newWidth = targetWidth;
				newHeight = targetWidth * currentHeight / currentWidth;
				if (newHeight > targetHeight) {
					newWidth = targetHeight * currentWidth / currentHeight;
					newHeight = targetHeight;
				}
				break;
			case "cover":
				newWidth = targetWidth;
				newHeight = targetWidth * currentHeight / currentWidth;
				if (newHeight < targetHeight) {
					newWidth = targetHeight * currentWidth / currentHeight;
					newHeight = targetHeight;
				}
				break;
			default:
				newWidth = targetWidth;
				newHeight = targetHeight;
				break;
		}
		// 丸める
		newWidth = Math.round(newWidth / unit) * unit;
		newHeight = Math.round(newHeight / unit) * unit;
		// 補正を行う
		switch (elems.resizeMode.value) {
			case "contain":
				while (newWidth > targetWidth) newWidth -= unit;
				while (newHeight > targetHeight) newHeight -= unit;
				break;
			case "cover":
				while (newWidth < targetWidth) newWidth += unit;
				while (newHeight < targetHeight) newHeight += unit;
				break;
		}
		if (newWidth <= 0) newWidth = unit;
		if (newHeight <= 0) newHeight = unit;
		// 結果を反映する
		resizeToWidth = newWidth;
		resizeToHeight = newHeight;
		elems.resizeResultSizeArea.textContent = `${newWidth}×${newHeight}`;
	};
	elems.resizeTargetWidth.addEventListener("change", updateResizeToSize);
	elems.resizeTargetHeight.addEventListener("change", updateResizeToSize);
	elems.resizeMode.addEventListener("change", updateResizeToSize);
	elems.resizeToMultipleOf8.addEventListener("change", updateResizeToSize);
	updateResizeToSize();

	elems.resizeTargetPreset.selectedIndex = 0;
	elems.resizeTargetPreset.addEventListener("change", () => {
		const size = elems.resizeTargetPreset.value.split(",");
		if (size.length === 2) {
			elems.resizeTargetWidth.value = size[0];
			elems.resizeTargetHeight.value = size[1];
			updateResizeToSize();
		}
		elems.resizeTargetPreset.selectedIndex = 0;
	});

	let cropLockedWidth = 0, cropLockedHeight = 0;
	const updateCropLock = () => {
		const width = parseInt(elems.cropWidth.value, 10);
		const height = parseInt(elems.cropHeight.value, 10);
		if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) return;
		cropLockedWidth = width;
		cropLockedHeight = height;
	};
	const updateCropStep = () => {
		const step = elems.cropToMultipleOf8.checked ? 8 : 1;
		elems.cropWidth.min = Math.min(elems.imageCanvas.width, step);
		elems.cropHeight.min = Math.min(elems.imageCanvas.height, step);
		elems.cropWidth.step = step;
		elems.cropHeight.step = step;
	};
	const cropSizeAdjust = () => {
		const widthMax = elems.imageCanvas.width, heightMax = elems.imageCanvas.height;
		elems.cropWidth.max = widthMax;
		elems.cropHeight.max = heightMax;
		let width = parseInt(elems.cropWidth.value, 10);
		let height = parseInt(elems.cropHeight.value, 10);
		if (isNaN(width) || isNaN(height)) return;
		const step = elems.cropToMultipleOf8.checked ? 8 : 1;
		// ステップの倍数に丸める
		width = Math.round(width / step) * step;
		height = Math.round(height / step) * step;
		// 画像サイズの超過を防ぐ (ステップ考慮)
		while (width > widthMax) width -= step;
		while (height > heightMax) height -= step;
		// サイズを正にする
		if (width <= 0) width = step;
		if (height <= 0) height = step;
		// 画像サイズの超過を防ぐ (強制) (画像サイズがステップより小さい場合対策)
		if (width > widthMax) width = widthMax;
		if (height > heightMax) height = heightMax;
		// 結果を書き戻す
		elems.cropWidth.value = width;
		elems.cropHeight.value = height;
		// この結果を用いて位置の制約を更新する
		const xMax = widthMax - width, yMax = heightMax - height;
		elems.cropX.max = xMax;
		elems.cropY.max = yMax;
		if (parseInt(elems.cropX.value, 10) > xMax) elems.cropX.value = xMax;
		if (parseInt(elems.cropY.value, 10) > yMax) elems.cropY.value = yMax;
	};
	elems.cropWidth.addEventListener("change", () => {
		if (elems.cropRetainAspectRatio.checked) {
			const step = elems.cropToMultipleOf8.checked ? 8 : 1;
			const width = parseInt(elems.cropWidth.value, 10);
			if (!(isNaN(width) || width <= 0)) {
				const rawHeight = width * cropLockedHeight / cropLockedWidth;
				const height = Math.round(rawHeight / step) * step;
				elems.cropHeight.value = height;
			}
		}
		cropSizeAdjust();
	});
	elems.cropHeight.addEventListener("change", () => {
		if (elems.cropRetainAspectRatio.checked) {
			const step = elems.cropToMultipleOf8.checked ? 8 : 1;
			const height = parseInt(elems.cropHeight.value, 10);
			if (!(isNaN(height) || height <= 0)) {
				const rawWidth = height * cropLockedWidth / cropLockedHeight;
				const width = Math.round(rawWidth / step) * step;
				elems.cropWidth.value = width;
			}
		}
		cropSizeAdjust();
	});
	elems.cropRetainAspectRatio.addEventListener("change", updateCropLock);
	elems.cropToMultipleOf8.addEventListener("change", () => {
		updateCropStep();
		cropSizeAdjust();
	});
	updateCropStep();
	cropSizeAdjust();
	updateCropLock();

	elems.cropSizePreset.selectedIndex = 0;
	elems.cropSizePreset.addEventListener("change", () => {
		const size = elems.cropSizePreset.value.split(",");
		if (size.length === 2) {
			elems.cropWidth.value = size[0];
			elems.cropHeight.value = size[1];
			updateCropLock();
			cropSizeAdjust();
		}
		elems.cropSizePreset.selectedIndex = 0;
	});

	const paintSizeAdjust = () => {
		const widthMax = elems.imageCanvas.width, heightMax = elems.imageCanvas.height;
		elems.paintWidth.max = widthMax;
		elems.paintHeight.max = heightMax;
		let width = parseInt(elems.paintWidth.value, 10);
		let height = parseInt(elems.paintHeight.value, 10);
		if (isNaN(width) || isNaN(height)) return;
		// サイズを正にする
		if (width <= 0) width = step;
		if (height <= 0) height = step;
		// 画像サイズの超過を防ぐ
		if (width > widthMax) width = widthMax;
		if (height > heightMax) height = heightMax;
		// 結果を書き戻す
		elems.paintWidth.value = width;
		elems.paintHeight.value = height;
		// この結果を用いて位置の制約を更新する
		const xMax = widthMax - width, yMax = heightMax - height;
		elems.paintX.max = xMax;
		elems.paintY.max = yMax;
		if (parseInt(elems.paintX.value, 10) > xMax) elems.paintX.value = xMax;
		if (parseInt(elems.paintY.value, 10) > yMax) elems.paintY.value = yMax;
	};
	elems.paintWidth.addEventListener("change", paintSizeAdjust);
	elems.paintHeight.addEventListener("change", paintSizeAdjust);
	paintSizeAdjust();

	const editCanvasContext = elems.editCanvas.getContext("2d");
	const imageCanvasContext = elems.imageCanvas.getContext("2d");
	editCanvasContext.globalCompositeOperation = "copy";
	imageCanvasContext.globalCompositeOperation = "copy";

	const putImageDataToCanvas = (data) => {
		elems.editCanvas.width = data.width;
		elems.editCanvas.height = data.height;
		elems.imageCanvas.width = data.width;
		elems.imageCanvas.height = data.height;
		imageCanvasContext.putImageData(data, 0, 0);
		updateSizeInfo();
		updateResizeToSize();
		cropSizeAdjust();
		updateCropLock();
		paintSizeAdjust();
	};

	let undoPos = 0;
	const undoList = [];
	const initUndo = (data) => {
		undoList.splice(0);
		undoList.push(data);
		undoPos = 0;
		elems.undoButton.disabled = true;
		elems.redoButton.disabled = true;
	};
	const doNewOperation = (newData) => {
		undoList.splice(undoPos + 1);
		undoList.push(newData);
		undoPos = undoList.length - 1;
		elems.undoButton.disabled = !(undoPos > 0);
		elems.redoButton.disabled = true;
		putImageDataToCanvas(newData);
	};
	const getCurrentData = () => {
		return undoList[undoPos];
	};
	elems.undoButton.addEventListener("click", () => {
		if (undoPos > 0) {
			undoPos--;
			putImageDataToCanvas(undoList[undoPos]);
			elems.undoButton.disabled = !(undoPos > 0);
			elems.redoButton.disabled = !(undoPos < undoList.length - 1);
		}
	});
	elems.redoButton.addEventListener("click", () => {
		if (undoPos < undoList.length - 1) {
			undoPos++;
			putImageDataToCanvas(undoList[undoPos]);
			elems.undoButton.disabled = !(undoPos > 0);
			elems.redoButton.disabled = !(undoPos < undoList.length - 1);
		}
	});
	initUndo(imageCanvasContext.getImageData(0, 0, imageCanvas.width, imageCanvas.height));

	let nameOfLoadedFile = "image";

	const loadImage = (blob, fileName) => {
		const url = URL.createObjectURL(blob);
		const img = document.createElement("img");
		img.onload = () => {
			const lastDotIdx = fileName.lastIndexOf(".");
			nameOfLoadedFile = lastDotIdx <= 0 ? fileName : fileName.substring(0, lastDotIdx);
			URL.revokeObjectURL(url);
			elems.editCanvas.width = img.width;
			elems.editCanvas.height = img.height;
			elems.imageCanvas.width = img.width;
			elems.imageCanvas.height = img.height;
			imageCanvasContext.drawImage(img, 0, 0);
			initUndo(imageCanvasContext.getImageData(0, 0, img.width, img.height));
			updateSizeInfo();
			updateResizeToSize();
			cropSizeAdjust();
			updateCropLock();
			paintSizeAdjust();
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			alert("画像の読み込みに失敗しました。");
		};
		img.src = url;
	};

	elems.loadFileButton.addEventListener("click", () => {
		const fileSelector = document.createElement("input");
		fileSelector.setAttribute("type", "file");
		fileSelector.setAttribute("accept", "image/*");
		fileSelector.onchange = () => {
			if (fileSelector.files.length > 0) {
				loadImage(fileSelector.files[0], fileSelector.files[0].name);
			}
		};
		fileSelector.click();
	});

	document.addEventListener("dragover", (event) => {
		const tr = event.dataTransfer;
		if (tr.types.includes("Files")) {
			event.preventDefault();
			tr.dropEffect = "copy";
		}
	});

	document.addEventListener("drop", (event) => {
		const tr = event.dataTransfer;
		if (tr.files.length > 0) {
			event.preventDefault();
			// 画像を優先する
			for (let i = 0; i < tr.files.length; i++) {
				if (tr.files[i].type.startsWith("image/")) {
					loadImage(tr.files[i], tr.files[i].name);
					return;
				}
			}
			// 画像が見つからなかったら、タイプ不明のファイルの読み込みを試みる
			for (let i = 0; i < tr.files.length; i++) {
				if (tr.files[i].type === "") {
					loadImage(tr.files[i], tr.files[i].name);
					return;
				}
			}
		}
	});

	if (navigator.clipboard) {
		elems.loadClipboardButton.addEventListener("click", () => {
			if (!navigator.clipboard) {
				alert("この環境はクリップボードの読み取りに非対応です。");
				return;
			}
			navigator.clipboard.read().then((items) => {
				for (let i = 0; i < items.length; i++) {
					const item = items[i];
					for (let j = 0; j < item.types.length; j++) {
						if (item.types[j].startsWith("image/")) {
							item.getType(item.types[j]).then((blob) => {
								loadImage(blob, "clipboard");
							}, (error) => {
								console.log(error);
								alert("クリップボードからのデータ取得に失敗しました。");
							});
							return;
						}
					}
				}
				alert("クリップボードに画像が見つかりません。");
			}, (error) => {
				console.error(error);
				alert("クリップボードの読み取りに失敗しました。");
			});
		});
	} else {
		elems.loadClipboardButton.disabled = true;
	}

	const syncQualityNumberToRange = () => {
		const quality = parseInt(elems.saveQuality.value, 10);
		if (!isNaN(quality)) elems.saveQualityRange.value = quality;
	};
	elems.saveQualityRange.addEventListener("input", () => {
		const quality = parseInt(elems.saveQualityRange.value, 10);
		if (!isNaN(quality)) elems.saveQuality.value = quality;
	});
	elems.saveQuality.addEventListener("input", syncQualityNumberToRange);
	syncQualityNumberToRange();

	let prevSavedObjectUrl = null;
	const saveImage = (mime, nameSuffix) => {
		const quality = parseInt(elems.saveQuality.value, 10);
		if (isNaN(quality) || quality < 0 || 100 < quality) {
			alert("品質の設定が無効です。");
			return;
		}
		try {
			elems.imageCanvas.toBlob((blob) => {
				if (blob === null) {
					alert("画像の保存に失敗しました。");
				} else if (blob.type !== mime) {
					alert("この形式での保存には非対応のようです。");
				} else {
					if (prevSavedObjectUrl !== null) URL.revokeObjectURL(prevSavedObjectUrl);
					prevSavedObjectUrl = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.setAttribute("href", prevSavedObjectUrl);
					a.setAttribute("download", `${nameOfLoadedFile}_${elems.imageCanvas.width}x${elems.imageCanvas.height}${nameSuffix}`);
					a.click();
				}
			}, mime, quality / 100.0);
		} catch (error) {
			console.log(error);
			alert("画像の出力に失敗しました。");
		}
	};

	elems.saveJpgButton.addEventListener("click", () => {
		saveImage("image/jpeg", ".jpg");
	});
	elems.savePngButton.addEventListener("click", () => {
		saveImage("image/png", ".png");
	});
	elems.saveWebpButton.addEventListener("click", () => {
		saveImage("image/webp", ".webp");
	});

	const getSamplePoints = (srcNumPoints, dstNumPoints) => {
		if (dstNumPoints <= 1) {
			return [0];
		} else {
			const res = [];
			for (let i = 0; i < dstNumPoints; i++) {
				res.push(i * (srcNumPoints - 1) / (dstNumPoints - 1));
			}
			return res;
		}
	};

	const getCoefficientsForBiliniar = (srcNumPoints, dstNumPoints) => {
		const samplePoints = getSamplePoints(srcNumPoints, dstNumPoints);
		const res = [];
		for (let i = 0; i < samplePoints.length; i++) {
			const start = Math.floor(samplePoints[i]);
			if (start === samplePoints[i]) {
				res.push({offset: start, coeffs: [1]});
			} else {
				res.push({offset: start, coeffs: [start + 1 - samplePoints[i], samplePoints[i] - start]});
			}
		}
		return res;
	};

	const getCoefficientsForBicubic = (() => {
		// https://qiita.com/yoya/items/f167b2598fec98679422
		const b = 1.0 / 3.0, c = 1.0 / 3.0;

		const p = 2 - 1.5 * b - c;
		const q = -3 + 2 * b + c;
		const r = 0;
		const s = 1 - (1.0 / 3.0) * b;
		const t = -(1.0 / 6.0) * b - c;
		const u = b + 5 * c;
		const v = -2 * b - 8 * c;
		const w = (4.0 / 3.0) * b + 4 * c;

		const bicubicFunction = (x) => {
			const ax = Math.abs(x);
			if (ax < 1) {
				return ((p * ax + q) * ax + r) * ax + s;
			} else if (ax < 2) {
				return ((t * ax + u) * ax + v) * ax + w;
			} else {
				return 0;
			}
		};

		return (srcNumPoints, dstNumPoints) => {
			const samplePoints = getSamplePoints(srcNumPoints, dstNumPoints);
			const res = [];
			for (let i = 0; i < samplePoints.length; i++) {
				const start = Math.floor(samplePoints[i]);
				let firstOffset = null;
				const coeffs = [];
				for (let j = -1; j <= 2; j++) {
					const offset = start + j;
					if (0 <= offset && offset < srcNumPoints) {
						if (firstOffset === null) firstOffset = offset;
						coeffs.push(bicubicFunction(j - (samplePoints[i] - start)));
					}
				}
				res.push({offset: firstOffset, coeffs});
			}
			return res;
		};
	})();

	const getCoefficientsForLanczos3 = (() => {
		// https://qiita.com/yoya/items/f167b2598fec98679422
		// https://en.wikipedia.org/wiki/Lanczos_resampling
		const a = 3;

		const sinc = (x) => {
			const pi_x = Math.PI * x;
			return Math.sin(pi_x) / pi_x; // x === 0 は下の関数で判定するので分岐不要
		};

		const lanczosFunction = (x) => {
			if (x === 0) {
				return 1;
			} else if (Math.abs(x) < a) {
				return sinc(x) * sinc(x / a);
			} else {
				return 0;
			}
		};

		return (srcNumPoints, dstNumPoints) => {
			const samplePoints = getSamplePoints(srcNumPoints, dstNumPoints);
			const res = [];
			for (let i = 0; i < samplePoints.length; i++) {
				const start = Math.floor(samplePoints[i]);
				let firstOffset = null;
				const coeffs = [];
				for (let j = -2; j <= 3; j++) {
					const offset = start + j;
					if (0 <= offset && offset < srcNumPoints) {
						if (firstOffset === null) firstOffset = offset;
						coeffs.push(lanczosFunction(j - (samplePoints[i] - start)));
					}
				}
				res.push({offset: firstOffset, coeffs});
			}
			return res;
		};
	})();

	const getCoeffiientsForAverage = (srcNumPoints, dstNumPoints) => {
		const res = [];
		for (let i = 0; i < dstNumPoints; i++) {
			const begin = i * srcNumPoints / dstNumPoints;
			const end = (i + 1) * srcNumPoints / dstNumPoints;
			const beginInt = Math.floor(begin), endInt = Math.floor(end);
			if (beginInt === endInt) {
				res.push({offset: beginInt, coeffs: [end - begin]});
			} else {
				const coeffs = [1 - (begin - beginInt)];
				for (let i = beginInt + 1; i < endInt; i++) {
					coeffs.push(1);
				}
				if (end !== endInt) {
					coeffs.push(end - endInt);
				}
				res.push({offset: beginInt, coeffs});
			}
		}
		return res;
	};

	// [0, 255] の sRGB を [0, 1] の RGB に変換する
	// https://www.psy.ritsumei.ac.jp/akitaoka/RGBtoXYZ_etal01.html
	const sRGB_to_RGB = (value) => {
		const temp = value / 255;
		if (temp <= 0.04045) {
			return temp / 12.92;
		} else {
			return Math.pow((temp + 0.055) / 1.055, 2.4);
		}
	};
	const sRGB_to_RGB_table = new Float32Array(256);
	for (let i = 0; i < 256; i++) {
		sRGB_to_RGB_table[i] = sRGB_to_RGB(i);
	}

	// [0, 1] の RGB を [0, 255] の sRGB に変換する
	const RGB_to_sRGB = (value) => {
		const temp = value * 12.92;
		if (temp <= 0.04045) {
			return temp * 255;
		} else {
			return (Math.pow(value, 1 / 2.4) * 1.055 - 0.055) * 255;
		}
	};

	const applyCoeffs = (srcData, xCoeffs, yCoeffs) => {
		const useRgb = elems.operateInRgb.checked;
		const srcPixels = new Float32Array(srcData.width * srcData.height * 4);
		// 入力を [0, 1] に変換する
		for (let i = 0; i < srcPixels.length; i += 4) {
			if (useRgb) {
				srcPixels[i] = sRGB_to_RGB_table[srcData.data[i]];
				srcPixels[i + 1] = sRGB_to_RGB_table[srcData.data[i + 1]];
				srcPixels[i + 2] = sRGB_to_RGB_table[srcData.data[i + 2]];
			} else {
				srcPixels[i] = srcData.data[i] / 255;
				srcPixels[i + 1] = srcData.data[i + 1] / 255;
				srcPixels[i + 2] = srcData.data[i + 2] / 255;
			}
			srcPixels[i + 3] = srcData.data[i + 3] / 255; // アルファ値
			srcPixels[i] *= srcPixels[i + 3];
			srcPixels[i + 1] *= srcPixels[i + 3];
			srcPixels[i + 2] *= srcPixels[i + 3];
		}
		// 計算を行う
		const dstPixels = new Float32Array(xCoeffs.length * yCoeffs.length * 4);
		for (let y = 0; y < yCoeffs.length; y++) {
			const yCoeff = yCoeffs[y];
			for (let x = 0; x < xCoeffs.length; x++) {
				const xCoeff = xCoeffs[x];
				const dstOffset = (y * xCoeffs.length + x) * 4;
				let r = 0, g = 0, b = 0, a = 0, weight = 0;
				for (let i = 0; i < yCoeff.coeffs.length; i++) {
					for (let j = 0; j < xCoeff.coeffs.length; j++) {
						const srcOffset = ((yCoeff.offset + i) * srcData.width + (xCoeff.offset + j)) * 4;
						const coeff = yCoeff.coeffs[i] * xCoeff.coeffs[j];
						r += srcPixels[srcOffset] * coeff;
						g += srcPixels[srcOffset + 1] * coeff;
						b += srcPixels[srcOffset + 2] * coeff;
						a += srcPixels[srcOffset + 3] * coeff;
						weight += coeff;
					}
				}
				dstPixels[dstOffset] = r / weight;
				dstPixels[dstOffset + 1] = g / weight;
				dstPixels[dstOffset + 2] = b / weight;
				dstPixels[dstOffset + 3] = a / weight;
			}
		}
		// 計算結果を [0, 255] に変換する
		const dstData = imageCanvasContext.createImageData(xCoeffs.length, yCoeffs.length);
		for (let i = 0; i < dstPixels.length; i += 4) {
			let r, g, b;
			if (dstPixels[i + 3] < 0.5 / 255) {
				r = 0;
				g = 0;
				b = 0;
			} else if (useRgb) {
				r = RGB_to_sRGB(dstPixels[i] / dstPixels[i + 3]);
				g = RGB_to_sRGB(dstPixels[i + 1] / dstPixels[i + 3]);
				b = RGB_to_sRGB(dstPixels[i + 2] / dstPixels[i + 3]);
			} else {
				r = (dstPixels[i] / dstPixels[i + 3]) * 255;
				g = (dstPixels[i + 1] / dstPixels[i + 3]) * 255;
				b = (dstPixels[i + 2] / dstPixels[i + 3]) * 255;
			}
			dstData.data[i] = Math.round(r);
			dstData.data[i + 1] = Math.round(g);
			dstData.data[i + 2] = Math.round(b);
			dstData.data[i + 3] = Math.round(dstPixels[i + 3] * 255);
		}
		return dstData;
	};

	const calculateAndApplyCoeffsToData = (srcData, dstWidth, dstHeight, coeffFunction) => {
		const xCoeffs = coeffFunction(srcData.width, dstWidth);
		const yCoeffs = coeffFunction(srcData.height, dstHeight);
		return applyCoeffs(srcData, xCoeffs, yCoeffs);
	};

	const stretchImage = (srcData, dstWidth, dstHeight) => {
		switch (elems.stretchMethod.value) {
			case "bilinear":
				return calculateAndApplyCoeffsToData(srcData, dstWidth, dstHeight, getCoefficientsForBiliniar);
			case "bicubic":
				return calculateAndApplyCoeffsToData(srcData, dstWidth, dstHeight, getCoefficientsForBicubic);
			case "lanczos3":
				return calculateAndApplyCoeffsToData(srcData, dstWidth, dstHeight, getCoefficientsForLanczos3);
			default:
				// ニアレストネイバー
				{
					const sxList = getSamplePoints(srcData.width, dstWidth);
					const syList = getSamplePoints(srcData.height, dstHeight);
					const dstData = imageCanvasContext.createImageData(dstWidth, dstHeight);
					for (let y = 0; y < dstData.height; y++) {
						const sy = Math.round(syList[y]);
						for (let x = 0; x < dstData.width; x++) {
							const sx = Math.round(sxList[x]);
							for (let i = 0; i < 4; i++) {
								dstData.data[(y * dstData.width + x) * 4 + i] = srcData.data[(sy * srcData.width + sx) * 4 + i];
							}
						}
					}
					return dstData;
				}
		}
	};

	const shrinkImage = (srcData, dstWidth, dstHeight) => {
		switch (elems.shrinkMethod.value) {
			case "average":
				return calculateAndApplyCoeffsToData(srcData, dstWidth, dstHeight, getCoeffiientsForAverage);
			default:
				// 1点サンプリング
				{
					const dstData = imageCanvasContext.createImageData(dstWidth, dstHeight);
					const sxList = getSamplePoints(srcData.width, dstWidth);
					const syList = getSamplePoints(srcData.height, dstHeight);
					for (let y = 0; y < dstData.height; y++) {
						const sy = Math.round(syList[y]);
						for (let x = 0; x < dstData.width; x++) {
							const sx = Math.round(sxList[x]);
							for (let i = 0; i < 4; i++) {
								dstData.data[(y * dstData.width + x) * 4 + i] = srcData.data[(sy * srcData.width + sx) * 4 + i];
							}
						}
					}
					return dstData;
				}
		}
	};

	elems.resizeButton.addEventListener("click", () => {
		const srcData = getCurrentData();
		const srcWidth = srcData.width, srcHeight = srcData.height;
		let dstData;
		if (resizeToWidth <= srcWidth && resizeToHeight <= srcHeight) {
			// 縮小のみ
			dstData = shrinkImage(srcData, resizeToWidth, resizeToHeight);
		} else if (resizeToWidth >= srcWidth && resizeToHeight >= srcHeight) {
			// 拡大のみ
			dstData = stretchImage(srcData, resizeToWidth, resizeToHeight);
		} else if (resizeToWidth > srcWidth) {
			// 横は拡大、縦は縮小
			const middleData = stretchImage(srcData, resizeToWidth, srcHeight);
			dstData = shrinkImage(middleData, resizeToWidth, resizeToHeight);
		} else {
			// 横は縮小、縦は拡大
			const middleData = stretchImage(srcData, srcWidth, resizeToHeight);
			dstData = shrinkImage(middleData, resizeToWidth, resizeToHeight);
		}
		doNewOperation(dstData);
	});

	elems.rotateLeftButton.addEventListener("click", () => {
		const srcData = getCurrentData();
		const dstData = imageCanvasContext.createImageData(srcData.height, srcData.width);
		for (let y = 0; y < srcData.height; y++) {
			const dx = y;
			for (let x = 0; x < srcData.width; x++) {
				const dy = srcData.width - 1 - x;
				for (let i = 0; i < 4; i++) {
					dstData.data[(dy * srcData.height + dx) * 4 + i] = srcData.data[(y * srcData.width + x) * 4 + i];
				}
			}
		}
		doNewOperation(dstData);
	});

	elems.rotateRightButton.addEventListener("click", () => {
		const srcData = getCurrentData();
		const dstData = imageCanvasContext.createImageData(srcData.height, srcData.width);
		for (let y = 0; y < srcData.height; y++) {
			const dx = srcData.height - 1 - y;
			for (let x = 0; x < srcData.width; x++) {
				const dy = x;
				for (let i = 0; i < 4; i++) {
					dstData.data[(dy * srcData.height + dx) * 4 + i] = srcData.data[(y * srcData.width + x) * 4 + i];
				}
			}
		}
		doNewOperation(dstData);
	});

	elems.horizontalFlipButton.addEventListener("click", () => {
		const srcData = getCurrentData();
		const dstData = imageCanvasContext.createImageData(srcData.width, srcData.height);
		for (let y = 0; y < srcData.height; y++) {
			for (let x = 0; x < srcData.width; x++) {
				const dx = srcData.width - 1 - x;
				for (let i = 0; i < 4; i++) {
					dstData.data[(y * srcData.width + dx) * 4 + i] = srcData.data[(y * srcData.width + x) * 4 + i];
				}
			}
		}
		doNewOperation(dstData);
	});

	elems.verticalFlipButton.addEventListener("click", () => {
		const srcData = getCurrentData();
		const dstData = imageCanvasContext.createImageData(srcData.width, srcData.height);
		for (let y = 0; y < srcData.height; y++) {
			const dy = srcData.height - 1 - y;
			for (let x = 0; x < srcData.width; x++) {
				for (let i = 0; i < 4; i++) {
					dstData.data[(dy * srcData.width + x) * 4 + i] = srcData.data[(y * srcData.width + x) * 4 + i];
				}
			}
		}
		doNewOperation(dstData);
	});
});
