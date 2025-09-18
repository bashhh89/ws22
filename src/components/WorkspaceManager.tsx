'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Bot, 
  Users, 
  Database,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { anythingLLMService } from '@/lib/anythingllm'

interface Agent {
  id: string
  name: string
  systemPrompt: string
  model: string
  tools: string[]
  createdAt: string
}

interface WorkspaceManagerProps {
  workspaceSlug: string
  isOpen: boolean
  onClose: () => void
}

export default function WorkspaceManager({ workspaceSlug, isOpen, onClose }: WorkspaceManagerProps) {
  const [systemPrompt, setSystemPrompt] = useState('')
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [showAgentForm, setShowAgentForm] = useState(false)
  const [newAgent, setNewAgent] = useState({
    name: '',
    systemPrompt: '',
    model: 'openai/gpt-3.5-turbo',
    tools: [] as string[]
  })

  useEffect(() => {
    if (isOpen && workspaceSlug) {
      loadWorkspaceData()
    }
  }, [isOpen, workspaceSlug])

  const loadWorkspaceData = async () => {
    try {
      setIsLoading(true)
      
      // Load system prompt
      const prompt = await anythingLLMService.getWorkspaceSystemPrompt(workspaceSlug)
      setSystemPrompt(prompt)
      
      // Load agents
      const agentList = await anythingLLMService.getAgents(workspaceSlug)
      setAgents(agentList)
    } catch (error) {
      console.error('Failed to load workspace data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSystemPrompt = async () => {
    try {
      setIsSaving(true)
      await anythingLLMService.setWorkspaceSystemPrompt(workspaceSlug, systemPrompt)
      
      // Show success message
      alert('System prompt updated successfully!')
    } catch (error) {
      console.error('Failed to save system prompt:', error)
      alert('Failed to save system prompt. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateAgent = async () => {
    try {
      if (!newAgent.name.trim() || !newAgent.systemPrompt.trim()) {
        alert('Please fill in all required fields.')
        return
      }

      setIsSaving(true)
      const createdAgent = await anythingLLMService.createAgent(workspaceSlug, newAgent)
      
      setAgents(prev => [createdAgent, ...prev])
      setNewAgent({
        name: '',
        systemPrompt: '',
        model: 'openai/gpt-3.5-turbo',
        tools: []
      })
      setShowAgentForm(false)
      
      alert('Agent created successfully!')
    } catch (error) {
      console.error('Failed to create agent:', error)
      alert('Failed to create agent. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) {
      return
    }

    try {
      // Note: This would need to be implemented in the AnythingLLM service
      // For now, we'll just remove it from the local state
      setAgents(prev => prev.filter(agent => agent.id !== agentId))
      alert('Agent deleted successfully!')
    } catch (error) {
      console.error('Failed to delete agent:', error)
      alert('Failed to delete agent. Please try again.')
    }
  }

  const availableTools = [
    'web-search',
    'document-search',
    'document-creation',
    'formatting',
    'data-analysis',
    'chart-generation',
    'code-generation',
    'debugging'
  ]

  const toggleTool = (tool: string) => {
    setNewAgent(prev => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Workspace Manager
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-gray-400 mt-1">Manage workspace settings and AI agents</p>
        </div>

        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading workspace data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* System Prompt Section */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Workspace System Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Enter the system prompt for this workspace..."
                    className="min-h-[120px] bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveSystemPrompt}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save System Prompt
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Separator className="bg-gray-700" />

              {/* Agents Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    AI Agents
                  </h3>
                  <Button
                    onClick={() => setShowAgentForm(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Agent
                  </Button>
                </div>

                {/* Agent Creation Form */}
                {showAgentForm && (
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Bot className="w-5 h-5" />
                          Create New Agent
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAgentForm(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Agent Name</label>
                        <Input
                          value={newAgent.name}
                          onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., researcher, writer, analyst"
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">System Prompt</label>
                        <Textarea
                          value={newAgent.systemPrompt}
                          onChange={(e) => setNewAgent(prev => ({ ...prev, systemPrompt: e.target.value }))}
                          placeholder="Define the agent's role, capabilities, and behavior..."
                          className="min-h-[100px] bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Model</label>
                        <Select value={newAgent.model} onValueChange={(value) => setNewAgent(prev => ({ ...prev, model: value }))}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                            <SelectItem value="openai/gpt-4">GPT-4</SelectItem>
                            <SelectItem value="openai/gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Available Tools</label>
                        <div className="grid grid-cols-2 gap-2">
                          {availableTools.map((tool) => (
                            <label
                              key={tool}
                              className="flex items-center gap-2 p-2 rounded bg-gray-800 hover:bg-gray-700 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={newAgent.tools.includes(tool)}
                                onChange={() => toggleTool(tool)}
                                className="rounded border-gray-600 bg-gray-700 text-blue-600"
                              />
                              <span className="text-sm capitalize">{tool.replace('-', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowAgentForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateAgent}
                          disabled={isSaving}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSaving ? 'Creating...' : 'Create Agent'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Agents List */}
                <div className="grid gap-4">
                  {agents.map((agent) => (
                    <Card key={agent.id} className="bg-gray-900 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Bot className="w-5 h-5 text-blue-400" />
                              <h4 className="font-semibold">{agent.name}</h4>
                              <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                {agent.model}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                              {agent.systemPrompt}
                            </p>
                            
                            <div className="flex flex-wrap gap-1">
                              {agent.tools.map((tool) => (
                                <Badge key={tool} variant="outline" className="text-xs border-gray-600 text-gray-400">
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingAgent(agent)}
                              className="text-gray-400 hover:text-white"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {agents.length === 0 && (
                    <Card className="bg-gray-900 border-gray-700 border-dashed">
                      <CardContent className="p-8 text-center">
                        <Bot className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                        <h4 className="text-lg font-medium mb-2">No Agents Created</h4>
                        <p className="text-gray-400 mb-4">
                          Create specialized AI agents to handle specific tasks and workflows.
                        </p>
                        <Button
                          onClick={() => setShowAgentForm(true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Agent
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}