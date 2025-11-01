import { supabase } from '../lib/supabase'

/**
 * Show a browser notification
 */
export async function showNotification(title: string, body: string, icon?: string) {
  // Check if notifications are supported
  if (!('Notification' in window)) {
    return
  }

  // Check if permission is granted
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
    })
  }
}

/**
 * Check if user has notifications enabled
 */
export async function checkNotificationsEnabled(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('notifications_enabled')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking notification preference:', error)
      return false
    }

    return data?.notifications_enabled || false
  } catch (error) {
    console.error('Error checking notification preference:', error)
    return false
  }
}

/**
 * Trigger notification if user has them enabled
 */
export async function triggerNotificationIfEnabled(
  userId: string,
  title: string,
  body: string,
  icon?: string
) {
  console.log('🔔 Triggering notification check for user:', userId)
  const enabled = await checkNotificationsEnabled(userId)
  console.log('🔔 User notifications enabled:', enabled, 'Permission:', Notification.permission)
  
  if (enabled && Notification.permission === 'granted') {
    showNotification(title, body, icon)
    console.log('✅ Notification sent!')
  } else {
    console.log('❌ Notification not sent - enabled:', enabled, 'permission:', Notification.permission)
  }
}

