import { isSupabaseEnabled, supabase } from './supabaseClient';

const getVisitorId = () => {
  const key = 't4c_visitor_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
};

export type EngagementSummary = {
  likeCount: number;
  shareCount: number;
  liked: boolean;
};

export type CommentItem = {
  id: string;
  article_id: string;
  name: string;
  message: string;
  created_at: string;
};

export const getArticleEngagement = async (articleId: string): Promise<EngagementSummary> => {
  if (!isSupabaseEnabled || !supabase) {
    return { likeCount: 0, shareCount: 0, liked: false };
  }
  const visitorId = getVisitorId();

  const [{ count: likeCount }, { count: shareCount }, { data: likedRow }] = await Promise.all([
    supabase.from('article_likes').select('*', { count: 'exact', head: true }).eq('article_id', articleId),
    supabase.from('article_shares').select('*', { count: 'exact', head: true }).eq('article_id', articleId),
    supabase
      .from('article_likes')
      .select('id')
      .eq('article_id', articleId)
      .eq('visitor_id', visitorId)
      .maybeSingle(),
  ]);

  return {
    likeCount: likeCount || 0,
    shareCount: shareCount || 0,
    liked: Boolean(likedRow),
  };
};

export const toggleLike = async (articleId: string) => {
  if (!isSupabaseEnabled || !supabase) {
    return false;
  }
  const visitorId = getVisitorId();
  const { data: existing } = await supabase
    .from('article_likes')
    .select('id')
    .eq('article_id', articleId)
    .eq('visitor_id', visitorId)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from('article_likes').delete().eq('id', existing.id);
    return false;
  }

  await supabase.from('article_likes').insert({ article_id: articleId, visitor_id: visitorId });
  return true;
};

export const addShare = async (articleId: string, platform: string) => {
  if (!isSupabaseEnabled || !supabase) {
    return;
  }
  const visitorId = getVisitorId();
  await supabase.from('article_shares').insert({
    article_id: articleId,
    visitor_id: visitorId,
    platform,
  });
};

export const listComments = async (articleId: string) => {
  if (!isSupabaseEnabled || !supabase) {
    return [];
  }
  const { data } = await supabase
    .from('article_comments')
    .select('*')
    .eq('article_id', articleId)
    .order('created_at', { ascending: false });
  return (data || []) as CommentItem[];
};

export const addComment = async (articleId: string, name: string, message: string) => {
  if (!isSupabaseEnabled || !supabase) {
    return;
  }
  const visitorId = getVisitorId();
  await supabase.from('article_comments').insert({
    article_id: articleId,
    visitor_id: visitorId,
    name,
    message,
  });
};
