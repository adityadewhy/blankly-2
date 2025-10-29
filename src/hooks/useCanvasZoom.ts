import {useState, useEffect, useRef} from "react";
import Konva from "konva";

interface useCanvasZoomProps {
	stageRef: React.RefObject<Konva.Stage | null>;
}

interface useCanvasZoomReturn {
	stageScale: number;
	stagePos: {x: number; y: number};
	handleWheel: (e: any) => void;
	handleDragEnd: (e: any) => void;
	getTransformedPosition: (x: number, y: number) => {left: number; top: number};
}

export function useCanvasZoom({
	stageRef,
}: useCanvasZoomProps): useCanvasZoomReturn {
	const [stageScale, setStageScale] = useState(1);
	const [stagePos, setStagePos] = useState({x: 0, y: 0});

	useEffect(() => {
		const preventDefault = (e: WheelEvent | KeyboardEvent) => {
			// Prevent Ctrl+scroll zoom
			if (e instanceof WheelEvent && e.ctrlKey) {
				e.preventDefault();
			}

			if (
				e instanceof KeyboardEvent &&
				(e.ctrlKey || e.metaKey) &&
				(e.key === "+" || e.key === "-" || e.key === "=")
			) {
				e.preventDefault();
			}
		};

		const preventPinchZoom = (e: TouchEvent) => {
			if (e.touches.length > 1) {
				e.preventDefault();
			}
		};

		document.addEventListener("wheel", preventDefault, {passive: false});
		document.addEventListener("keydown", preventDefault, {passive: false});
		document.addEventListener("touchmove", preventPinchZoom, {passive: false});

		return () => {
			document.removeEventListener("wheel", preventDefault);
			document.removeEventListener("keydown", preventDefault);
			document.removeEventListener("touchmove", preventPinchZoom);
		};
	}, []);

	const handleWheel = (e: any) => {
		e.evt.preventDefault();

		const stage = stageRef.current;
		if (!stage) return;

		const oldScale = stage.scaleX();
		const pointer = stage.getPointerPosition();
		if (!pointer) return;

		const mousePointTo = {
			x: (pointer.x - stage.x()) / oldScale,
			y: (pointer.y - stage.y()) / oldScale,
		};

		const scaleBy = 1.05;
		const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

		const limitedScale = Math.max(0.1, Math.min(10, newScale));

		const newPos = {
			x: pointer.x - mousePointTo.x * limitedScale,
			y: pointer.y - mousePointTo.y * limitedScale,
		};

		setStageScale(limitedScale);
		setStagePos(newPos);
	};

	const handleDragEnd = (e: any) => {
		setStagePos({
			x: e.target.x(),
			y: e.target.y(),
		});
	};

	const getTransformedPosition = (x: number, y: number) => {
		return {
			left: x * stageScale + stagePos.x,
			top: y * stageScale + stagePos.y,
		};
	};

	return {
		stageScale,
		stagePos,
		handleWheel,
		handleDragEnd,
		getTransformedPosition,
	};
}
