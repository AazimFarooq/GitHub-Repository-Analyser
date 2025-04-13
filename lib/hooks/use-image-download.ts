"use client"

import { useToast } from "@/components/ui/use-toast"
import { toPng } from "html-to-image"
import type { RefObject } from "react"

export function useImageDownload(containerRef: RefObject<HTMLElement>) {
  const { toast } = useToast()

  const downloadAsImage = async (filename: string) => {
    if (!containerRef.current) return

    toast({
      title: "Preparing download...",
      description: "Creating image of your visualization",
    })

    try {
      const dataUrl = await toPng(containerRef.current, {
        quality: 0.95,
        backgroundColor: document.documentElement.classList.contains("dark") ? "#020817" : "#ffffff",
      })

      // Create download link
      const link = document.createElement("a")
      link.download = `${filename}-visualization.png`
      link.href = dataUrl
      link.click()

      toast({
        title: "Download complete!",
        description: "Your visualization has been saved as an image",
      })
    } catch (error) {
      console.error("Error generating image:", error)
      toast({
        title: "Download failed",
        description: "There was an error creating the image",
        variant: "destructive",
      })
    }
  }

  return { downloadAsImage }
}
