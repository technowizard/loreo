import { useState } from 'react';
import { toast } from 'sonner';

import { useDebounce } from '@/hooks/use-debounce';

import type { TagGroup, Tag as TagType } from '@/types/tags';

import { useBulkDeleteTags } from '../api/bulk-delete-tags';
import { useCreateTag } from '../api/create-tag';
import { useCreateTagGroup } from '../api/create-tag-group';
import { useDeleteTag } from '../api/delete-tag';
import { useDeleteTagGroup } from '../api/delete-tag-group';
import { useGetTagGroups } from '../api/get-tag-groups';
import { useMoveBatchTags } from '../api/move-batch-tags';
import { useMoveTag } from '../api/move-tag';
import { useUpdateTag } from '../api/update-tag';
import { useUpdateTagGroup } from '../api/update-tag-group';
import type { MoveTagsDialogState } from '../components/move-tags-dialog';

const DEFAULT_GROUP_COLOR = '#3B82F6';

const groupSchema = {
  description: (value: string) => (!value.trim() ? 'Description is required' : undefined),
  name: (value: string) => (!value.trim() ? 'Group name is required' : undefined)
};

const tagSchema = {
  name: (value: string) => (!value.trim() ? 'Tag name is required' : undefined)
};

export function useTagsActions() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [isTagGroupDialogOpen, setIsTagGroupDialogOpen] = useState(false);
  const [tagGroupMode, setTagGroupMode] = useState<'create' | 'edit'>('create');
  const [selectedTagGroup, setSelectedTagGroup] = useState<TagGroup | null>(null);
  const [tagGroupForm, setTagGroupForm] = useState({
    color: DEFAULT_GROUP_COLOR,
    description: '',
    name: ''
  });
  const [tagGroupErrors, setTagGroupErrors] = useState<{
    description?: string;
    name?: string;
  }>({});
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagType | null>(null);
  const [tagForm, setTagForm] = useState({ color: '', name: '' });
  const [tagErrors, setTagErrors] = useState<{ name?: string }>({});
  const [isSavingTag, setIsSavingTag] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    item: TagGroup | TagType | null;
    relatedCount?: number;
    type: 'group' | 'tag';
  }>({ item: null, type: 'group' });
  const [isDeleting, setIsDeleting] = useState(false);

  const [sheetGroup, setSheetGroup] = useState<TagGroup | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const [moveTagsDialog, setMoveTagsDialog] = useState<MoveTagsDialogState | null>(null);
  const [moveDestinationGroupId, setMoveDestinationGroupId] = useState('');

  const tagGroupsQuery = useGetTagGroups();
  const tagGroups = tagGroupsQuery.data?.result || [];

  const createTagGroupMutation = useCreateTagGroup({
    mutationConfig: {
      onMutate: () =>
        toast.loading('Creating...', {
          position: 'bottom-right',
          richColors: true
        }),
      onSuccess: () => {
        toast.dismiss();
        toast.success('Group created', {
          position: 'bottom-right',
          richColors: true
        });
      }
    }
  });

  const updateTagGroupMutation = useUpdateTagGroup({
    mutationConfig: {
      onMutate: () =>
        toast.loading('Updating...', {
          position: 'bottom-right',
          richColors: true
        }),
      onSuccess: () => {
        toast.dismiss();
        toast.success('Group updated', {
          position: 'bottom-right',
          richColors: true
        });
      }
    }
  });

  const deleteTagGroupMutation = useDeleteTagGroup({
    mutationConfig: {
      onMutate: () =>
        toast.loading('Deleting...', {
          position: 'bottom-right',
          richColors: true
        }),
      onSuccess: () => {
        toast.dismiss();
        toast.success('Group deleted', {
          position: 'bottom-right',
          richColors: true
        });
      }
    }
  });

  const createTagMutation = useCreateTag({
    mutationConfig: {
      onMutate: () =>
        toast.loading('Creating...', {
          position: 'bottom-right',
          richColors: true
        }),
      onSuccess: () => {
        toast.dismiss();
        toast.success('Tag created', {
          position: 'bottom-right',
          richColors: true
        });
      }
    }
  });

  const updateTagMutation = useUpdateTag({
    mutationConfig: {
      onMutate: () =>
        toast.loading('Updating...', {
          position: 'bottom-right',
          richColors: true
        }),
      onSuccess: () => {
        toast.dismiss();
        toast.success('Tag updated', {
          position: 'bottom-right',
          richColors: true
        });
      }
    }
  });

  const deleteTagMutation = useDeleteTag({
    mutationConfig: {
      onMutate: () =>
        toast.loading('Deleting...', {
          position: 'bottom-right',
          richColors: true
        }),
      onSuccess: () => {
        toast.dismiss();
        toast.success('Tag deleted', {
          position: 'bottom-right',
          richColors: true
        });
      }
    }
  });

  const moveTagMutation = useMoveTag();
  const bulkDeleteTagsMutation = useBulkDeleteTags();
  const moveBatchTagsMutation = useMoveBatchTags();

  const liveSheetGroup = sheetGroup
    ? (tagGroups.find((group) => group.id === sheetGroup.id) ?? sheetGroup)
    : null;

  const filteredGroups = tagGroups.filter((group) => {
    if (!debouncedSearchQuery) return true;
    const q = debouncedSearchQuery.toLowerCase();
    return group.name.toLowerCase().includes(q) || group.description.toLowerCase().includes(q);
  });

  const openCreateGroup = () => {
    setTagGroupMode('create');
    setSelectedTagGroup(null);
    setTagGroupForm({ color: DEFAULT_GROUP_COLOR, description: '', name: '' });
    setTagGroupErrors({});
    setIsTagGroupDialogOpen(true);
  };

  const openEditTagGroup = (group: TagGroup) => {
    setTagGroupMode('edit');
    setSelectedTagGroup(group);
    setTagGroupForm({
      color: group.color,
      description: group.description,
      name: group.name
    });
    setTagGroupErrors({});
    setIsTagGroupDialogOpen(true);
  };

  const handleTagGroupFormChange = (field: string, value: string) => {
    setTagGroupForm((prev) => ({ ...prev, [field]: value }));
    if (tagGroupErrors[field as keyof typeof tagGroupErrors]) {
      setTagGroupErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSaveGroup = async () => {
    const errors = {
      description: groupSchema.description(tagGroupForm.description),
      name: groupSchema.name(tagGroupForm.name)
    };
    const filtered = Object.fromEntries(Object.entries(errors).filter(([, v]) => v !== undefined));
    setTagGroupErrors(filtered);
    if (Object.keys(filtered).length > 0) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsSavingGroup(true);
    try {
      if (tagGroupMode === 'edit' && selectedTagGroup) {
        await updateTagGroupMutation.mutateAsync({
          color: tagGroupForm.color,
          description: tagGroupForm.description,
          id: selectedTagGroup.id,
          name: tagGroupForm.name
        });
      } else {
        await createTagGroupMutation.mutateAsync({
          color: tagGroupForm.color,
          description: tagGroupForm.description,
          name: tagGroupForm.name
        });
      }
      setIsTagGroupDialogOpen(false);
    } catch {
      toast.error(`Failed to ${tagGroupMode === 'edit' ? 'update' : 'create'} group`);
    } finally {
      setIsSavingGroup(false);
    }
  };

  const openTagDialog = (group: TagGroup, tag?: TagType | null) => {
    setSelectedTagGroup(group);
    setSelectedTag(tag || null);
    setTagForm({ color: group.color, name: tag?.name ?? '' });
    setTagErrors({});
    setIsTagDialogOpen(true);
  };

  const handleTagFormChange = (field: string, value: string) => {
    setTagForm((prev) => ({ ...prev, [field]: value }));
    if (tagErrors[field as keyof typeof tagErrors]) {
      setTagErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSaveTag = async () => {
    const nameError = tagSchema.name(tagForm.name);
    if (nameError) {
      setTagErrors({ name: nameError });
      toast.error('Please fix validation errors');
      return;
    }
    if (!selectedTagGroup) return;

    setIsSavingTag(true);
    try {
      if (selectedTag) {
        await updateTagMutation.mutateAsync({
          groupId: selectedTagGroup.id,
          id: selectedTag.id,
          name: tagForm.name
        });
      } else {
        await createTagMutation.mutateAsync({
          groupId: selectedTagGroup.id,
          name: tagForm.name
        });
      }
      setIsTagDialogOpen(false);
    } catch {
      toast.error(`Failed to ${selectedTag ? 'update' : 'create'} tag`);
    } finally {
      setIsSavingTag(false);
    }
  };

  const openDeleteConfirmation = (
    type: 'group' | 'tag',
    item: TagGroup | TagType,
    relatedCount?: number
  ) => {
    setDeleteTarget({ item, relatedCount, type });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'group' && deleteTarget.item) {
        await deleteTagGroupMutation.mutateAsync({
          id: (deleteTarget.item as TagGroup).id
        });
      } else if (deleteTarget.type === 'tag' && deleteTarget.item) {
        const tag = deleteTarget.item as TagType;
        await deleteTagMutation.mutateAsync({
          groupId: tag.groupId,
          id: tag.id
        });
      }
      setIsDeleteDialogOpen(false);
    } catch {
      toast.error(`Failed to delete ${deleteTarget.type}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);

      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }

      return next;
    });
  };

  const clearSelection = () => {
    setSelectedTagIds(new Set());
    setIsSelectMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedTagIds.size === 0) return;
    try {
      const result = await bulkDeleteTagsMutation.mutateAsync({
        tagIds: Array.from(selectedTagIds)
      });
      clearSelection();
      toast.success(`${result.result.deletedTags} tag(s) deleted`, {
        position: 'bottom-right',
        richColors: true
      });
    } catch {
      toast.error('Failed to delete tags', { position: 'top-center' });
    }
  };

  const openMoveDialog = (state: MoveTagsDialogState) => {
    setMoveTagsDialog(state);
    setMoveDestinationGroupId('');
  };

  const closeMoveDialog = () => {
    setMoveTagsDialog(null);
    setMoveDestinationGroupId('');
  };

  const handleMoveConfirm = async () => {
    if (!moveTagsDialog || !moveDestinationGroupId) return;
    try {
      if (moveTagsDialog.mode === 'single') {
        await moveTagMutation.mutateAsync({
          tagId: moveTagsDialog.tag.id,
          targetGroupId: moveDestinationGroupId
        });
        toast.success('Tag moved successfully', {
          position: 'bottom-right',
          richColors: true
        });
      } else if (moveTagsDialog.mode === 'bulk') {
        const result = await moveBatchTagsMutation.mutateAsync({
          tagIds: moveTagsDialog.tagIds,
          toGroupId: moveDestinationGroupId
        });
        clearSelection();
        toast.success(`${result.result.movedTags} tag(s) moved`, {
          position: 'bottom-right',
          richColors: true
        });
      } else if (moveTagsDialog.mode === 'group') {
        const result = await moveBatchTagsMutation.mutateAsync({
          fromGroupId: moveTagsDialog.fromGroupId,
          toGroupId: moveDestinationGroupId
        });
        toast.success(`${result.result.movedTags} tag(s) moved`, {
          position: 'bottom-right',
          richColors: true
        });
      }
      closeMoveDialog();
    } catch (error: unknown) {
      const status = (error as { response?: { status: number } })?.response?.status;
      if (status === 409) {
        toast.error('A tag with the same name already exists in the target group', {
          position: 'bottom-right'
        });
      } else {
        toast.error('Failed to move tag(s)', { position: 'top-center' });
      }
    }
  };

  return {
    filteredGroups,
    isError: tagGroupsQuery.isError,
    isLoading: tagGroupsQuery.isLoading,
    refetch: tagGroupsQuery.refetch,
    searchQuery,
    setSearchQuery,

    tagGroupDialog: {
      errors: tagGroupErrors,
      form: tagGroupForm,
      isSaving: isSavingGroup,
      mode: tagGroupMode,
      onFormChange: handleTagGroupFormChange,
      onOpenChange: setIsTagGroupDialogOpen,
      onSave: handleSaveGroup,
      open: isTagGroupDialogOpen
    },
    openCreateGroup,
    openEditTagGroup,

    tagDialog: {
      group: selectedTagGroup,
      errors: tagErrors,
      form: tagForm,
      isSaving: isSavingTag,
      onFormChange: handleTagFormChange,
      onOpenChange: setIsTagDialogOpen,
      onSave: handleSaveTag,
      open: isTagDialogOpen,
      tag: selectedTag
    },
    openTagDialog,

    deleteDialog: {
      isDeleting,
      item: deleteTarget.item,
      onConfirm: handleConfirmDelete,
      onOpenChange: setIsDeleteDialogOpen,
      open: isDeleteDialogOpen,
      relatedCount: deleteTarget.relatedCount,
      type: deleteTarget.type
    },
    openDeleteConfirmation,

    tagsSheet: {
      bulkDeletePending: bulkDeleteTagsMutation.isPending,
      group: liveSheetGroup,
      isSelectMode,
      onAddTag: () => liveSheetGroup && openTagDialog(liveSheetGroup),
      onBulkDelete: handleBulkDelete,
      onClearSelection: clearSelection,
      onClose: () => {
        setSheetGroup(null);
        clearSelection();
      },
      onDeleteTag: (tag: TagType) => openDeleteConfirmation('tag', tag),
      onEditTag: (tag: TagType) => liveSheetGroup && openTagDialog(liveSheetGroup, tag),
      onMoveTag: openMoveDialog,
      onSelectMode: setIsSelectMode,
      onToggleSelect: toggleTagSelection,
      selectedTagIds
    },
    openTagsSheet: setSheetGroup,

    openMoveDialog,

    moveDialog: {
      allGroups: tagGroups,
      currentGroupId: liveSheetGroup?.id,
      destinationGroupId: moveDestinationGroupId,
      dialog: moveTagsDialog,
      isPending: moveTagMutation.isPending || moveBatchTagsMutation.isPending,
      onClose: closeMoveDialog,
      onConfirm: handleMoveConfirm,
      onDestinationChange: setMoveDestinationGroupId
    }
  };
}
