/**
 * Push Notification Service
 * Handles browser push notification permission and display.
 * Notifications are shown only when the user is not actively viewing the chat.
 */

const STORAGE_KEY = 'lumatha_push_permission_asked';

/** Request browser notification permission (only once per session unless reset). */
export const requestPushPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  // Only ask once; avoid repeated prompts
  const alreadyAsked = sessionStorage.getItem(STORAGE_KEY);
  if (alreadyAsked) return Notification.permission;

  sessionStorage.setItem(STORAGE_KEY, '1');
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
};

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  /** URL to navigate to when the notification is clicked */
  url?: string;
}

/**
 * Show a browser push notification.
 * Skips silently if the user hasn't granted permission or the document is focused.
 */
export const showPushNotification = (options: PushNotificationOptions): void => {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  // Don't show when the tab/window is visible (user can see it)
  if (document.visibilityState === 'visible') return;

  const notification = new Notification(options.title, {
    body: options.body,
    icon: options.icon || '/favicon.ico',
    tag: options.tag,
    // Reuse existing notification with same tag instead of stacking
    renotify: false,
  });

  if (options.url) {
    notification.onclick = () => {
      window.focus();
      window.location.href = options.url!;
      notification.close();
    };
  }
};

/**
 * Show a push notification for a new chat message.
 * Skips if the user is currently viewing the chat with that sender.
 *
 * @param senderName  Display name of the message sender
 * @param preview     Short message preview text
 * @param senderId    Supabase user ID of the sender (used to build the chat URL)
 * @param icon        Optional avatar URL
 */
export const showMessagePushNotification = (
  senderName: string,
  preview: string,
  senderId: string,
  icon?: string,
): void => {
  // Don't fire if the user is already looking at this exact chat while the tab is visible
  if (window.location.pathname === `/chat/${senderId}` && document.visibilityState === 'visible') return;

  showPushNotification({
    title: senderName,
    body: preview.length > 80 ? `${preview.slice(0, 77)}…` : preview,
    icon,
    tag: `chat-${senderId}`,
    url: `/chat/${senderId}`,
  });
};
