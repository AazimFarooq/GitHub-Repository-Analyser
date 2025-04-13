"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { RepositoryAnalysis } from "@/types/github"
import { treeToText } from "@/lib/tree-to-text"
import { toPng, toJpeg, toSvg } from "html-to-image"
import { ChevronDown, Download, Share, Copy, ImageIcon, FileJson } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type ExportOptionsProps = {
  data: RepositoryAnalysis
  repoUrl: string
}

export function ExportOptions({ data, repoUrl }: ExportOptionsProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareFormat, setShareFormat] = useState("link")
  const { toast } = useToast()

  // Generate repository name
  const repoName = repoUrl.split("/").pop() || "repository"

  // Handle image download
  const handleImageDownload = async (format: "png" | "jpeg" | "svg") => {
    const element = document.getElementById("tree-container")
    if (!element) return

    try {
      let dataUrl: string

      switch (format) {
        case "png":
          dataUrl = await toPng(element, { quality: 0.95 })
          break
        case "jpeg":
          dataUrl = await toJpeg(element, { quality: 0.95 })
          break
        case "svg":
          dataUrl = await toSvg(element)
          break
        default:
          dataUrl = await toPng(element, { quality: 0.95 })
      }

      // Create download link
      const link = document.createElement("a")
      link.download = `${repoName}-tree.${format}`
      link.href = dataUrl
      link.click()

      toast({
        title: "Download started",
        description: `Downloading ${repoName}-tree.${format}`,
      })
    } catch (error) {
      console.error(`Error generating ${format}:`, error)
      toast({
        title: "Download failed",
        description: `Could not generate ${format} image`,
        variant: "destructive",
      })
    }
  }

  // Handle text export
  const handleTextExport = () => {
    const textTree = treeToText(data.tree)
    navigator.clipboard
      .writeText(textTree)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "The folder structure has been copied as text",
        })
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err)
        toast({
          title: "Failed to copy",
          description: "Could not copy the folder structure to clipboard",
          variant: "destructive",
        })
      })
  }

  // Handle JSON export
  const handleJsonExport = () => {
    try {
      // Create a simplified version of the data for export
      const exportData = {
        name: repoName,
        structure: data.tree,
        stats: data.stats,
        fileTypes: data.fileTypes,
        languages: data.languages,
      }

      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.download = `${repoName}-analysis.json`
      link.href = url
      link.click()

      URL.revokeObjectURL(url)

      toast({
        title: "Download started",
        description: `Downloading ${repoName}-analysis.json`,
      })
    } catch (error) {
      console.error("Error generating JSON:", error)
      toast({
        title: "Export failed",
        description: "Could not generate JSON export",
        variant: "destructive",
      })
    }
  }

  // Generate shareable link
  const getShareableLink = () => {
    // In a real app, this would generate a unique link to this visualization
    // For demo purposes, we'll just return the original repo URL
    return repoUrl
  }

  // Generate embed code
  const getEmbedCode = () => {
    return `<iframe 
  src="${window.location.origin}/embed?repo=${encodeURIComponent(repoUrl)}" 
  width="100%" 
  height="500" 
  frameborder="0"
  title="GitHub Repository Visualization for ${repoName}"
></iframe>`
  }

  return (
    <>
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleImageDownload("png")}>
              <ImageIcon className="h-4 w-4 mr-2" />
              PNG Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleImageDownload("jpeg")}>
              <ImageIcon className="h-4 w-4 mr-2" />
              JPEG Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleImageDownload("svg")}>
              <ImageIcon className="h-4 w-4 mr-2" />
              SVG Vector
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleTextExport}>
              <Copy className="h-4 w-4 mr-2" />
              Text Format
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleJsonExport}>
              <FileJson className="h-4 w-4 mr-2" />
              JSON Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" onClick={() => setIsShareDialogOpen(true)} className="flex items-center gap-2">
          <Share className="h-4 w-4" />
          Share
        </Button>
      </div>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Repository Visualization</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="link" value={shareFormat} onValueChange={setShareFormat}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Link</TabsTrigger>
              <TabsTrigger value="embed">Embed</TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="mt-4">
              <div className="flex items-center space-x-2">
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={getShareableLink()}
                  readOnly
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(getShareableLink())
                    toast({
                      title: "Link copied",
                      description: "Shareable link copied to clipboard",
                    })
                  }}
                >
                  Copy
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="embed" className="mt-4">
              <div className="space-y-4">
                <div className="rounded-md bg-muted p-4">
                  <pre className="text-xs overflow-auto whitespace-pre-wrap">{getEmbedCode()}</pre>
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(getEmbedCode())
                    toast({
                      title: "Code copied",
                      description: "Embed code copied to clipboard",
                    })
                  }}
                >
                  Copy Embed Code
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
