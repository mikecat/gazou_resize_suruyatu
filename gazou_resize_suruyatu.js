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
});
