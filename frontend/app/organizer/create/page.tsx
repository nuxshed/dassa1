'use client'

import { AppLayout } from '@/components/layouts/applayout'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { usemutation } from '@/lib/hooks/usemutation'
import { eventcreateschema, type eventcreateform } from '@/lib/schemas/event'
import { Loader2, CalendarIcon, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export default function CreateEvent() {
  const router = useRouter()
  const [error, seterror] = useState('')
  const [deadlineDate, setDeadlineDate] = useState<Date>()
  const [deadlineTime, setDeadlineTime] = useState('09:00')
  const [startDate, setStartDate] = useState<Date>()
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState<Date>()
  const [endTime, setEndTime] = useState('17:00')
  const [deadlineOpen, setDeadlineOpen] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<eventcreateform>({
    resolver: zodResolver(eventcreateschema) as any,
    defaultValues: {
      type: 'Normal',
      eligibility: 'all',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const { mutate } = usemutation('/api/events', {
    method: 'POST',
    onsuccess: () => {
      router.push('/organizer')
    },
    onerror: (err) => {
      seterror(err.message)
    },
  })

  const onsubmit = async (data: eventcreateform) => {
    seterror('')
    
    if (!deadlineDate || !startDate || !endDate) {
      seterror('Please select all dates')
      return
    }

    const deadline = new Date(deadlineDate)
    if (deadlineTime) {
      const [hours, minutes] = deadlineTime.split(':')
      deadline.setHours(parseInt(hours), parseInt(minutes))
    }

    const start = new Date(startDate)
    if (startTime) {
      const [hours, minutes] = startTime.split(':')

      start.setHours(parseInt(hours), parseInt(minutes))
    }

    const end = new Date(endDate)
    if (endTime) {
      const [hours, minutes] = endTime.split(':')
      end.setHours(parseInt(hours), parseInt(minutes))
    }

    const payload: any = {
      name: data.name,
      description: data.description || '',
      type: data.type,
      eligibility: data.eligibility,
      dates: {
        deadline,
        start,
        end,
      },
      limit: data.registrationLimit || 100,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }

    if (data.type === 'Normal') {
      payload.fee = data.fee ?? 0
    } else if (data.type === 'Merchandise') {
      payload.variants = data.variants?.map(v => ({
        name: v.name,
        stock: v.stock,
        price: v.price || 0
      })) || [];
      payload.purchaseLimit = data.purchaseLimit || 1;
    }

    try {
      await mutate(payload)
    } catch (err) {}
  }

  const eventtype = watch('type')

  return (
    <AppLayout roles={['Organizer']}>
      <div className="max-w-3xl mx-auto py-8">
        <Link href="/organizer" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="space-y-2 mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm font-medium mb-8">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onsubmit)} className="space-y-10">
          <div className="space-y-8">
            <div>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Event Name</FieldLabel>
                  <Input
                    id="name"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <textarea
                    id="description"
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="type">Event Type</FieldLabel>
                    <Select
                      value={eventtype}
                      onValueChange={(value) => setValue('type', value as 'Normal' | 'Merchandise')}
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normal">Normal Event</SelectItem>
                        <SelectItem value="Merchandise">Merchandise</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-destructive">{errors.type.message}</p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="eligibility">Eligibility</FieldLabel>
                    <Select
                      defaultValue="all"
                      onValueChange={(value) => setValue('eligibility', value as any)}
                    >
                      <SelectTrigger id="eligibility">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="iiit">IIIT Students Only</SelectItem>
                        <SelectItem value="external">External Only</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.eligibility && (
                      <p className="text-sm text-destructive">{errors.eligibility.message}</p>
                    )}
                  </Field>
                </div>
              </FieldGroup>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold mb-6">Schedule</h2>
              <FieldGroup>
                <div className="flex gap-4">
                  <Field className="w-56">
                    <FieldLabel>Deadline Date</FieldLabel>
                    <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start font-normal"
                        >
                          {deadlineDate ? format(deadlineDate, "PPP") : "Select date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={deadlineDate}
                          onSelect={(date) => {
                            setDeadlineDate(date)
                            setDeadlineOpen(false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>
                  <Field className="w-32">
                    <FieldLabel htmlFor="deadline-time">Time</FieldLabel>
                    <Input
                      type="time"
                      id="deadline-time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="bg-background"
                    />
                  </Field>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <Field className="w-56">
                      <FieldLabel>Start Date</FieldLabel>
                      <Popover open={startOpen} onOpenChange={setStartOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start font-normal"
                          >
                            {startDate ? format(startDate, "PPP") : "Select date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => {
                              setStartDate(date)
                              setStartOpen(false)
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>
                    <Field className="w-32">
                      <FieldLabel htmlFor="start-time">Time</FieldLabel>
                      <Input
                        type="time"
                        id="start-time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="bg-background"
                      />
                    </Field>
                  </div>

                  <div className="flex gap-4">
                    <Field className="w-56">
                      <FieldLabel>End Date</FieldLabel>
                      <Popover open={endOpen} onOpenChange={setEndOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start font-normal"
                          >
                            {endDate ? format(endDate, "PPP") : "Select date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => {
                              setEndDate(date)
                              setEndOpen(false)
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>
                    <Field className="w-32">
                      <FieldLabel htmlFor="end-time">Time</FieldLabel>
                      <Input
                        type="time"
                        id="end-time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="bg-background"
                      />
                    </Field>
                  </div>
                </div>
              </FieldGroup>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold mb-6">Additional Settings</h2>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="registrationLimit">Registration Limit</FieldLabel>
                    <Input
                      id="registrationLimit"
                      type="number"
                      min="1"
                      {...register('registrationLimit', { 
                        setValueAs: (v) => v === '' ? undefined : parseInt(v) 
                      })}
                    />
                    <FieldDescription>Leave blank for unlimited</FieldDescription>
                    {errors.registrationLimit && (
                      <p className="text-sm text-destructive">{errors.registrationLimit.message}</p>
                    )}
                  </Field>

                  {eventtype === 'Normal' && (
                    <Field>
                      <FieldLabel htmlFor="fee">Registration Fee (₹)</FieldLabel>
                      <Input
                        id="fee"
                        type="number"
                        min="0"
                        {...register('fee', { 
                          setValueAs: (v) => v === '' ? 0 : parseFloat(v) 
                        })}
                      />
                      <FieldDescription>Enter 0 for free events</FieldDescription>
                      {errors.fee && (
                        <p className="text-sm text-destructive">{errors.fee.message}</p>
                      )}
                    </Field>
                  )}

                  {eventtype === 'Merchandise' && (
                     <Field>
                      <FieldLabel htmlFor="purchaseLimit">Purchase Limit / Person</FieldLabel>
                      <Input
                        id="purchaseLimit"
                        type="number"
                        min="1"
                        {...register('purchaseLimit', { 
                          setValueAs: (v) => v === '' ? undefined : parseInt(v) 
                        })}
                      />
                      {errors.purchaseLimit && (
                        <p className="text-sm text-destructive">{errors.purchaseLimit.message}</p>
                      )}
                    </Field>
                  )}
                </div>

                {eventtype === 'Merchandise' && (
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <h3 className="text-md font-medium">Variants</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', stock: 0, price: 0 })}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Variant
                        </Button>
                     </div>
                     
                     <div className="space-y-3">
                        {fields.map((field, index) => (
                           <div key={field.id} className="flex items-end gap-3">
                              <Field className="flex-1">
                                <FieldLabel>Name</FieldLabel>
                                <Input 
                                  placeholder="Size/Color (e.g. Small Red)"
                                  {...register(`variants.${index}.name`)} 
                                />
                                {errors.variants?.[index]?.name && (
                                   <p className="text-xs text-destructive mt-1">{errors.variants[index]?.name?.message}</p>
                                )}
                              </Field>
                              <Field className="w-24">
                                <FieldLabel>Price (₹)</FieldLabel>
                                <Input 
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  {...register(`variants.${index}.price`, { valueAsNumber: true })} 
                                />
                                {errors.variants?.[index]?.price && (
                                   <p className="text-xs text-destructive mt-1">{errors.variants[index]?.price?.message}</p>
                                )}
                              </Field>
                              <Field className="w-24">
                                <FieldLabel>Stock</FieldLabel>
                                <Input 
                                  type="number"
                                  min="0"
                                  {...register(`variants.${index}.stock`, { valueAsNumber: true })} 
                                />
                                {errors.variants?.[index]?.stock && (
                                   <p className="text-xs text-destructive mt-1">{errors.variants[index]?.stock?.message}</p>
                                )}
                              </Field>
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="icon"
                                className="mb-0.5"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                           </div>
                        ))}
                     </div>
                     {errors.variants && !Array.isArray(errors.variants) && (
                        <p className="text-sm text-destructive">{(errors.variants as any).message}</p>
                     )}
                  </div>
                )}


                <Field>
                  <FieldLabel htmlFor="tags">Tags</FieldLabel>
                  <Input
                    id="tags"
                    {...register('tags')}
                  />
                  <FieldDescription>Comma seperated</FieldDescription>
                  {errors.tags && (
                    <p className="text-sm text-destructive">{errors.tags.message}</p>
                  )}
                </Field>
              </FieldGroup>
            </div>
          </div>

          <Separator className="my-10" />

          <div className="flex gap-3 justify-end">
            <Link href="/organizer">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="min-w-32">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Event
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
