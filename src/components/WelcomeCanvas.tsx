'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  FileText, 
  Table, 
  Upload, 
  Bot, 
  Sparkles,
  ArrowRight,
  Plus,
  Wand2,
  Lightbulb,
  Star
} from 'lucide-react'

interface WelcomeCanvasProps {
  onCreateDocument: () => void
  onCreateSpreadsheet: () => void
  onUpload: () => void
  onOpenAI: () => void
}

export default function WelcomeCanvas({ 
  onCreateDocument, 
  onCreateSpreadsheet, 
  onUpload, 
  onOpenAI 
}: WelcomeCanvasProps) {
  const [welcomeText, setWelcomeText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [currentSuggestion, setCurrentSuggestion] = useState(0)
  
  const fullText = "Ready to create your first doc?"
  const suggestions = [
    "Write a blog post",
    "Create a report", 
    "Draft an email",
    "Brainstorm ideas",
    "Summarize text"
  ]

  useEffect(() => {
    // Typing animation for welcome text
    let currentText = ''
    let charIndex = 0
    
    const typeInterval = setInterval(() => {
      if (charIndex < fullText.length) {
        currentText = fullText.substring(0, charIndex + 1)
        setWelcomeText(currentText)
        charIndex++
      } else {
        clearInterval(typeInterval)
        setIsTyping(false)
      }
    }, 80)
    
    return () => clearInterval(typeInterval)
  }, [])

  useEffect(() => {
    // Rotate through suggestions
    if (!isTyping) {
      const suggestionInterval = setInterval(() => {
        setCurrentSuggestion((prev) => (prev + 1) % suggestions.length)
      }, 3000)
      
      return () => clearInterval(suggestionInterval)
    }
  }, [isTyping])

  const handlePromptClick = (prompt: string) => {
    // This would open the AI panel with the prompt pre-filled
    onOpenAI()
  }

  return (
    <div className="relative h-full flex items-center justify-center min-h-[600px]">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${4 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
              transform: `scale(${0.5 + Math.random() * 0.5})`
            }}
          />
        ))}
      </div>

      {/* Main welcome card */}
      <div className="relative z-10 max-w-4xl mx-auto p-8 w-full">
        <Card className="glass-effect-darker border-gray-800/50 rounded-3xl p-8 text-center backdrop-blur-xl">
          <CardContent className="space-y-8 p-0">
            {/* Icon with animated glow */}
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl mx-auto mb-6 flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Welcome text with typing animation */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                {welcomeText}
                {isTyping && (
                  <span className="inline-block w-2 h-8 bg-gradient-to-b from-blue-400 to-purple-500 ml-2 animate-pulse align-middle" />
                )}
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Your AI-powered workspace for creating, editing, and collaborating on documents with intelligent assistance
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <QuickActionButton
                icon={FileText}
                label="New Document"
                description="Start writing"
                onClick={onCreateDocument}
                color="from-blue-500 to-blue-600"
              />
              <QuickActionButton
                icon={Table}
                label="New Spreadsheet"
                description="Organize data"
                onClick={onCreateSpreadsheet}
                color="from-green-500 to-green-600"
              />
              <QuickActionButton
                icon={Upload}
                label="Import Template"
                description="Use a template"
                onClick={onUpload}
                color="from-purple-500 to-purple-600"
              />
              <QuickActionButton
                icon={Wand2}
                label="AI Scaffold"
                description="AI-powered start"
                onClick={onOpenAI}
                color="from-orange-500 to-orange-600"
              />
            </div>

            {/* Inspirational prompts */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span>Try asking me to:</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    className={`px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-full text-sm text-gray-300 hover:text-white transition-all duration-200 hover:scale-105 border border-gray-700/50 hover:border-gray-600/50 ${
                      index === currentSuggestion ? 'ring-2 ring-blue-500/50 bg-gray-700/50' : ''
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Pro tips */}
            <div className="bg-gray-800/30 rounded-2xl p-4 border border-gray-700/50">
              <div className="flex items-start gap-3 text-left">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-white">Pro Tips</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Press <kbd className="px-2 py-1 bg-gray-700/50 rounded text-xs">/</kbd> anywhere to access commands</li>
                    <li>• Select text to see AI suggestions and actions</li>
                    <li>• Use <kbd className="px-2 py-1 bg-gray-700/50 rounded text-xs">⌘+K</kbd> for quick commands</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface QuickActionButtonProps {
  icon: any
  label: string
  description: string
  onClick: () => void
  color: string
}

function QuickActionButton({ icon: Icon, label, description, onClick, color }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
    >
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      
      {/* Icon container */}
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      
      {/* Text content */}
      <div className="relative z-10">
        <h3 className="font-semibold text-white mb-1">{label}</h3>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      
      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    </button>
  )
}