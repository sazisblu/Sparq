import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
const vapidSubject = Deno.env.get('VAPID_SUBJECT')!;

webpush.setVapidDetails(vapidSubject, Deno.env.get('VAPID_PUBLIC_KEY')!, vapidPrivateKey);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'Missing authorization' }, 401);

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: 'Unauthorized' }, 401);

  const { recipientUserId, title, body, url = '/', type = 'ping', activityId, icon } = await request.json();
  if (!recipientUserId || !title || !body) return json({ error: 'recipientUserId, title, and body are required' }, 400);
  if (!['ping', 'log', 'comment', 'reaction'].includes(type)) return json({ error: 'Invalid notification type' }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: membership } = await admin.from('arena_members').select('user_id').in('user_id', [user.id, recipientUserId]);
  if (!membership || membership.length !== 2) return json({ error: 'Both users must be arena members' }, 403);

  const { data: subscriptions, error: subscriptionError } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, subscription')
    .eq('user_id', recipientUserId);
  if (subscriptionError) return json({ error: subscriptionError.message }, 500);

  const payload = JSON.stringify({ title, body, url, icon });
  const { error: notificationError } = await admin.from('notifications').insert({
    recipient_user_id: recipientUserId,
    actor_user_id: user.id,
    type,
    title,
    body,
    icon_url: icon ?? null,
    activity_id: activityId ?? null,
  });
  if (notificationError) return json({ error: notificationError.message }, 500);

  await Promise.all((subscriptions ?? []).map(async (subscription) => {
    try {
      await webpush.sendNotification(subscription.subscription, payload);
    } catch (error) {
      if (error instanceof webpush.WebPushError && (error.statusCode === 404 || error.statusCode === 410)) {
        await admin.from('push_subscriptions').delete().eq('id', subscription.id);
        return;
      }
      throw error;
    }
  }));

  return json({ delivered: subscriptions?.length ?? 0 });
});
