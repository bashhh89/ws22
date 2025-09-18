'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Settings,
  Code,
  Palette,
  Zap,
  Users,
  Database,
  FileText,
  Image,
  Video,
  Music,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Star,
  Lightbulb,
  AlertCircle,
  Info,
  HelpCircle,
  Clock,
  BarChart3,
  Calculator,
  BookOpen,
  MessageSquare,
  CheckSquare,
  Target,
  TrendingUp
} from 'lucide-react'

interface CustomCommand {
  id: string
  title: string
  description: string
  category: string
  keywords: string[]
  icon: string
  action: string
  params?: any
  isActive: boolean
}

const iconOptions = [
  { name: 'Star', icon: Star },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'AlertCircle', icon: AlertCircle },
  { name: 'Info', icon: Info },
  { name: 'HelpCircle', icon: HelpCircle },
  { name: 'Clock', icon: Clock },
  { name: 'BarChart3', icon: BarChart3 },
  { name: 'Calculator', icon: Calculator },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'MessageSquare', icon: MessageSquare },
  { name: 'CheckSquare', icon: CheckSquare },
  { name: 'Target', icon: Target },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Code', icon: Code },
  { name: 'Palette', icon: Palette },
  { name: 'Zap', icon: Zap },
  { name: 'Users', icon: Users },
  { name: 'Database', icon: Database },
  { name: 'FileText', icon: FileText },
  { name: 'Image', icon: Image },
  { name: 'Video', icon: Video },
  { name: 'Music', icon: Music },
  { name: 'Calendar', icon: Calendar },
  { name: 'MapPin', icon: MapPin },
  { name: 'Mail', icon: Mail },
  { name: 'Phone', icon: Phone },
  { name: 'Globe', icon: Globe },
  { name: 'Github', icon: Github },
  { name: 'Twitter', icon: Twitter },
  { name: 'Linkedin', icon: Linkedin }
]

const categoryOptions = [
  'Custom Commands',
  'AI Features',
  'Content Blocks',
  'Media',
  'Social',
  'Contact',
  'Date & Time',
  'Business',
  'Development',
  'Productivity',
  'Utilities'
]

