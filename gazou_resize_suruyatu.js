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
