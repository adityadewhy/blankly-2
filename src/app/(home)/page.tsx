"use client"
import { useState } from "react";

import dynamic from "next/dynamic";
import Topbar from "@/components/topbar";

// Dynamically import CanvasComponent, disable SSR
const CanvasComponent = dynamic(() => import("@/components/canvasComponent"), {
  ssr: false,
});
export default function Home() {

  const [activeTool, setActiveTool] = useState("Draw")
  return (
    <div>
      <Topbar activeTool={activeTool} setActiveTool={setActiveTool}/>
      <CanvasComponent activeTool={activeTool} />
    </div>
  );
}
