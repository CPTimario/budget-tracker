'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTrip } from '@/server/actions/trips'
import { Label } from '@/components/ui/label'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  destination: z.string().min(1, 'Destination required'),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  currency: z.enum(['PHP', 'THB', 'USD', 'SGD', 'EUR']),
}).refine(data => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
})

type FormData = z.infer<typeof schema>

export function TripForm({ onCancel }: { onCancel?: () => void }) {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'PHP' },
  })

  async function onSubmit(data: FormData) {
    const formData = new FormData()
    Object.entries(data).forEach(([k, v]) => formData.set(k, String(v)))
    await createTrip(formData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="tripName">Trip name</Label>
        <Input id="tripName" placeholder="e.g. Thailand Mission Trip 2026" className="mt-1" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="tripDestination">Destination</Label>
        <Input id="tripDestination" placeholder="Destination" className="mt-1" {...register('destination')} />
        {errors.destination && <p className="text-xs text-destructive mt-1">{errors.destination.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="startDate" className="text-sm font-medium mb-1 block">Start Date</label>
          <Input id="startDate" type="date" {...register('startDate')} />
        </div>
        <div>
          <label htmlFor="endDate" className="text-sm font-medium mb-1 block">End Date</label>
          <Input id="endDate" type="date" {...register('endDate')} />
          {errors.endDate && <p className="text-xs text-destructive mt-1">{errors.endDate.message}</p>}
        </div>
      </div>
      <Select onValueChange={(v) => v && setValue('currency', v as FormData['currency'])} defaultValue="PHP">
        <SelectTrigger>
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PHP">PHP — Philippine Peso</SelectItem>
          <SelectItem value="THB">THB — Thai Baht</SelectItem>
          <SelectItem value="USD">USD — US Dollar</SelectItem>
          <SelectItem value="SGD">SGD — Singapore Dollar</SelectItem>
          <SelectItem value="EUR">EUR — Euro</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-2 justify-end">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Trip'}
        </Button>
      </div>
    </form>
  )
}
