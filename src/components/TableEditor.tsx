'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  Save, 
  Plus, 
  Trash2, 
  Copy,
  Download,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TableCell {
  value: string
  formula?: string
  type: 'text' | 'number' | 'formula'
}

interface TableRow {
  cells: TableCell[]
}

interface TableEditorProps {
  data?: TableRow[]
  onChange?: (data: TableRow[]) => void
  onSave?: () => void
  className?: string
}

export default function TableEditor({ 
  data = [], 
  onChange, 
  onSave, 
  className 
}: TableEditorProps) {
  const [tableData, setTableData] = useState<TableRow[]>(data)
  const [title, setTitle] = useState('Untitled Spreadsheet')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [isAddingRow, setIsAddingRow] = useState(false)
  const [isAddingCol, setIsAddingCol] = useState(false)

  useEffect(() => {
    if (data.length === 0) {
      // Initialize with empty table
      setTableData([
        {
          cells: [
            { value: '', type: 'text' },
            { value: '', type: 'text' },
            { value: '', type: 'text' },
            { value: '', type: 'text' }
          ]
        },
        {
          cells: [
            { value: '', type: 'text' },
            { value: '', type: 'text' },
            { value: '', type: 'text' },
            { value: '', type: 'text' }
          ]
        }
      ])
    }
  }, [data])

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...tableData]
    newData[rowIndex].cells[colIndex].value = value
    
    // Auto-detect type
    if (value.startsWith('=')) {
      newData[rowIndex].cells[colIndex].type = 'formula'
      newData[rowIndex].cells[colIndex].formula = value
    } else if (!isNaN(Number(value)) && value !== '') {
      newData[rowIndex].cells[colIndex].type = 'number'
    } else {
      newData[rowIndex].cells[colIndex].type = 'text'
    }
    
    setTableData(newData)
    onChange?.(newData)
  }

  const addRow = () => {
    const newRow: TableRow = {
      cells: tableData[0]?.cells.map(() => ({ value: '', type: 'text' })) || []
    }
    setTableData([...tableData, newRow])
    setIsAddingRow(false)
  }

  const addColumn = () => {
    const newData = tableData.map(row => ({
      ...row,
      cells: [...row.cells, { value: '', type: 'text' }]
    }))
    setTableData(newData)
    setIsAddingCol(false)
  }

  const deleteRow = (rowIndex: number) => {
    if (tableData.length > 1) {
      const newData = tableData.filter((_, index) => index !== rowIndex)
      setTableData(newData)
      onChange?.(newData)
    }
  }

  const deleteColumn = (colIndex: number) => {
    if (tableData[0]?.cells.length > 1) {
      const newData = tableData.map(row => ({
        ...row,
        cells: row.cells.filter((_, index) => index !== colIndex)
      }))
      setTableData(newData)
      onChange?.(newData)
    }
  }

  const getColumnLetter = (index: number) => {
    return String.fromCharCode(65 + index)
  }

  const exportToCSV = () => {
    const csvContent = tableData.map(row => 
      row.cells.map(cell => cell.value).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const csv = e.target?.result as string
        const rows = csv.split('\n').filter(row => row.trim())
        const newData = rows.map(row => ({
          cells: row.split(',').map(cell => ({
            value: cell.trim(),
            type: 'text'
          }))
        }))
        setTableData(newData)
        onChange?.(newData)
      }
      reader.readAsText(file)
    }
  }

  return (
    <Card className={cn("bg-gray-900 border-gray-800 h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false)
                  }
                }}
                autoFocus
              />
            ) : (
              <CardTitle 
                className="text-gray-100 cursor-pointer hover:text-gray-300"
                onClick={() => setIsEditingTitle(true)}
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
            <label className="cursor-pointer">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4" />
                </span>
              </Button>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
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
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="border border-gray-700 p-2 w-12 text-gray-400">#</th>
                {tableData[0]?.cells.map((_, colIndex) => (
                  <th key={colIndex} className="border border-gray-700 p-2 text-left text-gray-400 min-w-[120px]">
                    <div className="flex items-center justify-between">
                      <span>{getColumnLetter(colIndex)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteColumn(colIndex)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </th>
                ))}
                <th className="border border-gray-700 p-2 w-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingCol(true)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="border border-gray-700 p-2 bg-gray-850 text-gray-400 text-center">
                    <div className="flex items-center justify-between">
                      <span>{rowIndex + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRow(rowIndex)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                  {row.cells.map((cell, colIndex) => (
                    <td 
                      key={colIndex} 
                      className={cn(
                        "border border-gray-700 p-0",
                        selectedCell?.row === rowIndex && selectedCell?.col === colIndex 
                          ? "bg-blue-900/20" 
                          : "bg-gray-850"
                      )}
                    >
                      <Input
                        value={cell.value}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        onFocus={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                        className="bg-transparent border-none text-white h-8 focus:ring-0"
                        placeholder={cell.type === 'formula' ? "=SUM(A1:A2)" : ""}
                      />
                    </td>
                  ))}
                  <td className="border border-gray-700 p-2 bg-gray-850"></td>
                </tr>
              ))}
              {isAddingRow && (
                <tr>
                  <td className="border border-gray-700 p-2 bg-gray-850 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addRow}
                      className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </td>
                  {tableData[0]?.cells.map((_, colIndex) => (
                    <td key={colIndex} className="border border-gray-700 p-2 bg-gray-850"></td>
                  ))}
                  <td className="border border-gray-700 p-2 bg-gray-850"></td>
                </tr>
              )}
              <tr>
                <td className="border border-gray-700 p-2 bg-gray-850">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingRow(true)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </td>
                {tableData[0]?.cells.map((_, colIndex) => (
                  <td key={colIndex} className="border border-gray-700 p-2 bg-gray-850"></td>
                ))}
                <td className="border border-gray-700 p-2 bg-gray-850"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}