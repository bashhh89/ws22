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
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
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
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  ListTodo,
  Undo,
  Redo,
  Superscript,
  Subscript,
  Strikethrough,
  Code2,
  Maximize2,
  Minimize2,
  Type,
  FileImage,
  Link2,
  Table2,
  MoreHorizontal,
  PlusCircle,
  Settings2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { anythingLLMService } from '@/lib/anythingllm'
import SlashCommand from './SlashCommand'
import AIBubbleMenu from './AIBubbleMenu'

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Link from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import UnderlineExtension from '@tiptap/extension-underline'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import SuperscriptExtension from '@tiptap/extension-superscript'
import SubscriptExtension from '@tiptap/extension-subscript'
import BubbleMenu from '@tiptap/extension-bubble-menu'
import FloatingMenu from '@tiptap/extension-floating-menu'
import { Extension } from '@tiptap/core'

// Custom Slash Command Extension
const SlashCommandExtension = Extension.create({
  name: 'slashCommand',
  
  addKeyboardShortcuts() {
    return {
      '/': () => {
        // This will be handled by the parent component
        return false
      },
    }
  },
  
  onTransaction({ transaction }) {
    // This will be handled by the parent component
    return false
  }
})

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
  const [showSlashCommand, setShowSlashCommand] = useState(false)
  const [slashCommandQuery, setSlashCommandQuery] = useState('')
  
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

  const editor = useEditor({
    extensions: [
      StarterKit,
      SlashCommandExtension,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your document... Type / for commands',
      }),
      CharacterCount,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      UnderlineExtension,
      SuperscriptExtension,
      SubscriptExtension,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
      
      // Check for slash commands
      checkForSlashCommand(editor)
      
      // Handle typing detection
      setIsTyping(true)
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
      
      const timeout = setTimeout(() => {
        setIsTyping(false)
        generateAISuggestions()
      }, 2000)
      
      setTypingTimeout(timeout)
    },
    onCreate: ({ editor }) => {
      // Set initial content
      if (content) {
        editor.commands.setContent(content)
      }
    },
  })

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    setAutoSaveStatus('unsaved')
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveVersion('auto-saved', 'Auto-saved changes')
      setAutoSaveStatus('saved')
    }, 3000)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [content])

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const generateAISuggestions = async () => {
    if (!workspaceSlug || !documentId || !content.trim()) return
    
    try {
      // Get AI suggestions based on current content
      const plainText = content.replace(/<[^>]*>/g, '').substring(0, 500)
      const prompt = `Based on this text, suggest 3 possible ways to continue or improve it:\n\n${plainText}\n\nProvide only the suggestions, one per line, without numbering.`
      
      // Show user feedback that AI is working
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant',
        content: `🤖 AI is generating suggestions...`
      }])
      
      const response = await anythingLLMService.chatWithWorkspace(workspaceSlug, prompt)
      const suggestions = response.textResponse
        ?.split('\n')
        .filter(s => s.trim())
        .slice(0, 3) || []
      
      setAiSuggestions(suggestions)
      setShowSuggestions(true)
      
      // Update the message to show completion
      setMessages(prev => prev.map(msg => 
        msg.content.includes('AI is generating suggestions') 
          ? { ...msg, content: `✅ AI generated ${suggestions.length} suggestions` }
          : msg
      ))
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error)
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant',
        content: `❌ Failed to generate AI suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`
      }])
    }
  }

  const applySuggestion = (suggestion: string) => {
    if (editor) {
      editor.commands.insertContent(' ' + suggestion)
      setShowSuggestions(false)
    }
  }

  const handleSlashCommand = (commandId: string, params?: any) => {
    console.log('Slash command executed:', commandId, params)
    
    // Handle text blocks
    if (commandId === 'heading1') {
      editor?.chain().focus().toggleHeading({ level: 1 }).run()
    } else if (commandId === 'heading2') {
      editor?.chain().focus().toggleHeading({ level: 2 }).run()
    } else if (commandId === 'heading3') {
      editor?.chain().focus().toggleHeading({ level: 3 }).run()
    } else if (commandId === 'paragraph') {
      editor?.chain().focus().setParagraph().run()
    } else if (commandId === 'quote') {
      editor?.chain().focus().toggleBlockquote().run()
    } else if (commandId === 'code') {
      editor?.chain().focus().toggleCodeBlock().run()
    }
    
    // Handle lists
    else if (commandId === 'bullet-list') {
      editor?.chain().focus().toggleBulletList().run()
    } else if (commandId === 'numbered-list') {
      editor?.chain().focus().toggleOrderedList().run()
    } else if (commandId === 'task-list') {
      editor?.chain().focus().toggleTaskList().run()
    }
    
    // Handle formatting
    else if (commandId === 'bold') {
      editor?.chain().focus().toggleBold().run()
    } else if (commandId === 'italic') {
      editor?.chain().focus().toggleItalic().run()
    } else if (commandId === 'underline') {
      editor?.chain().focus().toggleUnderline().run()
    } else if (commandId === 'strikethrough') {
      editor?.chain().focus().toggleStrike().run()
    } else if (commandId === 'code-inline') {
      editor?.chain().focus().toggleCode().run()
    } else if (commandId === 'superscript') {
      editor?.chain().focus().toggleSuperscript().run()
    } else if (commandId === 'subscript') {
      editor?.chain().focus().toggleSubscript().run()
    }
    
    // Handle insert elements
    else if (commandId === 'table') {
      editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    } else if (commandId === 'image') {
      const url = prompt('Enter image URL:')
      if (url) editor?.chain().focus().setImage({ src: url }).run()
    } else if (commandId === 'link') {
      const url = prompt('Enter URL:')
      if (url) editor?.chain().focus().setLink({ href: url }).run()
    } else if (commandId === 'horizontal-rule') {
      editor?.chain().focus().setHorizontalRule().run()
    }
    
    // Handle AI commands
    else if (commandId.startsWith('ai-')) {
      handleAICommand(commandId.replace('ai-', ''))
    }
    
    // Handle action commands
    else if (commandId === 'upload') {
      // Trigger upload modal (this would need to be implemented)
      alert('Upload functionality would be implemented here')
    } else if (commandId === 'manage') {
      window.open('/admin', '_blank')
    } else if (commandId === 'create-workspace') {
      alert('Create workspace functionality would be implemented here')
    }
  }

  const handleAICommand = (commandType: string) => {
    const selectedText = getSelectedText()
    if (!selectedText) {
      alert('Please select text to apply AI command')
      return
    }

    let instruction = ''
    switch (commandType) {
      case 'improve':
        instruction = 'Improve the writing quality of this text'
        break
      case 'shorten':
        instruction = 'Make this text more concise while keeping the meaning'
        break
      case 'expand':
        instruction = 'Expand on this text with more details and depth'
        break
      case 'rephrase':
        instruction = 'Rephrase this text in a different way'
        break
      case 'grammar':
        instruction = 'Fix grammar and spelling errors in this text'
        break
      case 'summarize':
        instruction = 'Summarize this text concisely'
        break
      case 'translate':
        const targetLanguage = prompt('Translate to which language?')
        if (targetLanguage) {
          instruction = `Translate this text to ${targetLanguage}`
        } else {
          return
        }
        break
      case 'custom':
        const customInstruction = prompt('Enter your AI instruction:')
        if (customInstruction) {
          instruction = customInstruction
        } else {
          return
        }
        break
      default:
        instruction = `Process this text with ${commandType}`
    }

    performAIEdit(instruction, selectedText)
  }

  const checkForSlashCommand = (editor: any) => {
    const { state } = editor
    const { selection } = state
    const { $from } = selection
    
    // Check if we're at the start of a line and just typed '/'
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, '\n')
    const lastLine = textBefore.split('\n').pop() || ''
    
    if (lastLine === '/') {
      setShowSlashCommand(true)
      setSlashCommandQuery('')
    } else if (lastLine.startsWith('/')) {
      setShowSlashCommand(true)
      setSlashCommandQuery(lastLine.substring(1))
    } else {
      setShowSlashCommand(false)
      setSlashCommandQuery('')
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

  const getSelectedText = () => {
    if (!editor) return ''
    const { state } = editor
    const { from, to } = state.selection
    return state.doc.textBetween(from, to, ' ')
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
        
        // Show user feedback that AI is working
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: 'assistant',
          content: `🤖 AI is ${instruction.toLowerCase()}...`
        }])
        
        const response = await anythingLLMService.chatWithWorkspace(workspaceSlug, prompt)
        editedText = response.textResponse || textToEdit
        
        // Update the message to show completion
        setMessages(prev => prev.map(msg => 
          msg.content.includes('AI is') 
            ? { ...msg, content: `✅ AI completed: ${instruction}` }
            : msg
        ))
      }

      // Replace the selected text with the edited version
      if (editor) {
        editor.chain().focus().insertContent(editedText).run()
      }
    } catch (error) {
      console.error('AI edit failed:', error)
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant',
        content: `❌ AI edit failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }])
    } finally {
      setIsAIEditing(false)
      setShowAIEditDialog(false)
      setAiEditInstruction('')
    }
  }

  const restoreVersion = (version: DocumentVersion) => {
    if (editor) {
      editor.commands.setContent(version.content)
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
            
            {/* Settings */}
          <ToolbarButton
            icon={Settings2}
            onClick={() => {
              // Open admin dashboard in new tab
              window.open('/admin', '_blank')
            }}
            tooltip="Editor Settings"
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
          {/* Undo/Redo */}
          <ToolbarButton
            icon={Undo}
            onClick={() => editor?.chain().focus().undo().run()}
            tooltip="Undo"
            isActive={editor?.can().undo()}
          />
          <ToolbarButton
            icon={Redo}
            onClick={() => editor?.chain().focus().redo().run()}
            tooltip="Redo"
            isActive={editor?.can().redo()}
          />
          <div className="w-px h-6 bg-gray-700 mx-1" />
          
          {/* Text Formatting */}
          <ToolbarButton
            icon={Bold}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            tooltip="Bold"
            isActive={editor?.isActive('bold')}
          />
          <ToolbarButton
            icon={Italic}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            tooltip="Italic"
            isActive={editor?.isActive('italic')}
          />
          <ToolbarButton
            icon={Underline}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            tooltip="Underline"
            isActive={editor?.isActive('underline')}
          />
          <ToolbarButton
            icon={Strikethrough}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            tooltip="Strikethrough"
            isActive={editor?.isActive('strike')}
          />
          <ToolbarButton
            icon={Superscript}
            onClick={() => editor?.chain().focus().toggleSuperscript().run()}
            tooltip="Superscript"
            isActive={editor?.isActive('superscript')}
          />
          <ToolbarButton
            icon={Subscript}
            onClick={() => editor?.chain().focus().toggleSubscript().run()}
            tooltip="Subscript"
            isActive={editor?.isActive('subscript')}
          />
          <ToolbarButton
            icon={Highlighter}
            onClick={() => editor?.chain().focus().toggleHighlight().run()}
            tooltip="Highlight"
            isActive={editor?.isActive('highlight')}
          />
          <div className="w-px h-6 bg-gray-700 mx-1" />
          
          {/* Text Alignment */}
          <ToolbarButton
            icon={AlignLeft}
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            tooltip="Align Left"
            isActive={editor?.isActive({ textAlign: 'left' })}
          />
          <ToolbarButton
            icon={AlignCenter}
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            tooltip="Align Center"
            isActive={editor?.isActive({ textAlign: 'center' })}
          />
          <ToolbarButton
            icon={AlignRight}
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            tooltip="Align Right"
            isActive={editor?.isActive({ textAlign: 'right' })}
          />
          <div className="w-px h-6 bg-gray-700 mx-1" />
          
          {/* Lists */}
          <ToolbarButton
            icon={List}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            tooltip="Bullet List"
            isActive={editor?.isActive('bulletList')}
          />
          <ToolbarButton
            icon={ListOrdered}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            tooltip="Numbered List"
            isActive={editor?.isActive('orderedList')}
          />
          <ToolbarButton
            icon={ListTodo}
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
            tooltip="Task List"
            isActive={editor?.isActive('taskList')}
          />
          <div className="w-px h-6 bg-gray-700 mx-1" />
          
          {/* Blocks */}
          <ToolbarButton
            icon={Quote}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            tooltip="Quote"
            isActive={editor?.isActive('blockquote')}
          />
          <ToolbarButton
            icon={Code}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            tooltip="Code Block"
            isActive={editor?.isActive('codeBlock')}
          />
          <div className="w-px h-6 bg-gray-700 mx-1" />
          
          {/* Insert Elements */}
          <ToolbarButton
            icon={LinkIcon}
            onClick={() => {
              const url = prompt('Enter URL:')
              if (url) editor?.chain().focus().setLink({ href: url }).run()
            }}
            tooltip="Insert Link"
            isActive={editor?.isActive('link')}
          />
          <ToolbarButton
            icon={ImageIcon}
            onClick={() => {
              const url = prompt('Enter image URL:')
              if (url) editor?.chain().focus().setImage({ src: url }).run()
            }}
            tooltip="Insert Image"
          />
          <ToolbarButton
            icon={TableIcon}
            onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            tooltip="Insert Table"
            isActive={editor?.isActive('table')}
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

        {/* Slash Command Menu */}
        {showSlashCommand && editor && (
          <SlashCommand
            editor={editor}
            isOpen={showSlashCommand}
            onClose={() => setShowSlashCommand(false)}
            onCommand={handleSlashCommand}
          />
        )}

        {/* AI Bubble Menu */}
        {editor && (
          <AIBubbleMenu
            editor={editor}
            onAIEdit={async (instruction, selectedText) => {
              setIsAIEditing(true)
              try {
                await performAIEdit(instruction, selectedText)
              } finally {
                setIsAIEditing(false)
              }
            }}
          />
        )}

        {/* Editor Content */}
        <div 
          className="min-h-[500px] p-6 bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-b-lg overflow-y-auto h-full"
          onKeyDown={handleKeyDown}
          style={{
            lineHeight: '1.6',
          }}
        >
          <EditorContent editor={editor} />
        </div>
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
                        <span className="text-sm text-gray-500">
                          {version.timestamp.toLocaleDateString()} {version.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restoreVersion(version)}
                        className="h-8"
                      >
                        Restore
                      </Button>
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                      {version.changeDescription}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{version.wordCount} words</span>
                      <span>{version.characterCount} characters</span>
                      <span>by {version.author}</span>
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