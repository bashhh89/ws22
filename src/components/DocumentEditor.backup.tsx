'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link,
  Image,
  Table,
  Save,
  Plus,
  Sparkles,
  Wand2,
  Edit3,
  CheckCircle,
  AlertCircle,
  Loader2,
  History,
  Users,
  Eye,
  FileText,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { anythingLLMService } from '@/lib/anythingllm'

interface DocumentEditorProps {
  content: string
  onChange: (content: string) => void
  onSave?: () => void
  onAIEdit?: (instruction: string, selectedText: string) => Promise<string>
  workspaceSlug?: string
  documentId?: string
  className?: string
  setMessages?: (messages: any[]) => void
}

interface DocumentVersion {
  id: string
  content: string
  timestamp: Date
  author: string
  changeDescription: string
  wordCount: number
  characterCount: number
  changeType: 'created' | 'edited' | 'formatted' | 'auto-saved'
}

interface AIEditSuggestion {
  type: 'improve' | 'shorten' | 'expand' | 'rephrase' | 'grammar' | 'custom'
  title: string
  description: string
  icon: any
}

export default function DocumentEditor({ 
  content, 
  onChange, 
  onSave, 
  onAIEdit,
  workspaceSlug,
  documentId,
  setMessages,
  className 
}: DocumentEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('Untitled Document')
  const [isAIEditing, setIsAIEditing] = useState(false)
  const [aiEditInstruction, setAiEditInstruction] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [showAIEditDialog, setShowAIEditDialog] = useState(false)
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [isCollaborating, setIsCollaborating] = useState(false)
  const [collaborators, setCollaborators] = useState<string[]>([])
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout>()
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  
  const editorRef = useRef<HTMLDivElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()

  const aiEditSuggestions: AIEditSuggestion[] = [
    {
      type: 'improve',
      title: 'Improve Writing',
      description: 'Enhance clarity, flow, and style',
      icon: Sparkles
    },
    {
      type: 'shorten',
      title: 'Make Concise',
      description: 'Reduce length while keeping meaning',
      icon: Edit3
    },
    {
      type: 'expand',
      title: 'Expand Ideas',
      description: 'Add more detail and depth',
      icon: FileText
    },
    {
      type: 'rephrase',
      title: 'Rephrase',
      description: 'Say it differently',
      icon: Wand2
    },
    {
      type: 'grammar',
      title: 'Fix Grammar',
      description: 'Correct grammar and spelling',
      icon: CheckCircle
    },
    {
      type: 'custom',
      title: 'Custom Edit',
      description: 'Give specific instructions',
      icon: Edit3
    }
  ]

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    setAutoSaveStatus('unsaved')
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveVersion('auto-saved', 'Auto-saved changes')
      setAutoSaveStatus('saved')
    }, 3000) // Auto-save after 3 seconds of inactivity

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [content])

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content
    }
  }, [content])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
      
      // Handle typing detection
      setIsTyping(true)
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
      
      const timeout = setTimeout(() => {
        setIsTyping(false)
        generateAISuggestions()
      }, 2000) // Wait 2 seconds after typing stops
      
      setTypingTimeout(timeout)
    }
  }

  const generateAISuggestions = async () => {
    if (!workspaceSlug || !documentId || !content.trim()) return
    
    try {
      // Get AI suggestions based on current content
      const plainText = content.replace(/<[^>]*>/g, '').substring(0, 500)
      const prompt = `Based on this text, suggest 3 possible ways to continue or improve it:\n\n${plainText}\n\nProvide only the suggestions, one per line, without numbering.`
      
      const response = await anythingLLMService.chatWithWorkspace(workspaceSlug, prompt)
      const suggestions = response.textResponse
        ?.split('\n')
        .filter(s => s.trim())
        .slice(0, 3) || []
      
      setAiSuggestions(suggestions)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error)
    }
  }

  const applySuggestion = (suggestion: string) => {
    if (editorRef.current) {
      const selection = window.getSelection()
      if (selection) {
        const range = document.createRange()
        range.selectNodeContents(editorRef.current)
        range.collapse(false) // Move to end
        
        selection.removeAllRanges()
        selection.addRange(range)
        
        // Insert the suggestion
        document.execCommand('insertText', false, ' ' + suggestion)
        handleInput()
        setShowSuggestions(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Show suggestions on Ctrl+Space
    if (e.ctrlKey && e.key === ' ') {
      e.preventDefault()
      generateAISuggestions()
    }
    
    // Hide suggestions on Escape
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const saveVersion = (changeType: DocumentVersion['changeType'] = 'auto-saved', description: string = 'Auto-saved') => {
    const plainText = content.replace(/<[^>]*>/g, '')
    const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length
    const characterCount = plainText.length
    
    const newVersion: DocumentVersion = {
      id: Date.now().toString(),
      content: content,
      timestamp: new Date(),
      author: 'You',
      changeDescription: description,
      wordCount,
      characterCount,
      changeType
    }
    
    setVersions(prev => {
      // Check if content is significantly different from last version
      const lastVersion = prev[0]
      if (lastVersion && lastVersion.content === content) {
        return prev // Don't save duplicate versions
      }
      
      return [newVersion, ...prev.slice(0, 9)] // Keep last 10 versions
    })
    setLastSaved(new Date())
  }

  const createManualVersion = (description: string) => {
    saveVersion('edited', description)
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      role: 'assistant',
      content: `✅ Version saved: "${description}"`
    }])
  }

  const formatText = (command: string, value: string = '') => {
    document.execCommand(command, false, value)
    handleInput()
    // Track formatting changes
    saveVersion('formatted', `Applied ${command} formatting`)
  }

  const insertTable = () => {
    const table = `
      <table class="min-w-full border-collapse border border-gray-600">
        <thead>
          <tr class="bg-gray-800">
            <th class="border border-gray-600 p-2 text-left">Header 1</th>
            <th class="border border-gray-600 p-2 text-left">Header 2</th>
            <th class="border border-gray-600 p-2 text-left">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-gray-600 p-2">Cell 1</td>
            <td class="border border-gray-600 p-2">Cell 2</td>
            <td class="border border-gray-600 p-2">Cell 3</td>
          </tr>
          <tr>
            <td class="border border-gray-600 p-2">Cell 4</td>
            <td class="border border-gray-600 p-2">Cell 5</td>
            <td class="border border-gray-600 p-2">Cell 6</td>
          </tr>
        </tbody>
      </table>
    `
    
    if (editorRef.current) {
      editorRef.current.innerHTML += table
      handleInput()
    }
  }

  const getSelectedText = () => {
    const selection = window.getSelection()
    return selection ? selection.toString() : ''
  }

  const handleAIEdit = async (suggestion: AIEditSuggestion) => {
    const selected = getSelectedText()
    if (!selected) {
      alert('Please select text to edit')
      return
    }

    setSelectedText(selected)
    
    if (suggestion.type === 'custom') {
      setShowAIEditDialog(true)
    } else {
      await performAIEdit(suggestion.title, selected)
    }
  }

  const performAIEdit = async (instruction: string, textToEdit: string) => {
    setIsAIEditing(true)
    
    try {
      let editedText = textToEdit
      
      if (onAIEdit) {
        editedText = await onAIEdit(instruction, textToEdit)
      } else if (workspaceSlug) {
        // Use AnythingLLM service for AI editing
        const prompt = `Please ${instruction.toLowerCase()} the following text:\n\n"${textToEdit}"\n\nReturn only the improved text without any additional explanation or formatting.`
        const response = await anythingLLMService.chatWithWorkspace(workspaceSlug, prompt)
        editedText = response.textResponse || textToEdit
      }

      // Replace the selected text with the edited version
      if (editorRef.current) {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.deleteContents()
          range.insertNode(document.createTextNode(editedText))
          handleInput()
        }
      }
    } catch (error) {
      console.error('AI edit failed:', error)
      alert('Failed to perform AI edit. Please try again.')
    } finally {
      setIsAIEditing(false)
      setShowAIEditDialog(false)
      setAiEditInstruction('')
    }
  }

  const restoreVersion = (version: DocumentVersion) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = version.content
      onChange(version.content)
      setShowVersionHistory(false)
    }
  }

  const ToolbarButton = ({ icon: Icon, onClick, tooltip, isActive = false, isLoading = false }: {
    icon: any,
    onClick: () => void,
    tooltip: string,
    isActive?: boolean,
    isLoading?: boolean
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "text-gray-400 hover:text-white hover:bg-gray-800",
        isActive && "text-white bg-gray-800",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
      title={tooltip}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
    </Button>
  )

  return (
    <Card className={cn("bg-gray-900 border-gray-800 h-full flex flex-col", className)}>
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditing(false)
                  }
                }}
                autoFocus
              />
            ) : (
              <CardTitle 
                className="text-gray-100 cursor-pointer hover:text-gray-300"
                onClick={() => setIsEditing(true)}
              >
                {title}
              </CardTitle>
            )}
            
            {/* Auto-save status */}
            <div className="flex items-center gap-2">
              {autoSaveStatus === 'saving' && (
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              )}
              {autoSaveStatus === 'saved' && lastSaved && (
                <span className="text-xs text-gray-500">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Version History */}
            <ToolbarButton
              icon={History}
              onClick={() => setShowVersionHistory(true)}
              tooltip="Version History"
            />
            
            {/* Manual Save */}
            <ToolbarButton
              icon={Save}
              onClick={() => {
                const description = prompt('Describe the changes you made:')
                if (description) {
                  createManualVersion(description)
                }
              }}
              tooltip="Save Version"
            />
            
            {/* AI Edit */}
            <ToolbarButton
              icon={Sparkles}
              onClick={() => {
                const selected = getSelectedText()
                if (selected) {
                  setShowAIEditDialog(true)
                } else {
                  alert('Please select text to edit with AI')
                }
              }}
              tooltip="AI Edit"
              isLoading={isAIEditing}
            />
            
            {/* Save */}
            {onSave && (
              <ToolbarButton
                icon={Save}
                onClick={onSave}
                tooltip="Save Document"
              />
            )}
          </div>
        </div>
        
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 pt-2 border-t border-gray-800 flex-wrap">
          <ToolbarButton
            icon={Bold}
            onClick={() => formatText('bold')}
            tooltip="Bold"
          />
          <ToolbarButton
            icon={Italic}
            onClick={() => formatText('italic')}
            tooltip="Italic"
          />
          <ToolbarButton
            icon={Underline}
            onClick={() => formatText('underline')}
            tooltip="Underline"
          />
          <div className="w-px h-6 bg-gray-700 mx-1" />
          <ToolbarButton
            icon={List}
            onClick={() => formatText('insertUnorderedList')}
            tooltip="Bullet List"
          />
          <ToolbarButton
            icon={ListOrdered}
            onClick={() => formatText('insertOrderedList')}
            tooltip="Numbered List"
          />
          <ToolbarButton
            icon={Quote}
            onClick={() => formatText('formatBlock', 'blockquote')}
            tooltip="Quote"
          />
          <ToolbarButton
            icon={Code}
            onClick={() => formatText('formatBlock', 'pre')}
            tooltip="Code Block"
          />
          <div className="w-px h-6 bg-gray-700 mx-1" />
          <ToolbarButton
            icon={Link}
            onClick={() => {
              const url = prompt('Enter URL:')
              if (url) formatText('createLink', url)
            }}
            tooltip="Insert Link"
          />
          <ToolbarButton
            icon={Image}
            onClick={() => {
              const url = prompt('Enter image URL:')
              if (url) formatText('insertImage', url)
            }}
            tooltip="Insert Image"
          />
          <ToolbarButton
            icon={Table}
            onClick={insertTable}
            tooltip="Insert Table"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-hidden relative">
        {/* Real-time typing indicator */}
        {isTyping && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="secondary" className="bg-blue-600 text-white">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Typing...
              </div>
            </Badge>
          </div>
        )}

        {/* AI Suggestions Panel */}
        {showSuggestions && aiSuggestions.length > 0 && (
          <div className="absolute bottom-20 left-6 right-6 z-10 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">AI Suggestions</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSuggestions(false)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-1">Press Ctrl+Space for suggestions</div>
            </div>
            <div className="p-2">
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => applySuggestion(suggestion)}
                  className="w-full text-left p-2 hover:bg-gray-700 rounded text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    {suggestion}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="min-h-[500px] p-6 bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-b-lg overflow-y-auto h-full"
          style={{
            lineHeight: '1.6',
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </CardContent>

      {/* AI Edit Dialog */}
      <Dialog open={showAIEditDialog} onOpenChange={setShowAIEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Edit Assistant
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Selected Text Preview */}
            {selectedText && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Selected Text:
                </label>
                <div className="p-3 bg-gray-800 rounded border border-gray-700 text-sm text-gray-300">
                  {selectedText}
                </div>
              </div>
            )}
            
            {/* Quick Actions */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Quick Actions:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {aiEditSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion.type}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAIEdit(suggestion)}
                    disabled={isAIEditing}
                    className="justify-start h-auto p-3"
                  >
                    <div className="flex items-center gap-2">
                      <suggestion.icon className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-medium">{suggestion.title}</div>
                        <div className="text-xs text-gray-500">{suggestion.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Custom Instruction */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Custom Instruction:
              </label>
              <Textarea
                value={aiEditInstruction}
                onChange={(e) => setAiEditInstruction(e.target.value)}
                placeholder="Describe how you want to edit the selected text..."
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => aiEditInstruction && performAIEdit(aiEditInstruction, selectedText)}
                disabled={!aiEditInstruction.trim() || isAIEditing}
                className="flex-1"
              >
                {isAIEditing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Editing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Apply Edit
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAIEditDialog(false)}
                disabled={isAIEditing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Version History
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No versions saved yet
              </div>
            ) : (
              versions.map((version, index) => (
                <Card key={version.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">v{versions.length - index}</Badge>
                        <Badge 
                          variant={version.changeType === 'auto-saved' ? 'outline' : 'default'}
                          className={
                            version.changeType === 'created' ? 'bg-green-600' :
                            version.changeType === 'edited' ? 'bg-blue-600' :
                            version.changeType === 'formatted' ? 'bg-purple-600' : ''
                          }
                        >
                          {version.changeType}
                        </Badge>
                        <span className="text-sm font-medium">{version.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {version.timestamp.toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restoreVersion(version)}
                        >
                          Restore
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{version.changeDescription}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{version.wordCount} words</span>
                      <span>{version.characterCount} characters</span>
                      {index > 0 && (
                        <span>
                          {Math.abs(version.wordCount - versions[index - 1].wordCount)} words change
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}