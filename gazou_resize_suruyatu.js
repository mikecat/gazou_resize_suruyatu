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
});
