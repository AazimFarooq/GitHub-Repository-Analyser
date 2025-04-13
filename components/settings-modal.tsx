"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useTheme } from "next-themes"
import { Moon, Sun, Monitor } from "lucide-react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: {
    expandLevel: number
    showFileIcons: boolean
    showFileSize: boolean
    theme: string
    codeHighlightTheme: string
  }
  onSettingsChange: (settings: any) => void
}

export function SettingsModal({ isOpen, onClose, settings, onSettingsChange }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState(settings)
  const { theme, setTheme } = useTheme()

  // Sync theme with settings
  useEffect(() => {
    if (theme && localSettings.theme !== theme) {
      setLocalSettings((prev) => ({ ...prev, theme: theme }))
    }
  }, [theme])

  // Update theme when settings change
  useEffect(() => {
    if (settings.theme !== localSettings.theme) {
      setLocalSettings((prev) => ({ ...prev, theme: settings.theme }))
    }
  }, [settings.theme])

  const handleChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-background border-border">
        <DialogHeader>
          <DialogTitle>Visualization Settings</DialogTitle>
          <DialogDescription>
            Customize how the repository visualization is displayed and interacted with.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="expandLevel" className="col-span-2">
              Default Expand Level
            </Label>
            <div className="col-span-2 flex items-center gap-2">
              <Slider
                id="expandLevel"
                min={1}
                max={5}
                step={1}
                value={[localSettings.expandLevel]}
                onValueChange={(value) => handleChange("expandLevel", value[0])}
                className="w-full"
              />
              <span className="w-8 text-center">{localSettings.expandLevel}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="showFileIcons" className="col-span-2">
              Show File Icons
            </Label>
            <div className="col-span-2 flex justify-end">
              <Switch
                id="showFileIcons"
                checked={localSettings.showFileIcons}
                onCheckedChange={(checked) => handleChange("showFileIcons", checked)}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="showFileSize" className="col-span-2">
              Show File Size
            </Label>
            <div className="col-span-2 flex justify-end">
              <Switch
                id="showFileSize"
                checked={localSettings.showFileSize}
                onCheckedChange={(checked) => handleChange("showFileSize", checked)}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="theme" className="col-span-2">
              UI Theme
            </Label>
            <div className="col-span-2 flex gap-2">
              <Button
                variant={localSettings.theme === "light" ? "default" : "outline"}
                size="sm"
                className="w-10 h-10 p-0 rounded-full"
                onClick={() => handleChange("theme", "light")}
                aria-label="Light theme"
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant={localSettings.theme === "dark" ? "default" : "outline"}
                size="sm"
                className="w-10 h-10 p-0 rounded-full"
                onClick={() => handleChange("theme", "dark")}
                aria-label="Dark theme"
              >
                <Moon className="h-4 w-4" />
              </Button>
              <Button
                variant={localSettings.theme === "system" ? "default" : "outline"}
                size="sm"
                className="w-10 h-10 p-0 rounded-full"
                onClick={() => handleChange("theme", "system")}
                aria-label="System theme"
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="codeHighlightTheme" className="col-span-2">
              Code Highlight Theme
            </Label>
            <Select
              value={localSettings.codeHighlightTheme}
              onValueChange={(value) => handleChange("codeHighlightTheme", value)}
              id="codeHighlightTheme"
              className="col-span-2"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="github">GitHub</SelectItem>
                <SelectItem value="monokai">Monokai</SelectItem>
                <SelectItem value="dracula">Dracula</SelectItem>
                <SelectItem value="solarized">Solarized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Apply</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
