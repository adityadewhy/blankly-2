"use client";

import React, {useState, useRef, useEffect} from "react";
import {
	Stage,
	Layer,
	Line,
	Rect,
	Arrow,
	Text,
	Ellipse,
	Transformer,
	Image,
} from "react-konva";
import Konva from "konva";
import {useCanvasZoom} from "@/hooks/useCanvasZoom";

interface canvasComponentProps {
	activeTool: string;
}

interface TextObject {
	id: string;
	x: number;
	y: number;
	text: string;
	visible: boolean;
	fontSize: number;
	fontFamily: string;
	fill: string;
	scaleX?: number;
	scaleY?: number;
	rotation?: number;
}

export default function CanvasComponent({activeTool}: canvasComponentProps) {
	const [shapes, setShapes] = useState<any[]>([]);
	const [previewShape, setPreviewShape] = useState<any | null>(null);
	const [inputText, setInputText] = useState<string>("");
	const [textArray, setTextArray] = useState<TextObject[]>([]);
	const [inputPosition, setInputPosition] = useState({
		x: 0,
		y: 0,
		visible: false,
	});

	const textInputRef = useRef<HTMLTextAreaElement>(null);
	const stageRef = useRef<Konva.Stage>(null);

	const [selectedId, setSelectedId] = useState<string | null>(null);
	const transformerRef = useRef<Konva.Transformer>(null);

	// Use the zoom hook - THIS IS WHERE IT'S USED
	const {
		stageScale,
		stagePos,
		handleWheel,
		handleDragEnd,
		getTransformedPosition,
	} = useCanvasZoom({stageRef});

	const defaultShapeConfig = {
		fill: "transparent",
		stroke: "white",
		strokeWidth: 1,
	};

	const textFontFamily = "Calibri";
	const textFontSize = 24;
	const textColor = "white";

	const toolHandlers: {[key: string]: any} = {
		Arrow: {
			onMouseDown: (e: any) => {
				const stage = e.target.getStage();
				const pointer = stage.getRelativePointerPosition();
				if (!pointer) return;

				setPreviewShape({
					type: "arrow",
					id: "preview",
					points: [pointer.x, pointer.y, pointer.x, pointer.y],
					...defaultShapeConfig,
				});
			},
			onMouseMove: (e: any) => {
				if (!previewShape) return;
				const stage = e.target.getStage();
				const pointer = stage.getRelativePointerPosition();
				if (!pointer) return;

				const newPoints = [
					previewShape.points[0],
					previewShape.points[1],
					pointer.x,
					pointer.y,
				];
				setPreviewShape({
					...previewShape,
					points: newPoints,
				});
			},
			onMouseUp: (e: any) => {
				if (!previewShape) return;
				setShapes((prev) => [
					...prev,
					{...previewShape, id: Date.now().toString(), draggable: false},
				]);
				setPreviewShape(null);
			},
		},
		Line: {
			onMouseDown: (e: any) => {
				const stage = e.target.getStage();
				const pointer = stage.getRelativePointerPosition();
				if (!pointer) return;

				setPreviewShape({
					type: "line",
					id: "preview",
					points: [pointer.x, pointer.y, pointer.x, pointer.y],
					...defaultShapeConfig,
				});
			},
			onMouseMove: (e: any) => {
				if (!previewShape) return;
				const stage = e.target.getStage();
				const pointer = stage.getRelativePointerPosition();
				if (!pointer) return;

				const newPoints = [...previewShape.points];
				newPoints[2] = pointer.x;
				newPoints[3] = pointer.y;

				setPreviewShape({...previewShape, points: newPoints});
			},
			onMouseUp: (e: any) => {
				if (!previewShape) return;
				setShapes((prev) => [
					...prev,
					{...previewShape, id: Date.now().toString(), draggable: false},
				]);
				setPreviewShape(null);
			},
		},
		Rectangle: {
			onMouseDown: (e: any) => {
				const stage = e.target.getStage();
				const pointer = stage.getRelativePointerPosition();
				if (!pointer) return;

				const newRect = {
					type: "rect",
					id: "preview",
					x: pointer.x,
					y: pointer.y,
					width: 0,
					height: 0,
					...defaultShapeConfig,
				};
				setPreviewShape(newRect);
			},
			onMouseMove: (e: any) => {
				if (!previewShape) return;
				const stage = e.target.getStage();
				const pointer = stage.getRelativePointerPosition();
				if (!pointer) return;

				const startX = previewShape.startX ?? previewShape.x;
				const startY = previewShape.startY ?? previewShape.y;

				setPreviewShape({
					...previewShape,
					x: Math.min(startX, pointer.x),
					y: Math.min(startY, pointer.y),
					width: Math.abs(pointer.x - startX),
					height: Math.abs(pointer.y - startY),
					startX: startX,
					startY: startY,
				});
			},
			onMouseUp: (e: any) => {
				if (!previewShape) return;
				const {startX, startY, ...finalShape} = previewShape;
				setShapes((prev) => [
					...prev,
					{...finalShape, id: Date.now().toString(), draggable: false},
				]);
				setPreviewShape(null);
			},
		},
		Draw: {
			onMouseDown: (e: any) => {
				const stage = e.target.getStage();
				const pointer = stage.getRelativePointerPosition();
				if (!pointer) return;

				setPreviewShape({
					type: "line",
					id: "preview",
					points: [pointer.x, pointer.y],
					...defaultShapeConfig,
				});
			},
			onMouseMove: (e: any) => {
				if (!previewShape) return;
				const stage = e.target.getStage();
				const pointer = stage.getRelativePointerPosition();
				if (!pointer) return;

				setPreviewShape({
					...previewShape,
					points: [...previewShape.points, pointer.x, pointer.y],
				});
			},
			onMouseUp: (e: any) => {
				if (!previewShape) return;
				setShapes((prev) => [
					...prev,
					{...previewShape, id: Date.now().toString(), draggable: false},
				]);
				setPreviewShape(null);
			},
		},
		Circle: {
			onMouseDown: (e: any) => {
				const stage = e.target.getStage();
				const pointer = stage.getRelativePointerPosition();
				if (!pointer) return;

				setPreviewShape({
					type: "ellipse",
					id: "preview",
					startX: pointer.x,
					startY: pointer.y,
					x: pointer.x,
					y: pointer.y,
					radiusX: 0,
					radiusY: 0,
					...defaultShapeConfig,
				});
			},
			onMouseMove: (e: any) => {
				if (!previewShape) return;
				const stage = e.target.getStage();
				const pointer = stage.getRelativePointerPosition();
				if (!pointer) return;

				const {startX, startY} = previewShape;
				const width = Math.abs(pointer.x - startX);
				const height = Math.abs(pointer.y - startY);

				setPreviewShape({
					...previewShape,
					x: (startX + pointer.x) / 2,
					y: (startY + pointer.y) / 2,
					radiusX: width / 2,
					radiusY: height / 2,
				});
			},
			onMouseUp: () => {
				if (!previewShape) return;
				const {startX, startY, ...finalShape} = previewShape;
				setShapes((prev) => [
					...prev,
					{...finalShape, id: Date.now().toString()},
				]);
				setPreviewShape(null);
			},
		},
	};

	const handleMouseDown = (e: any) => {
		const clickedOnEmpty = e.target === e.target.getStage();
		if (clickedOnEmpty) {
			if (activeTool === "Selection") {
				setSelectedId(null);
			}
		}

		if (drawingTools.includes(activeTool)) {
			toolHandlers[activeTool]?.onMouseDown?.(e);
		}
	};

	const handleMouseMove = (e: any) => {
		toolHandlers[activeTool]?.onMouseMove?.(e);
	};

	const handleMouseUp = (e: any) => {
		toolHandlers[activeTool]?.onMouseUp?.(e);
	};

	const handleInputText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInputText(e.target.value);
	};

	const finishTextEditing = () => {
		if (inputText.trim() !== "") {
			setTextArray([
				...textArray,
				{
					id: `${Date.now().toString()}`,
					x: inputPosition.x,
					y: inputPosition.y,
					text: inputText,
					visible: true,
					fontSize: textFontSize,
					fontFamily: textFontFamily,
					fill: textColor,
				},
			]);
		}
		setInputText("");
		setInputPosition({...inputPosition, visible: false});
	};

	const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			finishTextEditing();
		}
	};

	const handleTextBlur = () => {
		finishTextEditing();
	};

	const handleStageClickForText = (e: any) => {
		if (e.target !== e.target.getStage()) {
			return;
		}
		const stage = e.target.getStage();
		const pointer = stage.getRelativePointerPosition();
		if (!pointer) return;

		setInputPosition({x: pointer.x, y: pointer.y, visible: true});
	};

	useEffect(() => {
		if (inputPosition.visible) {
			textInputRef.current?.focus();
		}
	}, [inputPosition.visible]);

	const drawingTools = ["Arrow", "Line", "Rectangle", "Draw", "Circle"];

	const getCursor = () => {
		if (activeTool === "Text") {
			return "text";
		}
		if (activeTool === "Hand or panning tool") {
			return "grab";
		}
		if (drawingTools.includes(activeTool)) {
			return "crosshair";
		}
		return "default";
	};

	useEffect(() => console.log(activeTool), [activeTool]);

	useEffect(() => {
		if (!transformerRef.current) {
			return;
		}

		const transformer = transformerRef.current;
		const stage = transformer.getStage();

		if (selectedId) {
			const selectedNode = stage?.findOne("#" + selectedId);

			if (selectedNode) {
				transformer.nodes([selectedNode]);
			} else {
				transformer.nodes([]);
			}
		} else {
			transformer.nodes([]);
		}

		transformer.getLayer()?.batchDraw();
	}, [selectedId]);

	// Get text input position accounting for zoom/pan - HOOK USAGE #1
	const textInputPos = getTransformedPosition(inputPosition.x, inputPosition.y);

	return (
		<div
			className="border-4 border-white inset-0 z-0 fixed"
			style={{
				cursor: getCursor(),
			}}
		>
			<textarea
				ref={textInputRef}
				id="konva-text-input"
				value={inputText}
				onChange={handleInputText}
				onKeyDown={handleTextKeyDown}
				onBlur={handleTextBlur}
				aria-label="Text to place on canvas"
				style={{
					display: inputPosition.visible ? "block" : "none",
					position: "absolute",
					top: `${textInputPos.top}px`,
					left: `${textInputPos.left}px`,
					zIndex: 10,
					fontSize: `${textFontSize * stageScale}px`,
					fontFamily: textFontFamily,
					color: textColor,
					background: "transparent",
					border: "none",
					padding: "0",
					borderRadius: "2px",
					minHeight: "auto",
					minWidth: "auto",
					fieldSizing: "content",
					overflow: "hidden",
					lineHeight: `${textFontSize * stageScale}px`,
					resize: "none",
				}}
			/>
			<Stage
				ref={stageRef}
				width={window.innerWidth}
				height={window.innerHeight}
				scaleX={stageScale}
				scaleY={stageScale}
				x={stagePos.x}
				y={stagePos.y}
				onWheel={handleWheel}
				onMouseDown={
					activeTool === "Text" ? handleStageClickForText : handleMouseDown
				}
				onClick={activeTool === "Text" ? handleStageClickForText : undefined}
				onTap={activeTool === "Text" ? handleStageClickForText : undefined}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				draggable={activeTool === "Hand or panning tool"}
				onDragEnd={(e) => {
					// Only handle drag end if we're actually using the Hand tool
					if (activeTool === "Hand or panning tool") {
						handleDragEnd(e);
					}
				}}
			>
				<Layer>
					{shapes.map((shape) => {
						const {id, ...rest} = shape;
						const shapeProps = {
							id,
							...rest,
							fillEnabled: false,
							hitStrokeWidth: 10,

							onMouseEnter: (e: any) => {
								if (activeTool === "Selection") {
									const stage = e.target.getStage();
									if (stage) {
										stage.container().style.cursor = "move";
									}
								}
							},
							onMouseLeave: (e: any) => {
								const stage = e.target.getStage();
								if (stage) {
									stage.container().style.cursor = getCursor();
								}
							},
							onClick: (e: any) => {
								if (activeTool === "Selection") {
									e.cancelBubble = true;
									setSelectedId(shape.id);
								}
							},
							onTap: (e: any) => {
								if (activeTool === "Selection") {
									e.cancelBubble = true;
									setSelectedId(shape.id);
								}
							},

							draggable: activeTool === "Selection" && selectedId === shape.id,
							onDragStart: (e: any) => {
								e.cancelBubble = true;
							},
							onDragMove: (e: any) => {
								e.cancelBubble = true;
							},
							onDragEnd: (e: any) => {
								e.cancelBubble = true;

								const newShapes = shapes.slice();
								const index = newShapes.findIndex((s) => s.id === shape.id);
								newShapes[index] = {
									...newShapes[index],
									x: e.target.x(),
									y: e.target.y(),
								};
								setShapes(newShapes);
							},
							onTransformEnd: (e: any) => {
								const node = e.target;
								const newShapes = shapes.slice();
								const index = newShapes.findIndex((s) => s.id === shape.id);
								// Handle lines and arrows differently
								if (shape.type === "line" || shape.type === "arrow") {
									const scaleX = node.scaleX();
									const scaleY = node.scaleY();
									const points = node.points();

									// Scale the points
									const newPoints = points.map((point: number, idx: number) => {
										return idx % 2 === 0 ? point * scaleX : point * scaleY;
									});

									newShapes[index] = {
										...newShapes[index],
										x: node.x(),
										y: node.y(),
										points: newPoints,
										rotation: node.rotation(),
									};

									// Reset scale
									node.scaleX(1);
									node.scaleY(1);
								} else {
									// Handle rect and ellipse normally
									newShapes[index] = {
										...newShapes[index],
										x: node.x(),
										y: node.y(),
										width: node.width() * node.scaleX(),
										height: node.height() * node.scaleY(),
										rotation: node.rotation(),
									};
									node.scaleX(1);
									node.scaleY(1);
								}

								setShapes(newShapes);
							},
						};

						switch (shape.type) {
							case "rect":
								return <Rect key={id} {...shapeProps} />;
							case "ellipse":
								return <Ellipse key={id} {...shapeProps} />;
							case "line":
								return (
									<Line
										key={id}
										{...shapeProps}
										tension={0}
										lineCap="round"
										lineJoin="round"
									/>
								);
							case "arrow":
								return <Arrow key={id} {...shapeProps} />;
							default:
								return null;
						}
					})}
					{textArray.map((eachTextItem) => (
						<Text
							key={eachTextItem.id}
							id={eachTextItem.id}
							x={eachTextItem.x}
							y={eachTextItem.y}
							text={eachTextItem.text}
							fontSize={eachTextItem.fontSize}
							fontFamily={eachTextItem.fontFamily}
							fill={eachTextItem.fill}
							scaleX={eachTextItem.scaleX || 1}
							scaleY={eachTextItem.scaleY || 1}
							rotation={eachTextItem.rotation || 0}
							draggable={
								activeTool === "Selection" && selectedId === eachTextItem.id
							}
							onMouseEnter={(e: any) => {
								if (activeTool === "Selection") {
									const stage = e.target.getStage();
									if (stage) {
										stage.container().style.cursor = "move";
									}
								}
							}}
							onMouseLeave={(e: any) => {
								const stage = e.target.getStage();
								if (stage) {
									stage.container().style.cursor = getCursor();
								}
							}}
							onClick={(e: any) => {
								if (activeTool === "Selection") {
									e.cancelBubble = true;
									setSelectedId(eachTextItem.id);
								}
							}}
							onTap={(e: any) => {
								if (activeTool === "Selection") {
									e.cancelBubble = true;
									setSelectedId(eachTextItem.id);
								}
							}}
							onDragStart={(e: any) => {
								e.cancelBubble = true;
							}}
							onDragMove={(e: any) => {
								e.cancelBubble = true;
							}}
							onDragEnd={(e: any) => {
								e.cancelBubble = true;
								const newTextArray = textArray.slice();
								const index = newTextArray.findIndex(
									(t) => t.id === eachTextItem.id
								);
								newTextArray[index] = {
									...newTextArray[index],
									x: e.target.x(),
									y: e.target.y(),
								};
								setTextArray(newTextArray);
							}}
							onTransformEnd={(e: any) => {
								const node = e.target;
								const newTextArray = textArray.slice();
								const index = newTextArray.findIndex(
									(t) => t.id === eachTextItem.id
								);
								newTextArray[index] = {
									...newTextArray[index],
									x: node.x(),
									y: node.y(),
									scaleX: node.scaleX(),
									scaleY: node.scaleY(),
									rotation: node.rotation(),
								};
								setTextArray(newTextArray);
							}}
						/>
					))}

					{previewShape && previewShape.type === "rect" && (
						<Rect {...previewShape} dash={[4, 4]} />
					)}
					{previewShape && previewShape.type === "line" && (
						<Line {...previewShape} dash={[4, 4]} />
					)}
					{previewShape && previewShape.type === "arrow" && (
						<Arrow {...previewShape} dash={[4, 4]} />
					)}
					{previewShape && previewShape.type === "ellipse" && (
						<Ellipse {...previewShape} dash={[4, 4]} />
					)}

					<Transformer ref={transformerRef} />
				</Layer>
			</Stage>
		</div>
	);
}

//todos
//p-1 image addition
