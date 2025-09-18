'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Settings, Users, Database, Zap, Globe, FileText, BarChart3, Code, PenTool, Search } from 'lucide-react'
import { anythingLLMService } from '@/lib/anythingllm'

interface WorkspaceConfig {
  name: string
  description: string
  systemPrompt: string
  chatProvider: string
  chatModel: string
  enableRAG: boolean
  enableWebSearch: boolean
  enableAgents: boolean
  enableDatabase: boolean
}

interface CreateWorkspaceProps {
  onWorkspaceCreated: (workspace: any) => void
  isOpen: boolean
  onClose: () => void
}

const defaultSystemPrompts = {
  general: 'You are a helpful AI assistant that helps users with documents, spreadsheets, and general productivity tasks.',
  writer: 'You are a professional writing assistant focused on creating high-quality content, documents, and creative materials.',
  analyst: 'You are a data analysis assistant that helps users understand information, create insights, and make data-driven decisions.',
  developer: 'You are a software development assistant that helps with coding, debugging, and technical documentation.',
  researcher: 'You are a research assistant that helps users find information, analyze sources, and synthesize knowledge.'
}

const providerModels = {
  'openrouter': [
    'openai/gpt-3.5-turbo',
    'openai/gpt-4',
    'openai/gpt-4-turbo',
    'anthropic/claude-2',
    'anthropic/claude-instant-1'
  ],
  'openai': [
    'gpt-3.5-turbo',
    'gpt-4',
    'gpt-4-turbo'
  ],
  'anthropic': [
    'claude-2',
    'claude-instant-1'
  ]
}

