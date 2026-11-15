import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { InkProvider } from "@/lib/ink/react"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import App from "./App"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InkProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
      <Toaster />
    </InkProvider>
  </StrictMode>,
)
