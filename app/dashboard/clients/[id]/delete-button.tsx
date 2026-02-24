'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteClientWithChecks } from '@/actions/clients'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { useState } from 'react'

interface DeleteButtonProps {
  clientId: string
}

export function DeleteButton({ clientId }: DeleteButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsDeleting(true)

    try {
      const formData = new FormData()
      formData.append('id', clientId)

      await deleteClientWithChecks(formData)
      toast({
        title: 'Success',
        description: 'Client deleted successfully',
      })
      router.push('/dashboard/clients')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete client',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleDelete} className="flex-1 sm:flex-none">
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        className="w-full sm:w-auto"
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
    </form>
  )
}