export default function CreateWorkspace({ onWorkspaceCreated, isOpen, onClose }: CreateWorkspaceProps) {
  const [config, setConfig] = useState<WorkspaceConfig>({
    name: '',
    description: '',
    systemPrompt: defaultSystemPrompts.general,
    chatProvider: 'openrouter',
    chatModel: 'openai/gpt-3.5-turbo',
    enableRAG: true,
    enableWebSearch: false,
    enableAgents: true,
    enableDatabase: false
  })
  
  const [isCreating, setIsCreating] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')

  const handleCreateWorkspace = async () => {
    if (!config.name.trim()) {
      setError('Workspace name is required')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      // Create the workspace
      const workspace = await anythingLLMService.createWorkspace(config.name)
      
      // Configure the workspace with settings
      const updates: any = {
        openAiPrompt: config.systemPrompt,
        chatProvider: config.chatProvider,
        chatModel: config.chatModel
      }

      // Add feature flags
      if (config.enableRAG) {
        updates.rag = true
      }
      if (config.enableWebSearch) {
        updates.webSearch = true
      }
      if (config.enableAgents) {
        updates.agents = true
      }
      if (config.enableDatabase) {
        updates.database = true
      }

      await anythingLLMService.updateWorkspace(workspace.slug, updates)
      
      // Create default agents if enabled
      if (config.enableAgents) {
        try {
          await anythingLLMService.createDefaultAgents(workspace.slug)
        } catch (agentError) {
          console.warn('Failed to create default agents:', agentError)
        }
      }

      // Return the configured workspace
      const configuredWorkspace = {
        ...workspace,
        description: config.description,
        chatProvider: config.chatProvider,
        chatModel: config.chatModel,
        settings: {
          rag: config.enableRAG,
          webSearch: config.enableWebSearch,
          agents: config.enableAgents,
          database: config.enableDatabase
        }
      }

      onWorkspaceCreated(configuredWorkspace)
      onClose()
      
      // Reset form
      setConfig({
        name: '',
        description: '',
        systemPrompt: defaultSystemPrompts.general,
        chatProvider: 'openrouter',
        chatModel: 'openai/gpt-3.5-turbo',
        enableRAG: true,
        enableWebSearch: false,
        enableAgents: true,
        enableDatabase: false
      })
      setStep(1)
    } catch (error: any) {
      console.error('Failed to create workspace:', error)
      setError(error.message || 'Failed to create workspace')
    } finally {
      setIsCreating(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && !config.name.trim()) {
      setError('Please enter a workspace name')
      return
    }
    setError('')
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Workspace
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    s < step ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="workspaceName">Workspace Name *</Label>
                <Input
                  id="workspaceName"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Project Workspace"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this workspace..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Select 
                  value={config.systemPrompt} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, systemPrompt: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a system prompt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={defaultSystemPrompts.general}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        General Assistant
                      </div>
                    </SelectItem>
                    <SelectItem value={defaultSystemPrompts.writer}>
                      <div className="flex items-center gap-2">
                        <PenTool className="h-4 w-4" />
                        Writing Assistant
                      </div>
                    </SelectItem>
                    <SelectItem value={defaultSystemPrompts.analyst}>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Data Analyst
                      </div>
                    </SelectItem>
                    <SelectItem value={defaultSystemPrompts.developer}>
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Developer Assistant
                      </div>
                    </SelectItem>
                    <SelectItem value={defaultSystemPrompts.researcher}>
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Research Assistant
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  value={config.systemPrompt}
                  onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: AI Configuration */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="chatProvider">AI Provider</Label>
                <Select 
                  value={config.chatProvider} 
                  onValueChange={(value) => setConfig(prev => ({ 
                    ...prev, 
                    chatProvider: value,
                    chatModel: providerModels[value as keyof typeof providerModels]?.[0] || 'openai/gpt-3.5-turbo'
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="chatModel">AI Model</Label>
                <Select 
                  value={config.chatModel} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, chatModel: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providerModels[config.chatProvider as keyof typeof providerModels]?.map((model) => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Features</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Card className={`cursor-pointer transition-colors ${
                    config.enableRAG ? 'border-primary' : ''
                  }`} onClick={() => setConfig(prev => ({ ...prev, enableRAG: !prev.enableRAG }))}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">RAG</div>
                          <div className="text-xs text-muted-foreground">Document search</div>
                        </div>
                        {config.enableRAG && <Badge variant="default">Enabled</Badge>}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`cursor-pointer transition-colors ${
                    config.enableWebSearch ? 'border-primary' : ''
                  }`} onClick={() => setConfig(prev => ({ ...prev, enableWebSearch: !prev.enableWebSearch }))}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">Web Search</div>
                          <div className="text-xs text-muted-foreground">Internet access</div>
                        </div>
                        {config.enableWebSearch && <Badge variant="default">Enabled</Badge>}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`cursor-pointer transition-colors ${
                    config.enableAgents ? 'border-primary' : ''
                  }`} onClick={() => setConfig(prev => ({ ...prev, enableAgents: !prev.enableAgents }))}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">Agents</div>
                          <div className="text-xs text-muted-foreground">AI assistants</div>
                        </div>
                        {config.enableAgents && <Badge variant="default">Enabled</Badge>}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`cursor-pointer transition-colors ${
                    config.enableDatabase ? 'border-primary' : ''
                  }`} onClick={() => setConfig(prev => ({ ...prev, enableDatabase: !prev.enableDatabase }))}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">Database</div>
                          <div className="text-xs text-muted-foreground">Data storage</div>
                        </div>
                        {config.enableDatabase && <Badge variant="default">Enabled</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Workspace Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="font-medium">Name</div>
                    <div className="text-sm text-muted-foreground">{config.name}</div>
                  </div>
                  {config.description && (
                    <div>
                      <div className="font-medium">Description</div>
                      <div className="text-sm text-muted-foreground">{config.description}</div>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">AI Provider & Model</div>
                    <div className="text-sm text-muted-foreground">{config.chatProvider} / {config.chatModel}</div>
                  </div>
                  <div>
                    <div className="font-medium">Features</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {config.enableRAG && <Badge variant="secondary">RAG</Badge>}
                      {config.enableWebSearch && <Badge variant="secondary">Web Search</Badge>}
                      {config.enableAgents && <Badge variant="secondary">Agents</Badge>}
                      {config.enableDatabase && <Badge variant="secondary">Database</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {step < 3 ? (
                <Button onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleCreateWorkspace} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Workspace'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}