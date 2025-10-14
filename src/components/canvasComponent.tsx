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
			// Corresponds to "Minus" icon
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
					type: "rect", // Add a type property!
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

				// Use original x/y from the previewShape
				const startX = previewShape.startX ?? previewShape.x;
				const startY = previewShape.startY ?? previewShape.y;

				setPreviewShape({
					...previewShape,
					x: Math.min(startX, pointer.x),
					y: Math.min(startY, pointer.y),
					width: Math.abs(pointer.x - startX),
					height: Math.abs(pointer.y - startY),
					// Store the original start position if it doesn't exist
					startX: startX,
					startY: startY,
				});
			},
			onMouseUp: (e: any) => {
				if (!previewShape) return;
				// Remove the temporary startX/startY properties
				const {startX, startY, ...finalShape} = previewShape;
				setShapes((prev) => [
					...prev,
					{...finalShape, id: Date.now().toString(), draggable: false},
				]);
				setPreviewShape(null);
			},
		},

		Draw: {
			// Corresponds to "Pen" icon
			onMouseDown: (e: any) => {
				const stage = e.target.getStage();
				const pointer = stage.getRelativePointerPosition();
				if (!pointer) return;

				setPreviewShape({
					type: "line", // Freehand drawing is just a line with many points
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

		// ... image, eraser
	};

	const handleMouseDown = (e: any) => {
		const clickedOnEmpty = e.target === e.target.getStage();
		if (clickedOnEmpty) {
			if (activeTool === "Selection") {
				setSelectedId(null); // Deselect
			}
		}

		// 2. Pass to drawing tool handlers if a drawing tool is active
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
		inputPosition;
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

	// 4. Handles 'Enter' key to submit text
	const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault(); // Prevent new line on simple Enter
			finishTextEditing();
		}
	};

	// 5. Handles clicking away from the input to submit text
	const handleTextBlur = () => {
		finishTextEditing();
	};

	// 6. Replaces the old text click handler. This now only shows and positions the input.
	const handleStageClickForText = (e: any) => {
		// Only trigger on clicks to the stage itself, not existing shapes
		if (e.target !== e.target.getStage()) {
			return;
		}
		const stage = e.target.getStage();
		const pointer = stage.getRelativePointerPosition();
		if (!pointer) return;

		setInputPosition({x: pointer.x, y: pointer.y, visible: true});
		console.log("input pos", inputPosition);
	};

	// 7. useEffect to focus the input when it becomes visible
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
			// Find the node by its ID
			const selectedNode = stage?.findOne("#" + selectedId); // Konva uses '#' for ID selector

			if (selectedNode) {
				transformer.nodes([selectedNode]);
			} else {
				transformer.nodes([]);
			}
		} else {
			transformer.nodes([]);
		}

		transformer.getLayer()?.batchDraw();
	}, [selectedId]); // Re-run this effect whenever selectedId changes

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
					top: `${inputPosition.y + (stageRef.current?.y() ?? 0)}px`,
					left: `${inputPosition.x + (stageRef.current?.x() ?? 0)}px`,
					zIndex: 10,
					fontSize: `${textFontSize}px`,
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
					lineHeight: `${textFontSize}px`,
					resize:"none"

				}}
			/>
			<Stage
				ref={stageRef}
				width={window.innerWidth}
				height={window.innerHeight}
				onMouseDown={
					activeTool === "Text" ? handleStageClickForText : handleMouseDown
				}
				onClick={activeTool === "Text" ? handleStageClickForText : undefined}
				onTap={activeTool === "Text" ? handleStageClickForText : undefined}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				draggable={activeTool === "Hand or panning tool"}
			>
				<Layer>
					{shapes.map((shape) => {
						const shapeProps = {
							...shape,
							key: shape.id,
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
									stage.container().style.cursor = "default";
								}
							},
							onClick: (e: any) => {
								if (activeTool === "Selection") {
									setSelectedId(shape.id);
								}
							},
							onTap: (e: any) => {
								// For mobile
								if (activeTool === "Selection") {
									setSelectedId(shape.id);
								}
							},

							draggable: activeTool === "Selection" && selectedId === shape.id,
							onDragEnd: (e: any) => {
								// IMPORTANT: Update state on drag/transform
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
								// IMPORTANT: Update state on transform
								const node = e.target;
								const newShapes = shapes.slice();
								const index = newShapes.findIndex((s) => s.id === shape.id);
								newShapes[index] = {
									...newShapes[index],
									x: node.x(),
									y: node.y(),
									width: node.width() * node.scaleX(),
									height: node.height() * node.scaleY(),
									rotation: node.rotation(),
								};
								setShapes(newShapes);
								node.scaleX(1); // Reset scale after transform
								node.scaleY(1);
							},
						};

						switch (shape.type) {
							case "rect":
								return <Rect {...shapeProps} />;
							case "ellipse":
								return <Ellipse {...shapeProps} />;
							case "line":
								return (
									<Line
										{...shapeProps}
										tension={0}
										lineCap="round"
										lineJoin="round"
									/>
								);
							case "arrow":
								return <Arrow {...shapeProps} />;
							default:
								return null;
						}
					})}
					{textArray.map((eachTextItem) => (
						<Text
							key={eachTextItem.id}
							x={eachTextItem.x}
							y={eachTextItem.y}
							text={eachTextItem.text}
							fontSize={eachTextItem.fontSize}
							fontFamily={eachTextItem.fontFamily}
							fill={eachTextItem.fill}
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
// p-2 being able to drag a shape which is in front of another shape(partally) when it is being tansformed. right now drag only works from the border. 
// also when selection is activeTool then i should be able to selected multiple shapes, just double click and make a rect with selection tool and select all shapes within that rect and transform that whole group at once.
// onDragEnd and onDragMove events warnings....
// konva dragDistance -> drag gets enabled  only when pointer moves by x amount
// handle on dragEnd and onDragMove
// dynamic sizing works for now
//try transform - transform does nothing just shows resize handles
// we can use Touch events: touchstart, touchmove, touchend, tap, dbltap. for mobile support
