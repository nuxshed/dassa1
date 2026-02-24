'use client'

import { useState, useEffect } from 'react'
import { useauth } from '@/lib/authcontext'
import { usefetch } from '@/lib/hooks/usefetch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Trash2, ArrowUp, ArrowDown, Lock, Loader2, GripVertical, X } from 'lucide-react'
import { toast } from 'sonner'

type FormField = {
  label: string
  type: 'text' | 'email' | 'number' | 'select' | 'file' | 'textarea' | 'checkbox'
  required: boolean
  options?: string[]
}

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'file', label: 'File Upload' },
  { value: 'textarea', label: 'Long Text' },
] as const

export function FormBuilder({ eventId, regcount }: { eventId: string; regcount: number }) {
  const { token } = useauth()
  const { data, loading } = usefetch<{ fields: FormField[] }>(`/api/events/${eventId}/form`)
  const [fields, setFields] = useState<FormField[]>([])
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const locked = regcount > 0

  useEffect(() => {
    if (data?.fields) {
      setFields(data.fields)
    }
  }, [data])

  const addField = () => {
    setFields([...fields, { label: '', type: 'text', required: false }])
    setDirty(true)
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
    setDirty(true)
  }

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields(fields.map((f, i) => i === index ? { ...f, ...updates } : f))
    setDirty(true)
  }

  const moveField = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= fields.length) return
    const newFields = [...fields]
    ;[newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]]
    setFields(newFields)
    setDirty(true)
  }

  const addOption = (index: number) => {
    const field = fields[index]
    updateField(index, { options: [...(field.options || []), ''] })
  }

  const updateOption = (fieldIndex: number, optIndex: number, value: string) => {
    const field = fields[fieldIndex]
    const options = [...(field.options || [])]
    options[optIndex] = value
    updateField(fieldIndex, { options })
  }

  const removeOption = (fieldIndex: number, optIndex: number) => {
    const field = fields[fieldIndex]
    const options = (field.options || []).filter((_, i) => i !== optIndex)
    updateField(fieldIndex, { options })
  }

  const save = async () => {
    for (const field of fields) {
      if (!field.label.trim()) {
        toast.error('All fields must have a label')
        return
      }
      if (field.type === 'select' && (!field.options || field.options.filter(o => o.trim()).length < 2)) {
        toast.error(`Dropdown "${field.label}" needs at least 2 options`)
        return
      }
    }

    setSaving(true)
    try {
      const cleanFields = fields.map(f => ({
        ...f,
        label: f.label.trim(),
        options: f.type === 'select' ? f.options?.filter(o => o.trim()) : undefined,
      }))

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/events/${eventId}/form`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fields: cleanFields }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to save form')
      }

      toast.success('Form saved')
      setDirty(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-medium">Registration Form</h2>
          <p className="text-xs text-muted-foreground">
            {locked
              ? 'Form is locked because registrations exist'
              : fields.length > 0
                ? `${fields.length} field${fields.length !== 1 ? 's' : ''}`
                : 'No custom fields added yet'}
          </p>
        </div>
        {locked && (
          <Badge variant="secondary" className="gap-1.5">
            <Lock className="h-3 w-3" />
            Locked
          </Badge>
        )}
      </div>

      {fields.length > 0 && (
        <div className="border rounded-md divide-y">
          {fields.map((field, index) => (
            <div key={index} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-2 shrink-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                </div>
                <div className="flex-1 grid grid-cols-[1fr_140px] gap-3">
                  <Input
                    placeholder="Field label"
                    value={field.label}
                    onChange={e => updateField(index, { label: e.target.value })}
                    disabled={locked}
                  />
                  <Select
                    value={field.type}
                    onValueChange={v => updateField(index, { type: v as FormField['type'], options: v === 'select' ? (field.options || ['']) : undefined })}
                    disabled={locked}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1 pt-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateField(index, { required: !field.required })}
                    disabled={locked}
                  >
                    <Badge variant={field.required ? 'default' : 'outline'} className="text-[10px] px-1.5 py-0">
                      {field.required ? 'Req' : 'Opt'}
                    </Badge>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveField(index, -1)}
                    disabled={locked || index === 0}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveField(index, 1)}
                    disabled={locked || index === fields.length - 1}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeField(index)}
                    disabled={locked}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {field.type === 'select' && (
                <div className="pl-7 space-y-2">
                  <p className="text-xs text-muted-foreground">Options</p>
                  <div className="space-y-1.5">
                    {(field.options || []).map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <Input
                          placeholder={`Option ${optIdx + 1}`}
                          value={opt}
                          onChange={e => updateOption(index, optIdx, e.target.value)}
                          disabled={locked}
                          className="h-8 text-sm"
                        />
                        {!locked && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => removeOption(index, optIdx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {!locked && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addOption(index)}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add option
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {fields.length === 0 && !locked && (
        <div className="flex flex-col items-center justify-center py-12 border rounded-md border-dashed">
          <p className="text-sm text-muted-foreground mb-3">
            Add fields to create a custom registration form
          </p>
          <Button variant="outline" size="sm" onClick={addField}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Field
          </Button>
        </div>
      )}

      {!locked && (
        <div className="flex items-center gap-2">
          {fields.length > 0 && (
            <Button variant="outline" size="sm" onClick={addField}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Field
            </Button>
          )}
          {dirty && fields.length > 0 && (
            <Button size="sm" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Save Form
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
