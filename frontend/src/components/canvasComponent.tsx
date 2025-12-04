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
import {saveCanvasState, loadCanvasState} from "@/utils/canvasStorage";
import {io} from "socket.io-client";
import {useSearchParams} from "next/navigation";

interface UploadedImage {
	id: string;
	src: string;
	name: string;
}

interface canvasComponentProps {
	activeTool: string;
	images: UploadedImage[];
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

export default function CanvasComponent({
	activeTool,
	images,
}: canvasComponentProps) {
	const [shapes, setShapes] = useState<any[]>([]);
	const [previewShape, setPreviewShape] = useState<any | null>(null);
	const [inputText, setInputText] = useState<string>("");
	const [textArray, setTextArray] = useState<TextObject[]>([]);
	const [inputPosition, setInputPosition] = useState({
		x: 0,
		y: 0,
		visible: false,
	});
	const [konvaImages, setKonvaImages] = useState<any[]>([]);

	const textInputRef = useRef<HTMLTextAreaElement>(null);
	const stageRef = useRef<Konva.Stage | null>(null);

	const [selectedId, setSelectedId] = useState<string | null>(null);
	const transformerRef = useRef<Konva.Transformer>(null);

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

	const searchParams = useSearchParams();
	const roomId = searchParams.get("room");
	const socketRef = useRef<any>(null);

	useEffect(() => {
		if (!roomId) {
			return;
		}

		socketRef.current = io("http://localhost:3001");
		socketRef.current.emit("join_room", roomId);

		socketRef.current.on("draw", (data: any) => {
			setShapes((prev) => [...prev, data.shape]);
		});

		return () => {
			socketRef.current.disconnect();
		};
	}, [roomId]);

	const emitShape = (shape: any) => {
		if (socketRef.current && roomId) {
			socketRef.current.emit("draw", {roomId, shape});
		}
	};

	const eraseItem = (itemid: string) => {
		setShapes((prev) => {
			return prev.filter((shape) => {
				return shape.id !== itemid;
			});
		});

		setTextArray((prev) => {
			return prev.filter((text) => {
				return text.id !== itemid;
			});
		});

		setKonvaImages((prev) => {
			return prev.filter((img) => {
				return img.id !== itemid;
			});
		});

		if (selectedId === itemid) {
			setSelectedId(null);
		}
	};

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

				const finalShape = {
					...previewShape,
					id: Date.now().toString(),
					draggable: false,
				};
				setShapes((prev) => [...prev, finalShape]);
				emitShape(finalShape);

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

				const finalShape = {
					...previewShape,
					id: Date.now().toString(),
					draggable: false,
				};
				setShapes((prev) => [...prev, finalShape]);
				emitShape(finalShape);
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
				const {startX, startY, ...finalShapeData} = previewShape;
				const finalShape = {
					...finalShapeData,
					id: Date.now().toString(),
					draggable: false,
				};
				setShapes((prev) => [...prev, finalShape]);
				emitShape(finalShape);
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
				const finalShape = {
					...previewShape,
					id: Date.now().toString(),
					draggable: false,
				};
				setShapes((prev) => [...prev, finalShape]);
				emitShape(finalShape);
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
				const {startX, startY, ...finalShapeData} = previewShape;
				const finalShape = {
					...finalShapeData,
					id: Date.now().toString(),
					draggable: false,
				};
				setShapes((prev) => [
					...prev,
					finalShape,
				]);
				emitShape(finalShape)
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
		if (activeTool === "Eraser") {
			return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21'/%3E%3Cpath d='M22 21H7'/%3E%3Cpath d='m5 11 9 9'/%3E%3C/svg%3E") 0 24, auto`;
		}

		return "default";
	};

	useEffect(() => {
		const stage = stageRef.current;
		if (!stage) {
			return;
		}
		stage.container().style.cursor = getCursor();
	}, [activeTool]);

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

	const textInputPos = getTransformedPosition(inputPosition.x, inputPosition.y);

	useEffect(() => {
		if (!images || images.length === 0) {
			return;
		}

		const stage = stageRef.current;
		if (!stage) {
			return;
		}
		const stageWidth = stage.width();
		const stageHeight = stage.height();

		const newImages = images.map((eachImage) => {
			const eachImageObj = new window.Image(); // kind of just creates a dom image element
			eachImageObj.src = eachImage.src;

			return new Promise((resolve) => {
				eachImageObj.onload = () => {
					const aspect = eachImageObj.width / eachImageObj.height;
					let displayWidth = eachImageObj.width;
					let displayHeight = eachImageObj.height;

					const maxWidth = stageWidth * 0.5;
					const maxHeight = stageHeight * 0.5;

					if (displayWidth > maxWidth) {
						displayWidth = maxWidth;
						displayHeight = maxWidth / aspect;
					}
					if (displayHeight > maxHeight) {
						displayHeight = maxHeight;
						displayWidth = maxHeight * aspect;
					}

					resolve({
						id: eachImage.id,
						name: eachImage.name,
						image: eachImageObj,
						x: stageWidth / 2 - displayWidth / 2,
						y: stageHeight / 2 - displayHeight / 2,
						width: displayWidth,
						height: displayHeight,
						draggable: true,
						type: "image",
					});
				};
			});
		});

		Promise.all(newImages).then((loadedImage) => {
			setKonvaImages((prev) => [...prev, ...loadedImage]);
		});
	}, [images]);

