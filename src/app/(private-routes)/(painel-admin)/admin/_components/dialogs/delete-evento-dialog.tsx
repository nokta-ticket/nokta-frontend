'use client'

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'

interface DeleteEventoDialogProps {
  eventId: string
  eventName: string
  onConfirm: (id: string) => void
  trigger?: React.ReactNode
}

export function DeleteEventoDialog({
  eventId,
  eventName,
  onConfirm,
  trigger,
}: DeleteEventoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="w-full text-white bg-red-700 hover:bg-red-800">
            Excluir
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deseja excluir este evento?</DialogTitle>
          <DialogDescription>
            Essa ação não poderá ser desfeita. Você tem certeza que quer excluir{' '}
            <span className="font-medium text-foreground">{eventName}</span>?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 justify-end">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            className="text-white bg-red-700 hover:bg-red-800"
            onClick={() => onConfirm(eventId)}
          >
            Confirmar Exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
