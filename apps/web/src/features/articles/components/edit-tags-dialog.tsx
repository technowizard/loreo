import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { TagInput } from '@/components/ui/tag-input';

import { useUpdateTags } from '@/features/articles/api/update-tags';
import { type CreateTagBody, useCreateTag } from '@/features/tags/api/create-tag';
import { useGetTagGroups } from '@/features/tags/api/get-tag-groups';
import { useGetTags } from '@/features/tags/api/get-tags';

import { useMediaQuery } from '@/hooks/use-media-query';

import type { Tag } from '@/types/tags';

interface EditTagsDialogProps {
  initialTags: Tag[];
  linkId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

function EditTagsDialog({ initialTags, linkId, onOpenChange, open }: EditTagsDialogProps) {
  const [pendingTags, setPendingTags] = useState<Tag[]>(initialTags);
  const pendingCreatedTagRef = useRef<Tag | null>(null);
  const { t } = useTranslation();
  const { isMobile } = useMediaQuery();

  const tagsQuery = useGetTags();
  const tagGroupsQuery = useGetTagGroups();
  const createTagMutation = useCreateTag();
  const updateTagsMutation = useUpdateTags({
    mutationConfig: {
      onError: () => {
        toast.error(t('articles.toasts.failedUpdateTags'), {
          position: 'top-center',
          richColors: true
        });
      },
      onSuccess: () => {
        toast.success(t('articles.toasts.tagsUpdated'), {
          position: 'top-center',
          richColors: true
        });
        onOpenChange(false);
      }
    }
  });

  useEffect(() => {
    if (open) {
      setPendingTags(initialTags);
    }
  }, [open]);

  const hasChanges = useMemo(() => {
    const a = new Set(initialTags.map((t) => t.id));
    const b = new Set(pendingTags.map((t) => t.id));
    return a.size !== b.size || [...a].some((id) => !b.has(id));
  }, [initialTags, pendingTags]);

  const handleCreateTag = async (data: CreateTagBody) => {
    const response = await createTagMutation.mutateAsync(data);

    pendingCreatedTagRef.current = response.result;
  };

  const handleTagsChange = (newTags: Tag[]) => {
    const real = pendingCreatedTagRef.current;
    if (real) {
      pendingCreatedTagRef.current = null;
      setPendingTags(
        newTags.map((t) => (t.id.startsWith('temp-') && t.name === real.name ? real : t))
      );
    } else {
      setPendingTags(newTags);
    }
  };

  const handleSave = () => {
    updateTagsMutation.mutate({
      id: linkId,
      tags: pendingTags.map(({ id, groupId, name }) => ({
        id,
        groupId,
        name
      }))
    });
  };

  const isSaving = updateTagsMutation.isPending;

  const content = (
    <TagInput
      availableTags={tagsQuery.data?.result ?? []}
      groups={tagGroupsQuery.data?.result ?? []}
      onChange={handleTagsChange}
      onCreateTag={handleCreateTag}
      placeholder={t('tags.tagInput.placeholder')}
      value={pendingTags}
    />
  );

  const footer = (
    <>
      {/*<Button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onOpenChange(false);
        }}
        variant="outline"
      >
        Cancel
      </Button>*/}
      <Button
        disabled={!hasChanges || isSaving}
        onClick={(e) => {
          e.stopPropagation();
          handleSave();
        }}
      >
        {isSaving ? t('articles.editTags.saving') : t('articles.editTags.save')}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet onOpenChange={onOpenChange} open={open}>
        <SheetContent onClick={(e) => e.stopPropagation()} side="bottom">
          <SheetHeader>
            <SheetTitle>{t('articles.editTags.title')}</SheetTitle>
            <SheetDescription>{t('articles.editTags.description')}</SheetDescription>
          </SheetHeader>
          <div className="px-4 py-2">{content}</div>
          <SheetFooter className="px-4 pb-4">{footer}</SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{t('articles.editTags.title')}</DialogTitle>
          <DialogDescription>{t('articles.editTags.description')}</DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditTagsDialog;
