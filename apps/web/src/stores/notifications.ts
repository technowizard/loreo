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
  error: (message: string) => void;
  info: (message: string) => void;
  remove: (id: string) => void;
  success: (message: string) => void;
  clear: () => void;
};

export const useNotificationsStore = createSelectorHooks(
  create<NotificationsState>()((set) => ({
    notifications: [],
    add: (notification) =>
      set(
        produce((state) => {
          state.notifications.push({
            ...notification,
            id: crypto.randomUUID()
          });
        })
      ),
    error: (message) =>
      set(
        produce((state) => {
          state.notifications.push({
            id: crypto.randomUUID(),
            message,
            type: 'error'
          });
        })
      ),
    info: (message) =>
      set(
        produce((state) => {
          state.notifications.push({
            id: crypto.randomUUID(),
            message,
            type: 'info'
          });
        })
      ),
    remove: (id) =>
      set(
        produce((state) => {
          state.notifications = state.notifications.filter((n: Notification) => n.id !== id);
        })
      ),
    success: (message) =>
      set(
        produce((state) => {
          state.notifications.push({
            id: crypto.randomUUID(),
            message,
            type: 'success'
          });
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
