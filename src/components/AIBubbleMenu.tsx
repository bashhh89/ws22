'use client'

import { useState, useRef, useEffect } from 'react'
import { BubbleMenu } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Sparkles, 
  Wand2, 
  FileText, 
  Edit3, 
  X, 
  Send,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code2,
  Superscript,
  Subscript,
  Highlighter,
  Link as LinkIcon
} from 'lucide-react'

interface AIBubbleMenuProps {
  editor: any
  onAIEdit: (instruction: string, selectedText: string) => Promise<void>
}

export default function AIBubbleMenu({ editor, onAIEdit }: AIBubbleMenuProps) {
  const [showAIInput, setShowAIInput] = useState(false)
  const [aiInstruction, setAiInstruction] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const getSelectedText = () => {
    if (!editor) return ''
    const { state } = editor
    const { from, to } = state.selection
    return state.doc.textBetween(from, to, ' ')
  }

  const handleAIAction = async (action: string) => {
    const selectedText = getSelectedText()
    if (!selectedText) return

    setIsProcessing(true)
    try {
      await onAIEdit(action, selectedText)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCustomAI = async () => {
    const selectedText = getSelectedText()
    if (!selectedText || !aiInstruction.trim()) return

    setIsProcessing(true)
    try {
      await onAIEdit(aiInstruction, selectedText)
      setAiInstruction('')
      setShowAIInput(false)
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    if (showAIInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showAIInput])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAIInput(false)
        setAiInstruction('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'top',
        interactive: true,
      }}
      shouldShow={({ state, from, to }) => {
        const { doc, selection } = state
        const { empty } = selection
        // Only show when text is selected and it's not empty
        return !empty && from >= 0 && to <= doc.content.size && to - from > 0
      }}
    >
      <Card className="bg-gray-800 border-gray-700 shadow-lg p-2 min-w-[200px]">
        <CardContent className="p-0">
          {/* AI Section */}
          <div className="mb-2 pb-2 border-b border-gray-700">
            <div className="text-xs text-gray-400 mb-2 font-medium">AI Actions</div>
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAIAction('Improve the writing quality and clarity')}
                disabled={isProcessing}
                className="h-8 px-2 text-xs"
                title="Improve writing"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Improve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAIAction('Make this more concise while keeping the meaning')}
                disabled={isProcessing}
                className="h-8 px-2 text-xs"
                title="Make concise"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Shorten
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAIAction('Summarize this text concisely')}
                disabled={isProcessing}
                className="h-8 px-2 text-xs"
                title="Summarize"
              >
                <FileText className="w-3 h-3 mr-1" />
                Summarize
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAIInput(!showAIInput)}
                disabled={isProcessing}
                className="h-8 px-2 text-xs"
                title="Custom AI instruction"
              >
                <Wand2 className="w-3 h-3 mr-1" />
                Custom
              </Button>
            </div>
          </div>

          {/* Custom AI Input */}
          {showAIInput && (
            <div className="mb-2 pb-2 border-b border-gray-700">
              <div className="flex gap-1">
                <Input
                  ref={inputRef}
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  placeholder="Enter AI instruction..."
                  className="bg-gray-700 border-gray-600 text-white text-xs h-7"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleCustomAI()
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleCustomAI}
                  disabled={!aiInstruction.trim() || isProcessing}
                  className="h-7 px-2"
                >
                  {isProcessing ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAIInput(false)
                    setAiInstruction('')
                  }}
                  className="h-7 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Formatting Section */}
          <div>
            <div className="text-xs text-gray-400 mb-2 font-medium">Formatting</div>
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`h-7 w-7 p-0 ${editor.isActive('bold') ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
                title="Bold"
              >
                <Bold className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`h-7 w-7 p-0 ${editor.isActive('italic') ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
                title="Italic"
              >
                <Italic className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`h-7 w-7 p-0 ${editor.isActive('underline') ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
                title="Underline"
              >
                <Underline className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`h-7 w-7 p-0 ${editor.isActive('strike') ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
                title="Strikethrough"
              >
                <Strikethrough className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`h-7 w-7 p-0 ${editor.isActive('code') ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
                title="Inline Code"
              >
                <Code2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                className={`h-7 w-7 p-0 ${editor.isActive('superscript') ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
                title="Superscript"
              >
                <Superscript className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                className={`h-7 w-7 p-0 ${editor.isActive('subscript') ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
                title="Subscript"
              >
                <Subscript className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={`h-7 w-7 p-0 ${editor.isActive('highlight') ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
                title="Highlight"
              >
                <Highlighter className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const url = prompt('Enter URL:')
                  if (url) editor.chain().focus().setLink({ href: url }).run()
                }}
                className={`h-7 w-7 p-0 ${editor.isActive('link') ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
                title="Insert Link"
              >
                <LinkIcon className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </BubbleMenu>
  )
}