	useEffect(() => {
		const loadState = async () => {
			const savedState = await loadCanvasState();
			if (savedState) {
				setShapes(savedState.shapes || []);
				setTextArray(savedState.textArray || []);

				if (savedState.konvaImages) {
					const imagePromises = savedState.konvaImages.map((imgData) => {
						return new Promise((resolve) => {
							const imgEl = new window.Image();
							imgEl.src = imgData.src;
							imgEl.onload = () => {
								resolve({
									...imgData,
									image: imgEl, // Add the live element back
								});
							};
							// Handle cases where the image link might be broken
							imgEl.onerror = () => {
								console.error("Failed to load image:", imgData.src);
								resolve(null);
							};
						});
					});

					// Wait for all images to load and filter out any broken ones
					const loadedImages = (await Promise.all(imagePromises)).filter(
						Boolean
					);
					setKonvaImages(loadedImages as any[]);
				}
			}
		};
		loadState();
	}, []);

	useEffect(() => {
		const saveState = async () => {
			// NEW: Convert images to a serializable format
			const serializableImages = konvaImages.map((img) => ({
				id: img.id,
				name: img.name,
				src: img.image.src, // <-- Save the src string
				x: img.x,
				y: img.y,
				width: img.width,
				height: img.height,
				rotation: img.rotation, // <-- Make sure to save rotation
			}));

			await saveCanvasState({
				shapes,
				textArray,
				konvaImages: serializableImages, // <-- Pass the serializable array
				timestamp: Date.now(),
			});
		};

		// Debounce to avoid saving too frequently
		const timeoutId = setTimeout(saveState, 1000);
		return () => clearTimeout(timeoutId);
	}, [shapes, textArray, konvaImages]);

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
								} else if (activeTool === "Eraser") {
									const stage = e.target.getStage();
									if (stage) {
										stage.container().style.cursor = "pointer";
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
								} else if (activeTool === "Eraser") {
									e.cancelBubble = true;
									eraseItem(shape.id);
								}
							},
							onTap: (e: any) => {
								if (activeTool === "Selection") {
									e.cancelBubble = true;
									setSelectedId(shape.id);
								} else if (activeTool === "Eraser") {
									e.cancelBubble = true;
									eraseItem(shape.id);
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
								} else if (activeTool === "Eraser") {
									const stage = e.target.getStage();
									if (stage) {
										stage.container().style.cursor = "pointer";
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
								} else if (activeTool === "Eraser") {
									e.cancelBubble = true;
									eraseItem(eachTextItem.id);
								}
							}}
							onTap={(e: any) => {
								if (activeTool === "Selection") {
									e.cancelBubble = true;
									setSelectedId(eachTextItem.id);
								} else if (activeTool === "Eraser") {
									e.cancelBubble = true;
									eraseItem(eachTextItem.id);
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
					{konvaImages.map((eachImageObj) => (
						<Image
							key={eachImageObj.id}
							id={eachImageObj.id}
							image={eachImageObj.image}
							x={eachImageObj.x}
							y={eachImageObj.y}
							width={eachImageObj.width}
							height={eachImageObj.height}
							draggable={activeTool === "Selection"}
							onMouseEnter={(e) => {
								if (activeTool === "Selection") {
									const stage = e.target.getStage();
									if (stage) {
										stage.container().style.cursor = "move";
									}
								} else if (activeTool === "Eraser") {
									const stage = e.target.getStage();
									if (stage) {
										stage.container().style.cursor = "pointer";
									}
								}
							}}
							onMouseLeave={(e) => {
								const stage = e.target.getStage();
								if (stage) {
									stage.container().style.cursor = getCursor();
								}
							}}
							onClick={(e) => {
								if (activeTool === "Selection") {
									e.cancelBubble = true;
									setSelectedId(eachImageObj.id);
								} else if (activeTool === "Eraser") {
									e.cancelBubble = true;
									eraseItem(eachImageObj.id);
								}
							}}
							onTap={(e) => {
								if (activeTool === "Selection") {
									e.cancelBubble = true;
									setSelectedId(eachImageObj.id);
								} else if (activeTool === "Eraser") {
									e.cancelBubble = true;
									eraseItem(eachImageObj.id);
								}
							}}
							onTransformEnd={(e) => {
								const node = e.target;
								const scaleX = node.scaleX();
								const scaleY = node.scaleY();

								setKonvaImages((prev) =>
									prev.map((each) =>
										each.id === eachImageObj.id
											? {
													...each,
													x: node.x(),
													y: node.y(),
													width: node.width() * scaleX,
													height: node.height() * scaleY,
													rotation: node.rotation(),
											  }
											: each
									)
								);
								node.scaleX(1);
								node.scaleY(1);
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
