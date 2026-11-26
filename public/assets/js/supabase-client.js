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
  let { data, error } = await sb.from('users').select('*').eq('id', userId).maybeSingle();
  if (!data) {
    // Signed-in account with no profile row (signup trigger missed it, or the
    // account predates it): ask the database to create it, then use that.
    try {
      const r = await sb.rpc('ensure_my_profile');
      if (!r.error && r.data) data = Array.isArray(r.data) ? r.data[0] : r.data;
    } catch (e) { /* function not installed yet -> fall through */ }
  }
  if (!data) throw error || new Error('profile_missing');
  // Paid access is time-limited: let the database downgrade an expired member.
  if (data.membership_status === 'active' && data.role === 'student') {
    try {
      const r = await sb.rpc('refresh_my_membership');
      if (!r.error && r.data === 'pending') data = Object.assign({}, data, { membership_status: 'pending' });
    } catch (e) { /* function not installed yet */ }
  }
  return data;
}

// Turn a Supabase Auth error into a clear Arabic message for the user.
function epAuthMessage(err) {
  const msg = String((err && (err.message || err.error_description)) || '').toLowerCase();
  const code = String((err && (err.code || err.error_code)) || '').toLowerCase();
  const has = (...k) => k.some(x => msg.includes(x) || code.includes(x));
  if (has('already registered', 'already been registered', 'user_already_exists'))
    return 'هذا البريد الإلكتروني مسجّل بالفعل. سجّل الدخول، أو استعمل «نسيت كلمة المرور؟» إن لزم.';
  if (has('rate limit', 'over_email_send_rate_limit', 'over_request_rate_limit', 'too many'))
    return 'تم تجاوز عدد المحاولات أو رسائل البريد المسموح بها مؤقتًا. انتظر قليلًا ثم حاول مرة أخرى، أو راسلنا عبر واتساب.';
  if (has('weak_password', 'password should', 'password is too'))
    return 'كلمة المرور ضعيفة. استعمل 8 أحرف على الأقل مع أرقام وحروف.';
  if (has('valid email', 'email_address_invalid', 'invalid email', 'unable to validate email'))
    return 'البريد الإلكتروني غير صالح. تأكد من كتابته بشكل صحيح.';
  if (has('signup_disabled', 'signups not allowed', 'signups are disabled'))
    return 'التسجيل مغلق مؤقتًا. تواصل معنا عبر واتساب.';
  if (has('email not confirmed', 'email_not_confirmed'))
    return 'لم يتم تأكيد بريدك الإلكتروني بعد. افتح رسالة التأكيد التي أرسلناها إليك ثم سجّل الدخول.';
  if (has('invalid login credentials', 'invalid_credentials'))
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  if (has('database error', 'unexpected_failure'))
    return 'تعذّر إنشاء الحساب بسبب خطأ في الخادم. حاول مرة أخرى، وإن استمر الخطأ راسلنا عبر واتساب.';
  if (has('failed to fetch', 'networkerror', 'network request failed', 'load failed'))
    return 'تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.';
  return 'حدث خطأ غير متوقع. حاول مرة أخرى، وإن استمر الخطأ راسلنا عبر واتساب.';
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


// ---------------------------------------------------------------------------
// Language tracks (course language the student follows). The interface language
// (AR/EN/FR/ES) is separate and handled by i18n.js.
// ---------------------------------------------------------------------------
const EP_TRACKS = [
    { id: 'de', flag: '🇩🇪', ar: 'الألمانية' },
    { id: 'en', flag: '🇬🇧', ar: 'الإنجليزية' },
    { id: 'fr', flag: '🇫🇷', ar: 'الفرنسية' },
    { id: 'es', flag: '🇪🇸', ar: 'الإسبانية' }
];

function epTrack() {
    try {
        const v = localStorage.getItem('ep_track');
        if (EP_TRACKS.some(t => t.id === v)) return v;
    } catch (e) { /* storage unavailable */ }
    return 'de';
}

function epSetTrack(id) {
    try { localStorage.setItem('ep_track', id); } catch (e) { /* ignore */ }
}

// Returns null when the user_tracks table is not installed (migration not run yet).
async function epLoadTracks(userId) {
    const { data, error } = await sb.from('user_tracks').select('track').eq('user_id', userId);
    if (error) return null;
    return (data || []).map(r => r.track);
}

async function epAddTrack(userId, id) {
    const { error } = await sb.from('user_tracks').insert({ user_id: userId, track: id });
    // Duplicate = already has it. Missing table = migration not run: keep going locally.
    return !error || error.code === '23505' || error.code === '42P01' || error.code === 'PGRST205';
}

// tests query that keeps working if the `track` column has not been added yet.
async function epTestsQuery(skillPractice, track) {
    let q = sb.from('tests').select('*').eq('is_active', true).eq('is_skill_practice', skillPractice).eq('track', track);
    let r = await q;
    if (r.error) {
        r = await sb.from('tests').select('*').eq('is_active', true).eq('is_skill_practice', skillPractice);
    }
    return r;
}
