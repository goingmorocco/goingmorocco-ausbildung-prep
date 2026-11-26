function homeApp() {
    return {
        user: null,
        isLoading: false,
        showModal: false,
        showMobileMenu: false,
        scrolled: false,
        spotX: 72,
        spotY: 38,
        modalTitle: '',
        modalContent: '',
        email: '',
        password: '',
        rememberMe: false,
        resetEmail: '',
        resetEmailSent: false,
        showLoginPassword: false,
        showRegisterPassword: false,
        showRegisterPasswordConfirm: false,
        latestPosts: [],
        openFaq: null,
        statsPlayed: false,
        statExams: 0,
        statQuestions: 0,
        userData: {
            full_name: '',
            email: '',
            phone: '',
            password: '',
            password_confirm: '',
            track: '',
            terms_accepted: false
        },
        tests: [
            {
                name: 'Goethe-Zertifikat B1',
                subtitle: 'المستوى المتوسط',
                desc: 'الاختبار الرسمي لمعهد جوته لمستوى B1، يركز على التواصل اليومي والمواقف العملية',
                minutes: 165,
                questions: 60,
                note: 'مناسب لـ Ausbildung',
                level: 'B1',
                icon: 'fas fa-language',
                tone: 'red'
            },
            {
                name: 'Goethe-Zertifikat B2',
                subtitle: 'المستوى فوق المتوسط',
                desc: 'الاختبار الرسمي لمعهد جوته لمستوى B2، مطلوب لبرامج Ausbildung التقنية والتجارية',
                minutes: 180,
                questions: 60,
                note: 'مطلوب لمعظم البرامج',
                level: 'B2',
                icon: 'fas fa-language',
                tone: 'red'
            },
            {
                name: 'telc Deutsch B1 Beruf',
                subtitle: 'اللغة الألمانية المهنية',
                desc: 'اختبار telc المتخصص في السياقات المهنية، مثالي للمتقدمين لبرامج Ausbildung العملية',
                minutes: 150,
                questions: 60,
                note: 'مصطلحات مهنية',
                level: 'B1',
                icon: 'fas fa-briefcase',
                tone: 'gold'
            },
            {
                name: 'telc Deutsch B2 Beruf',
                subtitle: 'اللغة الألمانية المهنية المتقدمة',
                desc: 'اختبار telc المتخصص في السياقات المهنية لمستوى B2، مطلوب للبرامج التقنية والتجارية',
                minutes: 150,
                questions: 60,
                note: 'تواصل مهني',
                level: 'B2',
                icon: 'fas fa-briefcase',
                tone: 'gold'
            },
            {
                name: 'ÖSD Zertifikat B1',
                subtitle: 'شهادة اللغة الألمانية النمساوية',
                desc: 'شهادة اللغة الألمانية من معهد ÖSD النمساوي، معترف بها في ألمانيا لجميع الأغراض',
                minutes: 160,
                questions: 55,
                note: 'معترف به بالاتحاد الأوروبي',
                level: 'B1',
                icon: 'fas fa-language',
                tone: 'red'
            },
            {
                name: 'ÖSD Zertifikat B2',
                subtitle: 'شهادة اللغة الألمانية النمساوية المتقدمة',
                desc: 'شهادة ÖSD لمستوى B2، تُعادل Goethe B2 وتُقبل من قبل جميع المؤسسات الألمانية',
                minutes: 210,
                questions: 55,
                note: 'أكاديمية ومهنية',
                level: 'B2',
                icon: 'fas fa-language',
                tone: 'red'
            }
        ],
        testimonials: [
            {
                initials: 'م.أ',
                name: 'محمد أحمد',
                meta: 'نجح في اختبار telc B1 Beruf',
                quote: 'الاختبارات المحاكية كانت مشابهة تمامًا للاختبار الحقيقي. الشروحات التفصيلية ساعدتني على فهم أخطائي وتحسين مستواي بشكل ملحوظ.'
            },
            {
                initials: 'ف.ز',
                name: 'فاطمة الزهراء',
                meta: 'نجحت في اختبار Goethe B2',
                quote: 'ركزت على telc B1 Beruf لأنني أريد Ausbildung في المجال الصحي. المواد كانت ممتازة وحصلت على 82% في الاختبار الحقيقي بفضل التحضير هنا.'
            },
            {
                initials: 'ي.ب',
                name: 'يوسف بن علي',
                meta: 'نجح في اختبار ÖSD B2',
                quote: 'أحببت خاصية تتبع التقدم التي أظهرت لي مدى تحسني من أسبوع لآخر. أعطتني الثقة للذهاب إلى المركز الامتحاني بدون توتر.'
            }
        ],
        faqs: [
            {
                q: 'كيف تعمل الحصص المباشرة؟',
                a: 'ينشر الأستاذ رابط Zoom أو Google Meet لكل حصة. تدخل إلى لوحة التحكم وتضغط «انضمام» فيُسجَّل حضورك تلقائيًا ثم تفتح الحصة مباشرة.'
            },
            {
                q: 'ما اللغات المتاحة؟',
                a: 'نقدّم الألمانية والإنجليزية والفرنسية والإسبانية. الاختبارات التدريبية متاحة الآن للألمانية، وسنضيفها تباعًا لباقي اللغات.'
            },
            {
                q: 'ما هو مستوى اللغة المطلوب لبرامج Ausbildung في ألمانيا؟',
                a: 'معظم البرامج تتطلب على الأقل مستوى B1، بينما البرامج التقنية والتجارية والصحية تتطلب غالبًا مستوى B2. يُفضّل دائمًا التحقق من متطلبات البرنامج المحدد الذي ترغب فيه.'
            },
            {
                q: 'كم مرة يمكنني إعادة الاختبار المحاكي؟',
                a: 'يمكنك إعادة الاختبار المحاكي عدد غير محدود من المرات خلال فترة اشتراكك. كل محاولة تُسجَّل في لوحة التحكم لتتبع تقدمك.'
            },
            {
                q: 'ما هي وسائل الدفع المتاحة للاشتراك؟',
                a: 'ندفع بسهولة ودون بطاقة بنكية: نقدًا في مقر الأكاديمية، أو بتحويل بنكي إلى حسابنا في CIH Bank أو التجاري وفا بنك. بعد الدفع يؤكد فريقنا استلام المبلغ ويُفعَّل اشتراكك، وتجد تفاصيل الحسابات داخل حسابك في صفحة الاشتراك.'
            },
            {
                q: 'هل يمكنني الإلغاء في أي وقت والحصول على استرداد؟',
                a: 'نعم، يمكنك إلغاء اشتراكك في أي وقت من لوحة التحكم. ومع ذلك، لا يُسترد المبلغ عن الفترة المتبقية من الاشتراك الحالي، لكنه سيظل فعالًا حتى نهاية الفترة المدفوعة.'
            }
        ],

        async init() {
            this.onScroll();
            this._onScroll = () => this.onScroll();
            window.addEventListener('scroll', this._onScroll, { passive: true });

            const { data: { session } } = await sb.auth.getSession();
            if (session) {
                try {
                    this.user = await sbGetProfile(session.user.id);
                } catch (e) {
                    console.error('Failed to load profile:', e);
                }
            }
            this.loadLatestPosts();

            if (!this.user && new URLSearchParams(window.location.search).get('signup') === '1') {
                this.$nextTick(() => this.openSignup());
            }
        },

        onScroll() {
            this.scrolled = window.scrollY > 24;
        },

        onHeroMove(e) {
            const r = e.currentTarget.getBoundingClientRect();
            this.spotX = ((e.clientX - r.left) / r.width) * 100;
            this.spotY = ((e.clientY - r.top) / r.height) * 100;
        },

        animateNum(key, to, duration) {
            duration = duration || 1400;
            const start = performance.now();
            const tick = (now) => {
                const t = Math.min(1, (now - start) / duration);
                const eased = 1 - Math.pow(1 - t, 3);
                this[key] = Math.round(to * eased);
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        },

        playStats() {
            if (this.statsPlayed) return;
            this.statsPlayed = true;
            this.animateNum('statExams', 6, 900);
            this.animateNum('statQuestions', 394, 1400);
        },

        openSignup() {
            this.showModal = true;
            this.modalTitle = 'إنشاء حساب';
            this.modalContent = this.$refs['register-form'].innerHTML;
        },

        openLogin() {
            this.showModal = true;
            this.modalTitle = 'تسجيل الدخول';
            this.modalContent = this.$refs['login-form'].innerHTML;
        },

        openForgot() {
            this.resetEmailSent = false;
            this.resetEmail = '';
            this.showModal = true;
            this.modalTitle = 'استعادة كلمة المرور';
            this.modalContent = this.$refs['forgot-password-form'].innerHTML;
        },

        confirmLogout() {
            this.showModal = true;
            this.modalTitle = 'تسجيل الخروج';
            this.modalContent = this.$refs['logout-form'].innerHTML;
        },

        goPrimary() {
            if (this.user) {
                window.location.href = this.homeFor(this.user);
                return;
            }
            this.openSignup();
        },

        async loadLatestPosts() {
            try {
                const { data } = await sb.from('blog_posts')
                    .select('id, title, slug, excerpt, cover_image_path')
                    .eq('is_published', true)
                    .order('published_at', { ascending: false })
                    .limit(3);
                this.latestPosts = (data || []).map(p => ({
                    ...p,
                    imageUrl: p.cover_image_path
                        ? sb.storage.from('blog-images').getPublicUrl(p.cover_image_path).data.publicUrl
                        : null
                }));
            } catch (e) {
                console.error(e);
            }
        },

        async login(email, password) {
            email = (email || '').trim().toLowerCase();
            if (!email || !password) return;
            this.isLoading = true;
            try {
                const { data, error } = await sb.auth.signInWithPassword({ email, password });
                if (error) {
                    const notConfirmed = /not confirmed/i.test(error.message || '') || error.code === 'email_not_confirmed';
                    if (notConfirmed) {
                        try { await sb.auth.resend({ type: 'signup', email }); } catch (e) { /* rate limited: ignore */ }
                    }
                    this.showErrorModal('تعذّر تسجيل الدخول', epAuthMessage(error));
                    return;
                }
                let profile;
                try {
                    profile = await sbGetProfile(data.user.id);
                } catch (e) {
                    await sb.auth.signOut();
                    this.showErrorModal('تعذّر تسجيل الدخول', 'تم تسجيل دخولك لكن تعذّر تحميل ملفك الشخصي. حاول مرة أخرى، وإن استمر الخطأ راسلنا عبر واتساب.');
                    return;
                }
                if (profile.membership_status === 'rejected') {
                    await sb.auth.signOut();
                    this.showErrorModal('تعذّر تسجيل الدخول', 'تم رفض عضويتك. يرجى التواصل مع الدعم لمزيد من المعلومات.');
                    return;
                }
                this.user = profile;
                this.closeModal();
                window.location.href = this.homeFor(profile);
            } catch (error) {
                this.showErrorModal('خطأ في الاتصال', epAuthMessage(error));
            } finally {
                this.isLoading = false;
            }
        },

        homeFor(profile) {
            if (profile.role === 'admin') return 'admin.html';
            if (profile.role === 'teacher') return 'teacher.html';
            return 'dashboard.html';
        },

        async register(u) {
            const name = (u.full_name || '').trim();
            const email = (u.email || '').trim().toLowerCase();
            const password = u.password || '';
            const phone = (u.phone || '').replace(/[^\d+]/g, '').slice(0, 20) || null;
            const bad = (m) => this.showErrorModal('تعذّر إنشاء الحساب', m);
            if (name.length < 2) return bad('اكتب اسمك الكامل.');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return bad('البريد الإلكتروني غير صالح. تأكد من كتابته بشكل صحيح.');
            if (password.length < 8) return bad('كلمة المرور قصيرة. استعمل 8 أحرف على الأقل.');
            if (password !== u.password_confirm) return bad('كلمتا المرور غير متطابقتين.');
            if (!u.terms_accepted) return bad('يجب الموافقة على شروط الاستخدام وسياسة الخصوصية.');

            this.isLoading = true;
            try {
                const dir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
                const meta = { full_name: name, phone };
                if (['de', 'en', 'fr', 'es'].includes(u.track)) meta.track = u.track;
                const { data, error } = await sb.auth.signUp({
                    email, password,
                    options: { data: meta, emailRedirectTo: window.location.origin + dir + 'index.html' }
                });
                if (error) {
                    bad(epAuthMessage(error));
                    return;
                }
                // With e-mail confirmation on, an existing address is not an error:
                // Supabase returns a user with no identities.
                if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
                    bad(epAuthMessage({ code: 'user_already_exists' }));
                    return;
                }
                if (meta.track) { try { localStorage.setItem('ep_track', meta.track); } catch (e) { /* ignore */ }
                }
                if (data.session) {
                    this.showSuccessModal('تم إنشاء حسابك', 'مرحبًا بك! جارٍ تحويلك إلى لوحة التحكم...');
                    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
                } else {
                    this.showSuccessModal('تم إنشاء حسابك', 'أرسلنا رسالة تأكيد إلى بريدك الإلكتروني. افتح الرابط الموجود فيها (تحقق من الرسائل غير المرغوب فيها أيضًا) ثم سجّل الدخول.');
                }
            } catch (error) {
                bad(epAuthMessage(error));
            } finally {
                this.isLoading = false;
            }
        },

        async sendPasswordReset(email) {
            if (!email) return;
            this.isLoading = true;
            try {
                const path = window.location.pathname;
                const dir = path.substring(0, path.lastIndexOf('/') + 1);
                const redirectTo = window.location.origin + dir + 'reset-password.html';
                const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
                if (error) {
                    this.showErrorModal('تعذّر إرسال الرابط', epAuthMessage(error));
                    return;
                }
                this.resetEmailSent = true;
            } catch (error) {
                this.showErrorModal('خطأ في الاتصال', 'حدث خطأ أثناء الاتصال بالخادم');
            } finally {
                this.isLoading = false;
            }
        },

        showErrorModal(title, message) {
            this.modalTitle = title;
            this.modalContent = message;
            this.showModal = true;
        },

        showSuccessModal(title, message) {
            this.modalTitle = title;
            this.modalContent = message;
            this.showModal = true;
        },

        closeModal() {
            this.showModal = false;
            this.modalTitle = '';
            this.modalContent = '';
        },

        async logout() {
            await sb.auth.signOut();
            this.user = null;
            window.location.href = 'index.html';
        }
    };
}
