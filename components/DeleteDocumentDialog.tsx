"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentTitle: string;
  isDeleting: boolean;
}

export function DeleteDocumentDialog({
  isOpen,
  onClose,
  onConfirm,
  documentTitle,
  isDeleting,
}: DeleteDocumentDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-500" />
            </div>
            <DialogTitle className="text-left">Delete Document</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">&ldquo;{documentTitle}&rdquo;</span>?
            This action cannot be undone and will permanently remove the document and all its content.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 sm:flex-none"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
