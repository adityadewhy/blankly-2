import {Layer, Stage, Text, Rect, Circle} from "react-konva";

interface CanvasProps {
	activeTool: string;
}

export default function CanvasComponent({activeTool}: CanvasProps) {
	return (
        <div className="border-white border-4 w-max">
            <Stage width={400} height={800} >
			<Layer>
				<Text
					text="inside the layer which is inside a stage of 800x800 x20 y20"
					x={2}
					y={4}
                    stroke="white"
                    draggable
				/>
				<Rect
					x={100}
					y={100}
					width={200}
					height={100}
					fill="skyblue"
					stroke="white"
					strokeWidth={2}
					draggable
				/>
				<Circle x={200} y={400} radius={200} fill="pink" draggable />
				<Text
					text={`the active tool right now is as per props passed from page,tsx ${activeTool}`}
					x={20}
					y={60}
					fontSize={18}
					stroke=""
                    fill="white"
                    strokeWidth={0.5}
                    draggable
                    
				/>
			</Layer>
		</Stage>


        </div>
		
	);
}
