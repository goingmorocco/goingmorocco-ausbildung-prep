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
                q: 'ما هو مستوى اللغة المطلوب لبرامج Ausbildung في ألمانيا؟',
                a: 'معظم البرامج تتطلب على الأقل مستوى B1، بينما البرامج التقنية والتجارية والصحية تتطلب غالبًا مستوى B2. يُفضّل دائمًا التحقق من متطلبات البرنامج المحدد الذي ترغب فيه.'
            },
            {
                q: 'كم مرة يمكنني إعادة الاختبار المحاكي؟',
                a: 'يمكنك إعادة الاختبار المحاكي عدد غير محدود من المرات خلال فترة اشتراكك. كل محاولة تُسجَّل في لوحة التحكم لتتبع تقدمك.'
            },
            {
                q: 'ما هي وسائل الدفع المتاحة للاشتراك؟',
                a: 'نقبل الدفع عبر بطاقات الائتمان والخصم (Visa, Mastercard) وأيضًا عبر البنوك المغربية المحلية. جميع المعاملات آمنة ومشفّرة وفقًا لأعلى معايير الحماية.'
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
                window.location.href = this.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
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
            this.isLoading = true;
            try {
                const { data, error } = await sb.auth.signInWithPassword({ email, password });
                if (error) {
                    this.showErrorModal('خطأ في تسجيل الدخول', 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
                    return;
                }
                const profile = await sbGetProfile(data.user.id);
                if (profile.membership_status === 'rejected') {
                    await sb.auth.signOut();
                    this.showErrorModal('تعذّر تسجيل الدخول', 'تم رفض عضويتك. يرجى التواصل مع الدعم لمزيد من المعلومات.');
                    return;
                }
                this.user = profile;
                this.closeModal();
                window.location.href = profile.role === 'admin' ? 'admin.html' : 'dashboard.html';
            } catch (error) {
                this.showErrorModal('خطأ في الاتصال', 'حدث خطأ أثناء الاتصال بالخادم');
            } finally {
                this.isLoading = false;
            }
        },

        async register(userData) {
            this.isLoading = true;
            try {
                const { error } = await sb.auth.signUp({
                    email: userData.email,
                    password: userData.password,
                    options: { data: { full_name: userData.full_name, phone: userData.phone || null } }
                });
                if (error) {
                    this.showErrorModal('خطأ في التسجيل', error.message === 'User already registered'
                        ? 'البريد الإلكتروني موجود بالفعل' : error.message);
                    return;
                }
                this.showSuccessModal('تم التسجيل بنجاح', 'تم إنشاء حسابك وهو الآن قيد المراجعة. سنُفعّل وصولك الكامل بعد تأكيد الاشتراك من طرف الإدارة.');
                setTimeout(() => {
                    this.closeModal();
                }, 2000);
            } catch (error) {
                this.showErrorModal('خطأ في الاتصال', 'حدث خطأ أثناء الاتصال بالخادم');
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
                    this.showErrorModal('تعذّر إرسال الرابط', 'تأكد من صحة البريد الإلكتروني وحاول مرة أخرى.');
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
