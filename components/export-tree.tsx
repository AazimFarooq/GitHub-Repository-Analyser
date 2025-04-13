"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TreeNode } from "@/types/github"
import { Code, Copy, Download, FileJson, FileText, FileCode } from "lucide-react"
import { treeToText } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

type ExportTreeProps = {
  tree: TreeNode
}

export function ExportTree({ tree }: ExportTreeProps) {
  const [exportFormat, setExportFormat] = useState<"text" | "json" | "markdown">("text")
  const [jsonIndent, setJsonIndent] = useState("2")
  const { toast } = useToast()

  // Generate export content based on selected format
  const getExportContent = () => {
    switch (exportFormat) {
      case "text":
        return treeToText(tree)
      case "json":
        return JSON.stringify(tree, null, Number(jsonIndent))
      case "markdown":
        return treeToMarkdown(tree)
      default:
        return treeToText(tree)
    }
  }

  // Convert tree to markdown format
  const treeToMarkdown = (node: TreeNode, level = 0): string => {
    // Skip the root node's own representation but process its children
    if (level === 0) {
      let result = `# ${node.name}\n\n`
      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i]
          result += treeToMarkdown(child, level + 1)
        }
      }
      return result
    }

    // For non-root nodes
    const indent = "  ".repeat(level - 1)
    const prefix = `${indent}- `
    let result = ""

    if (node.type === "tree") {
      // Folder
      result += `${prefix}📁 **${node.name}**\n`
      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i]
          result += treeToMarkdown(child, level + 1)
        }
      }
    } else {
      // File
      result += `${prefix}📄 \`${node.name}\`\n`
    }

    return result
  }

  // Copy content to clipboard
  const handleCopy = () => {
    const content = getExportContent()
    navigator.clipboard
      .writeText(content)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: `The repository structure has been copied as ${exportFormat}`,
        })
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err)
        toast({
          title: "Failed to copy",
          description: "Could not copy the content to clipboard",
          variant: "destructive",
        })
      })
  }

  // Download content as file
  const handleDownload = () => {
    const content = getExportContent()
    const fileName = `${tree.name}-structure.${getFileExtension()}`
    const blob = new Blob([content], { type: `text/${getFileExtension()};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Download started",
      description: `Downloading ${fileName}`,
    })
  }

  // Get file extension based on export format
  const getFileExtension = () => {
    switch (exportFormat) {
      case "text":
        return "txt"
      case "json":
        return "json"
      case "markdown":
        return "md"
      default:
        return "txt"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <Code className="h-4 w-4 mr-2 text-primary" />
          Export Repository Structure
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Tabs defaultValue="text" value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="text" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>Text</span>
                </TabsTrigger>
                <TabsTrigger value="json" className="flex items-center gap-1">
                  <FileJson className="h-4 w-4" />
                  <span>JSON</span>
                </TabsTrigger>
                <TabsTrigger value="markdown" className="flex items-center gap-1">
                  <FileCode className="h-4 w-4" />
                  <span>Markdown</span>
                </TabsTrigger>
              </TabsList>

              {exportFormat === "json" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Indent:</span>
                  <Select value={jsonIndent} onValueChange={setJsonIndent}>
                    <SelectTrigger className="w-16 h-8">
                      <SelectValue placeholder="2" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <TabsContent value="text" className="mt-0">
              <div className="text-sm text-muted-foreground mb-2">
                Plain text representation of the repository structure in a tree format.
              </div>
            </TabsContent>
            <TabsContent value="json" className="mt-0">
              <div className="text-sm text-muted-foreground mb-2">
                JSON representation of the repository structure, useful for programmatic processing.
              </div>
            </TabsContent>
            <TabsContent value="markdown" className="mt-0">
              <div className="text-sm text-muted-foreground mb-2">
                Markdown representation of the repository structure, ideal for documentation.
              </div>
            </TabsContent>
          </Tabs>

          <Textarea value={getExportContent()} readOnly className="font-mono text-xs h-96 resize-none" />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </Button>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
