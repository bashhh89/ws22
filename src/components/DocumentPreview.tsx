'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Table as TableIcon, 
  Star,
  Clock,
  Hash,
  BookOpen,
  User,
  MoreHorizontal,
  Edit3,
  Trash2,
  Copy,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentPreviewProps {
  document: {
    id: string
    title: string
    type: 'document' | 'spreadsheet'
    content: string
    lastModified: Date
    isStarred: boolean
  }
  isActive?: boolean
  onClick: () => void
  onStar?: (id: string) => void
  onDelete?: (id: string) => void
  onDuplicate?: (id: string) => void
  onView?: (id: string) => void
}

export default function DocumentPreview({
  document,
  isActive = false,
  onClick,
  onStar,
  onDelete,
  onDuplicate,
  onView
}: DocumentPreviewProps) {
  const [preview, setPreview] = useState('')
  const [isHovering, setIsHovering] = useState(false)
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    // Generate preview text
    const plainText = document.content.replace(/<[^>]*>/g, '')
    const previewText = plainText.substring(0, 120) + (plainText.length > 120 ? '...' : '')
    setPreview(previewText)
  }, [document.content])

  const wordCount = document.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length
  const readingTime = Math.ceil(wordCount / 200) // Rough estimate

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStar?.(document.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(document.id)
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDuplicate?.(document.id)
  }

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation()
    onView?.(document.id)
  }

  return (
    <div className="relative group">
      <Card
        className={cn(
          "document-preview-card cursor-pointer transition-all duration-300 hover:shadow-lg",
          "bg-gray-900 border-gray-800 hover:border-gray-700",
          isActive && "border-blue-500 bg-gray-800/50"
        )}
        onClick={onClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <CardContent className="p-4">
          {/* Document header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                document.type === 'document' 
                  ? "bg-blue-500/20 text-blue-400" 
                  : "bg-green-500/20 text-green-400"
              )}>
                {document.type === 'document' ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <TableIcon className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-semibold truncate transition-colors",
                  isActive ? "text-blue-400" : "text-white group-hover:text-blue-400"
                )}>
                  {document.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(document.lastModified)}</span>
                </div>
              </div>
            </div>
            
            {/* Star button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStar}
              className={cn(
                "w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                document.isStarred && "opacity-100"
              )}
            >
              <Star className={cn(
                "w-4 h-4 transition-colors",
                document.isStarred ? "fill-yellow-400 text-yellow-400" : "text-gray-400 hover:text-yellow-400"
              )} />
            </Button>
          </div>

          {/* Preview content */}
          <div className="mb-4">
            <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
              {preview || <span className="text-gray-600 italic">Empty document</span>}
            </p>
          </div>

          {/* Document stats */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                <span>{wordCount} words</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>{readingTime} min read</span>
              </div>
            </div>
            
            {/* Quick actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleView}
                className="w-7 h-7 p-0 text-gray-400 hover:text-white"
              >
                <Eye className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDuplicate}
                className="w-7 h-7 p-0 text-gray-400 hover:text-white"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowActions(!showActions)
                }}
                className="w-7 h-7 p-0 text-gray-400 hover:text-white"
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Active indicator */}
          {isActive && (
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-lg" />
          )}
        </CardContent>
      </Card>

      {/* Expanded actions menu */}
      {showActions && (
        <Card className="absolute top-full right-0 mt-1 w-48 bg-gray-900 border-gray-800 z-10 shadow-xl">
          <CardContent className="p-2">
            <button
              onClick={handleView}
              className="w-full flex items-center gap-2 p-2 hover:bg-gray-800 rounded text-sm text-gray-300 hover:text-white"
            >
              <Eye className="w-4 h-4" />
              Open
            </button>
            <button
              onClick={handleDuplicate}
              className="w-full flex items-center gap-2 p-2 hover:bg-gray-800 rounded text-sm text-gray-300 hover:text-white"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <button
              onClick={handleStar}
              className="w-full flex items-center gap-2 p-2 hover:bg-gray-800 rounded text-sm text-gray-300 hover:text-white"
            >
              <Star className={cn("w-4 h-4", document.isStarred && "fill-yellow-400 text-yellow-400")} />
              {document.isStarred ? 'Unstar' : 'Star'}
            </button>
            <hr className="my-1 border-gray-800" />
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 p-2 hover:bg-red-900/20 rounded text-sm text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}