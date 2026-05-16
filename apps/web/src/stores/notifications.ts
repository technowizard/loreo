import { produce } from 'immer';
import { create } from 'zustand';

import { createSelectorHooks } from '@/lib/create-selector-hooks';

export type NotificationType = 'success' | 'error' | 'info';

export type Notification = {
  id: string;
  message: string;
  type: NotificationType;
};

type NotificationsState = {
  notifications: Notification[];
  add: (notification: Omit<Notification, 'id'>) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useNotificationsStore = createSelectorHooks(
  create<NotificationsState>()((set) => ({
    notifications: [],
    add: (notification) =>
      set(
        produce((state) => {
          state.notifications.push({ ...notification, id: crypto.randomUUID() });
        })
      ),
    remove: (id) =>
      set(
        produce((state) => {
          state.notifications = state.notifications.filter((n: Notification) => n.id !== id);
        })
      ),
    clear: () =>
      set(
        produce((state) => {
          state.notifications = [];
        })
      )
  }))
);
