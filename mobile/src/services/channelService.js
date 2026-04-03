// mobile/src/services/channelService.js
// ✅ Channel & Attachment Service — Supabase

import supabase from './supabase';

// ==========================================
// ✅ Fetch Channels for a Specific Server (Grouped by Category)
// ==========================================
export async function fetchServerChannels(serverId) {
  if (!serverId) throw new Error('serverId is required');

  // Fetch all categories for this server
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('server_id', serverId)
    .order('position', { ascending: true });

  if (catError) throw catError;

  // Fetch all channels for this server
  const { data: channels, error: chanError } = await supabase
    .from('channels')
    .select('*')
    .eq('server_id', serverId)
    .order('position', { ascending: true });

  if (chanError) throw chanError;

  // Group channels by category_id
  const grouped = (categories || []).map(cat => ({
    ...cat,
    channels: channels.filter(ch => ch.category_id === cat.id)
  }));

  // Handle uncategorized channels
  const uncategorized = channels.filter(ch => !ch.category_id);
  if (uncategorized.length > 0) {
    grouped.unshift({
      id: 'uncategorized',
      name: 'General',
      channels: uncategorized,
    });
  }

  return grouped;
}

// ==========================================
// ✅ Fetch Messages for a Channel
// ==========================================
export async function fetchChannelMessages(channelId, limit = 50) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, username, avatar_url)
    `)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(msg => ({
    _id: msg.id?.toString(),
    text: msg.content,
    createdAt: new Date(msg.created_at),
    senderId: msg.sender_id,
    senderUsername: msg.sender?.username || 'Unknown',
    senderAvatar: msg.sender?.avatar_url,
    attachmentUrl: msg.attachment_url,
    attachmentType: msg.attachment_type,
    intent: msg.intent,
    confidence: msg.confidence,
    translation: msg.translation,
    technicalTerms: msg.technical_terms,
    user: { _id: msg.sender_id },
  }));
}

// ==========================================
// ✅ Send a Channel Message
// ==========================================
export async function sendChannelMessage(channelId, senderId, content, attachmentUrl = null, attachmentType = null) {
  const insertData = {
    channel_id: channelId,
    sender_id: senderId,
    receiver_id: senderId,  // Channel messages: receiver_id = sender_id (required by schema NOT NULL)
    content: content || '',
    attachment_url: attachmentUrl,
    attachment_type: attachmentType,
  };

  const { data, error } = await supabase
    .from('messages')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==========================================
// ✅ Subscribe to Channel Messages (Realtime)
// ==========================================
export function subscribeToChannel(channelId, onNewMessage) {
  const channel = supabase
    .channel(`channel:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      },
      async (payload) => {
        const msg = payload.new;
        // Fetch sender profile
        const { data: sender } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', msg.sender_id)
          .single();

        const formatted = {
          _id: msg.id?.toString(),
          text: msg.content,
          createdAt: new Date(msg.created_at),
          senderId: msg.sender_id,
          senderUsername: sender?.username || 'Unknown',
          senderAvatar: sender?.avatar_url,
          attachmentUrl: msg.attachment_url,
          attachmentType: msg.attachment_type,
          user: { _id: msg.sender_id },
        };
        onNewMessage(formatted);
      }
    )
    .subscribe();

  return channel;
}

// ==========================================
// ✅ Upload Attachment to Supabase Storage
// ==========================================
export async function uploadAttachment(fileUri, fileType = 'image') {
  try {
    const ext = fileUri.split('.').pop()?.toLowerCase() || (fileType === 'video' ? 'mp4' : 'jpg');
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = `attachments/${fileName}`;

    const contentType = fileType === 'video'
      ? `video/${ext === 'mov' ? 'quicktime' : ext}`
      : `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    // Use FormData — the most reliable upload method in React Native
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: contentType,
    });

    // Get auth token for Supabase Storage REST API
    const { data: { session } } = await supabase.auth.getSession();
    const SUPABASE_URL = supabase.supabaseUrl;
    const SUPABASE_KEY = supabase.supabaseKey;

    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/chat-attachments/${filePath}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_KEY,
        },
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const errBody = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} ${errBody}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      type: fileType,
    };
  } catch (error) {
    console.error('❌ Upload attachment error:', error.message);
    throw error;
  }
}
