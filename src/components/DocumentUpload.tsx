'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import { anythingLLMService } from '@/lib/anythingllm'

interface DocumentUploadProps {
  workspaceSlug: string
  onUploadComplete?: (documents: any[]) => void
}

export default function DocumentUpload({ workspaceSlug, onUploadComplete }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        try {
          const result = await anythingLLMService.uploadDocumentToWorkspace(file, workspaceSlug)
          setUploadProgress(((index + 1) / files.length) * 100)
          return { file: file.name, result, success: true }
        } catch (error) {
          return { file: file.name, error, success: false }
        }
      })

      const results = await Promise.all(uploadPromises)
      
      const successfulUploads = results.filter(r => r.success)
      const failedUploads = results.filter(r => !r.success)

      setUploadedDocuments(successfulUploads.map(u => ({
        name: u.file,
        ...u.result
      })))

      if (failedUploads.length > 0) {
        setError(`Failed to upload ${failedUploads.length} file(s): ${failedUploads.map(f => f.file).join(', ')}`)
      }

      if (successfulUploads.length > 0 && onUploadComplete) {
        onUploadComplete(successfulUploads.map(u => u.result))
      }
    } catch (error: any) {
      setError(`Upload failed: ${error.message || 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      const dataTransfer = new DataTransfer()
      Array.from(files).forEach(file => dataTransfer.items.add(file))
      
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files
        const event = new Event('change', { bubbles: true })
        fileInputRef.current.dispatchEvent(event)
      }
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Documents to Workspace
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">
            {isUploading ? 'Uploading documents...' : 'Drop documents here or click to browse'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports PDF, DOC, DOCX, TXT, and other text formats
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.md,.rtf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          {!isUploading && (
            <Button variant="outline" className="mt-4">
              Select Files
            </Button>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {uploadedDocuments.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Successfully uploaded {uploadedDocuments.length} document(s)
            </h3>
            <div className="space-y-1">
              {uploadedDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                  <span className="text-sm text-green-700">{doc.name}</span>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}