interface CanvasProps {
    activeTool:string
}

export default function CanvasComponent({activeTool}:CanvasProps){
    return(
        <div>
            <p className="text-amber-50 text-2xl">
                selectedTool right now is : {activeTool}
            </p>
        </div>
    )

}