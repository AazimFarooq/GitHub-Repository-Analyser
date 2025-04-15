"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Code, Copy, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const AICodeReview = () => {
  const [code, setCode] = useState("")
  const [review, setReview] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [language, setLanguage] = useState("javascript") // Default language
  const [feedbackWithLineNumbers, setFeedbackWithLineNumbers] = useState<string[]>([])

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setReview("Analyzing code...")
    setFeedbackWithLineNumbers([])

    // Simulate AI code review
    setTimeout(() => {
      const aiReview = generateAIReview(code)
      setReview(aiReview.review)
      setFeedbackWithLineNumbers(aiReview.feedbackWithLineNumbers)
      setIsAnalyzing(false)
    }, 2000)
  }

  const handleCopy = () => {
    navigator.clipboard
      .writeText(review)
      .then(() => {
        alert("AI review copied to clipboard!")
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err)
      })
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Code className="h-4 w-4 mr-2" />
          AI Code Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="language">Language:</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          placeholder="Enter code to review..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="min-h-[150px]"
        />
        <div className="flex justify-end">
          <Button onClick={handleAnalyze} disabled={isAnalyzing} className="relative">
            {isAnalyzing && <Loader2 className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
            <span className={cn(isAnalyzing && "opacity-0")}>Analyze Code</span>
          </Button>
        </div>
        {review && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">AI Review:</h3>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="whitespace-pre-wrap font-mono text-xs p-4 border rounded-md bg-muted">
              {feedbackWithLineNumbers.length > 0
                ? feedbackWithLineNumbers.map((feedback, index) => (
                    <div key={index}>
                      {feedback}
                      <br />
                    </div>
                  ))
                : review}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Simulated AI code review function
const generateAIReview = (code: string) => {
  // Simulate different types of feedback
  const feedbackTypes = ["style", "performance", "security", "readability", "bestPractices"]
  const numFeedback = Math.floor(Math.random() * 3) + 1 // 1-3 feedback items
  const lines = code.split("\n")
  const feedbackWithLineNumbers: string[] = []

  let review = ""
  for (let i = 0; i < numFeedback; i++) {
    const type = feedbackTypes[Math.floor(Math.random() * feedbackTypes.length)]
    const lineNumber = Math.floor(Math.random() * lines.length) + 1
    let feedback = ""

    switch (type) {
      case "style":
        feedback = `[Line ${lineNumber}] Consider adopting a more consistent naming convention for variables and functions.`
        break
      case "performance":
        feedback = `[Line ${lineNumber}] This code could be optimized by memoizing expensive calculations or using more efficient data structures.`
        break
      case "security":
        feedback = `[Line ${lineNumber}] Be cautious about potential cross-site scripting (XSS) vulnerabilities when handling user input.`
        break
      case "readability":
        feedback = `[Line ${lineNumber}] Adding more comments, especially for complex logic, would greatly improve code readability.`
        break
      case "bestPractices":
        feedback = `[Line ${lineNumber}] Consider using more modern JavaScript features or design patterns to simplify the code.`
        break
      default:
        feedback = `[Line ${lineNumber}] General code review comments.`
    }
    review += feedback + "\n"
    feedbackWithLineNumbers.push(feedback)
  }

  return {
    review: review || "No issues found. The code appears to be well-structured and follows good practices.",
    feedbackWithLineNumbers: feedbackWithLineNumbers,
  }
}

export { AICodeReview }
