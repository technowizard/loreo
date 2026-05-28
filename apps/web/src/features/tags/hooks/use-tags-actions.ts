import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import {
  createEmptyTagGroupForm,
  createTagForm,
  createTagGroupForm,
  hasFormErrors,
  type TagErrors,
  type TagGroupErrors,
  validateTagForm,
  validateTagGroupForm
} from '../utils/tag-form-helpers';
import {
  createEmptyTagSelection,
  selectedTagIdsToArray,
  toggleSelectedTagId
} from '../utils/tag-selection-helpers';

const TAG_TOAST_OPTIONS = {
  position: 'bottom-right',
  richColors: true
} as const;
const TAG_ERROR_TOAST_OPTIONS = { position: 'top-center' } as const;

export function useTagsActions() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [isTagGroupDialogOpen, setIsTagGroupDialogOpen] = useState(false);
  const [tagGroupMode, setTagGroupMode] = useState<'create' | 'edit'>('create');
  const [selectedTagGroup, setSelectedTagGroup] = useState<TagGroup | null>(null);
  const [tagGroupForm, setTagGroupForm] = useState(createEmptyTagGroupForm);
  const [tagGroupErrors, setTagGroupErrors] = useState<TagGroupErrors>({});
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagType | null>(null);
  const [tagForm, setTagForm] = useState({ color: '', name: '' });
  const [tagErrors, setTagErrors] = useState<TagErrors>({});
  const [isSavingTag, setIsSavingTag] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    item: TagGroup | TagType | null;
    relatedCount?: number;
    type: 'group' | 'tag';
  }>({ item: null, type: 'group' });
  const [isDeleting, setIsDeleting] = useState(false);

  const [sheetGroup, setSheetGroup] = useState<TagGroup | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState(createEmptyTagSelection);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const [moveTagsDialog, setMoveTagsDialog] = useState<MoveTagsDialogState | null>(null);
  const [moveDestinationGroupId, setMoveDestinationGroupId] = useState('');

  const tagGroupsQuery = useGetTagGroups();
  const tagGroups = tagGroupsQuery.data?.result || [];

  const createTagGroupMutation = useCreateTagGroup({
    mutationConfig: {
      onMutate: () => toast.loading(t('tags.toasts.creating'), TAG_TOAST_OPTIONS),
      onSuccess: () => {
        toast.dismiss();
        toast.success(t('tags.toasts.groupCreated'), TAG_TOAST_OPTIONS);
      }
    }
  });

  const updateTagGroupMutation = useUpdateTagGroup({
    mutationConfig: {
      onMutate: () => toast.loading(t('tags.toasts.updating'), TAG_TOAST_OPTIONS),
      onSuccess: () => {
        toast.dismiss();
        toast.success(t('tags.toasts.groupUpdated'), TAG_TOAST_OPTIONS);
      }
    }
  });

  const deleteTagGroupMutation = useDeleteTagGroup({
    mutationConfig: {
      onMutate: () => toast.loading(t('tags.toasts.deleting'), TAG_TOAST_OPTIONS),
      onSuccess: () => {
        toast.dismiss();
        toast.success(t('tags.toasts.groupDeleted'), TAG_TOAST_OPTIONS);
      }
    }
  });

  const createTagMutation = useCreateTag({
    mutationConfig: {
      onMutate: () => toast.loading(t('tags.toasts.creating'), TAG_TOAST_OPTIONS),
      onSuccess: () => {
        toast.dismiss();
        toast.success(t('tags.toasts.tagCreated'), TAG_TOAST_OPTIONS);
      }
    }
  });

  const updateTagMutation = useUpdateTag({
    mutationConfig: {
      onMutate: () => toast.loading(t('tags.toasts.updating'), TAG_TOAST_OPTIONS),
      onSuccess: () => {
        toast.dismiss();
        toast.success(t('tags.toasts.tagUpdated'), TAG_TOAST_OPTIONS);
      }
    }
  });

  const deleteTagMutation = useDeleteTag({
    mutationConfig: {
      onMutate: () => toast.loading(t('tags.toasts.deleting'), TAG_TOAST_OPTIONS),
      onSuccess: () => {
        toast.dismiss();
        toast.success(t('tags.toasts.tagDeleted'), TAG_TOAST_OPTIONS);
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
    setTagGroupForm(createEmptyTagGroupForm());
    setTagGroupErrors({});
    setIsTagGroupDialogOpen(true);
  };

  const openEditTagGroup = (group: TagGroup) => {
    setTagGroupMode('edit');
    setSelectedTagGroup(group);
    setTagGroupForm(createTagGroupForm(group));
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
    const errors = validateTagGroupForm(tagGroupForm);
    setTagGroupErrors(errors);

    if (hasFormErrors(errors)) {
      toast.error(t('tags.toasts.fixValidation'));
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
      toast.error(
        tagGroupMode === 'edit'
          ? t('tags.toasts.failedUpdateGroup')
          : t('tags.toasts.failedCreateGroup')
      );
    } finally {
      setIsSavingGroup(false);
    }
  };

  const openTagDialog = (group: TagGroup, tag?: TagType | null) => {
    setSelectedTagGroup(group);
    setSelectedTag(tag || null);
    setTagForm(createTagForm(group, tag));
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
    const errors = validateTagForm(tagForm);
    setTagErrors(errors);

    if (hasFormErrors(errors)) {
      toast.error(t('tags.toasts.fixValidation'));
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
      toast.error(
        selectedTag ? t('tags.toasts.failedUpdateTag') : t('tags.toasts.failedCreateTag')
      );
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
      toast.error(t('tags.toasts.failedDeleteType', { type: deleteTarget.type }));
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds((prev) => toggleSelectedTagId(prev, tagId));
  };

  const clearSelection = () => {
    setSelectedTagIds(createEmptyTagSelection());
    setIsSelectMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedTagIds.size === 0) return;
    try {
      const result = await bulkDeleteTagsMutation.mutateAsync({
        tagIds: selectedTagIdsToArray(selectedTagIds)
      });
      clearSelection();
      toast.success(
        t('tags.toasts.tagsDeleted', { count: result.result.deletedTags }),
        TAG_TOAST_OPTIONS
      );
    } catch {
      toast.error(t('tags.toasts.failedDeleteTags'), TAG_ERROR_TOAST_OPTIONS);
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
        toast.success(t('tags.toasts.tagMoved'), TAG_TOAST_OPTIONS);
      } else if (moveTagsDialog.mode === 'bulk') {
        const result = await moveBatchTagsMutation.mutateAsync({
          tagIds: moveTagsDialog.tagIds,
          toGroupId: moveDestinationGroupId
        });
        clearSelection();
        toast.success(
          t('tags.toasts.tagsMoved', { count: result.result.movedTags }),
          TAG_TOAST_OPTIONS
        );
      } else if (moveTagsDialog.mode === 'group') {
        const result = await moveBatchTagsMutation.mutateAsync({
          fromGroupId: moveTagsDialog.fromGroupId,
          toGroupId: moveDestinationGroupId
        });
        toast.success(
          t('tags.toasts.tagsMoved', { count: result.result.movedTags }),
          TAG_TOAST_OPTIONS
        );
      }
      closeMoveDialog();
    } catch (error: unknown) {
      const status = (error as { response?: { status: number } })?.response?.status;
      if (status === 409) {
        toast.error(t('tags.toasts.nameConflict'), TAG_TOAST_OPTIONS);
      } else {
        toast.error(t('tags.toasts.failedMoveTags'), TAG_ERROR_TOAST_OPTIONS);
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
