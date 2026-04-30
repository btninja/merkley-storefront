export type NotificationItem = {
  name: string;
  event_key: string;
  title: string;
  body: string;
  link_url: string;
  is_read: 0 | 1;
  created_at: string;
};

export type NotificationListResponse = {
  items: NotificationItem[];
  unread_count: number;
};
