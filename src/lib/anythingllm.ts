import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_ANYTHINGLLM_API_URL || '';
const API_KEY = process.env.ANYTHINGLLM_API_KEY || '';

class AnythingLLMService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  async verifyAuth() {
    try {
      const response = await this.api.get('/v1/auth')
      return response.data
    } catch (error) {
      console.error('Auth verification failed:', error)
      throw error
    }
  }

  async getWorkspaces() {
    try {
      const response = await this.api.get('/v1/workspaces')
      return response.data
    } catch (error) {
      console.error('Failed to get workspaces:', error)
      throw error
    }
  }

  async createWorkspace(name: string) {
    try {
      const response = await this.api.post('/v1/workspace/new', { name })
      return response.data
    } catch (error) {
      console.error('Failed to create workspace:', error)
      throw error
    }
  }

  async updateWorkspace(workspaceSlug: string, updates: any) {
    try {
      const response = await this.api.post(`/v1/workspace/${workspaceSlug}/update`, updates)
      return response.data
    } catch (error) {
      console.error('Failed to update workspace:', error)
      throw error
    }
  }

  // Method to chat with workspace with document context
  async chatWithWorkspaceWithContext(workspaceSlug: string, message: string, documentContext?: {
    content: string
    title: string
    type: 'document' | 'spreadsheet'
  }, threadId?: string) {
    try {
      let enhancedMessage = message
      
      // If document context is provided, enhance the message with context
      if (documentContext && documentContext.content && documentContext.content.trim() !== '') {
        const cleanContent = documentContext.content.replace(/<[^>]*>/g, '').substring(0, 2000) // Limit context length
        enhancedMessage = `The user is currently working on a ${documentContext.type} titled "${documentContext.title}". Here is the current content:\n\n${cleanContent}\n\n---\n\nThe user's request: ${message}`
      }

      const payload: any = {
        message: enhancedMessage,
        mode: 'chat'
      }

      if (threadId) {
        payload.threadId = threadId
      }

      const response = await this.api.post(`/v1/workspace/${workspaceSlug}/chat`, payload)
      return response.data
    } catch (error: any) {
      console.error('Failed to chat with workspace with context:', error)
      
      // Handle vector database errors gracefully
      if (error.response?.data?.message?.includes('vector column') || 
          error.response?.data?.message?.includes('vector dimension')) {
        // Fallback to simple chat without vector search
        try {
          const fallbackPayload = {
            message: enhancedMessage,
            mode: 'chat',
            // Disable vector search if it's causing issues
            searchMethod: 'text'
          }
          
          if (threadId) {
            fallbackPayload.threadId = threadId
          }

          const fallbackResponse = await this.api.post(`/v1/workspace/${workspaceSlug}/chat`, fallbackPayload)
          return fallbackResponse.data
        } catch (fallbackError) {
          console.error('Fallback chat also failed:', fallbackError)
          throw new Error('Vector search is not properly configured for this workspace. Please check your AnythingLLM settings.')
        }
      }
      
      throw error
    }
  }

  // Method to get document-aware suggestions
  async getDocumentAwareSuggestions(workspaceSlug: string, documentContext: {
    content: string
    title: string
    type: 'document' | 'spreadsheet'
  }) {
    try {
      const cleanContent = documentContext.content.replace(/<[^>]*>/g, '').substring(0, 1000)
      const prompt = `Based on the following ${documentContext.type} content, provide helpful suggestions for improvements, next steps, or related actions:\n\nTitle: ${documentContext.title}\n\nContent:\n${cleanContent}\n\nPlease provide 3-5 specific, actionable suggestions in bullet points.`

      const response = await this.chatWithWorkspace(workspaceSlug, prompt)
      return response.textResponse || 'No suggestions available.'
    } catch (error) {
      console.error('Failed to get document suggestions:', error)
      return 'Unable to generate suggestions at this time.'
    }
  }

  // Method to analyze document and provide insights
  async analyzeDocument(workspaceSlug: string, documentContext: {
    content: string
    title: string
    type: 'document' | 'spreadsheet'
  }) {
    try {
      const cleanContent = documentContext.content.replace(/<[^>]*>/g, '')
      const prompt = `Please analyze the following ${documentContext.type} and provide insights:\n\nTitle: ${documentContext.title}\n\nContent:\n${cleanContent}\n\nPlease provide:\n1. A brief summary\n2. Key points or themes\n3. Structure analysis\n4. Improvement suggestions\n5. Next steps or actions`

      const response = await this.chatWithWorkspace(workspaceSlug, prompt)
      return response.textResponse || 'Analysis unavailable.'
    } catch (error) {
      console.error('Failed to analyze document:', error)
      return 'Unable to analyze document at this time.'
    }
  }

  // Method to continue writing from current position
  async continueWriting(workspaceSlug: string, documentContext: {
    content: string
    title: string
    type: 'document'
  }, lastSentence?: string) {
    try {
      const cleanContent = documentContext.content.replace(/<[^>]*>/g, '')
      const contextText = lastSentence || cleanContent.split('.').slice(-3).join('.').trim()
      
      const prompt = `Continue writing from where the user left off. Here's the context:\n\nDocument Title: ${documentContext.title}\n\nRecent Content: ${contextText}\n\nPlease continue writing in the same style and tone. Write 2-3 sentences that naturally follow from the current content.`

      const response = await this.chatWithWorkspace(workspaceSlug, prompt)
      return response.textResponse || ''
    } catch (error) {
      console.error('Failed to continue writing:', error)
      return ''
    }
  }

  // Method to edit specific portion of document
  async editDocumentSection(workspaceSlug: string, instruction: string, selectedText: string, documentContext?: {
    content: string
    title: string
  }) {
    try {
      let prompt = `Please edit the following text based on this instruction: "${instruction}"\n\nText to edit: "${selectedText}"\n\nReturn only the improved text without any additional explanation or formatting.`
      
      if (documentContext) {
        const cleanContent = documentContext.content.replace(/<[^>]*>/g, '').substring(0, 1000)
        prompt += `\n\nDocument context for reference:\nTitle: ${documentContext.title}\nContent: ${cleanContent}`
      }

      const response = await this.chatWithWorkspace(workspaceSlug, prompt)
      return response.textResponse || selectedText
    } catch (error) {
      console.error('Failed to edit document section:', error)
      return selectedText
    }
  }

  // Original chat method for backward compatibility
  async chatWithWorkspace(workspaceSlug: string, message: string, threadId?: string) {
    try {
      const payload: any = {
        message,
        mode: 'chat'
      }

      if (threadId) {
        payload.threadId = threadId
      }

      const response = await this.api.post(`/v1/workspace/${workspaceSlug}/chat`, payload)
      return response.data
    } catch (error: any) {
      console.error('Failed to chat with workspace:', error)
      
      // Handle vector database errors gracefully
      if (error.response?.data?.message?.includes('vector column') || 
          error.response?.data?.message?.includes('vector dimension')) {
        // Fallback to simple chat without vector search
        try {
          const fallbackPayload = {
            message,
            mode: 'chat',
            // Disable vector search if it's causing issues
            searchMethod: 'text'
          }
          
          if (threadId) {
            fallbackPayload.threadId = threadId
          }

          const fallbackResponse = await this.api.post(`/v1/workspace/${workspaceSlug}/chat`, fallbackPayload)
          return fallbackResponse.data
        } catch (fallbackError) {
          console.error('Fallback chat also failed:', fallbackError)
          throw new Error('Vector search is not properly configured for this workspace. Please check your AnythingLLM settings.')
        }
      }
      
      throw error
    }
  }

  async streamChatWithWorkspace(workspaceSlug: string, message: string, threadId?: string) {
    try {
      const payload: any = {
        message,
        mode: 'chat'
      }

      if (threadId) {
        payload.threadId = threadId
      }

      const response = await this.api.post(`/v1/workspace/${workspaceSlug}/stream-chat`, payload, {
        responseType: 'stream'
      })
      return response
    } catch (error: any) {
      console.error('Failed to stream chat with workspace:', error)
      
      // Handle vector database errors gracefully
      if (error.response?.data?.message?.includes('vector column') || 
          error.response?.data?.message?.includes('vector dimension')) {
        throw new Error('Vector search is not properly configured for this workspace. Please check your AnythingLLM settings.')
      }
      
      throw error
    }
  }

  async getWorkspaceChats(workspaceSlug: string) {
    try {
      const response = await this.api.get(`/v1/workspace/${workspaceSlug}/chats`)
      return response.data
    } catch (error) {
      console.error('Failed to get workspace chats:', error)
      throw error
    }
  }

  async uploadDocument(file: File, workspaceSlug?: string) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const url = workspaceSlug 
        ? `/v1/document/upload?workspaceSlug=${workspaceSlug}`
        : '/v1/document/upload'

      const response = await this.api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Failed to upload document:', error)
      throw error
    }
  }

  async getDocuments() {
    try {
      const response = await this.api.get('/v1/documents')
      return response.data
    } catch (error) {
      console.error('Failed to get documents:', error)
      throw error
    }
  }

  async vectorSearch(workspaceSlug: string, query: string) {
    try {
      const response = await this.api.post(`/v1/workspace/${workspaceSlug}/vector-search`, {
        query
      })
      return response.data
    } catch (error: any) {
      console.error('Failed to perform vector search:', error)
      
      // Handle vector database errors gracefully
      if (error.response?.data?.message?.includes('vector column') || 
          error.response?.data?.message?.includes('vector dimension')) {
        // Return empty results instead of throwing error
        return { 
          results: [], 
          error: 'Vector search not available',
          message: 'Vector database is not properly configured for this workspace.'
        }
      }
      
      throw error
    }
  }

  async createThread(workspaceSlug: string, name?: string) {
    try {
      const response = await this.api.post(`/v1/workspace/${workspaceSlug}/thread/new`, {
        name: name || 'New Thread'
      })
      return response.data
    } catch (error) {
      console.error('Failed to create thread:', error)
      throw error
    }
  }

  async getThreadChats(workspaceSlug: string, threadSlug: string) {
    try {
      const response = await this.api.get(`/v1/workspace/${workspaceSlug}/thread/${threadSlug}/chats`)
      return response.data
    } catch (error) {
      console.error('Failed to get thread chats:', error)
      throw error
    }
  }

  async getWorkspaceThreads(workspaceSlug: string) {
    try {
      const response = await this.api.get(`/v1/workspace/${workspaceSlug}/threads`)
      return response.data
    } catch (error) {
      console.error('Failed to get workspace threads:', error)
      throw error
    }
  }

  async deleteThread(workspaceSlug: string, threadSlug: string) {
    try {
      const response = await this.api.delete(`/v1/workspace/${workspaceSlug}/thread/${threadSlug}`)
      return response.data
    } catch (error) {
      console.error('Failed to delete thread:', error)
      throw error
    }
  }

  // New method to handle document-based threads
  async createDocumentThread(workspaceSlug: string, documentId: string, documentName: string) {
    try {
      const threadName = `Document: ${documentName}`
      const thread = await this.createThread(workspaceSlug, threadName)
      
      // Store document metadata in thread (this would be handled by AnythingLLM internally)
      return thread
    } catch (error) {
      console.error('Failed to create document thread:', error)
      throw error
    }
  }

  // Method to get workspaces with proper configuration checking
  async getValidWorkspaces() {
    try {
      const response = await this.getWorkspaces()
      
      if (!response.workspaces || response.workspaces.length === 0) {
        return { workspaces: [], validWorkspaces: [] }
      }

      // Check each workspace for basic configuration
      const validWorkspaces = response.workspaces.filter((ws: any) => {
        // Basic check - workspace exists and has a slug
        return ws && ws.slug
      })

      return {
        workspaces: response.workspaces,
        validWorkspaces: validWorkspaces
      }
    } catch (error) {
      console.error('Failed to get valid workspaces:', error)
      return { workspaces: [], validWorkspaces: [] }
    }
  }

  // Method to configure workspace with safe defaults
  async configureWorkspaceSafely(workspaceSlug: string) {
    try {
      const updates = {
        chatProvider: 'openrouter',
        chatModel: 'openai/gpt-3.5-turbo',
        openAiPrompt: 'You are a helpful AI assistant that helps users with documents, spreadsheets, and general productivity tasks.',
        // Disable vector database if it's causing issues
        vectorDB: 'none'
      }

      return await this.updateWorkspace(workspaceSlug, updates)
    } catch (error) {
      console.error('Failed to configure workspace:', error)
      throw error
    }
  }

  // Method to get system information and capabilities
  async getSystemInfo() {
    try {
      const response = await this.api.get('/v1/system')
      return response.data
    } catch (error) {
      console.error('Failed to get system info:', error)
      return null
    }
  }

  // Method to get available providers and models
  async getProviders() {
    try {
      const response = await this.api.get('/v1/providers')
      return response.data
    } catch (error) {
      console.error('Failed to get providers:', error)
      return null
    }
  }

  // Method to get workspace details with configuration
  async getWorkspaceDetails(workspaceSlug: string) {
    try {
      const response = await this.api.get(`/v1/workspace/${workspaceSlug}`)
      return response.data
    } catch (error) {
      console.error('Failed to get workspace details:', error)
      return null
    }
  }

  // Method to check workspace capabilities
  async getWorkspaceCapabilities(workspaceSlug: string) {
    try {
      const details = await this.getWorkspaceDetails(workspaceSlug)
      const system = await this.getSystemInfo()
      const providers = await this.getProviders()
      
      return {
        workspace: details,
        system: system,
        providers: providers,
        capabilities: {
          rag: details?.settings?.rag || false,
          webSearch: details?.settings?.webSearch || false,
          agents: details?.settings?.agents || false,
          database: details?.settings?.database || false,
          authentication: system?.authentication || false
        }
      }
    } catch (error) {
      console.error('Failed to get workspace capabilities:', error)
      return null
    }
  }

  // Method to set workspace system prompt
  async setWorkspaceSystemPrompt(workspaceSlug: string, systemPrompt: string) {
    try {
      const updates = {
        openAiPrompt: systemPrompt
      }
      return await this.updateWorkspace(workspaceSlug, updates)
    } catch (error) {
      console.error('Failed to set workspace system prompt:', error)
      throw error
    }
  }

  // Method to get workspace system prompt
  async getWorkspaceSystemPrompt(workspaceSlug: string) {
    try {
      const details = await this.getWorkspaceDetails(workspaceSlug)
      return details?.settings?.openAiPrompt || 'You are a helpful AI assistant.'
    } catch (error) {
      console.error('Failed to get workspace system prompt:', error)
      return 'You are a helpful AI assistant.'
    }
  }

  // Agent system methods
  async createAgent(workspaceSlug: string, agentConfig: {
    name: string
    systemPrompt: string
    model?: string
    tools?: string[]
  }) {
    try {
      // Store agent configuration in workspace metadata
      const details = await this.getWorkspaceDetails(workspaceSlug)
      const currentAgents = details?.settings?.agents || []
      
      const newAgent = {
        id: Date.now().toString(),
        name: agentConfig.name,
        systemPrompt: agentConfig.systemPrompt,
        model: agentConfig.model || 'openai/gpt-3.5-turbo',
        tools: agentConfig.tools || [],
        createdAt: new Date().toISOString()
      }

      const updatedAgents = [...currentAgents, newAgent]
      await this.updateWorkspace(workspaceSlug, { 
        agents: updatedAgents 
      })

      return newAgent
    } catch (error) {
      console.error('Failed to create agent:', error)
      throw error
    }
  }

  async getAgents(workspaceSlug: string) {
    try {
      const details = await this.getWorkspaceDetails(workspaceSlug)
      return details?.settings?.agents || []
    } catch (error) {
      console.error('Failed to get agents:', error)
      return []
    }
  }

  async callAgent(workspaceSlug: string, agentId: string, message: string, threadId?: string) {
    try {
      const agents = await this.getAgents(workspaceSlug)
      const agent = agents.find(a => a.id === agentId)
      
      if (!agent) {
        throw new Error('Agent not found')
      }

      // Create a temporary thread for this agent call
      const tempThread = await this.createThread(workspaceSlug, `Agent: ${agent.name}`)
      
      try {
        // Set agent-specific system prompt temporarily
        const originalPrompt = await this.getWorkspaceSystemPrompt(workspaceSlug)
        await this.setWorkspaceSystemPrompt(workspaceSlug, agent.systemPrompt)

        // Send message with agent configuration
        const response = await this.chatWithWorkspace(
          workspaceSlug, 
          message, 
          threadId || tempThread.slug
        )

        // Restore original system prompt
        await this.setWorkspaceSystemPrompt(workspaceSlug, originalPrompt)

        // Clean up temporary thread if not using existing thread
        if (!threadId) {
          await this.deleteThread(workspaceSlug, tempThread.slug)
        }

        return {
          response: response.textResponse,
          agent: agent.name,
          threadId: threadId || tempThread.slug
        }
      } catch (chatError) {
        // Clean up temporary thread on error
        if (!threadId) {
          await this.deleteThread(workspaceSlug, tempThread.slug)
        }
        throw chatError
      }
    } catch (error) {
      console.error('Failed to call agent:', error)
      throw error
    }
  }

  // Method to handle @agent commands
  async handleAgentCommand(workspaceSlug: string, command: string, threadId?: string) {
    try {
      const agents = await this.getAgents(workspaceSlug)
      
      if (command.startsWith('@agent ')) {
        const parts = command.split(' ')
        const agentName = parts[1]
        const message = parts.slice(2).join(' ')
        
        if (!agentName || !message) {
          return {
            response: 'Usage: @agent <agent_name> <message>\n\nAvailable agents:\n' + 
                     agents.map(a => `- ${a.name}: ${a.systemPrompt.substring(0, 100)}...`).join('\n'),
            error: 'Invalid command format'
          }
        }

        const agent = agents.find(a => a.name.toLowerCase() === agentName.toLowerCase())
        if (!agent) {
          return {
            response: `Agent "${agentName}" not found. Available agents:\n` + 
                     agents.map(a => `- ${a.name}`).join('\n'),
            error: 'Agent not found'
          }
        }

        const result = await this.callAgent(workspaceSlug, agent.id, message, threadId)
        return {
          response: result.response,
          agent: result.agent,
          threadId: result.threadId
        }
      } else if (command === '@agent list') {
        return {
          response: 'Available agents:\n' + 
                   agents.map(a => `- ${a.name}: ${a.systemPrompt.substring(0, 100)}...`).join('\n'),
          agents: agents
        }
      } else {
        return {
          response: 'Agent commands:\n' +
                   '- @agent list: List all available agents\n' +
                   '- @agent <agent_name> <message>: Call a specific agent\n\n' +
                   'Available agents:\n' +
                   agents.map(a => `- ${a.name}`).join('\n'),
          error: 'Unknown agent command'
        }
      }
    } catch (error) {
      console.error('Failed to handle agent command:', error)
      return {
        response: 'Error processing agent command.',
        error: error.message
      }
    }
  }

  // Method to get workspace-specific documents
  async getWorkspaceDocuments(workspaceSlug: string) {
    try {
      const response = await this.api.get(`/v1/workspace/${workspaceSlug}/documents`)
      return response.data
    } catch (error) {
      console.error('Failed to get workspace documents:', error)
      throw error
    }
  }

  // Method to upload document to specific workspace
  async uploadDocumentToWorkspace(file: File, workspaceSlug: string) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await this.api.post(`/v1/document/upload?workspaceSlug=${workspaceSlug}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Failed to upload document to workspace:', error)
      throw error
    }
  }

  // Method to create workspace-specific document metadata
  async createWorkspaceDocument(workspaceSlug: string, documentData: {
    title: string
    content: string
    type: 'document' | 'spreadsheet'
    metadata?: any
  }) {
    try {
      // Create a temporary file with the content
      const blob = new Blob([documentData.content], { type: 'text/plain' })
      const file = new File([blob], `${documentData.title}.txt`, { type: 'text/plain' })
      
      // Upload to workspace
      const uploadResponse = await this.uploadDocumentToWorkspace(file, workspaceSlug)
      
      // Store additional metadata in workspace settings
      const details = await this.getWorkspaceDetails(workspaceSlug)
      const currentDocuments = details?.settings?.documents || []
      
      const newDocument = {
        id: uploadResponse.documentId || Date.now().toString(),
        title: documentData.title,
        type: documentData.type,
        content: documentData.content,
        metadata: documentData.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const updatedDocuments = [...currentDocuments, newDocument]
      await this.updateWorkspace(workspaceSlug, { 
        documents: updatedDocuments 
      })

      return newDocument
    } catch (error) {
      console.error('Failed to create workspace document:', error)
      throw error
    }
  }

  // Method to update workspace-specific document
  async updateWorkspaceDocument(workspaceSlug: string, documentId: string, updates: {
    content?: string
    title?: string
    metadata?: any
  }) {
    try {
      const details = await this.getWorkspaceDetails(workspaceSlug)
      const currentDocuments = details?.settings?.documents || []
      
      const updatedDocuments = currentDocuments.map((doc: any) => 
        doc.id === documentId 
          ? { 
              ...doc, 
              ...updates, 
              updatedAt: new Date().toISOString() 
            } 
          : doc
      )

      await this.updateWorkspace(workspaceSlug, { 
        documents: updatedDocuments 
      })

      return updatedDocuments.find((doc: any) => doc.id === documentId)
    } catch (error) {
      console.error('Failed to update workspace document:', error)
      throw error
    }
  }

  // Method to delete workspace-specific document
  async deleteWorkspaceDocument(workspaceSlug: string, documentId: string) {
    try {
      const details = await this.getWorkspaceDetails(workspaceSlug)
      const currentDocuments = details?.settings?.documents || []
      
      const updatedDocuments = currentDocuments.filter((doc: any) => doc.id !== documentId)
      
      await this.updateWorkspace(workspaceSlug, { 
        documents: updatedDocuments 
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to delete workspace document:', error)
      throw error
    }
  }

  // Method to search workspace documents
  async searchWorkspaceDocuments(workspaceSlug: string, query: string) {
    try {
      const details = await this.getWorkspaceDetails(workspaceSlug)
      const documents = details?.settings?.documents || []
      
      // Simple text search for now
      const results = documents.filter((doc: any) => {
        const searchText = `${doc.title} ${doc.content}`.toLowerCase()
        return searchText.includes(query.toLowerCase())
      })

      return { results, total: results.length }
    } catch (error) {
      console.error('Failed to search workspace documents:', error)
      return { results: [], total: 0 }
    }
  }

  // Method to get document by ID from workspace
  async getWorkspaceDocument(workspaceSlug: string, documentId: string) {
    try {
      const details = await this.getWorkspaceDetails(workspaceSlug)
      const documents = details?.settings?.documents || []
      
      return documents.find((doc: any) => doc.id === documentId) || null
    } catch (error) {
      console.error('Failed to get workspace document:', error)
      return null
    }
  }

  // Method to create default agents for workspace
  async createDefaultAgents(workspaceSlug: string) {
    const defaultAgents = [
      {
        name: 'researcher',
        systemPrompt: 'You are a research assistant. Your job is to search for information, summarize findings, and provide detailed analysis on any topic.',
        tools: ['web-search', 'document-search']
      },
      {
        name: 'writer',
        systemPrompt: 'You are a professional writer. Your job is to create well-structured, engaging content including articles, emails, reports, and other written materials.',
        tools: ['document-creation', 'formatting']
      },
      {
        name: 'analyst',
        systemPrompt: 'You are a data analyst. Your job is to analyze information, identify patterns, create insights, and present data in meaningful ways.',
        tools: ['data-analysis', 'chart-generation']
      },
      {
        name: 'coder',
        systemPrompt: 'You are a software developer. Your job is to write, debug, and explain code in various programming languages.',
        tools: ['code-generation', 'debugging']
      }
    ]

    const createdAgents = []
    for (const agentConfig of defaultAgents) {
      try {
        const agent = await this.createAgent(workspaceSlug, agentConfig)
        createdAgents.push(agent)
      } catch (error) {
        console.error(`Failed to create agent ${agentConfig.name}:`, error)
      }
    }

    return createdAgents
  }
}

export const anythingLLMService = new AnythingLLMService()
export default anythingLLMService
