'use client'

import { useState, useRef, useEffect } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  MessageSquare, 
  X, 
  Menu, 
  FileText, 
  Table, 
  Bot,
  Send,
  Plus,
  Settings,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Folder,
  Clock,
  Star,
  Search,
  Database,
  BarChart3,
  Users,
  Zap,
  MessageCircle,
  User,
  Upload,
  Sparkles,
  Edit3,
  HelpCircle,
  Wand2,
  Command
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { anythingLLMService } from '@/lib/anythingllm'
import DocumentEditor from '@/components/DocumentEditor'
import Spreadsheet from '@/components/Spreadsheet'
import DocumentUpload from '@/components/DocumentUpload'
import WorkspaceManager from '@/components/WorkspaceManager'
import CreateWorkspace from '@/components/CreateWorkspace'
import WelcomeCanvas from '@/components/WelcomeCanvas'
import EmptyStateEditor from '@/components/EmptyStateEditor'
import DocumentPreview from '@/components/DocumentPreview'
import HelpPopover from '@/components/HelpPopover'

interface Document {
  id: string
  title: string
  type: 'document' | 'spreadsheet'
  content: string
  lastModified: Date
  isStarred: boolean
}

interface Thread {
  id: string
  slug: string
  name: string
  workspaceSlug: string
  documentId?: string
  createdAt: Date
}

