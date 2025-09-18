'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Trash2, 
  Save, 
  MoveVertical,
  Copy,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpreadsheetData {
  id: string
  rows: string[][]
  columnCount: number
  rowCount: number
}

interface SpreadsheetProps {
  data?: SpreadsheetData
  onChange?: (data: SpreadsheetData) => void
  onSave?: () => void
  className?: string
}

export default function Spreadsheet({ data, onChange, onSave, className }: SpreadsheetProps) {
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetData>(() => {
    // Handle the case where data might be an empty array or undefined
    if (data && data.rows && Array.isArray(data.rows)) {
      return data
    }
    // Default empty spreadsheet
    return {
      id: 'default',
      rows: [['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']],
      columnCount: 4,
      rowCount: 4
    }
  })
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('Untitled Spreadsheet')

  useEffect(() => {
    if (data && data.rows && Array.isArray(data.rows)) {
      setSpreadsheet(data)
    }
  }, [data])

  const handleCellChange = (row: number, col: number, value: string) => {
    if (!spreadsheet.rows || !Array.isArray(spreadsheet.rows)) return
    const newRows = [...spreadsheet.rows]
    newRows[row][col] = value
    const newSpreadsheet = { ...spreadsheet, rows: newRows }
    setSpreadsheet(newSpreadsheet)
    onChange?.(newSpreadsheet)
  }

  const addRow = () => {
    if (!spreadsheet.rows || !Array.isArray(spreadsheet.rows)) return
    const newRow = Array(spreadsheet.columnCount || 4).fill('')
    const newRows = [...spreadsheet.rows, newRow]
    const newSpreadsheet = { 
      ...spreadsheet, 
      rows: newRows, 
      rowCount: (spreadsheet.rowCount || 0) + 1 
    }
    setSpreadsheet(newSpreadsheet)
    onChange?.(newSpreadsheet)
  }

  const addColumn = () => {
    if (!spreadsheet.rows || !Array.isArray(spreadsheet.rows)) return
    const newRows = spreadsheet.rows.map(row => [...row, ''])
    const newSpreadsheet = { 
      ...spreadsheet, 
      rows: newRows, 
      columnCount: (spreadsheet.columnCount || 0) + 1 
    }
    setSpreadsheet(newSpreadsheet)
    onChange?.(newSpreadsheet)
  }

  const deleteRow = (rowIndex: number) => {
    if (!spreadsheet.rows || !Array.isArray(spreadsheet.rows) || (spreadsheet.rowCount || 0) <= 1) return
    const newRows = spreadsheet.rows.filter((_, index) => index !== rowIndex)
    const newSpreadsheet = { 
      ...spreadsheet, 
      rows: newRows, 
      rowCount: (spreadsheet.rowCount || 0) - 1 
    }
    setSpreadsheet(newSpreadsheet)
    onChange?.(newSpreadsheet)
  }

  const deleteColumn = (colIndex: number) => {
    if (!spreadsheet.rows || !Array.isArray(spreadsheet.rows) || (spreadsheet.columnCount || 0) <= 1) return
    const newRows = spreadsheet.rows.map(row => row.filter((_, index) => index !== colIndex))
    const newSpreadsheet = { 
      ...spreadsheet, 
      rows: newRows, 
      columnCount: (spreadsheet.columnCount || 0) - 1 
    }
    setSpreadsheet(newSpreadsheet)
    onChange?.(newSpreadsheet)
  }

  const handleKeyPress = (e: React.KeyboardEvent, row: number, col: number) => {
    if (!spreadsheet.rows || !Array.isArray(spreadsheet.rows)) return
    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        // Move to previous cell
        if (col > 0) {
          setSelectedCell({ row, col: col - 1 })
        } else if (row > 0) {
          setSelectedCell({ row: row - 1, col: (spreadsheet.columnCount || 4) - 1 })
        }
      } else {
        // Move to next cell
        if (col < (spreadsheet.columnCount || 4) - 1) {
          setSelectedCell({ row, col: col + 1 })
        } else if (row < (spreadsheet.rowCount || 4) - 1) {
          setSelectedCell({ row: row + 1, col: 0 })
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (row < (spreadsheet.rowCount || 4) - 1) {
        setSelectedCell({ row: row + 1, col })
      }
    }
  }

  const exportToCSV = () => {
    if (!spreadsheet.rows || !Array.isArray(spreadsheet.rows)) return
    const csvContent = spreadsheet.rows
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getColumnLetter = (col: number) => {
    let letter = ''
    let i = col
    while (i >= 0) {
      letter = String.fromCharCode(65 + (i % 26)) + letter
      i = Math.floor(i / 26) - 1
    }
    return letter
  }

  return (
    <Card className={cn("bg-gray-900 border-gray-800 h-full", className)}>
      <CardHeader className="pb-3">
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
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportToCSV}
              className="text-gray-400 hover:text-white"
            >
              <Download className="w-4 h-4" />
            </Button>
            {onSave && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                className="text-gray-400 hover:text-white"
              >
                <Save className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Spreadsheet Controls */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={addRow}
            className="text-gray-400 hover:text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Row
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addColumn}
            className="text-gray-400 hover:text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Column
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full border-collapse bg-gray-800">
            <thead>
              <tr className="bg-gray-850">
                <th className="border border-gray-700 p-2 w-12 text-center text-gray-400 font-medium">
                  #
                </th>
                {Array.from({ length: spreadsheet.columnCount || 4 }, (_, col) => (
                  <th key={col} className="border border-gray-700 p-2 text-center text-gray-400 font-medium min-w-[100px]">
                    <div className="flex items-center justify-between">
                      <span>{getColumnLetter(col)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteColumn(col)}
                        className="h-6 w-6 p-0 text-gray-500 hover:text-red-400"
                        disabled={(spreadsheet.columnCount || 0) <= 1}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spreadsheet.rows && Array.isArray(spreadsheet.rows) && spreadsheet.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-750">
                  <td className="border border-gray-700 p-2 text-center text-gray-400 font-medium">
                    <div className="flex items-center justify-between">
                      <span>{rowIndex + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRow(rowIndex)}
                        className="h-6 w-6 p-0 text-gray-500 hover:text-red-400"
                        disabled={(spreadsheet.rowCount || 0) <= 1}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className={cn(
                        "border border-gray-700 p-1 relative",
                        selectedCell?.row === rowIndex && selectedCell?.col === colIndex 
                          ? "bg-gray-700 ring-2 ring-blue-600" 
                          : "bg-gray-850"
                      )}
                    >
                      <Input
                        value={cell}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        onFocus={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                        onKeyDown={(e) => handleKeyPress(e, rowIndex, colIndex)}
                        className="bg-transparent border-none text-white focus:ring-0 focus:outline-none h-8 text-sm"
                        placeholder=""
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}