export default function AdminDashboard() {
  const [commands, setCommands] = useState<CustomCommand[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCommand, setEditingCommand] = useState<CustomCommand | null>(null)
  const [newCommand, setNewCommand] = useState<Partial<CustomCommand>>({
    title: '',
    description: '',
    category: 'Custom Commands',
    keywords: [],
    icon: 'Star',
    action: '',
    isActive: true
  })

  useEffect(() => {
    loadCommands()
  }, [])

  const loadCommands = () => {
    const savedCommands = localStorage.getItem('customSlashCommands')
    if (savedCommands) {
      try {
        setCommands(JSON.parse(savedCommands))
      } catch (error) {
        console.error('Failed to load commands:', error)
      }
    }
  }

  const saveCommands = (updatedCommands: CustomCommand[]) => {
    localStorage.setItem('customSlashCommands', JSON.stringify(updatedCommands))
    setCommands(updatedCommands)
  }

  const addCommand = () => {
    if (!newCommand.title || !newCommand.description || !newCommand.action) {
      alert('Please fill in all required fields')
      return
    }

    const command: CustomCommand = {
      id: Date.now().toString(),
      title: newCommand.title!,
      description: newCommand.description!,
      category: newCommand.category!,
      keywords: newCommand.keywords || [],
      icon: newCommand.icon!,
      action: newCommand.action!,
      params: newCommand.params,
      isActive: newCommand.isActive ?? true
    }

    const updatedCommands = [...commands, command]
    saveCommands(updatedCommands)
    
    setNewCommand({
      title: '',
      description: '',
      category: 'Custom Commands',
      keywords: [],
      icon: 'Star',
      action: '',
      isActive: true
    })
    setIsAddDialogOpen(false)
  }

  const updateCommand = () => {
    if (!editingCommand) return

    const updatedCommands = commands.map(cmd => 
      cmd.id === editingCommand.id ? editingCommand : cmd
    )
    saveCommands(updatedCommands)
    setEditingCommand(null)
  }

  const deleteCommand = (id: string) => {
    if (confirm('Are you sure you want to delete this command?')) {
      const updatedCommands = commands.filter(cmd => cmd.id !== id)
      saveCommands(updatedCommands)
    }
  }

  const toggleCommand = (id: string) => {
    const updatedCommands = commands.map(cmd => 
      cmd.id === id ? { ...cmd, isActive: !cmd.isActive } : cmd
    )
    saveCommands(updatedCommands)
  }

  const IconComponent = ({ iconName }: { iconName: string }) => {
    const iconOption = iconOptions.find(opt => opt.name === iconName)
    const Icon = iconOption?.icon || Star
    return <Icon className="w-5 h-5" />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your custom slash commands and editor settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Commands</p>
                  <p className="text-2xl font-bold text-gray-900">{commands.length}</p>
                </div>
                <Settings className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Commands</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {commands.filter(cmd => cmd.isActive).length}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Array.from(new Set(commands.map(cmd => cmd.category))).length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Custom Actions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {commands.filter(cmd => cmd.action.includes('custom')).length}
                  </p>
                </div>
                <Code className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Custom Slash Commands</h2>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Command
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Custom Command</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <Input
                    value={newCommand.title || ''}
                    onChange={(e) => setNewCommand(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., My Custom Command"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <Input
                    value={newCommand.description || ''}
                    onChange={(e) => setNewCommand(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of what this command does"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCommand.category || ''}
                    onChange={(e) => setNewCommand(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <select
                    value={newCommand.icon || ''}
                    onChange={(e) => setNewCommand(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {iconOptions.map(option => (
                      <option key={option.name} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keywords (comma-separated)
                  </label>
                  <Input
                    value={newCommand.keywords?.join(', ') || ''}
                    onChange={(e) => setNewCommand(prev => ({ 
                      ...prev, 
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) 
                    }))}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action (JavaScript code) *
                  </label>
                  <Textarea
                    value={newCommand.action || ''}
                    onChange={(e) => setNewCommand(prev => ({ ...prev, action: e.target.value }))}
                    placeholder="// JavaScript code to execute
// Available: editor, params
// Example: editor.chain().focus().insertContent('Hello World').run()"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={addCommand} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Add Command
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Commands List */}
        <div className="space-y-4">
          {commands.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Commands</h3>
                <p className="text-gray-600 mb-4">Create your first custom slash command to get started</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Command
                </Button>
              </CardContent>
            </Card>
          ) : (
            commands.map(command => (
              <Card key={command.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <IconComponent iconName={command.icon} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-gray-900">{command.title}</h3>
                          <Badge variant={command.isActive ? "default" : "secondary"}>
                            {command.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">{command.category}</Badge>
                        </div>
                        <p className="text-gray-600">{command.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {command.keywords.map(keyword => (
                            <Badge key={keyword} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCommand(command.id)}
                      >
                        {command.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCommand(command)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCommand(command.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingCommand} onOpenChange={() => setEditingCommand(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Command</DialogTitle>
            </DialogHeader>
            {editingCommand && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <Input
                    value={editingCommand.title}
                    onChange={(e) => setEditingCommand(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <Input
                    value={editingCommand.description}
                    onChange={(e) => setEditingCommand(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={editingCommand.category}
                    onChange={(e) => setEditingCommand(prev => prev ? { ...prev, category: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <select
                    value={editingCommand.icon}
                    onChange={(e) => setEditingCommand(prev => prev ? { ...prev, icon: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {iconOptions.map(option => (
                      <option key={option.name} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keywords (comma-separated)
                  </label>
                  <Input
                    value={editingCommand.keywords.join(', ')}
                    onChange={(e) => setEditingCommand(prev => prev ? { 
                      ...prev, 
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) 
                    } : null)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action (JavaScript code) *
                  </label>
                  <Textarea
                    value={editingCommand.action}
                    onChange={(e) => setEditingCommand(prev => prev ? { ...prev, action: e.target.value } : null)}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={updateCommand} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditingCommand(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}