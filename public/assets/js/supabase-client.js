// Shared Supabase client, loaded by all three pages (index/dashboard/admin).
//
// SETUP: fill in your project's URL and anon (public) key below -- both
// from Supabase dashboard -> Project Settings -> API. The anon key is
// safe to expose in client-side code by design (it only grants access
// allowed by your Row Level Security policies); never put the service
// role key here or anywhere in frontend code.
const SUPABASE_URL = 'https://qonzvlatldtsalscffmm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbnp2bGF0bGR0c2Fsc2NmZm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MjI1NjEsImV4cCI6MjEwMzA5ODU2MX0.bP5C_sRr1ZrhojxJPc_wm9i23H5_xvw_HPt30_kvtwk';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Small helpers reused across pages, so each page's Alpine logic doesn't
// have to repeat the same Supabase query/invoke boilerplate.

async function sbGetProfile(userId) {
  const { data, error } = await sb.from('users').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

async function sbInvoke(functionName, body) {
  const { data, error } = await sb.functions.invoke(functionName, { body });
  if (error) {
    // Edge Functions return a normal JSON body even on 4xx/5xx; the
    // supabase-js client surfaces those as a "non-2xx" FunctionsHttpError
    // without exposing the parsed body directly, so fall back to a
    // generic message when that happens.
    let message = 'حدث خطأ أثناء الاتصال بالخادم';
    let code = null;
    try {
      if (error.context && typeof error.context.json === 'function') {
        const parsed = await error.context.json();
        if (parsed && parsed.message) message = parsed.message;
        if (parsed && parsed.code) code = parsed.code;
      }
    } catch (_) { /* ignore parse failure, use generic message */ }
    return { success: false, message, code };
  }
  return data;
}

// Floating support-chat widget, shared by every page a logged-in student
// can reach (dashboard, classroom, ...). One thread per student with the
// admin team; updates live via Supabase Realtime, not polling.
//
// Usage: x-data="supportChat()" x-init="initChat(user.id)" once the host
// page's own auth check has already set `user`.
function supportChat() {
  return {
    studentId: null,
    open: false,
    messages: [],
    newMessage: '',
    unreadCount: 0,
    sending: false,
    channel: null,

    async initChat(studentId) {
      this.studentId = studentId;
      await this.loadMessages();
      this.subscribeRealtime();
    },

    async loadMessages() {
      const { data, error } = await sb
        .from('support_messages')
        .select('*')
        .eq('student_id', this.studentId)
        .order('created_at', { ascending: true });
      if (!error) {
        this.messages = data;
        this.unreadCount = data.filter(m => m.sender_role === 'admin' && !m.read_at).length;
      }
    },

    subscribeRealtime() {
      this.channel = sb
        .channel('support-' + this.studentId)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'support_messages',
          filter: 'student_id=eq.' + this.studentId
        }, (payload) => {
          this.messages.push(payload.new);
          if (payload.new.sender_role === 'admin' && !this.open) {
            this.unreadCount++;
          }
          if (this.open) {
            this.$nextTick(() => this.scrollToBottom());
            if (payload.new.sender_role === 'admin') this.markRead();
          }
        })
        .subscribe();
    },

    toggleOpen() {
      this.open = !this.open;
      if (this.open) {
        this.$nextTick(() => this.scrollToBottom());
        this.markRead();
      }
    },

    scrollToBottom() {
      const el = this.$refs.chatScroll;
      if (el) el.scrollTop = el.scrollHeight;
    },

    async markRead() {
      if (this.unreadCount === 0) return;
      this.unreadCount = 0;
      await sb.from('support_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('student_id', this.studentId)
        .eq('sender_role', 'admin')
        .is('read_at', null);
    },

    async send() {
      const body = this.newMessage.trim();
      if (!body || this.sending) return;
      this.sending = true;
      this.newMessage = '';
      try {
        const { error } = await sb.from('support_messages').insert({
          student_id: this.studentId, sender_id: this.studentId, sender_role: 'student', body
        });
        if (error) this.newMessage = body; // put it back so nothing's lost
        else this.$nextTick(() => this.scrollToBottom());
      } finally {
        this.sending = false;
      }
    },

    formatTime(iso) {
      return new Date(iso).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' });
    }
  };
}
