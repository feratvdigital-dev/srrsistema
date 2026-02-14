import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const NOTIFICATION_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczEjqe2teleykPVrDi4LZiLBFKn9neli0QFEOa2+OsQBoLMIva6MFaNhI6lNTfnTkOGkmh3OWoRh0OOZTb5bJXKxJBl9jdlSwPFEib3ualRBwMNpHa5rRcLRRFmtrilywOEkac3OemRx4QO5bc5rJYKBE+lNTfnjoPG0uj3eepSCATPZbd5rFWJhA8kdLcnDgOHEyl3eiqSyIVQJne5rJXJhA7j9DamjYMHU6m3umtTiUYRJ3g57RaKBI9kNHbmzgOHlCo3+qvUCgbR6Dh6LZcKxQ/kdPdnToPIFKq4OutUioeSqui6rhhLhZCk9XeoDoRIlSs4+ywVC0hTa2k7LpkMRlFl9jgo0ATJV2x5u+3WjAkUbCn7r1oNh1Jm9vipkMWKGC06PC6XTQoVrOq8MBrOiFOo9/lqkYaLGW47PK9YTgsXbev8sRxPiVUqeLnsEsgMWu88PXBZj4uZb2z9cl3RitdsuXrtE8lNnXA8vrHbkMybb+2+c6ASjRlvbjx0YlQO3TA+PzSe1I/dMW8/NeLV0WAxPr+2YVYS4rI/f7djF9Pkc/+/+KTZFeY1f7/6ZppYKPb/v/vnm5msOP+/+ygdHDA7P7/8aN4d8fy/v/ypH17y/f+/+ujdn3Q+v7/7KB0ftb9/v/snXB+2/7+/+qYan/f/v7/55Nlf+L+/v/kj2F/5P7+/+KLXX/l/v7/4Idaf+b+/v/ehFd/5v7+/96CVX/m/v7/3oFUf+b+/v/egFN/5f7+/959Un/k/v7/3XtRf+L+/v/deVB/4P7+/916UP/d/v7/3XtR/9z+/v/dfFP/2/7+/919Vf/a/v7/3X5X/9n+/v/egFr/2P7+/9+DXf/X/v7/4Idh/9f+/v/hjGX/1/7+/+KRav/X/v7/5Jdw/9j+/v/mnXb/2P7+/+ije//Z';

export function useTicketNotifications() {
  const [pendingTickets, setPendingTickets] = useState<any[]>([]);
  const prevCountRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      // Use Web Audio API for a simple notification beep
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Could not play notification sound');
    }
  }, []);

  const showBrowserNotification = useCallback((ticket: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('📩 Novo Chamado Recebido', {
        body: `${ticket.name} — ${ticket.description?.substring(0, 60) || 'Sem descrição'}`,
        icon: '/favicon.ico',
        tag: `ticket-${ticket.id}`,
      });
    }
  }, []);

  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch pending tickets
  const fetchPendingTickets = useCallback(async () => {
    const { data } = await supabase
      .from('client_tickets')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    return data || [];
  }, []);

  useEffect(() => {
    requestNotificationPermission();

    // Initial fetch
    fetchPendingTickets().then(tickets => {
      setPendingTickets(tickets);
      prevCountRef.current = tickets.length;
    });

    // Realtime listener for new tickets
    const channel = supabase
      .channel('ticket_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'client_tickets' },
        (payload) => {
          const newTicket = payload.new;
          if (newTicket.status === 'pending') {
            playNotificationSound();
            showBrowserNotification(newTicket);
            setPendingTickets(prev => [newTicket, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'client_tickets' },
        () => {
          // Refresh the list when a ticket is updated (e.g., accepted)
          fetchPendingTickets().then(setPendingTickets);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPendingTickets, playNotificationSound, showBrowserNotification, requestNotificationPermission]);

  return { pendingTickets };
}
