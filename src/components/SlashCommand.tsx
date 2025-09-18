'use client'

import { useEffect, useRef, useState } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Table as TableIcon, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  CheckSquare, 
  Heading1, 
  Heading2, 
  Heading3,
  Bot,
  Sparkles,
  Wand2,
  Edit3,
  BarChart3,
  Zap,
  Users,
  Settings,
  Plus,
  Upload,
  Search,
  MessageCircle,
  FileImage,
  Link2,
  Table2,
  MoreHorizontal,
  Minimize2,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  ListTodo,
  Superscript,
  Subscript,
  Strikethrough,
  Code2
} from 'lucide-react'

interface SlashCommandProps {
  editor: any
  isOpen: boolean
  onClose: () => void
  onCommand: (commandId: string, params?: any) => void
}

interface CommandItem {
  id: string
  name: string
  description: string
  icon: any
  category: string
  keywords?: string[]
}

export default function SlashCommand({ editor, isOpen, onClose, onCommand }: SlashCommandProps) {
  const [query, setQuery] = useState('')
  const commandRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands: CommandItem[] = [
    // Text Blocks
    { id: 'heading1', name: 'Heading 1', description: 'Large heading', icon: Heading1, category: 'text', keywords: ['h1', 'title'] },
    { id: 'heading2', name: 'Heading 2', description: 'Medium heading', icon: Heading2, category: 'text', keywords: ['h2'] },
    { id: 'heading3', name: 'Heading 3', description: 'Small heading', icon: Heading3, category: 'text', keywords: ['h3'] },
    { id: 'paragraph', name: 'Paragraph', description: 'Normal text', icon: Type, category: 'text', keywords: ['p', 'text'] },
    { id: 'quote', name: 'Quote', description: 'Block quote', icon: Quote, category: 'text', keywords: ['blockquote'] },
    { id: 'code', name: 'Code', description: 'Code block', icon: Code, category: 'text', keywords: ['pre'] },
    
    // Lists
    { id: 'bullet-list', name: 'Bullet List', description: 'Unordered list', icon: List, category: 'lists', keywords: ['ul', 'bullet'] },
    { id: 'numbered-list', name: 'Numbered List', description: 'Ordered list', icon: ListOrdered, category: 'lists', keywords: ['ol', 'numbered'] },
    { id: 'task-list', name: 'Task List', description: 'Checklist', icon: CheckSquare, category: 'lists', keywords: ['todo', 'checkbox'] },
    
    // Formatting
    { id: 'bold', name: 'Bold', description: 'Bold text', icon: Type, category: 'formatting' },
    { id: 'italic', name: 'Italic', description: 'Italic text', icon: Type, category: 'formatting' },
    { id: 'underline', name: 'Underline', description: 'Underlined text', icon: Type, category: 'formatting' },
    { id: 'strikethrough', name: 'Strikethrough', description: 'Strikethrough text', icon: Strikethrough, category: 'formatting' },
    { id: 'code-inline', name: 'Inline Code', description: 'Code within text', icon: Code2, category: 'formatting' },
    { id: 'superscript', name: 'Superscript', description: 'Superscript text', icon: Superscript, category: 'formatting' },
    { id: 'subscript', name: 'Subscript', description: 'Subscript text', icon: Subscript, category: 'formatting' },
    
    // Insert Elements
    { id: 'table', name: 'Table', description: 'Insert table', icon: TableIcon, category: 'insert' },
    { id: 'image', name: 'Image', description: 'Insert image', icon: ImageIcon, category: 'insert' },
    { id: 'link', name: 'Link', description: 'Insert link', icon: LinkIcon, category: 'insert' },
    { id: 'horizontal-rule', name: 'Divider', description: 'Horizontal line', icon: Minimize2, category: 'insert' },
    
    // AI Commands
    { id: 'ai-improve', name: 'Improve Writing', description: 'Enhance clarity and flow', icon: Sparkles, category: 'ai' },
    { id: 'ai-shorten', name: 'Make Concise', description: 'Reduce length while keeping meaning', icon: Edit3, category: 'ai' },
    { id: 'ai-expand', name: 'Expand Ideas', description: 'Add more detail and depth', icon: FileText, category: 'ai' },
    { id: 'ai-rephrase', name: 'Rephrase', description: 'Say it differently', icon: Wand2, category: 'ai' },
    { id: 'ai-grammar', name: 'Fix Grammar', description: 'Correct grammar and spelling', icon: CheckSquare, category: 'ai' },
    { id: 'ai-summarize', name: 'Summarize', description: 'Summarize selected text', icon: BarChart3, category: 'ai' },
    { id: 'ai-translate', name: 'Translate', description: 'Translate to another language', icon: MessageCircle, category: 'ai' },
    { id: 'ai-custom', name: 'Custom AI', description: 'Custom AI instruction', icon: Bot, category: 'ai' },
    
    // Actions
    { id: 'upload', name: 'Upload Document', description: 'Upload document to workspace', icon: Upload, category: 'actions' },
    { id: 'manage', name: 'Manage Workspace', description: 'Workspace settings', icon: Settings, category: 'actions' },
    { id: 'create-workspace', name: 'Create Workspace', description: 'Create new workspace', icon: Plus, category: 'actions' },
  ]

  const filteredCommands = commands.filter(command => {
    const searchLower = query.toLowerCase()
    return (
      command.name.toLowerCase().includes(searchLower) ||
      command.description.toLowerCase().includes(searchLower) ||
      command.category.toLowerCase().includes(searchLower) ||
      command.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
    )
  })

  const categories = Array.from(new Set(filteredCommands.map(cmd => cmd.category)))

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Focus the first item when opened
      setSelectedIndex(0)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1))
          break
        case 'Enter':
          event.preventDefault()
          if (filteredCommands[selectedIndex]) {
            handleCommandSelect(filteredCommands[selectedIndex])
          }
          break
        case 'Escape':
          event.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex])

  const handleCommandSelect = (command: CommandItem) => {
    onCommand(command.id)
    onClose()
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'text': return Type
      case 'lists': return List
      case 'formatting': return Highlighter
      case 'insert': return Plus
      case 'ai': return Bot
      case 'actions': return Settings
      default: return MoreHorizontal
    }
  }

  if (!isOpen) return null

  return (
    <div 
      ref={commandRef}
      className="absolute z-50 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-hidden"
      style={{
        left: '20px',
        top: '20px'
      }}
    >
      <Command className="bg-transparent">
        <CommandInput
          placeholder="Type a command..."
          value={query}
          onValueChange={setQuery}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        />
        <CommandList className="max-h-80 overflow-y-auto">
          <CommandEmpty className="text-gray-400 py-2 text-center">
            No commands found.
          </CommandEmpty>
          
          {categories.map(category => {
            const categoryCommands = filteredCommands.filter(cmd => cmd.category === category)
            if (categoryCommands.length === 0) return null

            const CategoryIcon = getCategoryIcon(category)
            
            return (
              <CommandGroup key={category} heading={
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-400 uppercase">
                  <CategoryIcon className="w-3 h-3" />
                  {category}
                </div>
              }>
                {categoryCommands.map((command, index) => {
                  const globalIndex = filteredCommands.indexOf(command)
                  const Icon = command.icon
                  const isSelected = globalIndex === selectedIndex
                  
                  return (
                    <CommandItem
                      key={command.id}
                      onSelect={() => handleCommandSelect(command)}
                      className={`flex items-center gap-3 px-2 py-2 cursor-pointer ${
                        isSelected ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-blue-400" />
                      <div className="flex-1">
                        <div className="font-medium">{command.name}</div>
                        <div className="text-xs text-gray-400">{command.description}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                        {command.category}
                      </Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )
          })}
        </CommandList>
      </Command>
    </div>
  )
}