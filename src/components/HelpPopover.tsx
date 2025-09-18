'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  HelpCircle, 
  X, 
  FileText, 
  Wand2, 
  Command, 
  Keyboard,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Lightbulb
} from 'lucide-react'

interface HelpPopoverProps {
  isOpen: boolean
  onClose: () => void
}

export default function HelpPopover({ isOpen, onClose }: HelpPopoverProps) {
  const [activeTab, setActiveTab] = useState('getting-started')

  const tabs = [
    { id: 'getting-started', label: 'Getting Started', icon: FileText },
    { id: 'ai-features', label: 'AI Features', icon: Wand2 },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'tips', label: 'Pro Tips', icon: Lightbulb }
  ]

  const gettingStartedSteps = [
    {
      title: 'Create Your First Document',
      description: 'Click "New Document" or press ⌘+N to start creating',
      icon: CheckCircle,
      completed: false
    },
    {
      title: 'Explore AI Features',
      description: 'Select any text to see AI suggestions and actions',
      icon: CheckCircle,
      completed: false
    },
    {
      title: 'Try Slash Commands',
      description: 'Type / anywhere to access quick commands',
      icon: CheckCircle,
      completed: false
    },
    {
      title: 'Use the AI Assistant',
      description: 'Chat with AI in the right panel for help and ideas',
      icon: CheckCircle,
      completed: false
    }
  ]

  const aiFeatures = [
    {
      title: 'Smart Writing Assistant',
      description: 'Get real-time suggestions as you type',
      icon: Sparkles
    },
    {
      title: 'Content Improvement',
      description: 'Select text and ask AI to improve, shorten, or expand it',
      icon: Wand2
    },
    {
      title: 'Document Analysis',
      description: 'Get insights and summaries of your documents',
      icon: FileText
    },
    {
      title: 'Creative Writing',
      description: 'Generate ideas, outlines, and complete content',
      icon: Sparkles
    }
  ]

  const shortcuts = [
    { key: '⌘+N', description: 'New Document' },
    { key: '⌘+S', description: 'Save Document' },
    { key: '⌘+K', description: 'Open Command Palette' },
    { key: '⌘+/', description: 'Show Help' },
    { key: '/', description: 'Slash Commands' },
    { key: '⌘+B', description: 'Bold Text' },
    { key: '⌘+I', description: 'Italic Text' },
    { key: '⌘+Enter', description: 'AI Continue Writing' }
  ]

  const proTips = [
    {
      title: 'Use Context-Aware AI',
      description: 'AI understands your document context for better suggestions'
    },
    {
      title: 'Keyboard Navigation',
      description: 'Use arrow keys to navigate and Enter to select commands'
    },
    {
      title: 'Quick Actions',
      description: 'Hover near cursor for quick insert menu'
    },
    {
      title: 'Template System',
      description: 'Use templates for consistent document formatting'
    }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-800 max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">How to Get Started</CardTitle>
                <p className="text-sm text-gray-400">Everything you need to know in 2 minutes</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Tab navigation */}
          <div className="flex gap-2 mt-4">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2",
                  activeTab === tab.id 
                    ? "bg-blue-500 text-white" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'getting-started' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Welcome to your AI Workspace!</h3>
                <p className="text-gray-400">Follow these quick steps to get started</p>
              </div>
              
              <div className="space-y-4">
                {gettingStartedSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1">{step.title}</h4>
                      <p className="text-sm text-gray-400">{step.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Creating
                </Button>
              </div>
            </div>
          )}
          
          {activeTab === 'ai-features' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Features</h3>
                <p className="text-gray-400">Discover what AI can do for you</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {aiFeatures.map((feature, index) => (
                  <Card key={index} className="bg-gray-800/50 border-gray-700 p-4">
                    <CardContent className="p-0">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                          <feature.icon className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-1">{feature.title}</h4>
                          <p className="text-sm text-gray-400">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Keyboard Shortcuts</h3>
                <p className="text-gray-400">Work faster with these shortcuts</p>
              </div>
              
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                    <span className="text-gray-300">{shortcut.description}</span>
                    <kbd className="px-3 py-1 bg-gray-700 rounded text-sm text-white font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
              
              <div className="text-center text-sm text-gray-500">
                Press ⌘+K anytime to see all available commands
              </div>
            </div>
          )}
          
          {activeTab === 'tips' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Pro Tips</h3>
                <p className="text-gray-400">Power user techniques</p>
              </div>
              
              <div className="space-y-4">
                {proTips.map((tip, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-1">{tip.title}</h4>
                        <p className="text-sm text-gray-300">{tip.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}