export default function Home() {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isRightChatOpen, setIsRightChatOpen] = useState(true)
  const [messages, setMessages] = useState<{id: number, role: string, content: string}[]>([])
  const [inputValue, setInputValue] = useState('')
  const [showCommands, setShowCommands] = useState(false)
  const [activeTab, setActiveTab] = useState('document')
  const [isLoading, setIsLoading] = useState(false)
  const [currentWorkspace, setCurrentWorkspace] = useState('theone')
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true)
  const [documentContent, setDocumentContent] = useState('')
  const [tableData, setTableData] = useState<any>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [threads, setThreads] = useState<Thread[]>([])
  const [currentThread, setCurrentThread] = useState<string | null>(null)
  const [isLoadingThreads, setIsLoadingThreads] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showWorkspaceManager, setShowWorkspaceManager] = useState(false)
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  const [showHelpPopover, setShowHelpPopover] = useState(false)
  const [showWelcomeCanvas, setShowWelcomeCanvas] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const commands = [
    { id: 'table', name: 'Create Table', description: 'Insert a new table', icon: Table },
    { id: 'document', name: 'New Document', description: 'Create a new document', icon: FileText },
    { id: 'upload', name: 'Upload Document', description: 'Upload document to workspace', icon: Upload },
    { id: 'manage', name: 'Manage Workspace', description: 'Open workspace and agent settings', icon: Settings },
    { id: 'createworkspace', name: 'Create Workspace', description: 'Create a new workspace', icon: Plus },
    { id: 'suggest', name: 'Get Suggestions', description: 'AI suggestions for current document', icon: Sparkles },
    { id: 'analyze', name: 'Analyze Document', description: 'Deep analysis of current document', icon: BarChart3 },
    { id: 'continue', name: 'Continue Writing', description: 'AI continues writing from current position', icon: Edit3 },
    { id: 'ai', name: 'AI Prompt', description: 'Custom AI prompt', icon: Bot },
    { id: 'settings', name: 'Settings', description: 'Open settings', icon: Settings },
    { id: 'summarize', name: 'Summarize', description: 'Summarize current document', icon: Bot },
    { id: 'analyze', name: 'Analyze', description: 'Analyze document content', icon: BarChart3 },
    { id: 'format', name: 'Format', description: 'Format document content', icon: Bot },
    { id: 'translate', name: 'Translate', description: 'Translate text to another language', icon: Bot },
    { id: 'generate', name: 'Generate', description: 'Generate content based on prompt', icon: Zap },
    { id: 'help', name: 'Help', description: 'Show available commands', icon: Bot },
    { id: 'test', name: 'Test Connection', description: 'Test connection to theone workspace', icon: Database },
    { id: 'explore', name: 'Explore Capabilities', description: 'Explore AnythingLLM system capabilities', icon: BarChart3 },
    { id: 'agents', name: 'List Agents', description: 'Show all available agents', icon: Users },
    { id: 'createagents', name: 'Create Agents', description: 'Create default agents for workspace', icon: Zap },
    { id: 'system', name: 'System Prompt', description: 'View workspace system prompt', icon: Settings }
  ]

  const customPrompts = [
    { id: 'blog', name: 'Blog Post', template: 'Write a blog post about: {topic}' },
    { id: 'email', name: 'Email', template: 'Write a professional email about: {topic}' },
    { id: 'code', name: 'Code', template: 'Write code to: {task}' },
    { id: 'summary', name: 'Summary', template: 'Summarize the following text: {text}' },
    { id: 'outline', name: 'Outline', template: 'Create an outline for: {topic}' }
  ]

  // Initialize AnythingLLM connection and load workspaces
  useEffect(() => {
    const initializeLLM = async () => {
      try {
        setIsLoadingWorkspaces(true)
        await anythingLLMService.verifyAuth()
        
        // Use the new getValidWorkspaces method
        const workspaceResponse = await anythingLLMService.getValidWorkspaces()
        
        // Check if the 'theone' workspace exists and works
        const theoneWorkspace = workspaceResponse.workspaces.find(ws => ws.slug === 'theone')
        
        if (theoneWorkspace) {
          // Test if 'theone' workspace works
          try {
            await anythingLLMService.chatWithWorkspace('theone', 'test')
            setWorkspaces([theoneWorkspace])
            setCurrentWorkspace('theone')
            await loadWorkspaceThreads('theone')
            
            // Create default agents for the workspace
            await anythingLLMService.createDefaultAgents('theone')
            
            setMessages(prev => [...prev, {
              id: prev.length + 1,
              role: 'assistant',
              content: 'Perfect! I\'ve connected to your "theone" workspace and created default agents. You now have access to specialized AI assistants:\n\n🔍 **Researcher** - For research and analysis\n✍️ **Writer** - For content creation\n📊 **Analyst** - For data analysis\n💻 **Coder** - For programming tasks\n\nUse @agent <name> <message> to call any agent!'
            }])
          } catch (testError) {
            // 'theone' workspace exists but has issues, try to configure it
            try {
              await anythingLLMService.configureWorkspaceSafely('theone')
              setWorkspaces([theoneWorkspace])
              setCurrentWorkspace('theone')
              await loadWorkspaceThreads('theone')
              
              // Create default agents for the workspace
              await anythingLLMService.createDefaultAgents('theone')
              
              setMessages(prev => [...prev, {
                id: prev.length + 1,
                role: 'assistant',
                content: 'I\'ve configured your "theone" workspace and created default agents. You now have access to specialized AI assistants!'
              }])
            } catch (configError) {
              // Fallback to other workspaces or create new one
              await handleFallbackWorkspace(workspaceResponse)
            }
          }
        } else {
          // 'theone' workspace doesn't exist, try to create it
          await handleFallbackWorkspace(workspaceResponse)
        }
      } catch (error) {
        console.error('Failed to initialize AnythingLLM:', error)
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: 'assistant',
          content: 'I\'m having trouble connecting to the AI service. This could be due to network issues or the service being unavailable. Please check your internet connection and ensure the AI service is running, then try again.'
        }])
      } finally {
        setIsLoadingWorkspaces(false)
      }
    }

    // Handle fallback workspace logic
    const handleFallbackWorkspace = async (workspaceResponse: any) => {
      if (workspaceResponse.validWorkspaces.length > 0) {
        setWorkspaces(workspaceResponse.validWorkspaces)
        setCurrentWorkspace(workspaceResponse.validWorkspaces[0].slug)
        await loadWorkspaceThreads(workspaceResponse.validWorkspaces[0].slug)
        
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: 'assistant',
          content: 'I\'ve connected to your AnythingLLM instance and loaded your workspaces. You can now start chatting with me!'
        }])
      } else if (workspaceResponse.workspaces.length > 0) {
        // There are workspaces but they're not properly configured
        try {
          // Try to configure the first available workspace
          const firstWorkspace = workspaceResponse.workspaces[0]
          await anythingLLMService.configureWorkspaceSafely(firstWorkspace.slug)
          
          setWorkspaces([{
            ...firstWorkspace,
            chatProvider: 'openrouter',
            chatModel: 'openai/gpt-3.5-turbo'
          }])
          setCurrentWorkspace(firstWorkspace.slug)
          
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: 'assistant',
            content: 'I\'ve configured your workspace to work without vector database. You can now start chatting with me!'
          }])
        } catch (configError) {
          // If configuration fails, create a new workspace
          const newWorkspace = await anythingLLMService.createWorkspace('App Workspace')
          await anythingLLMService.configureWorkspaceSafely(newWorkspace.slug)
          
          setWorkspaces([{
            ...newWorkspace,
            chatProvider: 'openrouter',
            chatModel: 'openai/gpt-3.5-turbo'
          }])
          setCurrentWorkspace(newWorkspace.slug)
          
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: 'assistant',
            content: 'I\'ve created and configured a new workspace for you. You can now start chatting with me!'
          }])
        }
      } else {
        // No workspaces exist, create one
        const newWorkspace = await anythingLLMService.createWorkspace('App Workspace')
        await anythingLLMService.configureWorkspaceSafely(newWorkspace.slug)
        
        setWorkspaces([{
          ...newWorkspace,
          chatProvider: 'openrouter',
          chatModel: 'openai/gpt-3.5-turbo'
        }])
        setCurrentWorkspace(newWorkspace.slug)
        
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: 'assistant',
          content: 'I\'ve created and configured a new workspace for you. You can now start chatting with me!'
        }])
      }
    }

    initializeLLM()
  }, [])

  // Load threads for a workspace
  const loadWorkspaceThreads = async (workspaceSlug: string) => {
    try {
      setIsLoadingThreads(true)
      const response = await anythingLLMService.getWorkspaceThreads(workspaceSlug)
      
      if (response && response.threads) {
        const formattedThreads: Thread[] = response.threads.map((thread: any) => ({
          id: thread.id,
          slug: thread.slug,
          name: thread.name,
          workspaceSlug: workspaceSlug,
          createdAt: new Date(thread.createdAt)
        }))
        setThreads(formattedThreads)
      } else {
        setThreads([])
      }
    } catch (error) {
      console.error('Failed to load workspace threads:', error)
      setThreads([])
    } finally {
      setIsLoadingThreads(false)
    }
  }

  // Create a new thread for a document
  const createDocumentThread = async (document: Document) => {
    try {
      const thread = await anythingLLMService.createDocumentThread(
        currentWorkspace, 
        document.id, 
        document.title
      )
      
      const newThread: Thread = {
        id: thread.id,
        slug: thread.slug,
        name: `Document: ${document.title}`,
        workspaceSlug: currentWorkspace,
        documentId: document.id,
        createdAt: new Date()
      }
      
      setThreads(prev => [newThread, ...prev])
      setCurrentThread(newThread.slug)
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant',
        content: `I've created a new thread for your document "${document.title}". You can now ask me questions about it!`
      }])
    } catch (error) {
      console.error('Failed to create document thread:', error)
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant',
        content: 'I had trouble creating a thread for this document. You can still chat with me about it though.'
      }])
    }
  }

  // Handle workspace change
  const handleWorkspaceChange = async (newWorkspaceSlug: string) => {
    setCurrentWorkspace(newWorkspaceSlug)
    setCurrentThread(null)
    setMessages([])
    await loadWorkspaceThreads(newWorkspaceSlug)
  }

  // Handle workspace creation
  const handleWorkspaceCreated = async (workspace: any) => {
    setWorkspaces(prev => [...prev, workspace])
    setCurrentWorkspace(workspace.slug)
    setCurrentThread(null)
    setMessages([])
    await loadWorkspaceThreads(workspace.slug)
    
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      role: 'assistant',
      content: `Great! I've created your new workspace "${workspace.name}" and switched to it. You can now start creating documents and chatting with me in this workspace.`
    }])
  }

  // Handle thread change
  const handleThreadChange = async (threadSlug: string) => {
    setCurrentThread(threadSlug)
    setMessages([])
    
    try {
      // Load thread messages
      const response = await anythingLLMService.getThreadChats(currentWorkspace, threadSlug)
      if (response && response.chats) {
        const formattedMessages = response.chats.map((chat: any, index: number) => ({
          id: index + 1,
          role: chat.role,
          content: chat.content
        }))
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error('Failed to load thread messages:', error)
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant',
        content: 'I had trouble loading the conversation history. You can start a new conversation though.'
      }])
    }
  }

  // Create a new thread manually
  const createNewThread = async () => {
    try {
      const thread = await anythingLLMService.createThread(currentWorkspace, 'New Conversation')
      
      const newThread: Thread = {
        id: thread.id,
        slug: thread.slug,
        name: 'New Conversation',
        workspaceSlug: currentWorkspace,
        createdAt: new Date()
      }
      
      setThreads(prev => [newThread, ...prev])
      setCurrentThread(newThread.slug)
      setMessages([])
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant',
        content: 'I\'ve created a new conversation thread for you. What would you like to talk about?'
      }])
    } catch (error) {
      console.error('Failed to create new thread:', error)
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant',
        content: 'I had trouble creating a new thread. You can still chat with me in the current thread.'
      }])
    }
  }

  // Handle workspace configuration errors
  const handleWorkspaceConfigError = async (workspaceSlug: string) => {
    try {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant',
        content: 'I\'m detecting configuration issues with this workspace. Let me try to fix it...'
      }])
      
      await anythingLLMService.configureWorkspaceSafely(workspaceSlug)
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant',
        content: 'I\'ve reconfigured the workspace to work without vector database. Please try your question again.'
      }])
    } catch (error) {
      console.error('Failed to reconfigure workspace:', error)
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant',
        content: 'I couldn\'t fix the workspace configuration automatically. You may need to check your AnythingLLM settings.'
      }])
    }
  }

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage = {
        id: messages.length + 1,
        role: 'user',
        content: inputValue
      }
      setMessages(prev => [...prev, userMessage])
      setInputValue('')
      setIsLoading(true)

      try {
        // Check if it's a command
        if (inputValue.startsWith('/')) {
          await handleCommand(inputValue.substring(1))
        } else {
          // Send to AnythingLLM with thread support and document context
          const currentDoc = selectedDocument ? documents.find(d => d.id === selectedDocument) : null
          const documentContext = currentDoc ? {
            content: currentDoc.content,
            title: currentDoc.title,
            type: currentDoc.type
          } : undefined

          const response = await anythingLLMService.chatWithWorkspaceWithContext(
            currentWorkspace, 
            inputValue, 
            documentContext,
            currentThread || undefined
          )
          
          const assistantMessage = {
            id: messages.length + 2,
            role: 'assistant',
            content: response.textResponse || 'I received your message but couldn\'t generate a response.'
          }
          setMessages(prev => [...prev, assistantMessage])
        }
      } catch (error: any) {
        console.error('Failed to get AI response:', error)
        
        let errorMessage = 'I apologize, but I encountered an error while processing your request.'
        
        // Handle specific vector database errors
        if (error.message?.includes('vector search') || error.message?.includes('vector database')) {
          errorMessage = 'I\'m having trouble with vector search, but I can still help you with general questions. Try asking me something else or check your AnythingLLM vector database configuration.'
        } else if (error.message?.includes('configured')) {
          // Try to fix the workspace configuration automatically
          await handleWorkspaceConfigError(currentWorkspace)
          return
        } else if (error.message?.includes('connection')) {
          errorMessage = 'I\'m having trouble connecting to the AI service. Please check your internet connection and try again.'
        }
        
        const errorResponse = {
          id: messages.length + 2,
          role: 'assistant',
          content: errorMessage
        }
        setMessages(prev => [...prev, errorResponse])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleCommand = async (command: string) => {
    let response = ''
    
    // Handle agent commands
    if (command.startsWith('@agent')) {
      try {
        const agentResult = await anythingLLMService.handleAgentCommand(currentWorkspace, command, currentThread || undefined)
        response = agentResult.response
      } catch (error: any) {
        response = `Error handling agent command: ${error.message || 'Unknown error'}`
      }
    } else {
      switch (command) {
      case 'table':
        response = 'I\'ll help you create a new table. Switching to table view now...'
        createNewSpreadsheet()
        break
      case 'document':
        response = 'Creating a new document for you...'
        createNewDocument()
        break
      case 'upload':
        response = 'Opening document upload dialog...'
        setShowUploadModal(true)
        break
      case 'manage':
        response = 'Opening workspace manager...'
        setShowWorkspaceManager(true)
        break
      case 'createworkspace':
        response = 'Opening workspace creation dialog...'
        setShowCreateWorkspace(true)
        break
      case 'suggest':
        response = 'Getting AI suggestions for your document...'
        if (selectedDocument && documentContent.trim() !== '') {
          try {
            const currentDoc = documents.find(d => d.id === selectedDocument)
            if (currentDoc) {
              const suggestions = await anythingLLMService.getDocumentAwareSuggestions(currentWorkspace, {
                content: documentContent,
                title: currentDoc.title,
                type: currentDoc.type
              })
              response = `🤖 **AI Suggestions for "${currentDoc.title}":**\n\n${suggestions}`
            }
          } catch (error) {
            response = 'I had trouble generating suggestions for your document. Please try again.'
          }
        } else {
          response = 'Please select a document with content to get suggestions.'
        }
        break
      case 'analyze':
        response = 'Analyzing your document...'
        if (selectedDocument && documentContent.trim() !== '') {
          try {
            const currentDoc = documents.find(d => d.id === selectedDocument)
            if (currentDoc) {
              const analysis = await anythingLLMService.analyzeDocument(currentWorkspace, {
                content: documentContent,
                title: currentDoc.title,
                type: currentDoc.type
              })
              response = `📊 **Document Analysis for "${currentDoc.title}":**\n\n${analysis}`
            }
          } catch (error) {
            response = 'I had trouble analyzing your document. Please try again.'
          }
        } else {
          response = 'Please select a document with content to analyze.'
        }
        break
      case 'continue':
        response = 'Continuing your writing...'
        if (selectedDocument && documentContent.trim() !== '') {
          try {
            const currentDoc = documents.find(d => d.id === selectedDocument)
            if (currentDoc && currentDoc.type === 'document') {
              const continuation = await anythingLLMService.continueWriting(currentWorkspace, {
                content: documentContent,
                title: currentDoc.title,
                type: 'document'
              })
              
              if (continuation) {
                // Add the continuation to the document
                const newContent = documentContent + ' ' + continuation
                setDocumentContent(newContent)
                setDocuments(prev => prev.map(doc => 
                  doc.id === selectedDocument ? { ...doc, content: newContent } : doc
                ))
                response = `✅ I've continued your writing:\n\n${continuation}`
              } else {
                response = 'I had trouble continuing your writing. Please try again.'
              }
            }
          } catch (error) {
            response = 'I had trouble continuing your writing. Please try again.'
          }
        } else {
          response = 'Please select a document with content to continue writing.'
        }
        break
      case 'summarize':
        response = 'I\'ll analyze the current document and provide a summary.'
        if (documentContent && documentContent.trim() !== '') {
          try {
            const summaryResponse = await anythingLLMService.chatWithWorkspace(
              currentWorkspace, 
              `Please summarize the following document content: ${documentContent.replace(/<[^>]*>/g, '')}`
            )
            response = summaryResponse.textResponse || 'I was unable to generate a summary. This might be due to a connection issue with the AI service. Please try again.'
          } catch (error) {
            response = 'I encountered an error while trying to summarize your document. This could be due to a connection issue with the AI service. Please check your connection and try again.'
          }
        } else {
          response = 'Please add some content to your document first, then I can summarize it for you.'
        }
        break
      case 'analyze':
        response = 'I\'ll analyze your document content and provide insights.'
        if (documentContent && documentContent.trim() !== '') {
          try {
            const analysisResponse = await anythingLLMService.chatWithWorkspace(
              currentWorkspace, 
              `Please analyze the following document content and provide insights: ${documentContent.replace(/<[^>]*>/g, '')}`
            )
            response = analysisResponse.textResponse || 'I was unable to analyze your document. This might be due to a connection issue with the AI service. Please try again.'
          } catch (error) {
            response = 'I encountered an error while trying to analyze your document. This could be due to a connection issue with the AI service. Please check your connection and try again.'
          }
        } else {
          response = 'Please add some content to your document first, then I can analyze it for you.'
        }
        break
      case 'format':
        response = 'I can help you format your document. What would you like me to do? Options: improve readability, fix grammar, add structure, or convert to a specific style.'
        break
      case 'translate':
        response = 'I can help you translate text. Please provide the text you want to translate and specify the target language.'
        break
      case 'generate':
        response = 'I can help you generate content. What would you like me to generate? (e.g., blog post, email, code, etc.)'
        break
      case 'ai':
        response = 'Choose a custom AI prompt template:\n\n' + 
          customPrompts.map(p => `/${p.id} - ${p.name}`).join('\n') + 
          '\n\nType /help to see all available commands.'
        break
      case 'help':
        response = 'Available commands:\n\n' +
          commands.map(c => `/${c.id} - ${c.description}`).join('\n') +
          '\n\nAgent Commands:\n' +
          '- @agent list - List all available agents\n' +
          '- @agent <name> <message> - Call a specific agent\n\n' +
          'Custom AI prompts:\n' +
          customPrompts.map(p => `/${p.id} - ${p.name}`).join('\n') +
          '\n\nYou can also ask me anything directly!'
        break
      case 'test':
        response = 'Testing connection to your "theone" workspace...'
        try {
          const testResponse = await anythingLLMService.chatWithWorkspace('theone', 'Hello, this is a connection test.')
          response = `✅ Connection test successful! Your "theone" workspace is working properly. Response: ${testResponse.textResponse || 'Connection established but no response text.'}`
        } catch (error: any) {
          response = `❌ Connection test failed: ${error.message || 'Unknown error'}. The workspace might need configuration.`
        }
        break
      case 'explore':
        response = 'Exploring your AnythingLLM system capabilities...'
        try {
          const capabilities = await anythingLLMService.getWorkspaceCapabilities('theone')
          
          if (capabilities) {
            let capResponse = '🔍 **AnythingLLM System Capabilities:**\n\n'
            
            capResponse += '**System Info:**\n'
            if (capabilities.system) {
              capResponse += "- Authentication: " + (capabilities.capabilities.authentication ? "✅" : "❌") + "\n"
              capResponse += `- Multi-user: ${capabilities.system.multiUser ? '✅' : '❌'}\n`
              capResponse += `- Version: ${capabilities.system.version || 'Unknown'}\n`
            }
            
            capResponse += '\n**Workspace Settings:**\n'
            if (capabilities.workspace) {
              capResponse += `- Name: ${capabilities.workspace.name}\n`
              capResponse += `- Slug: ${capabilities.workspace.slug}\n`
              capResponse += `- Chat Provider: ${capabilities.workspace.chatProvider || 'Not set'}\n`
              capResponse += `- Chat Model: ${capabilities.workspace.chatModel || 'Not set'}\n`
            }
            
            capResponse += '\n**Available Providers:**\n'
            if (capabilities.providers) {
              Object.keys(capabilities.providers).forEach(provider => {
                capResponse += `- ${provider}: ✅\n`
              })
            }
            
            capResponse += '\n**Features:**\n'
            capResponse += '- RAG (Retrieval Augmented Generation): ' + (capabilities.capabilities.rag ? '✅' : '❌') + '\n'
            capResponse += "- Web Search: " + (capabilities.capabilities.webSearch ? "✅" : "❌") + "\n"
            capResponse += "- Agents: " + (capabilities.capabilities.agents ? "✅" : "❌") + "\n"
            capResponse += "- Database: " + (capabilities.capabilities.database ? "✅" : "❌") + "\n"
            capResponse += "- Authentication: " + (capabilities.capabilities.authentication ? "✅" : "❌") + "\n"
            
            response = capResponse
          } else {
            response = '❌ Could not retrieve system capabilities. The workspace might not be properly configured.'
          }
        } catch (error: any) {
          response = `❌ Failed to explore capabilities: ${error.message || 'Unknown error'}`
        }
        break
      case 'agents':
        response = 'Getting available agents...'
        try {
          const agents = await anythingLLMService.getAgents(currentWorkspace)
          if (agents.length > 0) {
            response = '🤖 **Available Agents:**\n\n' + 
              agents.map(agent => `**${agent.name}**\n${agent.systemPrompt.substring(0, 100)}...\nTools: ${agent.tools.join(', ')}\n`).join('\n')
          } else {
            response = 'No agents found in this workspace. Use /createagents to create default agents.'
          }
        } catch (error: any) {
          response = `❌ Failed to get agents: ${error.message || 'Unknown error'}`
        }
        break
      case 'createagents':
        response = 'Creating default agents...'
        try {
          const createdAgents = await anythingLLMService.createDefaultAgents(currentWorkspace)
          response = `✅ Created ${createdAgents.length} default agents:\n` +
            createdAgents.map(agent => `- ${agent.name}`).join('\n')
        } catch (error: any) {
          response = `❌ Failed to create agents: ${error.message || 'Unknown error'}`
        }
        break
      case 'system':
        response = 'Getting workspace system prompt...'
        try {
          const systemPrompt = await anythingLLMService.getWorkspaceSystemPrompt(currentWorkspace)
          response = `**Current Workspace System Prompt:**\n\n${systemPrompt}\n\nUse /setsystem <prompt> to change it.`
        } catch (error: any) {
          response = `❌ Failed to get system prompt: ${error.message || 'Unknown error'}`
        }
        break
      default:
        // Check if it's a custom prompt
        const customPrompt = customPrompts.find(p => p.id === command)
        if (customPrompt) {
          response = `I'll help you create a ${customPrompt.name.toLowerCase()}. Please provide the necessary details for the template: "${customPrompt.template}"`
        } else {
          response = `Unknown command: ${command}. Type /help to see all available commands.`
        }
      }
    }

    const assistantMessage = {
      id: messages.length + 2,
      role: 'assistant',
      content: response
    }
    setMessages(prev => [...prev, assistantMessage])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
    if (e.key === '/' && inputValue === '') {
      setShowCommands(true)
    }
    if (e.key === 'Escape') {
      setShowCommands(false)
    }
  }

  const handleCommandSelect = (command: string) => {
    setInputValue(`/${command}`)
    setShowCommands(false)
  }

  const handleDocumentSelect = async (docId: string) => {
    setSelectedDocument(docId)
    const doc = documents.find(d => d.id === docId)
    if (doc) {
      setActiveTab(doc.type)
      if (doc.type === 'document') {
        setDocumentContent(doc.content)
      } else if (doc.type === 'spreadsheet') {
        // Load spreadsheet data from document content
        try {
          const parsedData = doc.content ? JSON.parse(doc.content) : []
          setTableData(parsedData)
        } catch {
          setTableData([])
        }
      }
      
      // Create or switch to document thread
      const existingThread = threads.find(t => t.documentId === docId)
      if (existingThread) {
        await handleThreadChange(existingThread.slug)
      } else {
        await createDocumentThread(doc)
      }
    }
  }

  const createNewDocument = () => {
    const newDoc: Document = {
      id: Date.now().toString(),
      title: 'Untitled Document',
      type: 'document',
      content: '',
      lastModified: new Date(),
      isStarred: false
    }
    setDocuments(prev => [newDoc, ...prev])
    setSelectedDocument(newDoc.id)
    setActiveTab('document')
    setDocumentContent('')
  }

  const createNewSpreadsheet = () => {
    const newDoc: Document = {
      id: Date.now().toString(),
      title: 'Untitled Spreadsheet',
      type: 'spreadsheet',
      content: '',
      lastModified: new Date(),
      isStarred: false
    }
    setDocuments(prev => [newDoc, ...prev])
    setSelectedDocument(newDoc.id)
    setActiveTab('table')
  }

  const toggleStarDocument = (docId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId ? { ...doc, isStarred: !doc.isStarred } : doc
    ))
  }

  const handleDocumentContentChange = (content: string) => {
    setDocumentContent(content)
    // Update the document object in the documents array
    if (selectedDocument) {
      setDocuments(prev => prev.map(doc => 
        doc.id === selectedDocument ? { ...doc, content } : doc
      ))
    }
  }

  const handleAIEdit = async (instruction: string, selectedText: string): Promise<string> => {
    try {
      // Use AnythingLLM to edit the text
      const prompt = `Please ${instruction.toLowerCase()} the following text. Return only the improved text without any additional explanation or formatting:\n\n"${selectedText}"`
      
      const response = await anythingLLMService.chatWithWorkspace(currentWorkspace, prompt)
      return response.textResponse || selectedText
    } catch (error) {
      console.error('AI edit failed:', error)
      return selectedText
    }
  }

  const handleTableDataChange = (data: any) => {
    setTableData(data)
    // Update the document object in the documents array
    if (selectedDocument) {
      setDocuments(prev => prev.map(doc => 
        doc.id === selectedDocument ? { ...doc, content: JSON.stringify(data) } : doc
      ))
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const starredDocuments = documents.filter(doc => doc.isStarred)

  return (
    <div className="min-h-screen bg-black-darker text-gray-200">
      <ResizablePanelGroup direction="horizontal" className="min-h-screen">
        {/* Left Sidebar - Document History */}
        {isLeftSidebarOpen && (
          <>
            <ResizablePanel 
              defaultSize={20} 
              minSize={15} 
              maxSize={30}
              className="bg-black-lighter border-r border-gray-800 panel-transition"
            >
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Workspace</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsLeftSidebarOpen(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search documents..."
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 pl-10 input-modern"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={createNewDocument}
                      size="sm"
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white btn-modern"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Doc
                    </Button>
                    <Button
                      onClick={createNewSpreadsheet}
                      size="sm"
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white btn-modern"
                    >
                      <Table className="w-4 h-4 mr-2" />
                      Sheet
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    {documents.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-400 mb-2">No documents yet</h3>
                        <p className="text-sm text-gray-500 mb-4">Create your first document or spreadsheet to get started</p>
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={createNewDocument}
                            size="sm"
                            className="bg-gray-800 hover:bg-gray-700 text-white"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            New Document
                          </Button>
                          <Button
                            onClick={createNewSpreadsheet}
                            size="sm"
                            className="bg-gray-800 hover:bg-gray-700 text-white"
                          >
                            <Table className="w-4 h-4 mr-2" />
                            New Spreadsheet
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {starredDocuments.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <h3 className="text-sm font-medium text-gray-300">Starred</h3>
                            </div>
                            <div className="space-y-2">
                              {starredDocuments.map((doc) => (
                                <div
                                  key={doc.id}
                                  onClick={() => handleDocumentSelect(doc.id)}
                                  className={cn(
                                    "document-item p-3 rounded-lg cursor-pointer",
                                    selectedDocument === doc.id && "active"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {doc.type === 'document' ? (
                                        <FileText className="w-4 h-4 text-gray-400" />
                                      ) : (
                                        <Table className="w-4 h-4 text-gray-400" />
                                      )}
                                      <div>
                                        <div className="text-sm font-medium text-gray-200">{doc.title}</div>
                                        <div className="text-xs text-gray-500">
                                          {doc.lastModified.toLocaleDateString()}
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleStarDocument(doc.id)
                                      }}
                                      className="text-gray-500 hover:text-yellow-500"
                                    >
                                      <Star className={cn("w-4 h-4", doc.isStarred && "fill-current text-yellow-500")} />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-300">Recent</h3>
                          </div>
                          <div className="space-y-2">
                            {filteredDocuments.map((doc) => (
                              <div
                                key={doc.id}
                                onClick={() => handleDocumentSelect(doc.id)}
                                className={cn(
                                  "document-item p-3 rounded-lg cursor-pointer",
                                  selectedDocument === doc.id && "active"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {doc.type === 'document' ? (
                                      <FileText className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <Table className="w-4 h-4 text-gray-400" />
                                    )}
                                    <div>
                                      <div className="text-sm font-medium text-gray-200">{doc.title}</div>
                                      <div className="text-xs text-gray-500">
                                        {doc.lastModified.toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleStarDocument(doc.id)
                                    }}
                                    className="text-gray-500 hover:text-yellow-500"
                                  >
                                    <Star className={cn("w-4 h-4", doc.isStarred && "fill-current text-yellow-500")} />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
            
            <ResizableHandle className="resize-handle" />
          </>
        )}
        
        {/* Main Content Area */}
        <ResizablePanel defaultSize={isRightChatOpen ? 60 : 100} minSize={40} maxSize={100} className="panel-transition">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 bg-black-lighter flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Menu className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={activeTab === 'document' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('document')}
                      className={cn(
                        activeTab === 'document' 
                          ? "bg-white text-black" 
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Document
                    </Button>
                    <Button
                      variant={activeTab === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('table')}
                      className={cn(
                        activeTab === 'table' 
                          ? "bg-white text-black" 
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      <Table className="w-4 h-4 mr-2" />
                      Table
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRightChatOpen(!isRightChatOpen)}
                    className={cn(
                      "text-gray-400 hover:text-white",
                      isRightChatOpen && "text-white bg-gray-800"
                    )}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 p-6 bg-black overflow-hidden">
              {activeTab === 'document' ? (
                <DocumentEditor
                  content={documentContent}
                  onChange={handleDocumentContentChange}
                  onAIEdit={handleAIEdit}
                  workspaceSlug={currentWorkspace}
                  documentId={selectedDocument || undefined}
                  setMessages={setMessages}
                />
              ) : (
                <Spreadsheet
                  data={tableData}
                  onChange={handleTableDataChange}
                />
              )}
            </div>
          </div>
        </ResizablePanel>
        
        {/* Right AI Chat Sidebar */}
        {isRightChatOpen && (
          <>
            <ResizableHandle className="resize-handle" />
            <ResizablePanel 
              defaultSize={20} 
              minSize={15} 
              maxSize={40}
              className="bg-black-lighter border-l border-gray-800 panel-transition"
            >
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-800 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full glow-effect"></div>
                      <Bot className="w-5 h-5 text-gray-300" />
                      <h2 className="font-semibold text-gray-300">AI Assistant</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsRightChatOpen(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Workspace Selector */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-400">Workspace:</span>
                    <div className="flex-1">
                      <Select 
                        value={currentWorkspace} 
                        onValueChange={handleWorkspaceChange}
                        disabled={isLoadingWorkspaces || workspaces.length === 0}
                      >
                        <SelectTrigger className="w-full h-8 bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Select workspace" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {isLoadingWorkspaces ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                              <span className="ml-2 text-sm text-gray-400">Loading...</span>
                            </div>
                          ) : workspaces.length === 0 ? (
                            <div className="p-2 text-sm text-gray-400">No workspaces available</div>
                          ) : (
                            workspaces.map((workspace) => (
                              <SelectItem 
                                key={workspace.slug} 
                                value={workspace.slug}
                                className="text-white hover:bg-gray-700 focus:bg-gray-700"
                              >
                                {workspace.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={() => setShowCreateWorkspace(true)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                      title="Create new workspace"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Thread Selector */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-400">Thread:</span>
                    <div className="flex gap-1 flex-1">
                      <Select 
                        value={currentThread || ''} 
                        onValueChange={handleThreadChange}
                        disabled={isLoadingThreads || threads.length === 0}
                        className="flex-1"
                      >
                        <SelectTrigger className="w-full h-8 bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Select thread" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {isLoadingThreads ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                              <span className="ml-2 text-sm text-gray-400">Loading...</span>
                            </div>
                          ) : threads.length === 0 ? (
                            <div className="p-2 text-sm text-gray-400">No threads available</div>
                          ) : (
                            threads.map((thread) => (
                              <SelectItem 
                                key={thread.slug} 
                                value={thread.slug}
                                className="text-white hover:bg-gray-700 focus:bg-gray-700"
                              >
                                <div className="flex items-center gap-2">
                                  <MessageCircle className="w-3 h-3" />
                                  {thread.name}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={createNewThread}
                        size="sm"
                        variant="ghost"
                        className="p-2 h-8 bg-gray-800 hover:bg-gray-700 text-white"
                        title="Create new thread"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4 h-full">
                    <div className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)]">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-3 message-slide-in",
                            message.role === 'user' ? "justify-end" : "justify-start"
                          )}
                        >
                          {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-700">
                              <Bot className="w-4 h-4 text-gray-300" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-3 py-2",
                              message.role === 'user'
                                ? "user-message text-white"
                                : "ai-message text-gray-200"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-700">
                              <span className="text-sm font-medium text-gray-300">U</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-3 justify-start">
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-700">
                            <Bot className="w-4 h-4 text-gray-300" />
                          </div>
                          <div className="ai-message rounded-lg px-3 py-2">
                            <div className="loading-dots">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t border-gray-800 flex-shrink-0">
                  <div className="relative">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask me anything..."
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 input-modern"
                    />
                    {showCommands && (
                      <Card className="absolute bottom-full mb-2 w-full bg-gray-800 border-gray-700 card-modern command-fade-in">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-300">Commands & Prompts</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500 font-medium mb-2">COMMANDS</div>
                            {commands.map((command) => (
                              <button
                                key={command.id}
                                onClick={() => handleCommandSelect(command.id)}
                                className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-700 text-left interactive-hover"
                              >
                                <command.icon className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium text-gray-200">/{command.id}</div>
                                  <div className="text-xs text-gray-500">{command.description}</div>
                                </div>
                              </button>
                            ))}
                            <div className="text-xs text-gray-500 font-medium mb-2 mt-3">CUSTOM PROMPTS</div>
                            {customPrompts.map((prompt) => (
                              <button
                                key={prompt.id}
                                onClick={() => handleCommandSelect(prompt.id)}
                                className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-700 text-left interactive-hover"
                              >
                                <Bot className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium text-gray-200">/{prompt.id}</div>
                                  <div className="text-xs text-gray-500">{prompt.name}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <Button
                      onClick={handleSendMessage}
                      size="sm"
                      disabled={isLoading}
                      className={cn(
                        "absolute right-1 top-1 bg-white text-black hover:bg-gray-200",
                        isLoading && "bg-gray-600"
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Document Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Upload Documents to Workspace</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <DocumentUpload
                workspaceSlug={currentWorkspace}
                onUploadComplete={(documents) => {
                  setMessages(prev => [...prev, {
                    id: prev.length + 1,
                    role: 'assistant',
                    content: `✅ Successfully uploaded ${documents.length} document(s) to your workspace. You can now ask me questions about them!`
                  }])
                  setShowUploadModal(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Workspace Manager Modal */}
      {showWorkspaceManager && (
        <WorkspaceManager
          workspaceSlug={currentWorkspace}
          isOpen={showWorkspaceManager}
          onClose={() => setShowWorkspaceManager(false)}
        />
      )}

      {/* Create Workspace Modal */}
      <CreateWorkspace
        onWorkspaceCreated={handleWorkspaceCreated}
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
      />
    </div>
  )
}