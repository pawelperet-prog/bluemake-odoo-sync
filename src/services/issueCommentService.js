/**
 * Bluemake Central Workshop Comments & Photo Issue Reporting Service
 * Allows operators (e.g. Mateusz) to report defects, broken tools, discrepancies,
 * or general notes with attached photos, synchronized centrally across all devices.
 */

const LOCAL_COMMENTS_CACHE_KEY = 'bluemake_workshop_comments_cache_v1';

export function getCachedComments() {
  try {
    const raw = localStorage.getItem(LOCAL_COMMENTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCachedComments(comments) {
  try {
    localStorage.setItem(LOCAL_COMMENTS_CACHE_KEY, JSON.stringify(comments));
  } catch (e) {
    console.warn('Could not cache comments:', e);
  }
}

/**
 * Fetch comments from central server (optionally filtered by orderId)
 */
export async function fetchComments(orderId = null) {
  try {
    const url = orderId 
      ? `/api/sync/comments?orderId=${encodeURIComponent(orderId)}` 
      : '/api/sync/comments';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.comments)) {
        if (!orderId) {
          saveCachedComments(data.comments);
        } else {
          // Merge into cache
          const cached = getCachedComments();
          const map = new Map();
          cached.forEach(c => map.set(c.id, c));
          data.comments.forEach(c => map.set(c.id, c));
          saveCachedComments(Array.from(map.values()));
        }
        return data.comments;
      }
    }
  } catch (err) {
    console.warn('Could not fetch comments from server, using local cache:', err);
  }

  // Fallback to local cache
  const cached = getCachedComments();
  if (orderId) {
    return cached.filter(c => c.orderId === orderId);
  }
  return cached;
}

/**
 * Submit a new comment / problem report with optional photo
 */
export async function submitComment({ 
  orderId = null, 
  orderRef = '', 
  sku = '', 
  operator = 'Mateusz', 
  operatorRole = 'ADMIN',
  text = '', 
  photoFile = null, 
  type = 'PROBLEM' 
}) {
  try {
    const formData = new FormData();
    if (orderId) formData.append('orderId', orderId);
    if (orderRef) formData.append('orderRef', orderRef);
    if (sku) formData.append('sku', sku);
    formData.append('operator', operator);
    formData.append('operatorRole', operatorRole);
    formData.append('text', text);
    formData.append('type', type);
    if (photoFile) {
      formData.append('photo', photoFile);
    }

    const res = await fetch('/api/sync/comments', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.comment) {
        // Update local cache
        const cached = getCachedComments();
        cached.unshift(data.comment);
        saveCachedComments(cached);
        return { success: true, comment: data.comment };
      }
    }
    const errText = await res.text();
    return { success: false, error: errText || 'Błąd serwera' };
  } catch (err) {
    console.error('Error submitting comment:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Toggle resolve status of a comment
 */
export async function toggleResolveComment(commentId, operator = 'Admin') {
  try {
    const res = await fetch(`/api/sync/comments/${commentId}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.comment) {
        const cached = getCachedComments();
        const idx = cached.findIndex(c => c.id === commentId);
        if (idx !== -1) {
          cached[idx] = data.comment;
          saveCachedComments(cached);
        }
        return { success: true, comment: data.comment };
      }
    }
  } catch (err) {
    console.error('Error toggling resolve comment:', err);
  }
  return { success: false };
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId) {
  try {
    const res = await fetch(`/api/sync/comments/${commentId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const cached = getCachedComments();
      const filtered = cached.filter(c => c.id !== commentId);
      saveCachedComments(filtered);
      return { success: true };
    }
  } catch (err) {
    console.error('Error deleting comment:', err);
  }
  return { success: false };
}
