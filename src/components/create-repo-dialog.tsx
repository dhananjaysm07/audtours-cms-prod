import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';
import { REPOSITORY_KINDS } from '@/types';
import { useContentStore } from '@/store/useContentStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import LanguageManagementDialog from './language-management-dialog';

// Schema for form validation
const CreateRepositorySchema = z.object({
  type: z.enum([REPOSITORY_KINDS.AUDIO]), // Only allow 'audio' as an option
  languageId: z.number().optional(),
});

type CreateRepositoryFormState = z.infer<typeof CreateRepositorySchema>;

export const CreateRepositoryDialog = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const form = useForm<CreateRepositoryFormState>({
    resolver: zodResolver(CreateRepositorySchema),
    defaultValues: {
      type: REPOSITORY_KINDS.AUDIO, // Default to 'audio'
      languageId: undefined,
    },
  });

  const { createRepository, currentPath } = useContentStore();
  const { languages, fetchLanguages } = useLanguageStore();
  const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);
  const lastSegment = currentPath[currentPath.length - 1];

  // Fetch languages on component mount
  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  const handleSubmit = async (data: CreateRepositoryFormState) => {
    const currentNodeId = lastSegment.id; // Use the current node ID from the path
    await createRepository(Number(currentNodeId), data.type, data.languageId);
    setIsOpen(false);
    form.reset();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Repository</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div>
              <Label>Type</Label>
              <Select
                value={form.watch('type')}
                onValueChange={value =>
                  form.setValue('type', value as typeof REPOSITORY_KINDS.AUDIO)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select repository type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={REPOSITORY_KINDS.AUDIO}>Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.watch('type') === REPOSITORY_KINDS.AUDIO && (
              <div>
                <Label>Language</Label>
                <div className="flex justify-between items-center">
                  <Select
                    value={form.watch('languageId')?.toString() || ''}
                    onValueChange={value =>
                      form.setValue('languageId', Number(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages
                        .filter(lang => lang.isActive)
                        .map(lang => (
                          <SelectItem key={lang.id} value={lang.id.toString()}>
                            {lang.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddLanguageOpen(true)}
                    type="button"
                  >
                    Manage Languages
                  </Button>
                </div>
              </div>
            )}

            <Button type="submit" disabled={form.formState.isSubmitting}>
              Create
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <LanguageManagementDialog
        isOpen={isAddLanguageOpen}
        onOpenChange={setIsAddLanguageOpen}
      />
    </>
  );
};
