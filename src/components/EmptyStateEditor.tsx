'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  FileText, 
  Sparkles, 
  Wand2, 
  Plus,
  Type,
  List,
  Image as ImageIcon,
  Table as TableIcon,
  Code,
  Quote,
  ArrowRight,
  Lightbulb,
  Command
} from 'lucide-react'

interface EmptyStateEditorProps {
  onStartTyping: () => void
  onInsertElement: (type: string) => void
  onOpenAI: () => void
}

export default function EmptyStateEditor({ 
  onStartTyping, 
  onInsertElement, 
  onOpenAI 
}: EmptyStateEditorProps) {
  const [showCommands, setShowCommands] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const quickActions = [
    { id: 'text', label: 'Start Writing', icon: Type, description: 'Begin with text' },
    { id: 'heading', label: 'Add Heading', icon: Type, description: 'Title or section' },
    { id: 'list', label: 'Create List', icon: List, description: 'Bullet points' },
    { id: 'image', label: 'Insert Image', icon: ImageIcon, description: 'Add visual' },
    { id: 'table', label: 'Add Table', icon: TableIcon, description: 'Organize data' },
    { id: 'code', label: 'Code Block', icon: Code, description: 'Add code' },
    { id: 'quote', label: 'Add Quote', icon: Quote, description: 'Highlight text' },
    { id: 'ai', label: 'AI Help', icon: Wand2, description: 'Get assistance' }
  ]

  const handleMouseMove = (e: React.MouseEvent) => {
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect()
      setCursorPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleClick = () => {
    onStartTyping()
  }

  return (
    <div className="relative h-full min-h-[500px]">
      {/* Floating action menu that follows cursor */}
      {isHovering && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            left: cursorPosition.x + 20,
            top: cursorPosition.y - 20,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-1 flex gap-1 opacity-90">
            <button
              onClick={() => onInsertElement('text')}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Insert text"
            >
              <Plus className="w-4 h-4 text-gray-300" />
            </button>
            <button
              onClick={() => onInsertElement('ai')}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="AI assist"
            >
              <Wand2 className="w-4 h-4 text-blue-400" />
            </button>
            <button
              onClick={() => setShowCommands(!showCommands)}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Commands"
            >
              <Command className="w-4 h-4 text-green-400" />
            </button>
          </div>
        </div>
      )}

      {/* Main empty state content */}
      <div 
        ref={editorRef}
        className="h-full flex items-center justify-center p-8 cursor-text"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleClick}
      >
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Central illustration */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border border-gray-700/50">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            
            {/* Animated sparkles */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                style={{
                  left: `${50 + Math.cos((i * 60) * Math.PI / 180) * 60}%`,
                  top: `${50 + Math.sin((i * 60) * Math.PI / 180) * 60}%`,
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.6
                }}
              />
            ))}
          </div>

          {/* Welcome message */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white">
              Start creating something amazing
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed">
              Click anywhere to begin typing, or choose from the quick actions below
            </p>
          </div>

          {/* Quick action grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.slice(0, 4).map((action) => (
              <QuickActionCard
                key={action.id}
                action={action}
                onClick={() => onInsertElement(action.id)}
              />
            ))}
          </div>

          {/* Command hint */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700/50">
              <Command className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Type</span>
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs text-white">/</kbd>
              <span className="text-sm text-gray-400">for commands</span>
            </div>
          </div>

          {/* AI suggestion */}
          <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-700/30 p-4">
            <CardContent className="p-0">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-white mb-1">AI Assistant Ready</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    I can help you write, edit, and improve your content. Just start typing or ask me anything!
                  </p>
                  <Button
                    onClick={onOpenAI}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Try AI Features
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Command palette overlay */}
      {showCommands && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Card className="w-96 bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        onInsertElement(action.id)
                        setShowCommands(false)
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg transition-colors text-left"
                    >
                      <action.icon className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium text-white">{action.label}</div>
                        <div className="text-sm text-gray-400">{action.description}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

interface QuickActionCardProps {
  action: {
    id: string
    label: string
    icon: any
    description: string
  }
  onClick: () => void
}

function QuickActionCard({ action, onClick }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:scale-105"
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Icon */}
      <div className="w-12 h-12 bg-gray-700/50 group-hover:bg-gray-600/50 rounded-xl flex items-center justify-center mb-3 transition-all duration-300">
        <action.icon className="w-6 h-6 text-gray-400 group-hover:text-white" />
      </div>
      
      {/* Text */}
      <div className="relative z-10">
        <h3 className="font-semibold text-white mb-1">{action.label}</h3>
        <p className="text-xs text-gray-400">{action.description}</p>
      </div>
    </button>
  )
}