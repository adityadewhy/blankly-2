"use client"
import { useState } from "react";

import Topbar from "@/components/topbar";
import CanvasComponent from "@/components/canvasComponent";

export default function Home() {

  const [activeTool, setActiveTool] = useState("Draw")
  return (
    <div>
      <Topbar activeTool={activeTool} setActiveTool={setActiveTool}/>
      <CanvasComponent activeTool={activeTool} />
    </div>
  );
}
