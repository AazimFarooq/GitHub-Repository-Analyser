"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

type RepoFormProps = {
  onSubmit: (url: string) => void
  isLoading: boolean
}

export function RepoForm({ onSubmit, isLoading }: RepoFormProps) {
  const [url, setUrl] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onSubmit(url.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <motion.div
          className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-75 blur-sm"
          animate={{
            opacity: isFocused ? 0.75 : 0,
          }}
          transition={{ duration: 0.3 }}
        />

        <div className="relative flex flex-col sm:flex-row gap-2 p-1 bg-background rounded-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter GitHub repository URL (e.g., https://github.com/vercel/next.js)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="pl-9 h-12 bg-muted/50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="h-12 px-6 gap-2 transition-all duration-300"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Visualize</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => setUrl("https://github.com/vercel/next.js")}
        >
          next.js
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => setUrl("https://github.com/facebook/react")}
        >
          react
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => setUrl("https://github.com/tailwindlabs/tailwindcss")}
        >
          tailwindcss
        </Button>
      </div>
    </form>
  )
}
