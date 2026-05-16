import { PlusIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagInput } from '@/components/ui/tag-input';

import { useCreateTag } from '@/features/tags/api/create-tag';

import type { Tag, TagGroup } from '@/types/tags';

import { useCreateLink } from '../api/create-link';

type FormData = {
  tags: Tag[];
  url: string;
};

type Props = {
  formData: FormData;
  isMobile: boolean;
  onClose: () => void;
  onFormChange: (field: string, value: string | Tag[]) => void;
  onReset: () => void;
  open: boolean;
  tagGroups: TagGroup[] | undefined;
  tags: Tag[] | undefined;
};

export function AddArticleDialog({
  formData,
  isMobile,
  onClose,
  onFormChange,
  onReset,
  open,
  tagGroups,
  tags
}: Props) {
  const position = isMobile ? 'top-center' : 'top-right';

  const createLinkMutation = useCreateLink({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Link saved', { position, richColors: true });
        onReset();
      }
    }
  });

  const createTagMutation = useCreateTag({
    mutationConfig: {
      onError: (error) => {
        toast.error('Failed to create tag', {
          description: error.message,
          position,
          richColors: true
        });
      },
      onSuccess: (response) => {
        toast.success(`Tag "${response.result?.name}" created`, { position, richColors: true });
      }
    }
  });

  const handleCreateTag = async (tagName: string, groupId: string) => {
    try {
      const response = await createTagMutation.mutateAsync({ groupId, name: tagName });
      const newTag = response.result;
      if (newTag) {
        const currentTags = formData.tags || [];
        if (!currentTags.some((tag) => tag.id === newTag.id)) {
          onFormChange('tags', [...currentTags, newTag]);
        }
      }
    } catch (error) {
      toast.error(`Failed to create tag: ${error}`, { position, richColors: true });
    }
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      tags: formData.tags.map((tag) => ({
        id: tag.id,
        groupId: tag.groupId,
        name: tag.name
      })),
      url: formData.url
    };

    try {
      createLinkMutation.mutate(payload);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, { position, richColors: true });
      }
    }
  };

  return (
    <Dialog onOpenChange={onClose} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save article for later</DialogTitle>
          <DialogDescription>
            Enter the URL of an article you&apos;d like to read later. We&apos;ll automatically
            extract the content for offline reading.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="url">Article URL</Label>
            <Input
              name="url"
              onChange={(e) => onFormChange('url', e.target.value)}
              placeholder="https://example.com/article"
              required
              type="url"
              value={formData.url}
            />
            <Label className="mt-2" htmlFor="tags">
              Tags (optional)
            </Label>
            <TagInput
              availableTags={tags}
              groups={tagGroups}
              onChange={(value) => onFormChange('tags', value)}
              onCreateTag={({ groupId, name }) => handleCreateTag(name, groupId)}
              value={formData.tags}
            />
            <Button className="mt-2 w-full" type="submit">
              <PlusIcon className="size-4" weight="bold" />
              Save Article
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
