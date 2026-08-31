// Test content: metadata + sections (Lesen/Sprachbausteine/Hoeren) + writing prompts.
// Extracted into its own module so both api/tests.js (routes) and
// scripts/generate-audio.js (offline TTS generation) can share the exact
// same data without duplicating it.
//
// Listening sections carry an `audio_url` pointing at a predictable path
// under /public/audio/<testId>__<sectionKey>.mp3. Those files do not exist
// until you run `node scripts/generate-audio.js` (see that file for setup).
// Until then the frontend gracefully falls back to the transcript.
//
// `is_skill_practice: true` marks the short single-skill drills (as
// opposed to the long realistic exams). `skill` groups them (reading/
// listening/writing/speaking); `level` is an honest CEFR estimate (A2/
// B1/B2) based on actual sentence complexity, vocabulary range, and
// register -- NOT a default. Every skill-practice test's level was
// reviewed and reassigned in one pass rather than inheriting a uniform
// 'B1' placeholder from creation. Full-exam levels (Goethe/telc/OSD B1
// or B2) are a different thing entirely -- they name which real exam
// format the test represents, not a calibration claim; whether their
// actual difficulty matches a real exam at that level is a separate,
// larger, not-yet-done review.
//
// `content_kind` distinguishes a multiple-choice quiz ('quiz', default)
// from a pure AI-graded essay prompt ('essay', no sections at all) from
// a "mixed" test (content_kind='quiz' but WITH a test_writing_prompts
// row attached -- same shape full exams have always used). public/
// schreiben.html's quiz flow offers to continue into the essay-grading
// flow after the MC portion when a writing prompt is attached.
//
// NOTE: content can now also be created/edited live from the admin
// dashboard's test builder (public/admin.html, "الاختبارات" تبويب), backed
// by the admin-tests Edge Function. Tests added via the admin UI live
// only in the database, not in this file. Running the seed script again
// is safe either way (it upserts by test_type) but will NOT remove or
// overwrite tests created purely through the admin UI.

const mockTests = [
  {
    "id": "test_goethe_b1",
    "title": "Goethe-Zertifikat B1",
    "description": "الاختبار الرسمي لمعهد جوته لمستوى B1 — يتكون من 4 وحدات: القراءة، الاستماع، الكتابة، والمحادثة",
    "test_type": "goethe_b1",
    "level": "B1",
    "duration_minutes": 165,
    "total_questions": 60,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": false,
    "skill": null
  },
  {
    "id": "test_goethe_b2",
    "title": "Goethe-Zertifikat B2",
    "description": "الاختبار الرسمي لمعهد جوته لمستوى B2 — يتكون من 4 وحدات: القراءة، الاستماع، الكتابة، والمحادثة",
    "test_type": "goethe_b2",
    "level": "B2",
    "duration_minutes": 180,
    "total_questions": 60,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": false,
    "skill": null
  },
  {
    "id": "test_telc_b1_beruf",
    "title": "telc Deutsch B1 Beruf",
    "description": "اختبار telc المتخصص في السياقات المهنية لمستوى B1 — Leseverstehen, Sprachbausteine, Hörverstehen, Schriftlicher und Mündlicher Ausdruck",
    "test_type": "telc_b1_beruf",
    "level": "B1",
    "duration_minutes": 150,
    "total_questions": 60,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": false,
    "skill": null
  },
  {
    "id": "test_telc_b2_beruf",
    "title": "telc Deutsch B2 Beruf",
    "description": "اختبار telc المتخصص في السياقات المهنية لمستوى B2 — Leseverstehen, Sprachbausteine, Hörverstehen, Schriftlicher und Mündlicher Ausdruck",
    "test_type": "telc_b2_beruf",
    "level": "B2",
    "duration_minutes": 150,
    "total_questions": 60,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": false,
    "skill": null
  },
  {
    "id": "test_osd_b1",
    "title": "ÖSD Zertifikat B1",
    "description": "شهادة اللغة الألمانية من معهد ÖSD النمساوي لمستوى B1 — Lesen, Hören, Schreiben, Sprechen (نفس عائلة اختبار Zertifikat B1 المشترك مع Goethe)",
    "test_type": "osd_b1",
    "level": "B1",
    "duration_minutes": 160,
    "total_questions": 60,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": false,
    "skill": null
  },
  {
    "id": "test_osd_b2",
    "title": "ÖSD Zertifikat B2",
    "description": "شهادة اللغة الألمانية من معهد ÖSD النمساوي لمستوى B2 — Lesen, Hören, Schreiben, Sprechen (نصوص من النمسا وألمانيا وسويسرا)",
    "test_type": "osd_b2",
    "level": "B2",
    "duration_minutes": 210,
    "total_questions": 64,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": false,
    "skill": null
  },
  {
    "id": "test_skill_reading",
    "title": "تدريب سريع: القراءة",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق، مثالي للتدريب اليومي السريع",
    "test_type": "skill_reading",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading"
  },
  {
    "id": "test_skill_listening",
    "title": "تدريب سريع: الاستماع",
    "description": "حوار قصير وست أسئلة استيعاب — حوالي 6 دقائق، مثالي للتدريب اليومي السريع",
    "test_type": "skill_listening",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening"
  },
  {
    "id": "test_skill_writing",
    "title": "تدريب سريع: أساسيات الكتابة",
    "description": "تدريب على القواعد والروابط اللغوية الأساسية للكتابة الجيدة — حوالي 6 دقائق",
    "test_type": "skill_writing",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 7,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "writing"
  },
  {
    "id": "test_skill_reading_market",
    "title": "تدريب القراءة: في السوبرماركت",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_market",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading"
  },
  {
    "id": "test_skill_reading_trip",
    "title": "تدريب القراءة: رحلة نهاية الأسبوع",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_trip",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading"
  },
  {
    "id": "test_skill_reading_neighbor",
    "title": "تدريب القراءة: الجار الجديد",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_neighbor",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading"
  },
  {
    "id": "test_skill_listening_restaurant",
    "title": "تدريب الاستماع: حجز طاولة في مطعم",
    "description": "حوار قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_restaurant",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening"
  },
  {
    "id": "test_skill_listening_directions",
    "title": "تدريب الاستماع: السؤال عن الطريق",
    "description": "حوار قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_directions",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening"
  },
  {
    "id": "test_skill_writing_formal",
    "title": "تدريب الكتابة: الأسلوب الرسمي",
    "description": "تدريب على اختيار الصيغة الرسمية المناسبة في المراسلات — حوالي 6 دقائق",
    "test_type": "skill_writing_formal",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 7,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "writing"
  },
  {
    "id": "test_skill_writing_clauses",
    "title": "تدريب الكتابة: الجمل الفرعية",
    "description": "تدريب على بناء الجمل الفرعية والروابط اللغوية — حوالي 6 دقائق",
    "test_type": "skill_writing_clauses",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 7,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "writing"
  },
  {
    "id": "test_skill_reading_dentist",
    "title": "تدريب القراءة: عند طبيب الأسنان",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_dentist",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading"
  },
  {
    "id": "test_skill_reading_birthday",
    "title": "تدريب القراءة: حفلة عيد ميلاد",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_birthday",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading"
  },
  {
    "id": "test_skill_reading_library",
    "title": "تدريب القراءة: المكتبة العامة",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_library",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading"
  },
  {
    "id": "test_skill_reading_phone",
    "title": "تدريب القراءة: شراء هاتف جديد",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_phone",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading"
  },
  {
    "id": "test_skill_reading_firstday",
    "title": "تدريب القراءة: أول يوم عمل",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_firstday",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading"
  },
  {
    "id": "test_skill_reading_train",
    "title": "تدريب القراءة: السفر بالقطار",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_train",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading"
  },
  {
    "id": "test_skill_reading_moving",
    "title": "تدريب القراءة: الانتقال إلى شقة جديدة",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_moving",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading"
  },
  {
    "id": "test_skill_listening_bank",
    "title": "تدريب الاستماع: مكالمة مع البنك",
    "description": "حوار قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_bank",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening"
  },
  {
    "id": "test_skill_listening_station",
    "title": "تدريب الاستماع: إعلان في محطة القطار",
    "description": "إعلان قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_station",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening"
  },
  {
    "id": "test_skill_listening_interview",
    "title": "تدريب الاستماع: مقابلة عمل",
    "description": "حوار قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_interview",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening"
  },
  {
    "id": "test_skill_listening_hairdresser",
    "title": "تدريب الاستماع: حجز موعد عند الحلاق",
    "description": "حوار قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_hairdresser",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening"
  },
  {
    "id": "test_skill_listening_return",
    "title": "تدريب الاستماع: إرجاع منتج",
    "description": "حوار قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_return",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening"
  },
  {
    "id": "test_skill_listening_landlord",
    "title": "تدريب الاستماع: مكالمة مع مالك الشقة",
    "description": "حوار قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_landlord",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening"
  },
  {
    "id": "test_skill_listening_weather",
    "title": "تدريب الاستماع: نشرة الطقس",
    "description": "إعلان قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_weather",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening"
  },
  {
    "id": "test_skill_writing_leave_email",
    "title": "نشاط كتابة: طلب إجازة",
    "description": "بريد إلكتروني رسمي لصاحب العمل — تقييم فوري بالذكاء الاصطناعي",
    "test_type": "skill_writing_leave_email",
    "level": "B1",
    "duration_minutes": 15,
    "total_questions": 0,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "writing",
    "content_kind": "essay"
  },
  {
    "id": "test_skill_writing_daily_life",
    "title": "نشاط كتابة: يوم في حياتي",
    "description": "نص وصفي حر عن يوم عادي — تقييم فوري بالذكاء الاصطناعي",
    "test_type": "skill_writing_daily_life",
    "level": "B1",
    "duration_minutes": 15,
    "total_questions": 0,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "writing",
    "content_kind": "essay"
  },
  {
    "id": "test_skill_writing_invite_friend",
    "title": "نشاط كتابة: دعوة صديق",
    "description": "رسالة غير رسمية لصديق — تقييم فوري بالذكاء الاصطناعي",
    "test_type": "skill_writing_invite_friend",
    "level": "B1",
    "duration_minutes": 15,
    "total_questions": 0,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "writing",
    "content_kind": "essay"
  },
  {
    "id": "test_skill_reading_optician",
    "title": "تدريب القراءة: عند طبيب العيون",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_optician",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_reading_bikeshop",
    "title": "تدريب القراءة: في محل الدراجات",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_bikeshop",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_reading_gym",
    "title": "تدريب القراءة: الاشتراك في النادي الرياضي",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_gym",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_reading_apartment_viewing",
    "title": "تدريب القراءة: معاينة شقة",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_apartment_viewing",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_reading_airport",
    "title": "تدريب القراءة: في المطار",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_airport",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_reading_package",
    "title": "تدريب القراءة: استلام طرد من البريد",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_package",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_reading_copyshop",
    "title": "تدريب القراءة: في محل التصوير والطباعة",
    "description": "نص قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_reading_copyshop",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "reading",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_listening_taxi",
    "title": "تدريب الاستماع: في سيارة الأجرة",
    "description": "حوار قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_taxi",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_listening_flight_announcement",
    "title": "تدريب الاستماع: إعلان في المطار",
    "description": "إعلان قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_flight_announcement",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_listening_car_repair",
    "title": "تدريب الاستماع: مكالمة مع ورشة السيارات",
    "description": "حوار قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_car_repair",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_listening_radio_news",
    "title": "تدريب الاستماع: نشرة أخبار إذاعية",
    "description": "إعلان قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_radio_news",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_listening_apartment_ad",
    "title": "تدريب الاستماع: مكالمة بخصوص إعلان شقة",
    "description": "حوار قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_apartment_ad",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_listening_food_delivery",
    "title": "تدريب الاستماع: طلب توصيل طعام",
    "description": "حوار قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_food_delivery",
    "level": "A2",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_listening_dentist_booking",
    "title": "تدريب الاستماع: حجز موعد عند طبيب الأسنان",
    "description": "حوار قصير وست أسئلة استيعاب — حوالي 6 دقائق",
    "test_type": "skill_listening_dentist_booking",
    "level": "B1",
    "duration_minutes": 6,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "listening",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_writing_prepositions",
    "title": "تدريب مختلط: حروف الجر + رسالة شكوى",
    "description": "اختبار قواعد عن حروف الجر، متبوع بنشاط كتابة رسالة شكوى — حوالي 15 دقيقة",
    "test_type": "skill_writing_prepositions",
    "level": "B1",
    "duration_minutes": 15,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "writing",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_writing_past_tense",
    "title": "تدريب مختلط: الماضي (Perfekt/Präteritum) + سرد تجربة",
    "description": "اختبار قواعد عن صيغ الماضي، متبوع بنشاط كتابة سرد تجربة شخصية — حوالي 15 دقيقة",
    "test_type": "skill_writing_past_tense",
    "level": "B1",
    "duration_minutes": 15,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "writing",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_writing_modal_verbs",
    "title": "تدريب مختلط: الأفعال الشرطية + تقديم نصيحة",
    "description": "اختبار قواعد عن الأفعال الشرطية، متبوع بنشاط كتابة تقديم نصيحة — حوالي 15 دقيقة",
    "test_type": "skill_writing_modal_verbs",
    "level": "A2",
    "duration_minutes": 15,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "writing",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_writing_adjective_endings",
    "title": "تدريب مختلط: نهايات الصفات + وصف منتج",
    "description": "اختبار قواعد عن نهايات الصفات، متبوع بنشاط كتابة وصف منتج — حوالي 15 دقيقة",
    "test_type": "skill_writing_adjective_endings",
    "level": "B2",
    "duration_minutes": 15,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "writing",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_writing_connectors_advanced",
    "title": "تدريب مختلط: أدوات الربط المتقدمة + التعبير عن الرأي",
    "description": "اختبار قواعد عن أدوات الربط، متبوع بنشاط كتابة التعبير عن رأي — حوالي 15 دقيقة",
    "test_type": "skill_writing_connectors_advanced",
    "level": "B2",
    "duration_minutes": 15,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "writing",
    "content_kind": "quiz"
  },
  {
    "id": "test_skill_writing_passive_voice",
    "title": "تدريب مختلط: المبني للمجهول + وصف إجراء",
    "description": "اختبار قواعد عن المبني للمجهول، متبوع بنشاط كتابة وصف إجراء عمل — حوالي 15 دقيقة",
    "test_type": "skill_writing_passive_voice",
    "level": "B2",
    "duration_minutes": 15,
    "total_questions": 6,
    "passing_score": 60,
    "is_active": true,
    "is_skill_practice": true,
    "skill": "writing",
    "content_kind": "quiz"
  }
];

const mockContent = {
  "test_goethe_b1": {
    "sections": [
      {
        "key": "lesen1",
        "name": "Lesen — Teil 1",
        "type": "reading",
        "official_duration_minutes": 65,
        "instructions": "اقرأ النص وحدد إن كانت الجمل التالية صحيحة أم خاطئة (Richtig / Falsch).",
        "passage": "Mein Alltag in Berlin\n\nIch heiße Lina und wohne seit sechs Monaten in Berlin. Am Anfang war es nicht leicht, weil ich niemanden kannte. Jetzt gehe ich jeden Dienstag zu einem Deutschkurs in der Volkshochschule und habe dort neue Freunde gefunden. Unter der Woche arbeite ich in einem Café in der Nähe vom Alexanderplatz. Am Wochenende fahre ich oft mit dem Fahrrad durch den Park oder treffe meine Freunde zum Kaffeetrinken. Nächsten Monat möchte ich die Prüfung Goethe-Zertifikat B1 machen, weil ich danach eine Ausbildung als Krankenpflegerin beginnen möchte. Meine Familie lebt noch in meiner Heimatstadt, aber wir telefonieren jeden Sonntag.",
        "items": [
          {
            "id": "gb1_l1_q1",
            "question_text": "Lina wohnt seit sechs Monaten in Berlin.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt: \"seit sechs Monaten in Berlin\".",
            "order_index": 0,
            "answers": [
              {
                "id": "gb1_l1_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "gb1_l1_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l1_q2",
            "question_text": "Lina hat in Berlin sofort viele Freunde gefunden.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie sagt, es war am Anfang nicht leicht.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb1_l1_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb1_l1_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb1_l1_q3",
            "question_text": "Lina arbeitet am Wochenende in einem Café.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie arbeitet unter der Woche im Café, nicht am Wochenende.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb1_l1_q3_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb1_l1_q3_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb1_l1_q4",
            "question_text": "Lina möchte nach der Prüfung eine Ausbildung beginnen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie möchte eine Ausbildung als Krankenpflegerin beginnen.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb1_l1_q4_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "gb1_l1_q4_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l1_q5",
            "question_text": "Der Deutschkurs findet jeden Dienstag statt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt \"jeden Dienstag zu einem Deutschkurs\".",
            "order_index": 4,
            "answers": [
              {
                "id": "gb1_l1_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "gb1_l1_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l1_q6",
            "question_text": "Linas Familie lebt auch in Berlin.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Ihre Familie lebt noch in ihrer Heimatstadt.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb1_l1_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb1_l1_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "lesen2",
        "name": "Lesen — Teil 2 (Zuordnung)",
        "type": "reading",
        "official_duration_minutes": 65,
        "instructions": "Lesen Sie die Situationen 1–6 und wählen Sie die passende Anzeige (A–F).",
        "passage": "Situationen:\n1. Eine Familie sucht eine günstige Wohnung in Zentrumsnähe.\n2. Ein Student sucht einen Deutschkurs am Abend.\n3. Eine Frau möchte gebrauchte Möbel kaufen.\n4. Ein Mann sucht eine Arbeit als Fahrer.\n5. Jemand möchte sein Fahrrad reparieren lassen.\n6. Eine Studentin sucht eine Nachhilfelehrerin für Mathematik.\n\nAnzeigen:\nA) 3-Zimmer-Wohnung, Nähe Stadtzentrum, 750€/Monat, ab sofort frei.\nB) Abendkurs Deutsch B1, montags und mittwochs, 18–20 Uhr, Volkshochschule.\nC) Second-Hand-Möbel: Sofa, Tisch, Stühle — günstig abzugeben.\nD) Gesucht: Lieferfahrer mit Führerschein Klasse B, Vollzeit.\nE) Fahrradwerkstatt: Reparaturen aller Art, auch am Wochenende geöffnet.\nF) Mathe-Nachhilfe für Schüler und Studierende, erste Stunde kostenlos.",
        "items": [
          {
            "id": "gb1_l2_q1",
            "question_text": "Welche Anzeige passt zu Situation 1 (Eine...)?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Anzeige A passt zu: Eine Familie sucht eine günstige Wohnung in Zentrumsnähe.",
            "order_index": 0,
            "answers": [
              {
                "id": "gb1_l2_q1_a1",
                "answer_text": "A) 3-Zimmer-Wohnung, Nähe Stadtzentrum, 750€/Monat, ab sofort frei.",
                "is_correct": true
              },
              {
                "id": "gb1_l2_q1_a2",
                "answer_text": "B) Abendkurs Deutsch B1, montags und mittwochs, 18–20 Uhr, Volkshochschule.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q1_a3",
                "answer_text": "C) Second-Hand-Möbel: Sofa, Tisch, Stühle — günstig abzugeben.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q1_a4",
                "answer_text": "D) Gesucht: Lieferfahrer mit Führerschein Klasse B, Vollzeit.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q1_a5",
                "answer_text": "E) Fahrradwerkstatt: Reparaturen aller Art, auch am Wochenende geöffnet.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q1_a6",
                "answer_text": "F) Mathe-Nachhilfe für Schüler und Studierende, erste Stunde kostenlos.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l2_q2",
            "question_text": "Welche Anzeige passt zu Situation 2 (Ein...)?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Anzeige B passt zu: Ein Student sucht einen Deutschkurs am Abend.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb1_l2_q2_a1",
                "answer_text": "A) 3-Zimmer-Wohnung, Nähe Stadtzentrum, 750€/Monat, ab sofort frei.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q2_a2",
                "answer_text": "B) Abendkurs Deutsch B1, montags und mittwochs, 18–20 Uhr, Volkshochschule.",
                "is_correct": true
              },
              {
                "id": "gb1_l2_q2_a3",
                "answer_text": "C) Second-Hand-Möbel: Sofa, Tisch, Stühle — günstig abzugeben.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q2_a4",
                "answer_text": "D) Gesucht: Lieferfahrer mit Führerschein Klasse B, Vollzeit.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q2_a5",
                "answer_text": "E) Fahrradwerkstatt: Reparaturen aller Art, auch am Wochenende geöffnet.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q2_a6",
                "answer_text": "F) Mathe-Nachhilfe für Schüler und Studierende, erste Stunde kostenlos.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l2_q3",
            "question_text": "Welche Anzeige passt zu Situation 3 (Eine...)?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Anzeige C passt zu: Eine Frau möchte gebrauchte Möbel kaufen.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb1_l2_q3_a1",
                "answer_text": "A) 3-Zimmer-Wohnung, Nähe Stadtzentrum, 750€/Monat, ab sofort frei.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q3_a2",
                "answer_text": "B) Abendkurs Deutsch B1, montags und mittwochs, 18–20 Uhr, Volkshochschule.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q3_a3",
                "answer_text": "C) Second-Hand-Möbel: Sofa, Tisch, Stühle — günstig abzugeben.",
                "is_correct": true
              },
              {
                "id": "gb1_l2_q3_a4",
                "answer_text": "D) Gesucht: Lieferfahrer mit Führerschein Klasse B, Vollzeit.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q3_a5",
                "answer_text": "E) Fahrradwerkstatt: Reparaturen aller Art, auch am Wochenende geöffnet.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q3_a6",
                "answer_text": "F) Mathe-Nachhilfe für Schüler und Studierende, erste Stunde kostenlos.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l2_q4",
            "question_text": "Welche Anzeige passt zu Situation 4 (Ein...)?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Anzeige D passt zu: Ein Mann sucht eine Arbeit als Fahrer.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb1_l2_q4_a1",
                "answer_text": "A) 3-Zimmer-Wohnung, Nähe Stadtzentrum, 750€/Monat, ab sofort frei.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q4_a2",
                "answer_text": "B) Abendkurs Deutsch B1, montags und mittwochs, 18–20 Uhr, Volkshochschule.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q4_a3",
                "answer_text": "C) Second-Hand-Möbel: Sofa, Tisch, Stühle — günstig abzugeben.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q4_a4",
                "answer_text": "D) Gesucht: Lieferfahrer mit Führerschein Klasse B, Vollzeit.",
                "is_correct": true
              },
              {
                "id": "gb1_l2_q4_a5",
                "answer_text": "E) Fahrradwerkstatt: Reparaturen aller Art, auch am Wochenende geöffnet.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q4_a6",
                "answer_text": "F) Mathe-Nachhilfe für Schüler und Studierende, erste Stunde kostenlos.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l2_q5",
            "question_text": "Welche Anzeige passt zu Situation 5 (Jemand...)?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Anzeige E passt zu: Jemand möchte sein Fahrrad reparieren lassen.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb1_l2_q5_a1",
                "answer_text": "A) 3-Zimmer-Wohnung, Nähe Stadtzentrum, 750€/Monat, ab sofort frei.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q5_a2",
                "answer_text": "B) Abendkurs Deutsch B1, montags und mittwochs, 18–20 Uhr, Volkshochschule.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q5_a3",
                "answer_text": "C) Second-Hand-Möbel: Sofa, Tisch, Stühle — günstig abzugeben.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q5_a4",
                "answer_text": "D) Gesucht: Lieferfahrer mit Führerschein Klasse B, Vollzeit.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q5_a5",
                "answer_text": "E) Fahrradwerkstatt: Reparaturen aller Art, auch am Wochenende geöffnet.",
                "is_correct": true
              },
              {
                "id": "gb1_l2_q5_a6",
                "answer_text": "F) Mathe-Nachhilfe für Schüler und Studierende, erste Stunde kostenlos.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l2_q6",
            "question_text": "Welche Anzeige passt zu Situation 6 (Eine...)?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Anzeige F passt zu: Eine Studentin sucht eine Nachhilfelehrerin für Mathematik.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb1_l2_q6_a1",
                "answer_text": "A) 3-Zimmer-Wohnung, Nähe Stadtzentrum, 750€/Monat, ab sofort frei.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q6_a2",
                "answer_text": "B) Abendkurs Deutsch B1, montags und mittwochs, 18–20 Uhr, Volkshochschule.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q6_a3",
                "answer_text": "C) Second-Hand-Möbel: Sofa, Tisch, Stühle — günstig abzugeben.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q6_a4",
                "answer_text": "D) Gesucht: Lieferfahrer mit Führerschein Klasse B, Vollzeit.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q6_a5",
                "answer_text": "E) Fahrradwerkstatt: Reparaturen aller Art, auch am Wochenende geöffnet.",
                "is_correct": false
              },
              {
                "id": "gb1_l2_q6_a6",
                "answer_text": "F) Mathe-Nachhilfe für Schüler und Studierende, erste Stunde kostenlos.",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "lesen3",
        "name": "Lesen — Teil 3",
        "type": "reading",
        "official_duration_minutes": 65,
        "instructions": "Lesen Sie den Text und beantworten Sie die Fragen.",
        "passage": "Öffnungszeiten der Stadtbibliothek\n\nDie Stadtbibliothek München ist von Montag bis Freitag von 9 bis 20 Uhr geöffnet, samstags von 10 bis 16 Uhr. Sonntags bleibt sie geschlossen. Die Ausleihe von Büchern ist für Mitglieder kostenlos, eine Jahresmitgliedschaft kostet 20 Euro für Erwachsene und ist für Kinder und Jugendliche unter 18 Jahren kostenlos. Wer ein Buch zu spät zurückbringt, zahlt eine Gebühr von 50 Cent pro Tag und Buch. Im zweiten Stock gibt es einen ruhigen Lesesaal mit kostenlosem WLAN, der auch für Gruppenarbeit genutzt werden kann.",
        "items": [
          {
            "id": "gb1_l3_q1",
            "question_text": "Wann ist die Bibliothek samstags geöffnet?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt 10 bis 16 Uhr für Samstag.",
            "order_index": 0,
            "answers": [
              {
                "id": "gb1_l3_q1_a1",
                "answer_text": "Von 10 bis 16 Uhr",
                "is_correct": true
              },
              {
                "id": "gb1_l3_q1_a2",
                "answer_text": "Von 9 bis 20 Uhr",
                "is_correct": false
              },
              {
                "id": "gb1_l3_q1_a3",
                "answer_text": "Sie ist samstags geschlossen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l3_q2",
            "question_text": "Die Bibliothek ist sonntags geöffnet.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sonntags bleibt sie geschlossen.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb1_l3_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb1_l3_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb1_l3_q3",
            "question_text": "Wie viel kostet die Jahresmitgliedschaft für Erwachsene?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt 20 Euro für Erwachsene.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb1_l3_q3_a1",
                "answer_text": "20 Euro",
                "is_correct": true
              },
              {
                "id": "gb1_l3_q3_a2",
                "answer_text": "10 Euro",
                "is_correct": false
              },
              {
                "id": "gb1_l3_q3_a3",
                "answer_text": "Sie ist kostenlos",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l3_q4",
            "question_text": "Für Kinder unter 18 Jahren ist die Mitgliedschaft kostenlos.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt das ausdrücklich.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb1_l3_q4_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "gb1_l3_q4_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l3_q5",
            "question_text": "Wie viel zahlt man, wenn man ein Buch zu spät zurückbringt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt eine Gebühr von 50 Cent pro Tag.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb1_l3_q5_a1",
                "answer_text": "50 Cent pro Tag",
                "is_correct": true
              },
              {
                "id": "gb1_l3_q5_a2",
                "answer_text": "1 Euro pro Tag",
                "is_correct": false
              },
              {
                "id": "gb1_l3_q5_a3",
                "answer_text": "Nichts",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l3_q6",
            "question_text": "Im Lesesaal gibt es kostenloses WLAN.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text erwähnt kostenloses WLAN im Lesesaal.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb1_l3_q6_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "gb1_l3_q6_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "lesen4",
        "name": "Lesen — Teil 4 (Zuordnung)",
        "type": "reading",
        "official_duration_minutes": 65,
        "instructions": "Sechs Personen sprechen über ihre Freizeit. Ordnen Sie die Aussagen den Personen zu.",
        "passage": "Forum: \"Wie verbringt ihr eure Freizeit?\"\n\nKarim: Ich verbringe die meiste Freizeit mit Sport. Dreimal die Woche gehe ich joggen, das hilft mir, Stress abzubauen.\nNora: Für mich ist Lesen die beste Entspannung. Ich lese am liebsten Krimis, weil sie so spannend sind.\nOmar: Ich koche sehr gerne, vor allem am Wochenende probiere ich neue Rezepte aus.\nPetra: Musik ist mein Leben. Ich spiele seit zehn Jahren Gitarre und übe fast jeden Tag.\nRania: Ich reise gerne, auch wenn es nur kurze Ausflüge in die Umgebung sind.\nSamir: Am liebsten treffe ich mich mit Freunden zum Kartenspielen, das mache ich fast jedes Wochenende.",
        "items": [
          {
            "id": "gb1_l4_q1",
            "question_text": "Wer treibt regelmäßig Sport?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Karim geht dreimal die Woche joggen.",
            "order_index": 0,
            "answers": [
              {
                "id": "gb1_l4_q1_a1",
                "answer_text": "Karim",
                "is_correct": true
              },
              {
                "id": "gb1_l4_q1_a2",
                "answer_text": "Nora",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q1_a3",
                "answer_text": "Omar",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q1_a4",
                "answer_text": "Petra",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q1_a5",
                "answer_text": "Rania",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q1_a6",
                "answer_text": "Samir",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l4_q2",
            "question_text": "Wer entspannt sich am liebsten mit Büchern?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Nora liest am liebsten Krimis.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb1_l4_q2_a1",
                "answer_text": "Karim",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q2_a2",
                "answer_text": "Nora",
                "is_correct": true
              },
              {
                "id": "gb1_l4_q2_a3",
                "answer_text": "Omar",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q2_a4",
                "answer_text": "Petra",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q2_a5",
                "answer_text": "Rania",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q2_a6",
                "answer_text": "Samir",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l4_q3",
            "question_text": "Wer probiert gerne neue Rezepte aus?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Omar kocht gerne und probiert neue Rezepte.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb1_l4_q3_a1",
                "answer_text": "Karim",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q3_a2",
                "answer_text": "Nora",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q3_a3",
                "answer_text": "Omar",
                "is_correct": true
              },
              {
                "id": "gb1_l4_q3_a4",
                "answer_text": "Petra",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q3_a5",
                "answer_text": "Rania",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q3_a6",
                "answer_text": "Samir",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l4_q4",
            "question_text": "Wer spielt seit zehn Jahren ein Instrument?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Petra spielt seit zehn Jahren Gitarre.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb1_l4_q4_a1",
                "answer_text": "Karim",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q4_a2",
                "answer_text": "Nora",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q4_a3",
                "answer_text": "Omar",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q4_a4",
                "answer_text": "Petra",
                "is_correct": true
              },
              {
                "id": "gb1_l4_q4_a5",
                "answer_text": "Rania",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q4_a6",
                "answer_text": "Samir",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l4_q5",
            "question_text": "Wer macht gerne kurze Ausflüge?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Rania reist gerne, auch kurze Ausflüge.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb1_l4_q5_a1",
                "answer_text": "Karim",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q5_a2",
                "answer_text": "Nora",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q5_a3",
                "answer_text": "Omar",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q5_a4",
                "answer_text": "Petra",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q5_a5",
                "answer_text": "Rania",
                "is_correct": true
              },
              {
                "id": "gb1_l4_q5_a6",
                "answer_text": "Samir",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l4_q6",
            "question_text": "Wer trifft sich am Wochenende zum Kartenspielen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Samir spielt fast jedes Wochenende Karten mit Freunden.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb1_l4_q6_a1",
                "answer_text": "Karim",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q6_a2",
                "answer_text": "Nora",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q6_a3",
                "answer_text": "Omar",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q6_a4",
                "answer_text": "Petra",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q6_a5",
                "answer_text": "Rania",
                "is_correct": false
              },
              {
                "id": "gb1_l4_q6_a6",
                "answer_text": "Samir",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "lesen5",
        "name": "Lesen — Teil 5",
        "type": "reading",
        "official_duration_minutes": 65,
        "instructions": "Lesen Sie die Hausordnung und beantworten Sie die Fragen.",
        "passage": "Hausordnung — Auszug\n\n1. Die Mülltonnen müssen bis spätestens 7 Uhr morgens an die Straße gestellt werden.\n2. Zwischen 13 und 15 Uhr gilt Mittagsruhe; lautes Musizieren ist in dieser Zeit nicht erlaubt.\n3. Fahrräder dürfen nur im Fahrradkeller abgestellt werden, nicht im Treppenhaus.\n4. Besucherparkplätze dürfen maximal zwei Stunden genutzt werden.\n5. Der Hausmeister ist dienstags und donnerstags von 9 bis 12 Uhr im Büro erreichbar.\n6. Reparaturen im Treppenhaus müssen der Hausverwaltung schriftlich gemeldet werden.",
        "items": [
          {
            "id": "gb1_l5_q1",
            "question_text": "Bis wann müssen die Mülltonnen an der Straße stehen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 1 nennt spätestens 7 Uhr morgens.",
            "order_index": 0,
            "answers": [
              {
                "id": "gb1_l5_q1_a1",
                "answer_text": "Bis 7 Uhr morgens",
                "is_correct": true
              },
              {
                "id": "gb1_l5_q1_a2",
                "answer_text": "Bis 9 Uhr morgens",
                "is_correct": false
              },
              {
                "id": "gb1_l5_q1_a3",
                "answer_text": "Bis 12 Uhr mittags",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l5_q2",
            "question_text": "Zwischen 13 und 15 Uhr darf man laut Musik machen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "In dieser Zeit gilt Mittagsruhe.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb1_l5_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb1_l5_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb1_l5_q3",
            "question_text": "Wo dürfen Fahrräder abgestellt werden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 3 erlaubt nur den Fahrradkeller.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb1_l5_q3_a1",
                "answer_text": "Nur im Fahrradkeller",
                "is_correct": true
              },
              {
                "id": "gb1_l5_q3_a2",
                "answer_text": "Im Treppenhaus",
                "is_correct": false
              },
              {
                "id": "gb1_l5_q3_a3",
                "answer_text": "Überall im Hof",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l5_q4",
            "question_text": "Wie lange darf man den Besucherparkplatz nutzen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 4 nennt maximal zwei Stunden.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb1_l5_q4_a1",
                "answer_text": "Maximal zwei Stunden",
                "is_correct": true
              },
              {
                "id": "gb1_l5_q4_a2",
                "answer_text": "Den ganzen Tag",
                "is_correct": false
              },
              {
                "id": "gb1_l5_q4_a3",
                "answer_text": "Maximal 30 Minuten",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l5_q5",
            "question_text": "Wann ist der Hausmeister im Büro erreichbar?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 5 nennt genau diese Zeiten.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb1_l5_q5_a1",
                "answer_text": "Dienstags und donnerstags, 9–12 Uhr",
                "is_correct": true
              },
              {
                "id": "gb1_l5_q5_a2",
                "answer_text": "Jeden Tag von 9–17 Uhr",
                "is_correct": false
              },
              {
                "id": "gb1_l5_q5_a3",
                "answer_text": "Nur am Wochenende",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_l5_q6",
            "question_text": "Reparaturen im Treppenhaus können einfach mündlich gemeldet werden.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie müssen schriftlich gemeldet werden.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb1_l5_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb1_l5_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "sprachbausteine",
        "name": "Sprachbausteine (تدريب إضافي)",
        "type": "language",
        "official_duration_minutes": null,
        "instructions": "تدريب إضافي على القواعد والمفردات (غير جزء رسمي من اختبار Goethe، لكنه مفيد للتحضير).",
        "passage": null,
        "items": [
          {
            "id": "gb1_sb_q1",
            "question_text": "Ich ___ seit drei Jahren in Deutschland.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Mit \"Ich\" verwendet man \"wohne\".",
            "order_index": 0,
            "answers": [
              {
                "id": "gb1_sb_q1_a1",
                "answer_text": "wohne",
                "is_correct": true
              },
              {
                "id": "gb1_sb_q1_a2",
                "answer_text": "wohnst",
                "is_correct": false
              },
              {
                "id": "gb1_sb_q1_a3",
                "answer_text": "wohnen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_sb_q2",
            "question_text": "Wir freuen uns ___ deinen Besuch.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"sich freuen auf\" + Akkusativ.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb1_sb_q2_a1",
                "answer_text": "auf",
                "is_correct": true
              },
              {
                "id": "gb1_sb_q2_a2",
                "answer_text": "für",
                "is_correct": false
              },
              {
                "id": "gb1_sb_q2_a3",
                "answer_text": "mit",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_sb_q3",
            "question_text": "___ du mir bitte helfen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Mit \"du\" verwendet man \"kannst\".",
            "order_index": 2,
            "answers": [
              {
                "id": "gb1_sb_q3_a1",
                "answer_text": "Kannst",
                "is_correct": true
              },
              {
                "id": "gb1_sb_q3_a2",
                "answer_text": "Kann",
                "is_correct": false
              },
              {
                "id": "gb1_sb_q3_a3",
                "answer_text": "Können",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_sb_q4",
            "question_text": "Er ist ___ als sein Bruder.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Vergleich zwischen zwei Personen braucht den Komparativ.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb1_sb_q4_a1",
                "answer_text": "größer",
                "is_correct": true
              },
              {
                "id": "gb1_sb_q4_a2",
                "answer_text": "groß",
                "is_correct": false
              },
              {
                "id": "gb1_sb_q4_a3",
                "answer_text": "am größten",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_sb_q5",
            "question_text": "Ich rufe dich an, ___ ich zu Hause bin.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"wenn\" drückt eine Bedingung/einen Zeitpunkt aus.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb1_sb_q5_a1",
                "answer_text": "wenn",
                "is_correct": true
              },
              {
                "id": "gb1_sb_q5_a2",
                "answer_text": "obwohl",
                "is_correct": false
              },
              {
                "id": "gb1_sb_q5_a3",
                "answer_text": "damit",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_sb_q6",
            "question_text": "Das ist die Frau, ___ mir geholfen hat.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Relativpronomen für feminines Subjekt: \"die\".",
            "order_index": 5,
            "answers": [
              {
                "id": "gb1_sb_q6_a1",
                "answer_text": "die",
                "is_correct": true
              },
              {
                "id": "gb1_sb_q6_a2",
                "answer_text": "der",
                "is_correct": false
              },
              {
                "id": "gb1_sb_q6_a3",
                "answer_text": "das",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_sb_q7",
            "question_text": "Ich habe das Buch schon ___.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Perfekt: \"habe\" + Partizip II \"gelesen\".",
            "order_index": 6,
            "answers": [
              {
                "id": "gb1_sb_q7_a1",
                "answer_text": "gelesen",
                "is_correct": true
              },
              {
                "id": "gb1_sb_q7_a2",
                "answer_text": "lesen",
                "is_correct": false
              },
              {
                "id": "gb1_sb_q7_a3",
                "answer_text": "las",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_sb_q8",
            "question_text": "Sie interessiert sich sehr ___ Musik.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"sich interessieren für\" + Akkusativ.",
            "order_index": 7,
            "answers": [
              {
                "id": "gb1_sb_q8_a1",
                "answer_text": "für",
                "is_correct": true
              },
              {
                "id": "gb1_sb_q8_a2",
                "answer_text": "an",
                "is_correct": false
              },
              {
                "id": "gb1_sb_q8_a3",
                "answer_text": "mit",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_sb_q9",
            "question_text": "Nach der Arbeit gehe ich ___ Hause.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"nach Hause gehen\" ist eine feste Wendung.",
            "order_index": 8,
            "answers": [
              {
                "id": "gb1_sb_q9_a1",
                "answer_text": "nach",
                "is_correct": true
              },
              {
                "id": "gb1_sb_q9_a2",
                "answer_text": "zu",
                "is_correct": false
              },
              {
                "id": "gb1_sb_q9_a3",
                "answer_text": "in",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_sb_q10",
            "question_text": "Er hat mir geholfen, ___ das Formular auszufüllen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"um...zu\" drückt einen Zweck aus.",
            "order_index": 9,
            "answers": [
              {
                "id": "gb1_sb_q10_a1",
                "answer_text": "um",
                "is_correct": true
              },
              {
                "id": "gb1_sb_q10_a2",
                "answer_text": "damit",
                "is_correct": false
              },
              {
                "id": "gb1_sb_q10_a3",
                "answer_text": "weil",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "hoeren1",
        "name": "Hören — Teil 1 (Transkript)",
        "type": "listening",
        "official_duration_minutes": 40,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ كل نص قصير كما لو كنت تسمعه، ثم أجب عن سؤاله.",
        "passage": "Kurze Texte (Transkript):\n1. Der Fernseher von Frau Hüttner wurde repariert. Sie kann ihn morgen abholen.\n2. Herr Beck hat seinen Schlüssel im Büro vergessen und bittet den Hausmeister um Hilfe.\n3. Die nächste Deutschstunde fällt wegen Krankheit der Lehrerin aus.\n4. Am Bahnhof gibt es ab nächster Woche einen neuen Zeitungskiosk direkt am Haupteingang.\n5. Frau Sultan sucht ihre Brille, die sie wahrscheinlich im Auto liegen gelassen hat.\n6. Der Kurs beginnt heute zehn Minuten später, weil der Raum noch aufgeräumt wird.\n7. Im Supermarkt gibt es diese Woche Äpfel im Angebot, zwei Kilo für drei Euro.\n8. Die Post kommt heute später, weil ein Fahrzeug eine Panne hatte.",
        "items": [
          {
            "id": "gb1_h1_q1",
            "question_text": "Was ist mit dem Fernseher passiert?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text sagt \"wurde repariert\".",
            "order_index": 0,
            "answers": [
              {
                "id": "gb1_h1_q1_a1",
                "answer_text": "Er wurde repariert.",
                "is_correct": true
              },
              {
                "id": "gb1_h1_q1_a2",
                "answer_text": "Er wurde verkauft.",
                "is_correct": false
              },
              {
                "id": "gb1_h1_q1_a3",
                "answer_text": "Er ist kaputt geblieben.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h1_q2",
            "question_text": "Was hat Herr Beck vergessen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Er hat den Schlüssel vergessen.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb1_h1_q2_a1",
                "answer_text": "Seinen Schlüssel",
                "is_correct": true
              },
              {
                "id": "gb1_h1_q2_a2",
                "answer_text": "Seine Tasche",
                "is_correct": false
              },
              {
                "id": "gb1_h1_q2_a3",
                "answer_text": "Sein Handy",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h1_q3",
            "question_text": "Warum fällt die Stunde aus?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Stunde fällt wegen Krankheit aus.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb1_h1_q3_a1",
                "answer_text": "Die Lehrerin ist krank.",
                "is_correct": true
              },
              {
                "id": "gb1_h1_q3_a2",
                "answer_text": "Der Raum ist belegt.",
                "is_correct": false
              },
              {
                "id": "gb1_h1_q3_a3",
                "answer_text": "Es sind zu wenige Teilnehmer.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h1_q4",
            "question_text": "Was gibt es ab nächster Woche?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt einen neuen Zeitungskiosk.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb1_h1_q4_a1",
                "answer_text": "Einen neuen Zeitungskiosk",
                "is_correct": true
              },
              {
                "id": "gb1_h1_q4_a2",
                "answer_text": "Ein neues Café",
                "is_correct": false
              },
              {
                "id": "gb1_h1_q4_a3",
                "answer_text": "Einen neuen Fahrkartenautomaten",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h1_q5",
            "question_text": "Was sucht Frau Sultan?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie sucht ihre Brille.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb1_h1_q5_a1",
                "answer_text": "Ihre Brille",
                "is_correct": true
              },
              {
                "id": "gb1_h1_q5_a2",
                "answer_text": "Ihren Autoschlüssel",
                "is_correct": false
              },
              {
                "id": "gb1_h1_q5_a3",
                "answer_text": "Ihre Handtasche",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h1_q6",
            "question_text": "Warum beginnt der Kurs später?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Raum muss noch aufgeräumt werden.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb1_h1_q6_a1",
                "answer_text": "Der Raum wird noch aufgeräumt.",
                "is_correct": true
              },
              {
                "id": "gb1_h1_q6_a2",
                "answer_text": "Die Lehrerin kommt zu spät.",
                "is_correct": false
              },
              {
                "id": "gb1_h1_q6_a3",
                "answer_text": "Es gibt technische Probleme.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h1_q7",
            "question_text": "Was ist diese Woche im Angebot?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt Äpfel im Angebot.",
            "order_index": 6,
            "answers": [
              {
                "id": "gb1_h1_q7_a1",
                "answer_text": "Äpfel",
                "is_correct": true
              },
              {
                "id": "gb1_h1_q7_a2",
                "answer_text": "Bananen",
                "is_correct": false
              },
              {
                "id": "gb1_h1_q7_a3",
                "answer_text": "Kartoffeln",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h1_q8",
            "question_text": "Warum kommt die Post später?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Ein Fahrzeug hatte eine Panne.",
            "order_index": 7,
            "answers": [
              {
                "id": "gb1_h1_q8_a1",
                "answer_text": "Ein Fahrzeug hatte eine Panne.",
                "is_correct": true
              },
              {
                "id": "gb1_h1_q8_a2",
                "answer_text": "Es ist Feiertag.",
                "is_correct": false
              },
              {
                "id": "gb1_h1_q8_a3",
                "answer_text": "Es gibt zu viele Pakete.",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_goethe_b1__hoeren1.mp3"
      },
      {
        "key": "hoeren2",
        "name": "Hören — Teil 2 (Transkript)",
        "type": "listening",
        "official_duration_minutes": 40,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص الحوار كما لو كنت تسمعه، ثم أجب عن الأسئلة.",
        "passage": "Gespräch zwischen zwei Kolleginnen:\n\"A: Hast du schon gehört? Die Kantine bekommt ab nächstem Monat ein neues Angebot: jeden Freitag gibt es vegetarisches Essen.\nB: Das ist ja schön! Isst du eigentlich oft in der Kantine?\nA: Ja, meistens zweimal pro Woche, mittwochs und freitags. Am Montag bringe ich mir immer selbst etwas mit.\nB: Ich war lange nicht mehr dort, weil das Essen mir zu teuer war. Aber wenn es jetzt günstiger wird, gehe ich vielleicht wieder hin.\nA: Ja, die Preise wurden tatsächlich gesenkt, ein Hauptgericht kostet jetzt nur noch vier Euro fünfzig.\nB: Perfekt, dann komme ich nächste Woche mit!\"",
        "items": [
          {
            "id": "gb1_h2_q1",
            "question_text": "Was gibt es ab nächstem Monat jeden Freitag in der Kantine?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "A sagt \"jeden Freitag gibt es vegetarisches Essen\".",
            "order_index": 0,
            "answers": [
              {
                "id": "gb1_h2_q1_a1",
                "answer_text": "Vegetarisches Essen",
                "is_correct": true
              },
              {
                "id": "gb1_h2_q1_a2",
                "answer_text": "Fisch",
                "is_correct": false
              },
              {
                "id": "gb1_h2_q1_a3",
                "answer_text": "Nur Suppe",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h2_q2",
            "question_text": "Wie oft isst A in der Kantine?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "A isst meistens zweimal pro Woche dort.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb1_h2_q2_a1",
                "answer_text": "Zweimal pro Woche",
                "is_correct": true
              },
              {
                "id": "gb1_h2_q2_a2",
                "answer_text": "Jeden Tag",
                "is_correct": false
              },
              {
                "id": "gb1_h2_q2_a3",
                "answer_text": "Einmal im Monat",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h2_q3",
            "question_text": "A bringt sich montags selbst Essen mit.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "A sagt \"Am Montag bringe ich mir immer selbst etwas mit\".",
            "order_index": 2,
            "answers": [
              {
                "id": "gb1_h2_q3_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "gb1_h2_q3_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h2_q4",
            "question_text": "Warum war B lange nicht mehr in der Kantine?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "B sagt, das Essen war ihr zu teuer.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb1_h2_q4_a1",
                "answer_text": "Das Essen war ihr zu teuer.",
                "is_correct": true
              },
              {
                "id": "gb1_h2_q4_a2",
                "answer_text": "Sie hatte keine Zeit.",
                "is_correct": false
              },
              {
                "id": "gb1_h2_q4_a3",
                "answer_text": "Ihr schmeckte das Essen nicht.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h2_q5",
            "question_text": "Wie viel kostet ein Hauptgericht jetzt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "A nennt \"vier Euro fünfzig\".",
            "order_index": 4,
            "answers": [
              {
                "id": "gb1_h2_q5_a1",
                "answer_text": "4,50 Euro",
                "is_correct": true
              },
              {
                "id": "gb1_h2_q5_a2",
                "answer_text": "6 Euro",
                "is_correct": false
              },
              {
                "id": "gb1_h2_q5_a3",
                "answer_text": "3 Euro",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h2_q6",
            "question_text": "Die Preise in der Kantine wurden gesenkt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "A bestätigt, die Preise wurden gesenkt.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb1_h2_q6_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "gb1_h2_q6_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h2_q7",
            "question_text": "B möchte nächste Woche mit in die Kantine kommen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "B sagt \"dann komme ich nächste Woche mit\".",
            "order_index": 6,
            "answers": [
              {
                "id": "gb1_h2_q7_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "gb1_h2_q7_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h2_q8",
            "question_text": "Worüber sprechen die beiden Kolleginnen hauptsächlich?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Das gesamte Gespräch dreht sich um die Kantine.",
            "order_index": 7,
            "answers": [
              {
                "id": "gb1_h2_q8_a1",
                "answer_text": "Über die Kantine",
                "is_correct": true
              },
              {
                "id": "gb1_h2_q8_a2",
                "answer_text": "Über ihren Urlaub",
                "is_correct": false
              },
              {
                "id": "gb1_h2_q8_a3",
                "answer_text": "Über ein neues Projekt",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_goethe_b1__hoeren2.mp3"
      },
      {
        "key": "hoeren3",
        "name": "Hören — Teil 3 (Transkript)",
        "type": "listening",
        "official_duration_minutes": 40,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص الإعلان كما لو كنت تسمعه، ثم أجب عن الأسئلة.",
        "passage": "Kurzvortrag: Sportprogramm für Neuankömmlinge\n\"Willkommen zu unserem einwöchigen Sportprogramm! Jeden Morgen um 9 Uhr treffen wir uns im Stadtpark zum gemeinsamen Joggen. Am Nachmittag bieten wir verschiedene Kurse an: Montag und Mittwoch Schwimmen im Hallenbad, Dienstag und Donnerstag Fußball auf dem Sportplatz. Freitag ist der Abschlusstag mit einem kleinen Turnier, und alle Teilnehmenden bekommen am Ende ein Zertifikat. Die Teilnahme ist kostenlos, aber bitte bringen Sie bequeme Sportkleidung mit. Bei Regen findet das Joggen drinnen in der Sporthalle statt.\"",
        "items": [
          {
            "id": "gb1_h3_q1",
            "question_text": "Wie lange dauert das Sportprogramm?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Es ist ein \"einwöchiges Sportprogramm\".",
            "order_index": 0,
            "answers": [
              {
                "id": "gb1_h3_q1_a1",
                "answer_text": "Eine Woche",
                "is_correct": true
              },
              {
                "id": "gb1_h3_q1_a2",
                "answer_text": "Einen Monat",
                "is_correct": false
              },
              {
                "id": "gb1_h3_q1_a3",
                "answer_text": "Ein Wochenende",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h3_q2",
            "question_text": "Um wie viel Uhr trifft man sich zum Joggen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt 9 Uhr morgens.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb1_h3_q2_a1",
                "answer_text": "Um 9 Uhr",
                "is_correct": true
              },
              {
                "id": "gb1_h3_q2_a2",
                "answer_text": "Um 7 Uhr",
                "is_correct": false
              },
              {
                "id": "gb1_h3_q2_a3",
                "answer_text": "Um 12 Uhr",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h3_q3",
            "question_text": "An welchen Tagen gibt es Schwimmen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Schwimmen ist montags und mittwochs.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb1_h3_q3_a1",
                "answer_text": "Montag und Mittwoch",
                "is_correct": true
              },
              {
                "id": "gb1_h3_q3_a2",
                "answer_text": "Dienstag und Donnerstag",
                "is_correct": false
              },
              {
                "id": "gb1_h3_q3_a3",
                "answer_text": "Nur Freitag",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h3_q4",
            "question_text": "Was passiert am Freitag?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Freitag ist der Abschlusstag mit Turnier.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb1_h3_q4_a1",
                "answer_text": "Ein kleines Turnier",
                "is_correct": true
              },
              {
                "id": "gb1_h3_q4_a2",
                "answer_text": "Nur Joggen",
                "is_correct": false
              },
              {
                "id": "gb1_h3_q4_a3",
                "answer_text": "Das Programm beginnt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h3_q5",
            "question_text": "Alle Teilnehmenden bekommen am Ende ein Zertifikat.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt das ausdrücklich.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb1_h3_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "gb1_h3_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h3_q6",
            "question_text": "Die Teilnahme am Programm kostet Geld.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Teilnahme ist kostenlos.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb1_h3_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb1_h3_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb1_h3_q7",
            "question_text": "Was passiert bei Regen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Bei Regen wird drinnen in der Sporthalle gejoggt.",
            "order_index": 6,
            "answers": [
              {
                "id": "gb1_h3_q7_a1",
                "answer_text": "Das Joggen findet in der Sporthalle statt.",
                "is_correct": true
              },
              {
                "id": "gb1_h3_q7_a2",
                "answer_text": "Das Programm wird abgesagt.",
                "is_correct": false
              },
              {
                "id": "gb1_h3_q7_a3",
                "answer_text": "Man bleibt zu Hause.",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_goethe_b1__hoeren3.mp3"
      },
      {
        "key": "hoeren4",
        "name": "Hören — Teil 4 (Transkript)",
        "type": "listening",
        "official_duration_minutes": 40,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص النقاش كما لو كنت تسمعه، ثم أجب عن الأسئلة.",
        "passage": "Radiodiskussion: Sollten Handys in der Schule verboten werden?\n\"Moderator: Heute diskutieren wir über Handyverbote an Schulen. Frau Lang, Sie sind Lehrerin — was denken Sie?\nFrau Lang: Ich bin klar dafür. Handys lenken die Schüler im Unterricht stark ab, das sehe ich jeden Tag.\nModerator: Und Herr Reuter, Sie sind Vater von zwei Schulkindern?\nHerr Reuter: Ich sehe das differenzierter. In Notfällen möchte ich, dass meine Kinder erreichbar sind. Ein komplettes Verbot finde ich zu streng, aber während des Unterrichts sollten Handys sicher weggepackt sein.\nFrau Lang: Da stimme ich zu — es geht nicht um ein Verbot des Besitzes, sondern der Nutzung im Unterricht.\nModerator: Vielen Dank Ihnen beiden für die interessanten Perspektiven!\"",
        "items": [
          {
            "id": "gb1_h4_q1",
            "question_text": "Worüber diskutieren die Gäste?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Das Thema ist Handyverbote an Schulen.",
            "order_index": 0,
            "answers": [
              {
                "id": "gb1_h4_q1_a1",
                "answer_text": "Über Handyverbote an Schulen",
                "is_correct": true
              },
              {
                "id": "gb1_h4_q1_a2",
                "answer_text": "Über Hausaufgaben",
                "is_correct": false
              },
              {
                "id": "gb1_h4_q1_a3",
                "answer_text": "Über Schuluniformen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h4_q2",
            "question_text": "Was ist Frau Lang von Beruf?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie wird als Lehrerin vorgestellt.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb1_h4_q2_a1",
                "answer_text": "Lehrerin",
                "is_correct": true
              },
              {
                "id": "gb1_h4_q2_a2",
                "answer_text": "Ärztin",
                "is_correct": false
              },
              {
                "id": "gb1_h4_q2_a3",
                "answer_text": "Journalistin",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h4_q3",
            "question_text": "Frau Lang ist gegen ein Handyverbot.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie sagt \"Ich bin klar dafür\".",
            "order_index": 2,
            "answers": [
              {
                "id": "gb1_h4_q3_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb1_h4_q3_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb1_h4_q4",
            "question_text": "Warum möchte Herr Reuter, dass seine Kinder ein Handy haben?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Er sagt, in Notfällen möchte er sie erreichen können.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb1_h4_q4_a1",
                "answer_text": "Für Notfälle",
                "is_correct": true
              },
              {
                "id": "gb1_h4_q4_a2",
                "answer_text": "Für Spiele",
                "is_correct": false
              },
              {
                "id": "gb1_h4_q4_a3",
                "answer_text": "Für die Hausaufgaben",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h4_q5",
            "question_text": "Herr Reuter ist für ein komplettes Handyverbot.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er findet ein komplettes Verbot zu streng.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb1_h4_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb1_h4_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb1_h4_q6",
            "question_text": "Worauf einigen sich beide am Ende?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Beide stimmen zu, dass es um die Nutzung im Unterricht geht.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb1_h4_q6_a1",
                "answer_text": "Handys sollten während des Unterrichts weggepackt sein.",
                "is_correct": true
              },
              {
                "id": "gb1_h4_q6_a2",
                "answer_text": "Handys sollten ganz verboten werden.",
                "is_correct": false
              },
              {
                "id": "gb1_h4_q6_a3",
                "answer_text": "Handys sollten frei erlaubt sein.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb1_h4_q7",
            "question_text": "Wie viele Kinder hat Herr Reuter?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Er wird als \"Vater von zwei Schulkindern\" vorgestellt.",
            "order_index": 6,
            "answers": [
              {
                "id": "gb1_h4_q7_a1",
                "answer_text": "Zwei",
                "is_correct": true
              },
              {
                "id": "gb1_h4_q7_a2",
                "answer_text": "Eins",
                "is_correct": false
              },
              {
                "id": "gb1_h4_q7_a3",
                "answer_text": "Drei",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_goethe_b1__hoeren4.mp3"
      }
    ],
    "writing": {
      "name": "Schreiben (تدريب غير مُقيَّم)",
      "official_duration_minutes": 60,
      "instructions": "في الاختبار الرسمي، تكتب رسالتين إلكترونيتين ومساهمة نقاش. هذا تدريب ذاتي غير مُقيَّم آليًا — اكتب إجابتك ثم قارنها بالنموذج.",
      "prompt": "Schreiben Sie eine informelle E-Mail an einen Freund / eine Freundin (ca. 40–50 Wörter). Gehen Sie auf folgende Punkte ein:\n- Erzählen Sie, warum Sie nicht zu seiner/ihrer Geburtstagsfeier kommen konnten.\n- Entschuldigen Sie sich.\n- Schlagen Sie ein Treffen für nächste Woche vor.",
      "sample_answer": "Liebe Sara,\n\nes tut mir sehr leid, dass ich nicht zu deiner Geburtstagsfeier kommen konnte. Ich war leider krank und musste zu Hause bleiben. Ich hoffe, du kannst mir verzeihen!\n\nHättest du nächste Woche Zeit? Ich würde dich gerne zum Kaffee einladen, um deinen Geburtstag nachzufeiern.\n\nLiebe Grüße\nAhmed"
    }
  },
  "test_goethe_b2": {
    "sections": [
      {
        "key": "lesen1",
        "name": "Lesen — Teil 1 (Zuordnung)",
        "type": "reading",
        "official_duration_minutes": 65,
        "instructions": "Sechs Personen äußern sich in einem Forum zum Thema Homeoffice. Ordnen Sie die Aussagen den Personen zu.",
        "passage": "Forum: \"Was denkt ihr über Homeoffice?\"\n\nAmir: Ich arbeite seit einem Jahr komplett von zu Hause. Am Anfang war es toll, aber mittlerweile vermisse ich den direkten Kontakt zu meinen Kollegen sehr.\nBetül: Für mich ist Homeoffice ideal, weil ich so Beruf und Familie viel besser vereinbaren kann. Ich spare außerdem täglich eine Stunde Fahrzeit.\nCarsten: Meiner Meinung nach sollte man mindestens zwei Tage pro Woche im Büro sein. Nur so bleibt man wirklich Teil des Teams.\nDunja: Ich finde es schwierig, mich zu Hause zu konzentrieren. Meine Wohnung ist einfach nicht für konzentriertes Arbeiten gemacht.\nElias: Ich bin seit der Umstellung viel produktiver, weil ich meine Zeit freier einteilen kann.\nFarah: Mir fehlt vor allem der informelle Austausch mit Kollegen in der Kaffeepause, das lässt sich online kaum ersetzen.",
        "items": [
          {
            "id": "gb2_l1_q1",
            "question_text": "Wer vermisst den Kontakt zu den Kollegen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Amir sagt, er vermisst den direkten Kontakt zu seinen Kollegen.",
            "order_index": 0,
            "answers": [
              {
                "id": "gb2_l1_q1_a1",
                "answer_text": "Amir",
                "is_correct": true
              },
              {
                "id": "gb2_l1_q1_a2",
                "answer_text": "Betül",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q1_a3",
                "answer_text": "Carsten",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q1_a4",
                "answer_text": "Dunja",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q1_a5",
                "answer_text": "Elias",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q1_a6",
                "answer_text": "Farah",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l1_q2",
            "question_text": "Wer kann dank Homeoffice Beruf und Familie besser vereinbaren?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Betül nennt genau diesen Vorteil.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb2_l1_q2_a1",
                "answer_text": "Amir",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q2_a2",
                "answer_text": "Betül",
                "is_correct": true
              },
              {
                "id": "gb2_l1_q2_a3",
                "answer_text": "Carsten",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q2_a4",
                "answer_text": "Dunja",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q2_a5",
                "answer_text": "Elias",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q2_a6",
                "answer_text": "Farah",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l1_q3",
            "question_text": "Wer findet, man sollte mindestens zwei Tage im Büro sein?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Carsten schlägt mindestens zwei Bürotage pro Woche vor.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb2_l1_q3_a1",
                "answer_text": "Amir",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q3_a2",
                "answer_text": "Betül",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q3_a3",
                "answer_text": "Carsten",
                "is_correct": true
              },
              {
                "id": "gb2_l1_q3_a4",
                "answer_text": "Dunja",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q3_a5",
                "answer_text": "Elias",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q3_a6",
                "answer_text": "Farah",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l1_q4",
            "question_text": "Wer hat Konzentrationsprobleme zu Hause?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Dunja sagt, ihre Wohnung sei nicht für konzentriertes Arbeiten gemacht.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb2_l1_q4_a1",
                "answer_text": "Amir",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q4_a2",
                "answer_text": "Betül",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q4_a3",
                "answer_text": "Carsten",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q4_a4",
                "answer_text": "Dunja",
                "is_correct": true
              },
              {
                "id": "gb2_l1_q4_a5",
                "answer_text": "Elias",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q4_a6",
                "answer_text": "Farah",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l1_q5",
            "question_text": "Wer ist seit dem Wechsel produktiver geworden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Elias sagt, er sei viel produktiver geworden.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb2_l1_q5_a1",
                "answer_text": "Amir",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q5_a2",
                "answer_text": "Betül",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q5_a3",
                "answer_text": "Carsten",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q5_a4",
                "answer_text": "Dunja",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q5_a5",
                "answer_text": "Elias",
                "is_correct": true
              },
              {
                "id": "gb2_l1_q5_a6",
                "answer_text": "Farah",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l1_q6",
            "question_text": "Wem fehlt der informelle Austausch in der Kaffeepause?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Farah nennt genau diesen Punkt.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb2_l1_q6_a1",
                "answer_text": "Amir",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q6_a2",
                "answer_text": "Betül",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q6_a3",
                "answer_text": "Carsten",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q6_a4",
                "answer_text": "Dunja",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q6_a5",
                "answer_text": "Elias",
                "is_correct": false
              },
              {
                "id": "gb2_l1_q6_a6",
                "answer_text": "Farah",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "lesen2",
        "name": "Lesen — Teil 2",
        "type": "reading",
        "official_duration_minutes": 65,
        "instructions": "Lesen Sie den Artikel und beantworten Sie die Fragen.",
        "passage": "Studie: Vier-Tage-Woche steigert Zufriedenheit\n\nEine neue Studie aus mehreren europäischen Unternehmen zeigt, dass Mitarbeitende bei einer Vier-Tage-Woche nicht nur zufriedener, sondern auch produktiver sind. Die Firmen berichten von weniger Krankheitstagen und einer geringeren Fluktuation. Kritiker warnen jedoch, dass sich das Modell nicht für alle Branchen eignet, etwa im Gesundheitswesen oder im Einzelhandel, wo durchgehende Anwesenheit nötig ist. Die Forscher betonen außerdem, dass eine sorgfältige Planung der Arbeitsabläufe entscheidend für den Erfolg des Modells sei.",
        "items": [
          {
            "id": "gb2_l2_q1",
            "question_text": "Was zeigt die Studie laut Text?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text sagt genau das im ersten Satz.",
            "order_index": 0,
            "answers": [
              {
                "id": "gb2_l2_q1_a1",
                "answer_text": "Mitarbeitende sind bei einer Vier-Tage-Woche zufriedener und produktiver.",
                "is_correct": true
              },
              {
                "id": "gb2_l2_q1_a2",
                "answer_text": "Mitarbeitende sind bei einer Vier-Tage-Woche weniger produktiv.",
                "is_correct": false
              },
              {
                "id": "gb2_l2_q1_a3",
                "answer_text": "Die Vier-Tage-Woche funktioniert nur im Gesundheitswesen.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l2_q2",
            "question_text": "Was berichten die Firmen zusätzlich?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt weniger Krankheitstage und geringere Fluktuation.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb2_l2_q2_a1",
                "answer_text": "Weniger Krankheitstage und geringere Fluktuation.",
                "is_correct": true
              },
              {
                "id": "gb2_l2_q2_a2",
                "answer_text": "Mehr Krankheitstage.",
                "is_correct": false
              },
              {
                "id": "gb2_l2_q2_a3",
                "answer_text": "Höhere Kosten.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l2_q3",
            "question_text": "In welchen Branchen ist das Modell laut Kritikern schwierig?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt explizit Gesundheitswesen und Einzelhandel.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb2_l2_q3_a1",
                "answer_text": "Gesundheitswesen und Einzelhandel",
                "is_correct": true
              },
              {
                "id": "gb2_l2_q3_a2",
                "answer_text": "Nur in der Industrie",
                "is_correct": false
              },
              {
                "id": "gb2_l2_q3_a3",
                "answer_text": "In allen Branchen gleichermaßen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l2_q4",
            "question_text": "Alle Branchen können die Vier-Tage-Woche laut Text problemlos einführen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Kritiker warnen, dass sich das Modell nicht für alle Branchen eignet.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb2_l2_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb2_l2_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb2_l2_q5",
            "question_text": "Die Forscher betonen die Bedeutung sorgfältiger Planung.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der letzte Satz nennt genau das.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb2_l2_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "gb2_l2_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l2_q6",
            "question_text": "Warum ist durchgehende Anwesenheit im Einzelhandel wichtig?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt \"durchgehende Anwesenheit nötig\" als Grund.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb2_l2_q6_a1",
                "answer_text": "Weil dort ständige Erreichbarkeit nötig ist.",
                "is_correct": true
              },
              {
                "id": "gb2_l2_q6_a2",
                "answer_text": "Weil dort keine Digitalisierung möglich ist.",
                "is_correct": false
              },
              {
                "id": "gb2_l2_q6_a3",
                "answer_text": "Weil das Gesetz es vorschreibt.",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "lesen3",
        "name": "Lesen — Teil 3 (Zuordnung)",
        "type": "reading",
        "official_duration_minutes": 65,
        "instructions": "Sechs Personen äußern sich zum Thema Minimalismus. Ordnen Sie die Aussagen zu.",
        "passage": "Forum: \"Minimalismus im Alltag\"\n\nJonas: Seit ich weniger Dinge besitze, fühle ich mich viel freier. Ich brauche keine Zeit mehr, um Sachen zu suchen oder aufzuräumen.\nKatja: Ich finde Minimalismus übertrieben. Manche Dinge haben einen emotionalen Wert, den man nicht einfach wegwerfen sollte.\nLuca: Für mich ist es vor allem eine finanzielle Entscheidung — ich gebe seitdem viel weniger Geld für unnötige Dinge aus.\nMona: Ich sehe beide Seiten. Weniger Besitz kann entlasten, aber komplette Reduktion passt nicht zu jedem Lebensstil.\nNoah: Umweltschutz ist mein Hauptgrund. Weniger konsumieren bedeutet weniger Ressourcenverbrauch.\nPetra: Ich probiere es gerade aus, bin aber noch unsicher, ob ich langfristig dabei bleibe.",
        "items": [
          {
            "id": "gb2_l3_q1",
            "question_text": "Wer fühlt sich durch weniger Besitz freier?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Jonas sagt, er fühle sich viel freier.",
            "order_index": 0,
            "answers": [
              {
                "id": "gb2_l3_q1_a1",
                "answer_text": "Jonas",
                "is_correct": true
              },
              {
                "id": "gb2_l3_q1_a2",
                "answer_text": "Katja",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q1_a3",
                "answer_text": "Luca",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q1_a4",
                "answer_text": "Mona",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q1_a5",
                "answer_text": "Noah",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q1_a6",
                "answer_text": "Petra",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l3_q2",
            "question_text": "Wer findet Minimalismus übertrieben?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Katja nennt es übertrieben wegen des emotionalen Werts von Dingen.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb2_l3_q2_a1",
                "answer_text": "Jonas",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q2_a2",
                "answer_text": "Katja",
                "is_correct": true
              },
              {
                "id": "gb2_l3_q2_a3",
                "answer_text": "Luca",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q2_a4",
                "answer_text": "Mona",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q2_a5",
                "answer_text": "Noah",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q2_a6",
                "answer_text": "Petra",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l3_q3",
            "question_text": "Für wen ist es vor allem eine finanzielle Entscheidung?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Luca nennt finanzielle Gründe.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb2_l3_q3_a1",
                "answer_text": "Jonas",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q3_a2",
                "answer_text": "Katja",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q3_a3",
                "answer_text": "Luca",
                "is_correct": true
              },
              {
                "id": "gb2_l3_q3_a4",
                "answer_text": "Mona",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q3_a5",
                "answer_text": "Noah",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q3_a6",
                "answer_text": "Petra",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l3_q4",
            "question_text": "Wer sieht sowohl Vor- als auch Nachteile?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Mona sagt, sie sehe beide Seiten.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb2_l3_q4_a1",
                "answer_text": "Jonas",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q4_a2",
                "answer_text": "Katja",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q4_a3",
                "answer_text": "Luca",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q4_a4",
                "answer_text": "Mona",
                "is_correct": true
              },
              {
                "id": "gb2_l3_q4_a5",
                "answer_text": "Noah",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q4_a6",
                "answer_text": "Petra",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l3_q5",
            "question_text": "Wer nennt Umweltschutz als Hauptgrund?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Noah nennt Umweltschutz als Hauptgrund.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb2_l3_q5_a1",
                "answer_text": "Jonas",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q5_a2",
                "answer_text": "Katja",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q5_a3",
                "answer_text": "Luca",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q5_a4",
                "answer_text": "Mona",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q5_a5",
                "answer_text": "Noah",
                "is_correct": true
              },
              {
                "id": "gb2_l3_q5_a6",
                "answer_text": "Petra",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l3_q6",
            "question_text": "Wer ist sich noch unsicher, ob sie dabei bleibt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Petra sagt, sie sei noch unsicher.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb2_l3_q6_a1",
                "answer_text": "Jonas",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q6_a2",
                "answer_text": "Katja",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q6_a3",
                "answer_text": "Luca",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q6_a4",
                "answer_text": "Mona",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q6_a5",
                "answer_text": "Noah",
                "is_correct": false
              },
              {
                "id": "gb2_l3_q6_a6",
                "answer_text": "Petra",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "lesen4",
        "name": "Lesen — Teil 4 (Regeltext)",
        "type": "reading",
        "official_duration_minutes": 65,
        "instructions": "Lesen Sie die Nutzungsbedingungen und beantworten Sie die Fragen.",
        "passage": "Nutzungsbedingungen für den Coworking-Space — Auszug\n\n1. Der Zugang zum Gebäude ist täglich von 7 bis 22 Uhr über die Schlüsselkarte möglich.\n2. Besprechungsräume können maximal für zwei Stunden am Stück gebucht werden.\n3. Telefonate sollten ausschließlich in den dafür vorgesehenen Telefonkabinen geführt werden.\n4. Mitglieder dürfen bis zu zwei Gäste pro Tag ohne Voranmeldung mitbringen.\n5. Die Nutzung der Küche ist kostenlos, jedoch muss das Geschirr selbst gespült werden.\n6. Bei Kündigung der Mitgliedschaft gilt eine Frist von einem Monat zum Monatsende.",
        "items": [
          {
            "id": "gb2_l4_q1",
            "question_text": "Wann ist der Zugang zum Gebäude möglich?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 1 nennt genau diese Zeiten.",
            "order_index": 0,
            "answers": [
              {
                "id": "gb2_l4_q1_a1",
                "answer_text": "Täglich von 7 bis 22 Uhr",
                "is_correct": true
              },
              {
                "id": "gb2_l4_q1_a2",
                "answer_text": "Nur werktags",
                "is_correct": false
              },
              {
                "id": "gb2_l4_q1_a3",
                "answer_text": "Rund um die Uhr",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l4_q2",
            "question_text": "Wie lange können Besprechungsräume am Stück gebucht werden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 2 nennt maximal zwei Stunden.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb2_l4_q2_a1",
                "answer_text": "Maximal zwei Stunden",
                "is_correct": true
              },
              {
                "id": "gb2_l4_q2_a2",
                "answer_text": "Maximal eine Stunde",
                "is_correct": false
              },
              {
                "id": "gb2_l4_q2_a3",
                "answer_text": "Unbegrenzt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l4_q3",
            "question_text": "Telefonate dürfen überall im Coworking-Space geführt werden.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie sollten nur in den Telefonkabinen geführt werden.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb2_l4_q3_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb2_l4_q3_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb2_l4_q4",
            "question_text": "Wie viele Gäste dürfen Mitglieder pro Tag mitbringen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 4 nennt bis zu zwei Gäste.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb2_l4_q4_a1",
                "answer_text": "Bis zu zwei",
                "is_correct": true
              },
              {
                "id": "gb2_l4_q4_a2",
                "answer_text": "Nur einen",
                "is_correct": false
              },
              {
                "id": "gb2_l4_q4_a3",
                "answer_text": "Beliebig viele",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l4_q5",
            "question_text": "Die Nutzung der Küche kostet extra.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Nutzung ist kostenlos.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb2_l4_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb2_l4_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb2_l4_q6",
            "question_text": "Welche Kündigungsfrist gilt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 6 nennt eine Frist von einem Monat.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb2_l4_q6_a1",
                "answer_text": "Ein Monat zum Monatsende",
                "is_correct": true
              },
              {
                "id": "gb2_l4_q6_a2",
                "answer_text": "Zwei Wochen",
                "is_correct": false
              },
              {
                "id": "gb2_l4_q6_a3",
                "answer_text": "Drei Monate",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "lesen5",
        "name": "Lesen — Teil 5",
        "type": "reading",
        "official_duration_minutes": 65,
        "instructions": "Lesen Sie den Artikel und beantworten Sie die Fragen.",
        "passage": "Digitale Nomaden: Freiheit mit Herausforderungen\n\nImmer mehr Berufstätige arbeiten heute ortsunabhängig und reisen dabei durch die Welt. Befürworter loben die Flexibilität und die Möglichkeit, verschiedene Kulturen kennenzulernen. Kritiker weisen jedoch darauf hin, dass ständiges Reisen auch belastend sein kann: Der fehlende feste Freundeskreis und die unregelmäßige Zeitplanung führen bei manchen zu Einsamkeit. Experten empfehlen daher, regelmäßig Pausen vom Reisen einzulegen und feste Rituale beizubehalten, um psychisch stabil zu bleiben.",
        "items": [
          {
            "id": "gb2_l5_q1",
            "question_text": "Digitale Nomaden arbeiten ortsunabhängig.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der erste Satz beschreibt genau das.",
            "order_index": 0,
            "answers": [
              {
                "id": "gb2_l5_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "gb2_l5_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l5_q2",
            "question_text": "Was loben Befürworter?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau diese Vorteile.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb2_l5_q2_a1",
                "answer_text": "Die Flexibilität und das Kennenlernen von Kulturen.",
                "is_correct": true
              },
              {
                "id": "gb2_l5_q2_a2",
                "answer_text": "Die hohen Gehälter.",
                "is_correct": false
              },
              {
                "id": "gb2_l5_q2_a3",
                "answer_text": "Die festen Arbeitszeiten.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l5_q3",
            "question_text": "Was kritisieren manche am Reisen als Lebensstil?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt Einsamkeit als möglichen Nachteil.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb2_l5_q3_a1",
                "answer_text": "Es kann zu Einsamkeit führen.",
                "is_correct": true
              },
              {
                "id": "gb2_l5_q3_a2",
                "answer_text": "Es ist zu teuer.",
                "is_correct": false
              },
              {
                "id": "gb2_l5_q3_a3",
                "answer_text": "Es ist gesetzlich verboten.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l5_q4",
            "question_text": "Ein fehlender fester Freundeskreis wird im Text erwähnt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text nennt genau diesen Punkt.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb2_l5_q4_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "gb2_l5_q4_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l5_q5",
            "question_text": "Was empfehlen Experten?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der letzte Satz nennt genau diese Empfehlung.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb2_l5_q5_a1",
                "answer_text": "Regelmäßige Pausen vom Reisen und feste Rituale.",
                "is_correct": true
              },
              {
                "id": "gb2_l5_q5_a2",
                "answer_text": "Nie länger als eine Woche an einem Ort zu bleiben.",
                "is_correct": false
              },
              {
                "id": "gb2_l5_q5_a3",
                "answer_text": "Ganz auf Reisen zu verzichten.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_l5_q6",
            "question_text": "Warum sind feste Rituale laut Experten wichtig?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt psychische Stabilität als Grund.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb2_l5_q6_a1",
                "answer_text": "Um psychisch stabil zu bleiben.",
                "is_correct": true
              },
              {
                "id": "gb2_l5_q6_a2",
                "answer_text": "Um mehr Geld zu verdienen.",
                "is_correct": false
              },
              {
                "id": "gb2_l5_q6_a3",
                "answer_text": "Um schneller reisen zu können.",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "sprachbausteine",
        "name": "Sprachbausteine (تدريب إضافي)",
        "type": "language",
        "official_duration_minutes": null,
        "instructions": "تدريب إضافي على القواعد المتقدمة والمفردات (غير جزء رسمي من اختبار Goethe، لكنه مفيد للتحضير).",
        "passage": null,
        "items": [
          {
            "id": "gb2_sb_q1",
            "question_text": "___ es regnete, ging er ohne Regenschirm aus dem Haus.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"Obwohl\" drückt einen Gegensatz aus.",
            "order_index": 0,
            "answers": [
              {
                "id": "gb2_sb_q1_a1",
                "answer_text": "Obwohl",
                "is_correct": true
              },
              {
                "id": "gb2_sb_q1_a2",
                "answer_text": "Weil",
                "is_correct": false
              },
              {
                "id": "gb2_sb_q1_a3",
                "answer_text": "Damit",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_sb_q2",
            "question_text": "Wenn ich mehr Zeit hätte, ___ ich öfter Sport.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Konjunktiv II: \"würde\" + Infinitiv.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb2_sb_q2_a1",
                "answer_text": "würde ich machen",
                "is_correct": true
              },
              {
                "id": "gb2_sb_q2_a2",
                "answer_text": "mache ich",
                "is_correct": false
              },
              {
                "id": "gb2_sb_q2_a3",
                "answer_text": "machte ich",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_sb_q3",
            "question_text": "Der Bericht ___ gestern von der Abteilung fertiggestellt.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Passiv Präteritum: \"wurde\" + Partizip II.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb2_sb_q3_a1",
                "answer_text": "wurde",
                "is_correct": true
              },
              {
                "id": "gb2_sb_q3_a2",
                "answer_text": "hat",
                "is_correct": false
              },
              {
                "id": "gb2_sb_q3_a3",
                "answer_text": "ist",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_sb_q4",
            "question_text": "___ er den Termin abgesagt hat, müssen wir neu planen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"Nachdem\" beschreibt ein Ereignis vor dem Hauptsatz.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb2_sb_q4_a1",
                "answer_text": "Nachdem",
                "is_correct": true
              },
              {
                "id": "gb2_sb_q4_a2",
                "answer_text": "Bevor",
                "is_correct": false
              },
              {
                "id": "gb2_sb_q4_a3",
                "answer_text": "Seitdem",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_sb_q5",
            "question_text": "Die Entscheidung hängt ___ ab, wie das Budget aussieht.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"abhängen von\" → \"davon abhängen\".",
            "order_index": 4,
            "answers": [
              {
                "id": "gb2_sb_q5_a1",
                "answer_text": "davon",
                "is_correct": true
              },
              {
                "id": "gb2_sb_q5_a2",
                "answer_text": "darauf",
                "is_correct": false
              },
              {
                "id": "gb2_sb_q5_a3",
                "answer_text": "damit",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_sb_q6",
            "question_text": "Er tut so, ___ er nichts wüsste.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"als ob\" + Konjunktiv II drückt einen Vergleich/Schein aus.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb2_sb_q6_a1",
                "answer_text": "als ob",
                "is_correct": true
              },
              {
                "id": "gb2_sb_q6_a2",
                "answer_text": "obwohl",
                "is_correct": false
              },
              {
                "id": "gb2_sb_q6_a3",
                "answer_text": "damit",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_sb_q7",
            "question_text": "Das Projekt wird ___ Erfolg gekrönt, wenn alle mitarbeiten.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"mit Erfolg gekrönt werden\" ist eine feste Wendung.",
            "order_index": 6,
            "answers": [
              {
                "id": "gb2_sb_q7_a1",
                "answer_text": "mit",
                "is_correct": true
              },
              {
                "id": "gb2_sb_q7_a2",
                "answer_text": "von",
                "is_correct": false
              },
              {
                "id": "gb2_sb_q7_a3",
                "answer_text": "durch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_sb_q8",
            "question_text": "Sie hat sich dazu ___, das Angebot anzunehmen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"sich entschließen zu\" + Infinitiv.",
            "order_index": 7,
            "answers": [
              {
                "id": "gb2_sb_q8_a1",
                "answer_text": "entschlossen",
                "is_correct": true
              },
              {
                "id": "gb2_sb_q8_a2",
                "answer_text": "entschieden sich",
                "is_correct": false
              },
              {
                "id": "gb2_sb_q8_a3",
                "answer_text": "beschlossen sich",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_sb_q9",
            "question_text": "___ seiner Erfahrung wurde er schnell befördert.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"Aufgrund\" nennt den Grund für die Beförderung.",
            "order_index": 8,
            "answers": [
              {
                "id": "gb2_sb_q9_a1",
                "answer_text": "Aufgrund",
                "is_correct": true
              },
              {
                "id": "gb2_sb_q9_a2",
                "answer_text": "Trotz",
                "is_correct": false
              },
              {
                "id": "gb2_sb_q9_a3",
                "answer_text": "Statt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_sb_q10",
            "question_text": "Die Firma muss ihre Strategie überdenken, ___ wettbewerbsfähig zu bleiben.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"um...zu\" + Infinitiv drückt einen Zweck aus.",
            "order_index": 9,
            "answers": [
              {
                "id": "gb2_sb_q10_a1",
                "answer_text": "um",
                "is_correct": true
              },
              {
                "id": "gb2_sb_q10_a2",
                "answer_text": "damit sie",
                "is_correct": false
              },
              {
                "id": "gb2_sb_q10_a3",
                "answer_text": "weil",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "hoeren1",
        "name": "Hören — Teil 1 (Transkript)",
        "type": "listening",
        "official_duration_minutes": 40,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ كل نص قصير، ثم أجب عن سؤاله.",
        "passage": "Kurze Texte (Transkript):\n1. Die Geschäftsführung informiert, dass die jährliche Betriebsversammlung dieses Jahr online stattfindet.\n2. Der Aufzug im Westflügel ist außer Betrieb, bitte nutzen Sie den Aufzug im Ostflügel.\n3. Die Rückgabefrist für Bibliotheksbücher wurde wegen der Feiertage um eine Woche verlängert.\n4. Wegen Bauarbeiten ist die Hauptstraße bis Freitag für den Verkehr gesperrt.\n5. Der Wetterdienst warnt für morgen vor starkem Wind an der Küste.\n6. Die Fluggesellschaft teilt mit, dass der Flug nach Frankfurt eine Stunde Verspätung hat.\n7. Ab kommendem Monat wird die Parkgebühr in der Innenstadt um 20 Prozent erhöht.\n8. Das Museum bietet ab sofort jeden ersten Sonntag im Monat freien Eintritt an.",
        "items": [
          {
            "id": "gb2_h1_q1",
            "question_text": "Wie findet die Betriebsversammlung dieses Jahr statt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text sagt \"findet online statt\".",
            "order_index": 0,
            "answers": [
              {
                "id": "gb2_h1_q1_a1",
                "answer_text": "Online",
                "is_correct": true
              },
              {
                "id": "gb2_h1_q1_a2",
                "answer_text": "Im Konferenzraum",
                "is_correct": false
              },
              {
                "id": "gb2_h1_q1_a3",
                "answer_text": "Sie fällt aus",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h1_q2",
            "question_text": "Was ist im Westflügel außer Betrieb?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Aufzug im Westflügel ist außer Betrieb.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb2_h1_q2_a1",
                "answer_text": "Der Aufzug",
                "is_correct": true
              },
              {
                "id": "gb2_h1_q2_a2",
                "answer_text": "Die Klimaanlage",
                "is_correct": false
              },
              {
                "id": "gb2_h1_q2_a3",
                "answer_text": "Das Licht",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h1_q3",
            "question_text": "Was wurde verlängert?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Rückgabefrist wurde verlängert.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb2_h1_q3_a1",
                "answer_text": "Die Rückgabefrist",
                "is_correct": true
              },
              {
                "id": "gb2_h1_q3_a2",
                "answer_text": "Die Öffnungszeiten",
                "is_correct": false
              },
              {
                "id": "gb2_h1_q3_a3",
                "answer_text": "Die Mitgliedschaft",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h1_q4",
            "question_text": "Bis wann ist die Straße gesperrt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Straße ist bis Freitag gesperrt.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb2_h1_q4_a1",
                "answer_text": "Bis Freitag",
                "is_correct": true
              },
              {
                "id": "gb2_h1_q4_a2",
                "answer_text": "Bis Montag",
                "is_correct": false
              },
              {
                "id": "gb2_h1_q4_a3",
                "answer_text": "Für immer",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h1_q5",
            "question_text": "Wovor warnt der Wetterdienst?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Es wird vor starkem Wind gewarnt.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb2_h1_q5_a1",
                "answer_text": "Vor starkem Wind",
                "is_correct": true
              },
              {
                "id": "gb2_h1_q5_a2",
                "answer_text": "Vor Schnee",
                "is_correct": false
              },
              {
                "id": "gb2_h1_q5_a3",
                "answer_text": "Vor Hitze",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h1_q6",
            "question_text": "Wie viel Verspätung hat der Flug?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Flug hat eine Stunde Verspätung.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb2_h1_q6_a1",
                "answer_text": "Eine Stunde",
                "is_correct": true
              },
              {
                "id": "gb2_h1_q6_a2",
                "answer_text": "Zwei Stunden",
                "is_correct": false
              },
              {
                "id": "gb2_h1_q6_a3",
                "answer_text": "Zehn Minuten",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h1_q7",
            "question_text": "Um wie viel steigt die Parkgebühr?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Gebühr steigt um 20 Prozent.",
            "order_index": 6,
            "answers": [
              {
                "id": "gb2_h1_q7_a1",
                "answer_text": "Um 20 Prozent",
                "is_correct": true
              },
              {
                "id": "gb2_h1_q7_a2",
                "answer_text": "Um 50 Prozent",
                "is_correct": false
              },
              {
                "id": "gb2_h1_q7_a3",
                "answer_text": "Sie sinkt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h1_q8",
            "question_text": "Wann ist der Eintritt frei?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt jeden ersten Sonntag im Monat.",
            "order_index": 7,
            "answers": [
              {
                "id": "gb2_h1_q8_a1",
                "answer_text": "Jeden ersten Sonntag im Monat",
                "is_correct": true
              },
              {
                "id": "gb2_h1_q8_a2",
                "answer_text": "Jeden Samstag",
                "is_correct": false
              },
              {
                "id": "gb2_h1_q8_a3",
                "answer_text": "Nur an Feiertagen",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_goethe_b2__hoeren1.mp3"
      },
      {
        "key": "hoeren2",
        "name": "Hören — Teil 2 (Transkript)",
        "type": "listening",
        "official_duration_minutes": 40,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص المقابلة كما لو كنت تسمعها، ثم أجب عن الأسئلة.",
        "passage": "Radiointerview mit einer Stadtplanerin:\n\"Moderator: Frau Berger, warum setzt Ihre Stadt so stark auf Fahrradwege?\nFrau Berger: Weil wir gesehen haben, dass mehr Fahrradwege den Autoverkehr im Zentrum deutlich reduzieren. Seit dem Ausbau des Netzes vor zwei Jahren ist die Zahl der Autos in der Innenstadt um fast 20 Prozent gesunken.\nModerator: Gab es auch Widerstand gegen das Projekt?\nFrau Berger: Ja, anfangs vor allem von Geschäftsleuten, die um weniger Kundschaft fürchteten. Mittlerweile zeigen unsere Zahlen aber, dass die Umsätze in der Innenstadt sogar leicht gestiegen sind.\nModerator: Was sind die nächsten Schritte?\nFrau Berger: Wir planen, das Netz bis 2027 um weitere 50 Kilometer zu erweitern und mehr Fahrradparkplätze zu schaffen.\"",
        "items": [
          {
            "id": "gb2_h2_q1",
            "question_text": "Worüber spricht Frau Berger?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Das Interview handelt vom Ausbau der Fahrradwege.",
            "order_index": 0,
            "answers": [
              {
                "id": "gb2_h2_q1_a1",
                "answer_text": "Über den Ausbau von Fahrradwegen",
                "is_correct": true
              },
              {
                "id": "gb2_h2_q1_a2",
                "answer_text": "Über neue Autobahnen",
                "is_correct": false
              },
              {
                "id": "gb2_h2_q1_a3",
                "answer_text": "Über den öffentlichen Nahverkehr",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h2_q2",
            "question_text": "Um wie viel ist die Zahl der Autos gesunken?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Frau Berger nennt fast 20 Prozent.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb2_h2_q2_a1",
                "answer_text": "Um fast 20 Prozent",
                "is_correct": true
              },
              {
                "id": "gb2_h2_q2_a2",
                "answer_text": "Um 5 Prozent",
                "is_correct": false
              },
              {
                "id": "gb2_h2_q2_a3",
                "answer_text": "Um 50 Prozent",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h2_q3",
            "question_text": "Seit wann ist das Fahrradnetz ausgebaut?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Ausbau war vor zwei Jahren.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb2_h2_q3_a1",
                "answer_text": "Seit zwei Jahren",
                "is_correct": true
              },
              {
                "id": "gb2_h2_q3_a2",
                "answer_text": "Seit einem Monat",
                "is_correct": false
              },
              {
                "id": "gb2_h2_q3_a3",
                "answer_text": "Seit zehn Jahren",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h2_q4",
            "question_text": "Wer war anfangs gegen das Projekt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Geschäftsleute fürchteten weniger Kundschaft.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb2_h2_q4_a1",
                "answer_text": "Geschäftsleute",
                "is_correct": true
              },
              {
                "id": "gb2_h2_q4_a2",
                "answer_text": "Fahrradfahrer",
                "is_correct": false
              },
              {
                "id": "gb2_h2_q4_a3",
                "answer_text": "Die Stadtverwaltung",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h2_q5",
            "question_text": "Die Umsätze in der Innenstadt sind gesunken.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie sind laut Frau Berger leicht gestiegen.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb2_h2_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb2_h2_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb2_h2_q6",
            "question_text": "Um wie viele Kilometer soll das Netz erweitert werden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Frau Berger nennt 50 Kilometer.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb2_h2_q6_a1",
                "answer_text": "Um 50 Kilometer",
                "is_correct": true
              },
              {
                "id": "gb2_h2_q6_a2",
                "answer_text": "Um 10 Kilometer",
                "is_correct": false
              },
              {
                "id": "gb2_h2_q6_a3",
                "answer_text": "Um 200 Kilometer",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h2_q7",
            "question_text": "Bis wann soll die Erweiterung abgeschlossen sein?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie nennt das Jahr 2027.",
            "order_index": 6,
            "answers": [
              {
                "id": "gb2_h2_q7_a1",
                "answer_text": "Bis 2027",
                "is_correct": true
              },
              {
                "id": "gb2_h2_q7_a2",
                "answer_text": "Bis nächstes Jahr",
                "is_correct": false
              },
              {
                "id": "gb2_h2_q7_a3",
                "answer_text": "Bis 2030",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h2_q8",
            "question_text": "Es sollen auch mehr Fahrradparkplätze entstehen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Frau Berger erwähnt das ausdrücklich.",
            "order_index": 7,
            "answers": [
              {
                "id": "gb2_h2_q8_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "gb2_h2_q8_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_goethe_b2__hoeren2.mp3"
      },
      {
        "key": "hoeren3",
        "name": "Hören — Teil 3 (Transkript)",
        "type": "listening",
        "official_duration_minutes": 40,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص المحاضرة كما لو كنت تسمعها، ثم أجب عن الأسئلة.",
        "passage": "Vortrag: Nachhaltigkeit in Unternehmen\n\"Immer mehr Unternehmen setzen sich verbindliche Klimaziele. Eine aktuelle Untersuchung zeigt, dass 65 Prozent der befragten Firmen bis 2030 klimaneutral werden wollen. Die größte Herausforderung dabei ist laut den Befragten nicht die Technologie, sondern die Finanzierung der Umstellung. Besonders kleine und mittlere Unternehmen berichten von Schwierigkeiten beim Zugang zu Fördermitteln. Die Untersuchung empfiehlt daher vereinfachte Antragsverfahren und mehr Beratungsangebote für kleinere Betriebe.\"",
        "items": [
          {
            "id": "gb2_h3_q1",
            "question_text": "Wie viel Prozent der Firmen wollen bis 2030 klimaneutral werden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Vortrag nennt 65 Prozent.",
            "order_index": 0,
            "answers": [
              {
                "id": "gb2_h3_q1_a1",
                "answer_text": "65 Prozent",
                "is_correct": true
              },
              {
                "id": "gb2_h3_q1_a2",
                "answer_text": "35 Prozent",
                "is_correct": false
              },
              {
                "id": "gb2_h3_q1_a3",
                "answer_text": "90 Prozent",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h3_q2",
            "question_text": "Was ist laut den Befragten die größte Herausforderung?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Finanzierung wird als größte Herausforderung genannt.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb2_h3_q2_a1",
                "answer_text": "Die Finanzierung der Umstellung",
                "is_correct": true
              },
              {
                "id": "gb2_h3_q2_a2",
                "answer_text": "Die Technologie",
                "is_correct": false
              },
              {
                "id": "gb2_h3_q2_a3",
                "answer_text": "Der Personalmangel",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h3_q3",
            "question_text": "Große Konzerne haben laut Text die größten Schwierigkeiten mit Fördermitteln.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Besonders kleine und mittlere Unternehmen haben diese Schwierigkeiten.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb2_h3_q3_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb2_h3_q3_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb2_h3_q4",
            "question_text": "Was empfiehlt die Untersuchung?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der letzte Satz nennt genau diese Empfehlung.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb2_h3_q4_a1",
                "answer_text": "Vereinfachte Antragsverfahren und mehr Beratung",
                "is_correct": true
              },
              {
                "id": "gb2_h3_q4_a2",
                "answer_text": "Höhere Steuern für Unternehmen",
                "is_correct": false
              },
              {
                "id": "gb2_h3_q4_a3",
                "answer_text": "Weniger staatliche Kontrolle",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h3_q5",
            "question_text": "Die Technologie ist laut Text das größte Hindernis.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Nicht die Technologie, sondern die Finanzierung ist das Hindernis.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb2_h3_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb2_h3_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb2_h3_q6",
            "question_text": "Für wen sind Fördermittel besonders schwer zugänglich?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt explizit kleine und mittlere Unternehmen.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb2_h3_q6_a1",
                "answer_text": "Für kleine und mittlere Unternehmen",
                "is_correct": true
              },
              {
                "id": "gb2_h3_q6_a2",
                "answer_text": "Für staatliche Betriebe",
                "is_correct": false
              },
              {
                "id": "gb2_h3_q6_a3",
                "answer_text": "Für alle Unternehmen gleichermaßen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h3_q7",
            "question_text": "Bis wann wollen viele Firmen klimaneutral werden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Vortrag nennt das Jahr 2030.",
            "order_index": 6,
            "answers": [
              {
                "id": "gb2_h3_q7_a1",
                "answer_text": "Bis 2030",
                "is_correct": true
              },
              {
                "id": "gb2_h3_q7_a2",
                "answer_text": "Bis 2025",
                "is_correct": false
              },
              {
                "id": "gb2_h3_q7_a3",
                "answer_text": "Bis 2050",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_goethe_b2__hoeren3.mp3"
      },
      {
        "key": "hoeren4",
        "name": "Hören — Teil 4 (Transkript)",
        "type": "listening",
        "official_duration_minutes": 40,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص النقاش كما لو كنت تسمعه، ثم أجب عن الأسئلة.",
        "passage": "Diskussion: Sollten Studiengebühren wieder eingeführt werden?\n\"Moderatorin: Herr Kessler, Sie sind für die Wiedereinführung von Studiengebühren?\nHerr Kessler: Ja, ich denke, moderate Gebühren könnten die Qualität der Lehre verbessern, weil Universitäten mehr finanzielle Mittel hätten.\nModeratorin: Frau Ahrens, Sie sind dagegen?\nFrau Ahrens: Genau. Ich befürchte, dass Studiengebühren den Zugang zur Bildung für Menschen aus einkommensschwachen Familien erschweren würden. Bildung sollte meiner Meinung nach kostenlos bleiben.\nHerr Kessler: Man könnte aber ein Stipendiensystem einführen, um genau das zu verhindern.\nFrau Ahrens: Das ist möglich, aber in der Praxis erreichen solche Systeme oft nicht alle, die sie bräuchten.\"",
        "items": [
          {
            "id": "gb2_h4_q1",
            "question_text": "Worüber diskutieren die beiden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Das Thema ist Studiengebühren.",
            "order_index": 0,
            "answers": [
              {
                "id": "gb2_h4_q1_a1",
                "answer_text": "Über die Wiedereinführung von Studiengebühren",
                "is_correct": true
              },
              {
                "id": "gb2_h4_q1_a2",
                "answer_text": "Über Schulnoten",
                "is_correct": false
              },
              {
                "id": "gb2_h4_q1_a3",
                "answer_text": "Über Universitätsrankings",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h4_q2",
            "question_text": "Herr Kessler ist gegen Studiengebühren.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er ist für die Wiedereinführung.",
            "order_index": 1,
            "answers": [
              {
                "id": "gb2_h4_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb2_h4_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb2_h4_q3",
            "question_text": "Was erhofft sich Herr Kessler von Studiengebühren?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Er sagt, es könnte die Qualität der Lehre verbessern.",
            "order_index": 2,
            "answers": [
              {
                "id": "gb2_h4_q3_a1",
                "answer_text": "Bessere Qualität der Lehre",
                "is_correct": true
              },
              {
                "id": "gb2_h4_q3_a2",
                "answer_text": "Weniger Studierende",
                "is_correct": false
              },
              {
                "id": "gb2_h4_q3_a3",
                "answer_text": "Mehr Professoren",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h4_q4",
            "question_text": "Wovor hat Frau Ahrens Angst?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie befürchtet erschwerten Zugang für einkommensschwache Familien.",
            "order_index": 3,
            "answers": [
              {
                "id": "gb2_h4_q4_a1",
                "answer_text": "Dass der Zugang zur Bildung erschwert wird.",
                "is_correct": true
              },
              {
                "id": "gb2_h4_q4_a2",
                "answer_text": "Dass zu viele Studierende kommen.",
                "is_correct": false
              },
              {
                "id": "gb2_h4_q4_a3",
                "answer_text": "Dass die Universitäten schließen.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h4_q5",
            "question_text": "Was schlägt Herr Kessler als Lösung vor?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Er schlägt ein Stipendiensystem vor.",
            "order_index": 4,
            "answers": [
              {
                "id": "gb2_h4_q5_a1",
                "answer_text": "Ein Stipendiensystem",
                "is_correct": true
              },
              {
                "id": "gb2_h4_q5_a2",
                "answer_text": "Kostenlose Bücher",
                "is_correct": false
              },
              {
                "id": "gb2_h4_q5_a3",
                "answer_text": "Weniger Prüfungen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "gb2_h4_q6",
            "question_text": "Frau Ahrens hält Stipendiensysteme für eine perfekte Lösung.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie sagt, solche Systeme erreichen in der Praxis oft nicht alle.",
            "order_index": 5,
            "answers": [
              {
                "id": "gb2_h4_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "gb2_h4_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "gb2_h4_q7",
            "question_text": "Was ist Frau Ahrens' grundsätzliche Meinung zu Bildung?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie sagt \"Bildung sollte meiner Meinung nach kostenlos bleiben\".",
            "order_index": 6,
            "answers": [
              {
                "id": "gb2_h4_q7_a1",
                "answer_text": "Bildung sollte kostenlos bleiben.",
                "is_correct": true
              },
              {
                "id": "gb2_h4_q7_a2",
                "answer_text": "Bildung sollte teurer werden.",
                "is_correct": false
              },
              {
                "id": "gb2_h4_q7_a3",
                "answer_text": "Bildung ist nicht wichtig.",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_goethe_b2__hoeren4.mp3"
      }
    ],
    "writing": {
      "name": "Schreiben (تدريب غير مُقيَّم)",
      "official_duration_minutes": 75,
      "instructions": "في الاختبار الرسمي، تكتب مساهمة في منتدى (150 كلمة على الأقل) ورسالة رسمية (100 كلمة على الأقل). هذا تدريب ذاتي غير مُقيَّم آليًا.",
      "prompt": "Schreiben Sie einen Forumsbeitrag (mind. 150 Wörter) zum Thema: \"Sollten Unternehmen ihren Mitarbeitenden eine Vier-Tage-Woche anbieten?\" Nennen Sie Vor- und Nachteile und begründen Sie Ihre eigene Meinung.",
      "sample_answer": "Meiner Meinung nach ist die Vier-Tage-Woche eine sinnvolle Entwicklung, auch wenn sie nicht für jede Branche gleich gut funktioniert. Einerseits profitieren Angestellte von mehr Erholungszeit, was nachweislich Stress reduziert und die Motivation steigert. Andererseits befürchten manche Unternehmen, dass die Produktivität sinkt, wenn weniger Arbeitsstunden zur Verfügung stehen.\n\nAus meiner Sicht überwiegen die Vorteile, solange die Umstellung gut geplant wird. Studien zeigen, dass viele Firmen trotz kürzerer Arbeitszeit ähnliche oder sogar bessere Ergebnisse erzielen, weil Mitarbeitende konzentrierter arbeiten. Natürlich eignet sich das Modell nicht überall, etwa im Gesundheitswesen, wo durchgehende Anwesenheit notwendig ist.\n\nInsgesamt halte ich es für wichtig, dass Unternehmen das Modell zumindest testen, bevor sie es pauschal ablehnen."
    }
  },
  "test_telc_b1_beruf": {
    "sections": [
      {
        "key": "lese1",
        "name": "Leseverstehen — Teil 1 (Globalverstehen)",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "Ordnen Sie jedem kurzen Text die passende Überschrift zu.",
        "passage": "Texte:\n1. Ab nächster Woche gilt im ganzen Gebäude eine neue Kleiderordnung im Kundenbereich. Bitte informieren Sie Ihr Team.\n2. Der Drucker im zweiten Stock ist seit Montag defekt. Bitte nutzen Sie bis auf Weiteres den Drucker im Erdgeschoss.\n3. Alle Mitarbeitenden sind eingeladen, an der Weihnachtsfeier am 15. Dezember teilzunehmen. Bitte melden Sie sich bis Freitag an.\n4. Die IT-Abteilung führt am Donnerstag zwischen 18 und 20 Uhr Wartungsarbeiten durch. Das System ist in dieser Zeit nicht erreichbar.\n5. Neue Mitarbeitende erhalten künftig am ersten Arbeitstag ein Einführungspaket mit allen wichtigen Informationen.\n\nÜberschriften:\nA) Technische Störung\nB) Einladung zur Feier\nC) Neue Vorschrift\nD) Wartungsarbeiten\nE) Willkommenspaket\nF) Urlaubsantrag",
        "items": [
          {
            "id": "tb1_l1_q1",
            "question_text": "Welche Überschrift passt zu Text 1?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Text 1 passt zu C) Neue Vorschrift.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb1_l1_q1_a1",
                "answer_text": "A) Technische Störung",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q1_a2",
                "answer_text": "B) Einladung zur Feier",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q1_a3",
                "answer_text": "C) Neue Vorschrift",
                "is_correct": true
              },
              {
                "id": "tb1_l1_q1_a4",
                "answer_text": "D) Wartungsarbeiten",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q1_a5",
                "answer_text": "E) Willkommenspaket",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q1_a6",
                "answer_text": "F) Urlaubsantrag",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l1_q2",
            "question_text": "Welche Überschrift passt zu Text 2?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Text 2 passt zu A) Technische Störung.",
            "order_index": 1,
            "answers": [
              {
                "id": "tb1_l1_q2_a1",
                "answer_text": "A) Technische Störung",
                "is_correct": true
              },
              {
                "id": "tb1_l1_q2_a2",
                "answer_text": "B) Einladung zur Feier",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q2_a3",
                "answer_text": "C) Neue Vorschrift",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q2_a4",
                "answer_text": "D) Wartungsarbeiten",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q2_a5",
                "answer_text": "E) Willkommenspaket",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q2_a6",
                "answer_text": "F) Urlaubsantrag",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l1_q3",
            "question_text": "Welche Überschrift passt zu Text 3?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Text 3 passt zu B) Einladung zur Feier.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb1_l1_q3_a1",
                "answer_text": "A) Technische Störung",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q3_a2",
                "answer_text": "B) Einladung zur Feier",
                "is_correct": true
              },
              {
                "id": "tb1_l1_q3_a3",
                "answer_text": "C) Neue Vorschrift",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q3_a4",
                "answer_text": "D) Wartungsarbeiten",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q3_a5",
                "answer_text": "E) Willkommenspaket",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q3_a6",
                "answer_text": "F) Urlaubsantrag",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l1_q4",
            "question_text": "Welche Überschrift passt zu Text 4?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Text 4 passt zu D) Wartungsarbeiten.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb1_l1_q4_a1",
                "answer_text": "A) Technische Störung",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q4_a2",
                "answer_text": "B) Einladung zur Feier",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q4_a3",
                "answer_text": "C) Neue Vorschrift",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q4_a4",
                "answer_text": "D) Wartungsarbeiten",
                "is_correct": true
              },
              {
                "id": "tb1_l1_q4_a5",
                "answer_text": "E) Willkommenspaket",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q4_a6",
                "answer_text": "F) Urlaubsantrag",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l1_q5",
            "question_text": "Welche Überschrift passt zu Text 5?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Text 5 passt zu E) Willkommenspaket.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb1_l1_q5_a1",
                "answer_text": "A) Technische Störung",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q5_a2",
                "answer_text": "B) Einladung zur Feier",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q5_a3",
                "answer_text": "C) Neue Vorschrift",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q5_a4",
                "answer_text": "D) Wartungsarbeiten",
                "is_correct": false
              },
              {
                "id": "tb1_l1_q5_a5",
                "answer_text": "E) Willkommenspaket",
                "is_correct": true
              },
              {
                "id": "tb1_l1_q5_a6",
                "answer_text": "F) Urlaubsantrag",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "lese2",
        "name": "Leseverstehen — Teil 2 (Detailverstehen)",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "Lesen Sie die interne Mitteilung und beantworten Sie die Fragen.",
        "passage": "Interne Mitteilung\n\nLiebe Kolleginnen und Kollegen,\n\nab dem 1. des nächsten Monats wird die Gleitzeitregelung angepasst: Die Kernarbeitszeit liegt künftig zwischen 9:30 und 15:30 Uhr. Mitarbeitende können ihre Arbeitszeit davor und danach flexibel gestalten, solange die wöchentliche Sollarbeitszeit von 40 Stunden eingehalten wird. Überstunden können bis zu einem Maximum von 10 Stunden pro Monat ins nächste Monat übertragen werden. Bei Fragen wenden Sie sich bitte an die Personalabteilung, die montags bis donnerstags von 9 bis 16 Uhr erreichbar ist.\n\nMit freundlichen Grüßen\nDie Geschäftsführung",
        "items": [
          {
            "id": "tb1_l2_q1",
            "question_text": "Was ändert sich laut der Mitteilung?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Mitteilung handelt von einer neuen Kernarbeitszeit.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb1_l2_q1_a1",
                "answer_text": "Die Kernarbeitszeit",
                "is_correct": true
              },
              {
                "id": "tb1_l2_q1_a2",
                "answer_text": "Der Urlaubsanspruch",
                "is_correct": false
              },
              {
                "id": "tb1_l2_q1_a3",
                "answer_text": "Das Gehalt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l2_q2",
            "question_text": "Wie viele Stunden pro Woche müssen Mitarbeitende arbeiten?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt eine Sollarbeitszeit von 40 Stunden.",
            "order_index": 1,
            "answers": [
              {
                "id": "tb1_l2_q2_a1",
                "answer_text": "40 Stunden",
                "is_correct": true
              },
              {
                "id": "tb1_l2_q2_a2",
                "answer_text": "35 Stunden",
                "is_correct": false
              },
              {
                "id": "tb1_l2_q2_a3",
                "answer_text": "45 Stunden",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l2_q3",
            "question_text": "An wen sollen sich Mitarbeitende bei Fragen wenden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text verweist auf die Personalabteilung.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb1_l2_q3_a1",
                "answer_text": "An die Personalabteilung",
                "is_correct": true
              },
              {
                "id": "tb1_l2_q3_a2",
                "answer_text": "An die Geschäftsführung direkt",
                "is_correct": false
              },
              {
                "id": "tb1_l2_q3_a3",
                "answer_text": "An die IT-Abteilung",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l2_q4",
            "question_text": "Die neue Kernarbeitszeit beginnt bereits morgen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie beginnt erst am 1. des nächsten Monats.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb1_l2_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb1_l2_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "tb1_l2_q5",
            "question_text": "Wie viele Überstunden können maximal übertragen werden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt maximal 10 Stunden pro Monat.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb1_l2_q5_a1",
                "answer_text": "10 Stunden pro Monat",
                "is_correct": true
              },
              {
                "id": "tb1_l2_q5_a2",
                "answer_text": "5 Stunden pro Monat",
                "is_correct": false
              },
              {
                "id": "tb1_l2_q5_a3",
                "answer_text": "Unbegrenzt viele",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "lese3",
        "name": "Leseverstehen — Teil 3 (Selektives Verstehen)",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "Ordnen Sie jedem Bewerberprofil die passende Stellenanzeige zu.",
        "passage": "Bewerberprofile:\n1. Ein Bewerber mit Erfahrung in der Buchhaltung sucht eine Teilzeitstelle.\n2. Eine Person mit guten Englischkenntnissen sucht eine Stelle im Kundenservice.\n3. Ein IT-Fachmann sucht eine Stelle im Homeoffice.\n4. Eine Person ohne Berufserfahrung sucht eine Ausbildungsstelle im Einzelhandel.\n5. Ein Bewerber mit Führerschein sucht eine Stelle als Lieferfahrer.\n6. Eine zweisprachige Person (Deutsch/Arabisch) sucht eine Stelle als Dolmetscherin.\n7. Ein erfahrener Koch sucht eine Vollzeitstelle in einem Restaurant.\n8. Eine Person mit Interesse an Marketing sucht ein Praktikum.\n9. Ein Bewerber mit Pflegeerfahrung sucht eine Stelle im Krankenhaus.\n10. Eine Person mit handwerklichem Geschick sucht eine Stelle als Elektriker.\n\nStellenanzeigen:\nA) Buchhalter/in Teilzeit gesucht, flexible Arbeitszeiten möglich.\nB) Kundenservice-Mitarbeiter/in mit Englischkenntnissen gesucht.\nC) IT-Support, 100% remote möglich, flexible Zeiten.\nD) Ausbildungsplatz Einzelhandelskaufmann/-frau, keine Vorerfahrung nötig.\nE) Lieferfahrer/in mit Führerschein Klasse B gesucht, Vollzeit.\nF) Dolmetscher/in Deutsch-Arabisch für Behördentermine gesucht.\nG) Koch/Köchin Vollzeit für gehobenes Restaurant gesucht.\nH) Marketing-Praktikum für Studierende, 3-6 Monate.\nI) Pflegekraft für Krankenhausstation gesucht, Erfahrung erwünscht.\nJ) Elektriker/in für Wartungsarbeiten gesucht, handwerkliches Geschick nötig.",
        "items": [
          {
            "id": "tb1_l3_q1",
            "question_text": "Welche Anzeige passt zu Profil 1?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 1 passt zu Anzeige A.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb1_l3_q1_a1",
                "answer_text": "A) Buchhalter/in Teilzeit gesucht, flexible Arbeitszeiten möglich.",
                "is_correct": true
              },
              {
                "id": "tb1_l3_q1_a2",
                "answer_text": "B) Kundenservice-Mitarbeiter/in mit Englischkenntnissen gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q1_a3",
                "answer_text": "C) IT-Support, 100% remote möglich, flexible Zeiten.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q1_a4",
                "answer_text": "D) Ausbildungsplatz Einzelhandelskaufmann/-frau, keine Vorerfahrung nötig.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q1_a5",
                "answer_text": "E) Lieferfahrer/in mit Führerschein Klasse B gesucht, Vollzeit.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q1_a6",
                "answer_text": "F) Dolmetscher/in Deutsch-Arabisch für Behördentermine gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q1_a7",
                "answer_text": "G) Koch/Köchin Vollzeit für gehobenes Restaurant gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q1_a8",
                "answer_text": "H) Marketing-Praktikum für Studierende, 3-6 Monate.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q1_a9",
                "answer_text": "I) Pflegekraft für Krankenhausstation gesucht, Erfahrung erwünscht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q1_a10",
                "answer_text": "J) Elektriker/in für Wartungsarbeiten gesucht, handwerkliches Geschick nötig.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l3_q2",
            "question_text": "Welche Anzeige passt zu Profil 2?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 2 passt zu Anzeige B.",
            "order_index": 1,
            "answers": [
              {
                "id": "tb1_l3_q2_a1",
                "answer_text": "A) Buchhalter/in Teilzeit gesucht, flexible Arbeitszeiten möglich.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q2_a2",
                "answer_text": "B) Kundenservice-Mitarbeiter/in mit Englischkenntnissen gesucht.",
                "is_correct": true
              },
              {
                "id": "tb1_l3_q2_a3",
                "answer_text": "C) IT-Support, 100% remote möglich, flexible Zeiten.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q2_a4",
                "answer_text": "D) Ausbildungsplatz Einzelhandelskaufmann/-frau, keine Vorerfahrung nötig.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q2_a5",
                "answer_text": "E) Lieferfahrer/in mit Führerschein Klasse B gesucht, Vollzeit.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q2_a6",
                "answer_text": "F) Dolmetscher/in Deutsch-Arabisch für Behördentermine gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q2_a7",
                "answer_text": "G) Koch/Köchin Vollzeit für gehobenes Restaurant gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q2_a8",
                "answer_text": "H) Marketing-Praktikum für Studierende, 3-6 Monate.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q2_a9",
                "answer_text": "I) Pflegekraft für Krankenhausstation gesucht, Erfahrung erwünscht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q2_a10",
                "answer_text": "J) Elektriker/in für Wartungsarbeiten gesucht, handwerkliches Geschick nötig.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l3_q3",
            "question_text": "Welche Anzeige passt zu Profil 3?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 3 passt zu Anzeige C.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb1_l3_q3_a1",
                "answer_text": "A) Buchhalter/in Teilzeit gesucht, flexible Arbeitszeiten möglich.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q3_a2",
                "answer_text": "B) Kundenservice-Mitarbeiter/in mit Englischkenntnissen gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q3_a3",
                "answer_text": "C) IT-Support, 100% remote möglich, flexible Zeiten.",
                "is_correct": true
              },
              {
                "id": "tb1_l3_q3_a4",
                "answer_text": "D) Ausbildungsplatz Einzelhandelskaufmann/-frau, keine Vorerfahrung nötig.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q3_a5",
                "answer_text": "E) Lieferfahrer/in mit Führerschein Klasse B gesucht, Vollzeit.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q3_a6",
                "answer_text": "F) Dolmetscher/in Deutsch-Arabisch für Behördentermine gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q3_a7",
                "answer_text": "G) Koch/Köchin Vollzeit für gehobenes Restaurant gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q3_a8",
                "answer_text": "H) Marketing-Praktikum für Studierende, 3-6 Monate.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q3_a9",
                "answer_text": "I) Pflegekraft für Krankenhausstation gesucht, Erfahrung erwünscht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q3_a10",
                "answer_text": "J) Elektriker/in für Wartungsarbeiten gesucht, handwerkliches Geschick nötig.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l3_q4",
            "question_text": "Welche Anzeige passt zu Profil 4?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 4 passt zu Anzeige D.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb1_l3_q4_a1",
                "answer_text": "A) Buchhalter/in Teilzeit gesucht, flexible Arbeitszeiten möglich.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q4_a2",
                "answer_text": "B) Kundenservice-Mitarbeiter/in mit Englischkenntnissen gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q4_a3",
                "answer_text": "C) IT-Support, 100% remote möglich, flexible Zeiten.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q4_a4",
                "answer_text": "D) Ausbildungsplatz Einzelhandelskaufmann/-frau, keine Vorerfahrung nötig.",
                "is_correct": true
              },
              {
                "id": "tb1_l3_q4_a5",
                "answer_text": "E) Lieferfahrer/in mit Führerschein Klasse B gesucht, Vollzeit.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q4_a6",
                "answer_text": "F) Dolmetscher/in Deutsch-Arabisch für Behördentermine gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q4_a7",
                "answer_text": "G) Koch/Köchin Vollzeit für gehobenes Restaurant gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q4_a8",
                "answer_text": "H) Marketing-Praktikum für Studierende, 3-6 Monate.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q4_a9",
                "answer_text": "I) Pflegekraft für Krankenhausstation gesucht, Erfahrung erwünscht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q4_a10",
                "answer_text": "J) Elektriker/in für Wartungsarbeiten gesucht, handwerkliches Geschick nötig.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l3_q5",
            "question_text": "Welche Anzeige passt zu Profil 5?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 5 passt zu Anzeige E.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb1_l3_q5_a1",
                "answer_text": "A) Buchhalter/in Teilzeit gesucht, flexible Arbeitszeiten möglich.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q5_a2",
                "answer_text": "B) Kundenservice-Mitarbeiter/in mit Englischkenntnissen gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q5_a3",
                "answer_text": "C) IT-Support, 100% remote möglich, flexible Zeiten.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q5_a4",
                "answer_text": "D) Ausbildungsplatz Einzelhandelskaufmann/-frau, keine Vorerfahrung nötig.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q5_a5",
                "answer_text": "E) Lieferfahrer/in mit Führerschein Klasse B gesucht, Vollzeit.",
                "is_correct": true
              },
              {
                "id": "tb1_l3_q5_a6",
                "answer_text": "F) Dolmetscher/in Deutsch-Arabisch für Behördentermine gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q5_a7",
                "answer_text": "G) Koch/Köchin Vollzeit für gehobenes Restaurant gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q5_a8",
                "answer_text": "H) Marketing-Praktikum für Studierende, 3-6 Monate.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q5_a9",
                "answer_text": "I) Pflegekraft für Krankenhausstation gesucht, Erfahrung erwünscht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q5_a10",
                "answer_text": "J) Elektriker/in für Wartungsarbeiten gesucht, handwerkliches Geschick nötig.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l3_q6",
            "question_text": "Welche Anzeige passt zu Profil 6?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 6 passt zu Anzeige F.",
            "order_index": 5,
            "answers": [
              {
                "id": "tb1_l3_q6_a1",
                "answer_text": "A) Buchhalter/in Teilzeit gesucht, flexible Arbeitszeiten möglich.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q6_a2",
                "answer_text": "B) Kundenservice-Mitarbeiter/in mit Englischkenntnissen gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q6_a3",
                "answer_text": "C) IT-Support, 100% remote möglich, flexible Zeiten.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q6_a4",
                "answer_text": "D) Ausbildungsplatz Einzelhandelskaufmann/-frau, keine Vorerfahrung nötig.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q6_a5",
                "answer_text": "E) Lieferfahrer/in mit Führerschein Klasse B gesucht, Vollzeit.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q6_a6",
                "answer_text": "F) Dolmetscher/in Deutsch-Arabisch für Behördentermine gesucht.",
                "is_correct": true
              },
              {
                "id": "tb1_l3_q6_a7",
                "answer_text": "G) Koch/Köchin Vollzeit für gehobenes Restaurant gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q6_a8",
                "answer_text": "H) Marketing-Praktikum für Studierende, 3-6 Monate.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q6_a9",
                "answer_text": "I) Pflegekraft für Krankenhausstation gesucht, Erfahrung erwünscht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q6_a10",
                "answer_text": "J) Elektriker/in für Wartungsarbeiten gesucht, handwerkliches Geschick nötig.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l3_q7",
            "question_text": "Welche Anzeige passt zu Profil 7?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 7 passt zu Anzeige G.",
            "order_index": 6,
            "answers": [
              {
                "id": "tb1_l3_q7_a1",
                "answer_text": "A) Buchhalter/in Teilzeit gesucht, flexible Arbeitszeiten möglich.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q7_a2",
                "answer_text": "B) Kundenservice-Mitarbeiter/in mit Englischkenntnissen gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q7_a3",
                "answer_text": "C) IT-Support, 100% remote möglich, flexible Zeiten.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q7_a4",
                "answer_text": "D) Ausbildungsplatz Einzelhandelskaufmann/-frau, keine Vorerfahrung nötig.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q7_a5",
                "answer_text": "E) Lieferfahrer/in mit Führerschein Klasse B gesucht, Vollzeit.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q7_a6",
                "answer_text": "F) Dolmetscher/in Deutsch-Arabisch für Behördentermine gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q7_a7",
                "answer_text": "G) Koch/Köchin Vollzeit für gehobenes Restaurant gesucht.",
                "is_correct": true
              },
              {
                "id": "tb1_l3_q7_a8",
                "answer_text": "H) Marketing-Praktikum für Studierende, 3-6 Monate.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q7_a9",
                "answer_text": "I) Pflegekraft für Krankenhausstation gesucht, Erfahrung erwünscht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q7_a10",
                "answer_text": "J) Elektriker/in für Wartungsarbeiten gesucht, handwerkliches Geschick nötig.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l3_q8",
            "question_text": "Welche Anzeige passt zu Profil 8?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 8 passt zu Anzeige H.",
            "order_index": 7,
            "answers": [
              {
                "id": "tb1_l3_q8_a1",
                "answer_text": "A) Buchhalter/in Teilzeit gesucht, flexible Arbeitszeiten möglich.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q8_a2",
                "answer_text": "B) Kundenservice-Mitarbeiter/in mit Englischkenntnissen gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q8_a3",
                "answer_text": "C) IT-Support, 100% remote möglich, flexible Zeiten.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q8_a4",
                "answer_text": "D) Ausbildungsplatz Einzelhandelskaufmann/-frau, keine Vorerfahrung nötig.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q8_a5",
                "answer_text": "E) Lieferfahrer/in mit Führerschein Klasse B gesucht, Vollzeit.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q8_a6",
                "answer_text": "F) Dolmetscher/in Deutsch-Arabisch für Behördentermine gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q8_a7",
                "answer_text": "G) Koch/Köchin Vollzeit für gehobenes Restaurant gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q8_a8",
                "answer_text": "H) Marketing-Praktikum für Studierende, 3-6 Monate.",
                "is_correct": true
              },
              {
                "id": "tb1_l3_q8_a9",
                "answer_text": "I) Pflegekraft für Krankenhausstation gesucht, Erfahrung erwünscht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q8_a10",
                "answer_text": "J) Elektriker/in für Wartungsarbeiten gesucht, handwerkliches Geschick nötig.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l3_q9",
            "question_text": "Welche Anzeige passt zu Profil 9?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 9 passt zu Anzeige I.",
            "order_index": 8,
            "answers": [
              {
                "id": "tb1_l3_q9_a1",
                "answer_text": "A) Buchhalter/in Teilzeit gesucht, flexible Arbeitszeiten möglich.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q9_a2",
                "answer_text": "B) Kundenservice-Mitarbeiter/in mit Englischkenntnissen gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q9_a3",
                "answer_text": "C) IT-Support, 100% remote möglich, flexible Zeiten.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q9_a4",
                "answer_text": "D) Ausbildungsplatz Einzelhandelskaufmann/-frau, keine Vorerfahrung nötig.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q9_a5",
                "answer_text": "E) Lieferfahrer/in mit Führerschein Klasse B gesucht, Vollzeit.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q9_a6",
                "answer_text": "F) Dolmetscher/in Deutsch-Arabisch für Behördentermine gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q9_a7",
                "answer_text": "G) Koch/Köchin Vollzeit für gehobenes Restaurant gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q9_a8",
                "answer_text": "H) Marketing-Praktikum für Studierende, 3-6 Monate.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q9_a9",
                "answer_text": "I) Pflegekraft für Krankenhausstation gesucht, Erfahrung erwünscht.",
                "is_correct": true
              },
              {
                "id": "tb1_l3_q9_a10",
                "answer_text": "J) Elektriker/in für Wartungsarbeiten gesucht, handwerkliches Geschick nötig.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_l3_q10",
            "question_text": "Welche Anzeige passt zu Profil 10?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 10 passt zu Anzeige J.",
            "order_index": 9,
            "answers": [
              {
                "id": "tb1_l3_q10_a1",
                "answer_text": "A) Buchhalter/in Teilzeit gesucht, flexible Arbeitszeiten möglich.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q10_a2",
                "answer_text": "B) Kundenservice-Mitarbeiter/in mit Englischkenntnissen gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q10_a3",
                "answer_text": "C) IT-Support, 100% remote möglich, flexible Zeiten.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q10_a4",
                "answer_text": "D) Ausbildungsplatz Einzelhandelskaufmann/-frau, keine Vorerfahrung nötig.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q10_a5",
                "answer_text": "E) Lieferfahrer/in mit Führerschein Klasse B gesucht, Vollzeit.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q10_a6",
                "answer_text": "F) Dolmetscher/in Deutsch-Arabisch für Behördentermine gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q10_a7",
                "answer_text": "G) Koch/Köchin Vollzeit für gehobenes Restaurant gesucht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q10_a8",
                "answer_text": "H) Marketing-Praktikum für Studierende, 3-6 Monate.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q10_a9",
                "answer_text": "I) Pflegekraft für Krankenhausstation gesucht, Erfahrung erwünscht.",
                "is_correct": false
              },
              {
                "id": "tb1_l3_q10_a10",
                "answer_text": "J) Elektriker/in für Wartungsarbeiten gesucht, handwerkliches Geschick nötig.",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "sprachbausteine1",
        "name": "Sprachbausteine — Teil 1",
        "type": "language",
        "official_duration_minutes": 90,
        "instructions": "Wählen Sie die richtige Lösung (Wortschatz und Grammatik im Berufskontext).",
        "passage": null,
        "items": [
          {
            "id": "tb1_sb1_q1",
            "question_text": "Sehr geehrte Damen und Herren, ich schreibe Ihnen ___ meiner Bewerbung.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"bezüglich\" + Genitiv ist die formelle Variante.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb1_sb1_q1_a1",
                "answer_text": "bezüglich",
                "is_correct": true
              },
              {
                "id": "tb1_sb1_q1_a2",
                "answer_text": "wegen der",
                "is_correct": false
              },
              {
                "id": "tb1_sb1_q1_a3",
                "answer_text": "über",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb1_q2",
            "question_text": "Könnten Sie mir bitte den Bericht bis Freitag ___?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"zusenden\" ist hier die passende Verbform.",
            "order_index": 1,
            "answers": [
              {
                "id": "tb1_sb1_q2_a1",
                "answer_text": "zusenden",
                "is_correct": true
              },
              {
                "id": "tb1_sb1_q2_a2",
                "answer_text": "zuschicken lassen",
                "is_correct": false
              },
              {
                "id": "tb1_sb1_q2_a3",
                "answer_text": "senden bitte",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb1_q3",
            "question_text": "Frau Klein ist ___ für die Buchhaltung zuständig.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"seit Januar\" beschreibt eine andauernde Zuständigkeit.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb1_sb1_q3_a1",
                "answer_text": "seit Januar",
                "is_correct": true
              },
              {
                "id": "tb1_sb1_q3_a2",
                "answer_text": "ab Januar zuständig gewesen",
                "is_correct": false
              },
              {
                "id": "tb1_sb1_q3_a3",
                "answer_text": "seit Januar zuständig sein",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb1_q4",
            "question_text": "Der Termin wurde ___ nächste Woche verschoben.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"verschieben auf\" + Akkusativ.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb1_sb1_q4_a1",
                "answer_text": "auf",
                "is_correct": true
              },
              {
                "id": "tb1_sb1_q4_a2",
                "answer_text": "zu",
                "is_correct": false
              },
              {
                "id": "tb1_sb1_q4_a3",
                "answer_text": "bei",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb1_q5",
            "question_text": "Ich möchte mich für das Missverständnis ___.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Reflexives Verb: \"sich entschuldigen\".",
            "order_index": 4,
            "answers": [
              {
                "id": "tb1_sb1_q5_a1",
                "answer_text": "entschuldigen",
                "is_correct": true
              },
              {
                "id": "tb1_sb1_q5_a2",
                "answer_text": "Entschuldigung",
                "is_correct": false
              },
              {
                "id": "tb1_sb1_q5_a3",
                "answer_text": "entschuldigt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb1_q6",
            "question_text": "Die Unterlagen liegen bereits ___ Ihnen vor.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"vorliegen bei\" + Dativ.",
            "order_index": 5,
            "answers": [
              {
                "id": "tb1_sb1_q6_a1",
                "answer_text": "bei",
                "is_correct": true
              },
              {
                "id": "tb1_sb1_q6_a2",
                "answer_text": "mit",
                "is_correct": false
              },
              {
                "id": "tb1_sb1_q6_a3",
                "answer_text": "zu",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb1_q7",
            "question_text": "Wir bitten um ___ bei eventuellen Verzögerungen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"um Verständnis bitten\" ist die feste Wendung.",
            "order_index": 6,
            "answers": [
              {
                "id": "tb1_sb1_q7_a1",
                "answer_text": "Verständnis",
                "is_correct": true
              },
              {
                "id": "tb1_sb1_q7_a2",
                "answer_text": "Verstehen",
                "is_correct": false
              },
              {
                "id": "tb1_sb1_q7_a3",
                "answer_text": "Verständlichkeit",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb1_q8",
            "question_text": "Der neue Kollege wird sich morgen dem Team ___.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Reflexives Verb im Futur: \"wird sich vorstellen\".",
            "order_index": 7,
            "answers": [
              {
                "id": "tb1_sb1_q8_a1",
                "answer_text": "vorstellen",
                "is_correct": true
              },
              {
                "id": "tb1_sb1_q8_a2",
                "answer_text": "vorzustellen",
                "is_correct": false
              },
              {
                "id": "tb1_sb1_q8_a3",
                "answer_text": "vorstellt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb1_q9",
            "question_text": "Bitte bestätigen Sie den Erhalt dieser E-Mail ___ Rückantwort.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"per Rückantwort\" ist eine feste Wendung in Geschäftskorrespondenz.",
            "order_index": 8,
            "answers": [
              {
                "id": "tb1_sb1_q9_a1",
                "answer_text": "per",
                "is_correct": true
              },
              {
                "id": "tb1_sb1_q9_a2",
                "answer_text": "durch",
                "is_correct": false
              },
              {
                "id": "tb1_sb1_q9_a3",
                "answer_text": "über",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb1_q10",
            "question_text": "Die Besprechung musste ___ technischer Probleme verschoben werden.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"aufgrund\" + Genitiv nennt den Grund.",
            "order_index": 9,
            "answers": [
              {
                "id": "tb1_sb1_q10_a1",
                "answer_text": "aufgrund",
                "is_correct": true
              },
              {
                "id": "tb1_sb1_q10_a2",
                "answer_text": "trotz",
                "is_correct": false
              },
              {
                "id": "tb1_sb1_q10_a3",
                "answer_text": "statt",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "sprachbausteine2",
        "name": "Sprachbausteine — Teil 2 (Zuordnung)",
        "type": "language",
        "official_duration_minutes": 90,
        "instructions": "Ordnen Sie jeder Redewendung die passende Funktion in einem Geschäftsbrief zu.",
        "passage": "Redewendungen:\n1. Mit freundlichen Grüßen\n2. Ich freue mich auf Ihre Rückmeldung.\n3. Anbei sende ich Ihnen die gewünschten Unterlagen.\n4. Für Rückfragen stehe ich Ihnen gerne zur Verfügung.\n5. Vielen Dank im Voraus für Ihre Bemühungen.\n6. Bitte lassen Sie mich wissen, falls Sie weitere Informationen benötigen.\n7. Wir bedauern, Ihnen mitteilen zu müssen, dass...\n8. Ich möchte mich hiermit offiziell bewerben um...\n9. Bezugnehmend auf unser Telefongespräch...\n10. In der Anlage finden Sie...\n\nFunktionen:\nA) Formeller Briefabschluss\nB) Bitte um Antwort\nC) Ankündigung eines Anhangs\nD) Angebot weiterer Hilfe\nE) Dank im Voraus\nF) Aufforderung zu weiteren Fragen\nG) Formelle schlechte Nachricht einleiten\nH) Bewerbungseinleitung\nI) Bezug auf ein früheres Gespräch\nJ) Verweis auf beigefügte Dokumente",
        "items": [
          {
            "id": "tb1_sb2_q1",
            "question_text": "Welche Funktion hat Redewendung 1?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Redewendung 1 entspricht Funktion A.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb1_sb2_q1_a1",
                "answer_text": "A) Formeller Briefabschluss",
                "is_correct": true
              },
              {
                "id": "tb1_sb2_q1_a2",
                "answer_text": "B) Bitte um Antwort",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q1_a3",
                "answer_text": "C) Ankündigung eines Anhangs",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q1_a4",
                "answer_text": "D) Angebot weiterer Hilfe",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q1_a5",
                "answer_text": "E) Dank im Voraus",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q1_a6",
                "answer_text": "F) Aufforderung zu weiteren Fragen",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q1_a7",
                "answer_text": "G) Formelle schlechte Nachricht einleiten",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q1_a8",
                "answer_text": "H) Bewerbungseinleitung",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q1_a9",
                "answer_text": "I) Bezug auf ein früheres Gespräch",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q1_a10",
                "answer_text": "J) Verweis auf beigefügte Dokumente",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb2_q2",
            "question_text": "Welche Funktion hat Redewendung 2?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Redewendung 2 entspricht Funktion B.",
            "order_index": 1,
            "answers": [
              {
                "id": "tb1_sb2_q2_a1",
                "answer_text": "A) Formeller Briefabschluss",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q2_a2",
                "answer_text": "B) Bitte um Antwort",
                "is_correct": true
              },
              {
                "id": "tb1_sb2_q2_a3",
                "answer_text": "C) Ankündigung eines Anhangs",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q2_a4",
                "answer_text": "D) Angebot weiterer Hilfe",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q2_a5",
                "answer_text": "E) Dank im Voraus",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q2_a6",
                "answer_text": "F) Aufforderung zu weiteren Fragen",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q2_a7",
                "answer_text": "G) Formelle schlechte Nachricht einleiten",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q2_a8",
                "answer_text": "H) Bewerbungseinleitung",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q2_a9",
                "answer_text": "I) Bezug auf ein früheres Gespräch",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q2_a10",
                "answer_text": "J) Verweis auf beigefügte Dokumente",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb2_q3",
            "question_text": "Welche Funktion hat Redewendung 3?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Redewendung 3 entspricht Funktion C.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb1_sb2_q3_a1",
                "answer_text": "A) Formeller Briefabschluss",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q3_a2",
                "answer_text": "B) Bitte um Antwort",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q3_a3",
                "answer_text": "C) Ankündigung eines Anhangs",
                "is_correct": true
              },
              {
                "id": "tb1_sb2_q3_a4",
                "answer_text": "D) Angebot weiterer Hilfe",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q3_a5",
                "answer_text": "E) Dank im Voraus",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q3_a6",
                "answer_text": "F) Aufforderung zu weiteren Fragen",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q3_a7",
                "answer_text": "G) Formelle schlechte Nachricht einleiten",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q3_a8",
                "answer_text": "H) Bewerbungseinleitung",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q3_a9",
                "answer_text": "I) Bezug auf ein früheres Gespräch",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q3_a10",
                "answer_text": "J) Verweis auf beigefügte Dokumente",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb2_q4",
            "question_text": "Welche Funktion hat Redewendung 4?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Redewendung 4 entspricht Funktion D.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb1_sb2_q4_a1",
                "answer_text": "A) Formeller Briefabschluss",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q4_a2",
                "answer_text": "B) Bitte um Antwort",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q4_a3",
                "answer_text": "C) Ankündigung eines Anhangs",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q4_a4",
                "answer_text": "D) Angebot weiterer Hilfe",
                "is_correct": true
              },
              {
                "id": "tb1_sb2_q4_a5",
                "answer_text": "E) Dank im Voraus",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q4_a6",
                "answer_text": "F) Aufforderung zu weiteren Fragen",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q4_a7",
                "answer_text": "G) Formelle schlechte Nachricht einleiten",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q4_a8",
                "answer_text": "H) Bewerbungseinleitung",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q4_a9",
                "answer_text": "I) Bezug auf ein früheres Gespräch",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q4_a10",
                "answer_text": "J) Verweis auf beigefügte Dokumente",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb2_q5",
            "question_text": "Welche Funktion hat Redewendung 5?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Redewendung 5 entspricht Funktion E.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb1_sb2_q5_a1",
                "answer_text": "A) Formeller Briefabschluss",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q5_a2",
                "answer_text": "B) Bitte um Antwort",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q5_a3",
                "answer_text": "C) Ankündigung eines Anhangs",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q5_a4",
                "answer_text": "D) Angebot weiterer Hilfe",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q5_a5",
                "answer_text": "E) Dank im Voraus",
                "is_correct": true
              },
              {
                "id": "tb1_sb2_q5_a6",
                "answer_text": "F) Aufforderung zu weiteren Fragen",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q5_a7",
                "answer_text": "G) Formelle schlechte Nachricht einleiten",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q5_a8",
                "answer_text": "H) Bewerbungseinleitung",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q5_a9",
                "answer_text": "I) Bezug auf ein früheres Gespräch",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q5_a10",
                "answer_text": "J) Verweis auf beigefügte Dokumente",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb2_q6",
            "question_text": "Welche Funktion hat Redewendung 6?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Redewendung 6 entspricht Funktion F.",
            "order_index": 5,
            "answers": [
              {
                "id": "tb1_sb2_q6_a1",
                "answer_text": "A) Formeller Briefabschluss",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q6_a2",
                "answer_text": "B) Bitte um Antwort",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q6_a3",
                "answer_text": "C) Ankündigung eines Anhangs",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q6_a4",
                "answer_text": "D) Angebot weiterer Hilfe",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q6_a5",
                "answer_text": "E) Dank im Voraus",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q6_a6",
                "answer_text": "F) Aufforderung zu weiteren Fragen",
                "is_correct": true
              },
              {
                "id": "tb1_sb2_q6_a7",
                "answer_text": "G) Formelle schlechte Nachricht einleiten",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q6_a8",
                "answer_text": "H) Bewerbungseinleitung",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q6_a9",
                "answer_text": "I) Bezug auf ein früheres Gespräch",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q6_a10",
                "answer_text": "J) Verweis auf beigefügte Dokumente",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb2_q7",
            "question_text": "Welche Funktion hat Redewendung 7?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Redewendung 7 entspricht Funktion G.",
            "order_index": 6,
            "answers": [
              {
                "id": "tb1_sb2_q7_a1",
                "answer_text": "A) Formeller Briefabschluss",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q7_a2",
                "answer_text": "B) Bitte um Antwort",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q7_a3",
                "answer_text": "C) Ankündigung eines Anhangs",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q7_a4",
                "answer_text": "D) Angebot weiterer Hilfe",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q7_a5",
                "answer_text": "E) Dank im Voraus",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q7_a6",
                "answer_text": "F) Aufforderung zu weiteren Fragen",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q7_a7",
                "answer_text": "G) Formelle schlechte Nachricht einleiten",
                "is_correct": true
              },
              {
                "id": "tb1_sb2_q7_a8",
                "answer_text": "H) Bewerbungseinleitung",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q7_a9",
                "answer_text": "I) Bezug auf ein früheres Gespräch",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q7_a10",
                "answer_text": "J) Verweis auf beigefügte Dokumente",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb2_q8",
            "question_text": "Welche Funktion hat Redewendung 8?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Redewendung 8 entspricht Funktion H.",
            "order_index": 7,
            "answers": [
              {
                "id": "tb1_sb2_q8_a1",
                "answer_text": "A) Formeller Briefabschluss",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q8_a2",
                "answer_text": "B) Bitte um Antwort",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q8_a3",
                "answer_text": "C) Ankündigung eines Anhangs",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q8_a4",
                "answer_text": "D) Angebot weiterer Hilfe",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q8_a5",
                "answer_text": "E) Dank im Voraus",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q8_a6",
                "answer_text": "F) Aufforderung zu weiteren Fragen",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q8_a7",
                "answer_text": "G) Formelle schlechte Nachricht einleiten",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q8_a8",
                "answer_text": "H) Bewerbungseinleitung",
                "is_correct": true
              },
              {
                "id": "tb1_sb2_q8_a9",
                "answer_text": "I) Bezug auf ein früheres Gespräch",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q8_a10",
                "answer_text": "J) Verweis auf beigefügte Dokumente",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb2_q9",
            "question_text": "Welche Funktion hat Redewendung 9?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Redewendung 9 entspricht Funktion I.",
            "order_index": 8,
            "answers": [
              {
                "id": "tb1_sb2_q9_a1",
                "answer_text": "A) Formeller Briefabschluss",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q9_a2",
                "answer_text": "B) Bitte um Antwort",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q9_a3",
                "answer_text": "C) Ankündigung eines Anhangs",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q9_a4",
                "answer_text": "D) Angebot weiterer Hilfe",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q9_a5",
                "answer_text": "E) Dank im Voraus",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q9_a6",
                "answer_text": "F) Aufforderung zu weiteren Fragen",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q9_a7",
                "answer_text": "G) Formelle schlechte Nachricht einleiten",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q9_a8",
                "answer_text": "H) Bewerbungseinleitung",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q9_a9",
                "answer_text": "I) Bezug auf ein früheres Gespräch",
                "is_correct": true
              },
              {
                "id": "tb1_sb2_q9_a10",
                "answer_text": "J) Verweis auf beigefügte Dokumente",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_sb2_q10",
            "question_text": "Welche Funktion hat Redewendung 10?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Redewendung 10 entspricht Funktion J.",
            "order_index": 9,
            "answers": [
              {
                "id": "tb1_sb2_q10_a1",
                "answer_text": "A) Formeller Briefabschluss",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q10_a2",
                "answer_text": "B) Bitte um Antwort",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q10_a3",
                "answer_text": "C) Ankündigung eines Anhangs",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q10_a4",
                "answer_text": "D) Angebot weiterer Hilfe",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q10_a5",
                "answer_text": "E) Dank im Voraus",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q10_a6",
                "answer_text": "F) Aufforderung zu weiteren Fragen",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q10_a7",
                "answer_text": "G) Formelle schlechte Nachricht einleiten",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q10_a8",
                "answer_text": "H) Bewerbungseinleitung",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q10_a9",
                "answer_text": "I) Bezug auf ein früheres Gespräch",
                "is_correct": false
              },
              {
                "id": "tb1_sb2_q10_a10",
                "answer_text": "J) Verweis auf beigefügte Dokumente",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "hoeren1",
        "name": "Hörverstehen — Teil 1 (Globalverstehen)",
        "type": "listening",
        "official_duration_minutes": 30,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص الرد الآلي كما لو كنت تسمعه، ثم حدد صحة الجمل.",
        "passage": "Telefonansage einer Firma:\n\"Sie erreichen die Firma Meier GmbH. Unsere Geschäftszeiten sind Montag bis Freitag von 8 bis 17 Uhr. Für technische Fragen wählen Sie bitte die 1, für Fragen zur Rechnungsstellung die 2. Falls Sie einen Rückruf wünschen, hinterlassen Sie bitte Ihren Namen und Ihre Telefonnummer nach dem Signalton.\"",
        "items": [
          {
            "id": "tb1_h1_q1",
            "question_text": "Die Geschäftszeiten sind von 8 bis 17 Uhr.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Ansage nennt genau diese Zeiten.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb1_h1_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb1_h1_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_h1_q2",
            "question_text": "Für Rechnungsfragen wählt man die 1.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die 1 ist für technische Fragen, die 2 für Rechnungsfragen.",
            "order_index": 1,
            "answers": [
              {
                "id": "tb1_h1_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb1_h1_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "tb1_h1_q3",
            "question_text": "Man kann einen Rückruf hinterlassen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Ansage erwähnt diese Option.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb1_h1_q3_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb1_h1_q3_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_h1_q4",
            "question_text": "Die Firma ist auch am Wochenende erreichbar.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Geschäftszeiten gelten nur Montag bis Freitag.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb1_h1_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb1_h1_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "tb1_h1_q5",
            "question_text": "Man muss Namen und Telefonnummer hinterlassen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Ansage bittet genau darum.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb1_h1_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb1_h1_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_telc_b1_beruf__hoeren1.mp3"
      },
      {
        "key": "hoeren2",
        "name": "Hörverstehen — Teil 2 (Detailverstehen)",
        "type": "listening",
        "official_duration_minutes": 30,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص المكالمة كما لو كنت تسمعها، ثم حدد صحة الجمل.",
        "passage": "Telefongespräch im Büro:\n\"A: Guten Tag, hier ist Yassin von der Marketingabteilung. Ich rufe wegen unseres Meetings am Donnerstag an.\nB: Ah, guten Tag Herr Yassin. Das Meeting musste leider auf Freitag, 10 Uhr, verschoben werden.\nA: Kein Problem, ich trage es mir gleich in den Kalender ein. Findet es im gleichen Raum statt?\nB: Nein, diesmal im Konferenzraum im 3. Stock. Bitte bringen Sie auch die aktuelle Präsentation mit.\nA: Mache ich. Sind sonst noch Kollegen aus anderen Abteilungen eingeladen?\nB: Ja, auch zwei Kollegen aus dem Vertrieb werden dabei sein, um über die neue Kampagne zu sprechen.\nA: Verstanden, dann bis Freitag!\"",
        "items": [
          {
            "id": "tb1_h2_q1",
            "question_text": "Das Meeting findet am Donnerstag statt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es wurde auf Freitag verschoben.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb1_h2_q1_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb1_h2_q1_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "tb1_h2_q2",
            "question_text": "Das Meeting beginnt um 10 Uhr.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Anrufer sagt \"Freitag, 10 Uhr\".",
            "order_index": 1,
            "answers": [
              {
                "id": "tb1_h2_q2_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb1_h2_q2_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_h2_q3",
            "question_text": "Das Meeting findet im gleichen Raum wie sonst statt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es findet diesmal im Konferenzraum im 3. Stock statt.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb1_h2_q3_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb1_h2_q3_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "tb1_h2_q4",
            "question_text": "Herr Yassin soll die Präsentation mitbringen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "B bittet ihn, die Präsentation mitzubringen.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb1_h2_q4_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb1_h2_q4_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_h2_q5",
            "question_text": "Herr Yassin arbeitet in der Marketingabteilung.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er stellt sich als \"Yassin von der Marketingabteilung\" vor.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb1_h2_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb1_h2_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_h2_q6",
            "question_text": "Es sind auch Kollegen aus dem Vertrieb eingeladen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "B erwähnt zwei Kollegen aus dem Vertrieb.",
            "order_index": 5,
            "answers": [
              {
                "id": "tb1_h2_q6_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb1_h2_q6_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_h2_q7",
            "question_text": "Beim Meeting geht es auch um eine neue Kampagne.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Vertriebskollegen sprechen über die neue Kampagne.",
            "order_index": 6,
            "answers": [
              {
                "id": "tb1_h2_q7_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb1_h2_q7_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_h2_q8",
            "question_text": "Das Meeting wurde komplett abgesagt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es wurde nur verschoben, nicht abgesagt.",
            "order_index": 7,
            "answers": [
              {
                "id": "tb1_h2_q8_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb1_h2_q8_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "tb1_h2_q9",
            "question_text": "Der Konferenzraum liegt im 3. Stock.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "B nennt genau diesen Ort.",
            "order_index": 8,
            "answers": [
              {
                "id": "tb1_h2_q9_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb1_h2_q9_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_h2_q10",
            "question_text": "Herr Yassin kennt den neuen Raum bereits gut.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es wird nicht gesagt, dass er den Raum kennt; es ist ein anderer Raum als sonst.",
            "order_index": 9,
            "answers": [
              {
                "id": "tb1_h2_q10_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb1_h2_q10_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ],
        "audio_url": "/audio/test_telc_b1_beruf__hoeren2.mp3"
      },
      {
        "key": "hoeren3",
        "name": "Hörverstehen — Teil 3 (Selektives Verstehen)",
        "type": "listening",
        "official_duration_minutes": 30,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص الإعلان كما لو كنت تسمعه، ثم حدد صحة الجمل.",
        "passage": "Durchsage in der Kantine:\n\"Liebe Kolleginnen und Kollegen, ab morgen wird die Kantine wegen Renovierungsarbeiten für zwei Wochen geschlossen. In dieser Zeit steht ein Foodtruck auf dem Parkplatz zur Verfügung. Die Preise bleiben unverändert. Wir bitten um Ihr Verständnis.\"",
        "items": [
          {
            "id": "tb1_h3_q1",
            "question_text": "Die Kantine wird für zwei Wochen geschlossen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Durchsage nennt genau diesen Zeitraum.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb1_h3_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb1_h3_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_h3_q2",
            "question_text": "Der Grund für die Schließung sind Renovierungsarbeiten.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Durchsage nennt Renovierungsarbeiten als Grund.",
            "order_index": 1,
            "answers": [
              {
                "id": "tb1_h3_q2_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb1_h3_q2_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb1_h3_q3",
            "question_text": "Während der Schließung gibt es gar kein Essen im Haus.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Ein Foodtruck steht auf dem Parkplatz zur Verfügung.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb1_h3_q3_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb1_h3_q3_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "tb1_h3_q4",
            "question_text": "Die Preise werden während dieser Zeit erhöht.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Preise bleiben laut Durchsage unverändert.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb1_h3_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb1_h3_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "tb1_h3_q5",
            "question_text": "Die Schließung beginnt sofort, ab heute.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie beginnt ab morgen, nicht ab heute.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb1_h3_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb1_h3_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ],
        "audio_url": "/audio/test_telc_b1_beruf__hoeren3.mp3"
      }
    ],
    "writing": {
      "name": "Schriftlicher Ausdruck (تدريب غير مُقيَّم)",
      "official_duration_minutes": 30,
      "instructions": "في الاختبار الرسمي، تكتب رسالة أو بريدًا إلكترونيًا بناءً على 4 نقاط إرشادية. هذا تدريب ذاتي غير مُقيَّم آليًا.",
      "prompt": "Schreiben Sie eine E-Mail an einen Kollegen / eine Kollegin (ca. 80 Wörter). Gehen Sie auf folgende Punkte ein:\n- Erklären Sie, dass Sie morgen später ins Büro kommen.\n- Nennen Sie den Grund.\n- Bitten Sie um Vertretung bei einem Termin.\n- Bedanken Sie sich im Voraus.",
      "sample_answer": "Liebe Frau Amrani,\n\nich wollte Ihnen kurz Bescheid geben, dass ich morgen erst gegen 11 Uhr ins Büro kommen kann, da ich einen Arzttermin habe.\n\nKönnten Sie bitte in der Zwischenzeit meinen Termin mit dem Lieferanten um 9:30 Uhr übernehmen? Alle Unterlagen dazu liegen auf meinem Schreibtisch.\n\nVielen Dank im Voraus für Ihre Hilfe!\n\nMit freundlichen Grüßen\nKarim"
    }
  },
  "test_telc_b2_beruf": {
    "sections": [
      {
        "key": "lese1",
        "name": "Leseverstehen — Teil 1 (Globalverstehen)",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "Ordnen Sie jedem Absatz die passende Überschrift zu.",
        "passage": "Absätze:\n1. Immer mehr Unternehmen setzen auf digitale Tools, um Meetings effizienter zu gestalten und Reisezeiten zu reduzieren.\n2. Fachkräftemangel zwingt viele Firmen dazu, ihre Ausbildungsprogramme deutlich auszubauen.\n3. Eine aktuelle Umfrage zeigt, dass flexible Arbeitszeitmodelle die Mitarbeiterbindung erheblich verbessern.\n4. Cyberangriffe auf mittelständische Unternehmen haben in den letzten zwei Jahren stark zugenommen.\n5. Nachhaltige Lieferketten werden für Kunden zu einem immer wichtigeren Auswahlkriterium.\n\nÜberschriften:\nA) Ausbildung als Lösung gegen Personalmangel\nB) Digitalisierung verändert Meetingkultur\nC) Flexibilität stärkt die Bindung ans Unternehmen\nD) Wachsende Bedrohung durch Cyberkriminalität\nE) Nachhaltigkeit als Verkaufsargument\nF) Neue Steuervorschriften für Betriebe",
        "items": [
          {
            "id": "tb2_l1_q1",
            "question_text": "Welche Überschrift passt zu Absatz 1?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Absatz 1 passt zu B) Digitalisierung verändert Meetingkultur.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb2_l1_q1_a1",
                "answer_text": "A) Ausbildung als Lösung gegen Personalmangel",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q1_a2",
                "answer_text": "B) Digitalisierung verändert Meetingkultur",
                "is_correct": true
              },
              {
                "id": "tb2_l1_q1_a3",
                "answer_text": "C) Flexibilität stärkt die Bindung ans Unternehmen",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q1_a4",
                "answer_text": "D) Wachsende Bedrohung durch Cyberkriminalität",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q1_a5",
                "answer_text": "E) Nachhaltigkeit als Verkaufsargument",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q1_a6",
                "answer_text": "F) Neue Steuervorschriften für Betriebe",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l1_q2",
            "question_text": "Welche Überschrift passt zu Absatz 2?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Absatz 2 passt zu A) Ausbildung als Lösung gegen Personalmangel.",
            "order_index": 1,
            "answers": [
              {
                "id": "tb2_l1_q2_a1",
                "answer_text": "A) Ausbildung als Lösung gegen Personalmangel",
                "is_correct": true
              },
              {
                "id": "tb2_l1_q2_a2",
                "answer_text": "B) Digitalisierung verändert Meetingkultur",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q2_a3",
                "answer_text": "C) Flexibilität stärkt die Bindung ans Unternehmen",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q2_a4",
                "answer_text": "D) Wachsende Bedrohung durch Cyberkriminalität",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q2_a5",
                "answer_text": "E) Nachhaltigkeit als Verkaufsargument",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q2_a6",
                "answer_text": "F) Neue Steuervorschriften für Betriebe",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l1_q3",
            "question_text": "Welche Überschrift passt zu Absatz 3?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Absatz 3 passt zu C) Flexibilität stärkt die Bindung ans Unternehmen.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb2_l1_q3_a1",
                "answer_text": "A) Ausbildung als Lösung gegen Personalmangel",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q3_a2",
                "answer_text": "B) Digitalisierung verändert Meetingkultur",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q3_a3",
                "answer_text": "C) Flexibilität stärkt die Bindung ans Unternehmen",
                "is_correct": true
              },
              {
                "id": "tb2_l1_q3_a4",
                "answer_text": "D) Wachsende Bedrohung durch Cyberkriminalität",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q3_a5",
                "answer_text": "E) Nachhaltigkeit als Verkaufsargument",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q3_a6",
                "answer_text": "F) Neue Steuervorschriften für Betriebe",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l1_q4",
            "question_text": "Welche Überschrift passt zu Absatz 4?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Absatz 4 passt zu D) Wachsende Bedrohung durch Cyberkriminalität.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb2_l1_q4_a1",
                "answer_text": "A) Ausbildung als Lösung gegen Personalmangel",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q4_a2",
                "answer_text": "B) Digitalisierung verändert Meetingkultur",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q4_a3",
                "answer_text": "C) Flexibilität stärkt die Bindung ans Unternehmen",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q4_a4",
                "answer_text": "D) Wachsende Bedrohung durch Cyberkriminalität",
                "is_correct": true
              },
              {
                "id": "tb2_l1_q4_a5",
                "answer_text": "E) Nachhaltigkeit als Verkaufsargument",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q4_a6",
                "answer_text": "F) Neue Steuervorschriften für Betriebe",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l1_q5",
            "question_text": "Welche Überschrift passt zu Absatz 5?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Absatz 5 passt zu E) Nachhaltigkeit als Verkaufsargument.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb2_l1_q5_a1",
                "answer_text": "A) Ausbildung als Lösung gegen Personalmangel",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q5_a2",
                "answer_text": "B) Digitalisierung verändert Meetingkultur",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q5_a3",
                "answer_text": "C) Flexibilität stärkt die Bindung ans Unternehmen",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q5_a4",
                "answer_text": "D) Wachsende Bedrohung durch Cyberkriminalität",
                "is_correct": false
              },
              {
                "id": "tb2_l1_q5_a5",
                "answer_text": "E) Nachhaltigkeit als Verkaufsargument",
                "is_correct": true
              },
              {
                "id": "tb2_l1_q5_a6",
                "answer_text": "F) Neue Steuervorschriften für Betriebe",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "lese2",
        "name": "Leseverstehen — Teil 2 (Detailverstehen)",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "Lesen Sie den Artikel und beantworten Sie die Fragen.",
        "passage": "Digitalisierung im Mittelstand\n\nViele mittelständische Unternehmen zögern noch, in digitale Prozesse zu investieren, obwohl Studien zeigen, dass digitalisierte Betriebe im Schnitt produktiver sind. Als Hauptgründe für das Zögern nennen Geschäftsführer fehlendes Fachpersonal und hohe Anfangsinvestitionen. Experten empfehlen daher, mit kleinen, klar abgegrenzten Projekten zu beginnen, statt die gesamte Firma auf einmal umzustellen. Eine begleitende Studie zeigt zudem, dass Unternehmen, die externe Berater einbeziehen, im Schnitt schneller Ergebnisse erzielen als jene, die den Prozess komplett intern steuern.",
        "items": [
          {
            "id": "tb2_l2_q1",
            "question_text": "Warum zögern viele Mittelständler laut Text?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau diese beiden Gründe.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb2_l2_q1_a1",
                "answer_text": "Wegen fehlendem Fachpersonal und hohen Investitionskosten.",
                "is_correct": true
              },
              {
                "id": "tb2_l2_q1_a2",
                "answer_text": "Weil die Digitalisierung gesetzlich verboten ist.",
                "is_correct": false
              },
              {
                "id": "tb2_l2_q1_a3",
                "answer_text": "Weil sie keine Kunden haben.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l2_q2",
            "question_text": "Was empfehlen Experten?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau diese Empfehlung.",
            "order_index": 1,
            "answers": [
              {
                "id": "tb2_l2_q2_a1",
                "answer_text": "Mit kleinen, klar abgegrenzten Projekten zu beginnen.",
                "is_correct": true
              },
              {
                "id": "tb2_l2_q2_a2",
                "answer_text": "Sofort die gesamte Firma umzustellen.",
                "is_correct": false
              },
              {
                "id": "tb2_l2_q2_a3",
                "answer_text": "Auf Digitalisierung ganz zu verzichten.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l2_q3",
            "question_text": "Was zeigen Studien laut Text?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text sagt das explizit im ersten Satz.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb2_l2_q3_a1",
                "answer_text": "Digitalisierte Betriebe sind im Schnitt produktiver.",
                "is_correct": true
              },
              {
                "id": "tb2_l2_q3_a2",
                "answer_text": "Digitalisierung senkt die Produktivität.",
                "is_correct": false
              },
              {
                "id": "tb2_l2_q3_a3",
                "answer_text": "Digitalisierung hat keinen Effekt.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l2_q4",
            "question_text": "Alle mittelständischen Unternehmen haben bereits vollständig digitalisiert.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt, viele zögern noch mit der Investition.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb2_l2_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb2_l2_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "tb2_l2_q5",
            "question_text": "Was zeigt die begleitende Studie?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der letzte Satz nennt genau diesen Befund.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb2_l2_q5_a1",
                "answer_text": "Unternehmen mit externen Beratern erzielen schneller Ergebnisse.",
                "is_correct": true
              },
              {
                "id": "tb2_l2_q5_a2",
                "answer_text": "Externe Berater verlangsamen den Prozess.",
                "is_correct": false
              },
              {
                "id": "tb2_l2_q5_a3",
                "answer_text": "Interne Steuerung ist immer schneller.",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "lese3",
        "name": "Leseverstehen — Teil 3 (Selektives Verstehen)",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "Ordnen Sie jedem Unternehmensprofil den passenden Dienstleister zu.",
        "passage": "Unternehmensprofile:\n1. Eine Firma sucht einen Anbieter für Cloud-Speicherlösungen.\n2. Ein Start-up benötigt Hilfe bei der Gestaltung des Firmenlogos.\n3. Ein Unternehmen möchte seine Mitarbeitenden in Projektmanagement schulen lassen.\n4. Eine Firma sucht einen Steuerberater für die Jahresabschlusserstellung.\n5. Ein Betrieb sucht einen Anbieter für Übersetzungsdienste Deutsch-Englisch.\n6. Ein Unternehmen benötigt eine neue Website mit Onlineshop.\n7. Eine Firma sucht einen Caterer für eine Firmenveranstaltung.\n8. Ein Betrieb sucht einen Sicherheitsdienst für das Firmengelände.\n9. Ein Unternehmen möchte seinen CO2-Fußabdruck berechnen lassen.\n10. Eine Firma sucht Unterstützung beim Recruiting neuer Fachkräfte.\n\nDienstleister:\nA) CloudSecure: Sichere Cloud-Speicherlösungen für Unternehmen.\nB) Designstudio Nova: Logo- und Markendesign für Start-ups.\nC) ProManage Academy: Schulungen im Projektmanagement.\nD) Steuerkanzlei Berger: Jahresabschlüsse und Steuerberatung.\nE) LinguaPro: Übersetzungen Deutsch-Englisch für Unternehmen.\nF) WebCraft: Website- und Onlineshop-Erstellung.\nG) EventCatering Plus: Catering für Firmenveranstaltungen.\nH) SecureGuard: Sicherheitsdienste für Firmengelände.\nI) GreenMetrics: Berechnung des CO2-Fußabdrucks für Unternehmen.\nJ) TalentFinder: Recruiting-Dienstleistungen für Fachkräfte.",
        "items": [
          {
            "id": "tb2_l3_q1",
            "question_text": "Welcher Dienstleister passt zu Profil 1?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 1 passt zu A.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb2_l3_q1_a1",
                "answer_text": "A) CloudSecure: Sichere Cloud-Speicherlösungen für Unternehmen.",
                "is_correct": true
              },
              {
                "id": "tb2_l3_q1_a2",
                "answer_text": "B) Designstudio Nova: Logo- und Markendesign für Start-ups.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q1_a3",
                "answer_text": "C) ProManage Academy: Schulungen im Projektmanagement.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q1_a4",
                "answer_text": "D) Steuerkanzlei Berger: Jahresabschlüsse und Steuerberatung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q1_a5",
                "answer_text": "E) LinguaPro: Übersetzungen Deutsch-Englisch für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q1_a6",
                "answer_text": "F) WebCraft: Website- und Onlineshop-Erstellung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q1_a7",
                "answer_text": "G) EventCatering Plus: Catering für Firmenveranstaltungen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q1_a8",
                "answer_text": "H) SecureGuard: Sicherheitsdienste für Firmengelände.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q1_a9",
                "answer_text": "I) GreenMetrics: Berechnung des CO2-Fußabdrucks für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q1_a10",
                "answer_text": "J) TalentFinder: Recruiting-Dienstleistungen für Fachkräfte.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l3_q2",
            "question_text": "Welcher Dienstleister passt zu Profil 2?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 2 passt zu B.",
            "order_index": 1,
            "answers": [
              {
                "id": "tb2_l3_q2_a1",
                "answer_text": "A) CloudSecure: Sichere Cloud-Speicherlösungen für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q2_a2",
                "answer_text": "B) Designstudio Nova: Logo- und Markendesign für Start-ups.",
                "is_correct": true
              },
              {
                "id": "tb2_l3_q2_a3",
                "answer_text": "C) ProManage Academy: Schulungen im Projektmanagement.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q2_a4",
                "answer_text": "D) Steuerkanzlei Berger: Jahresabschlüsse und Steuerberatung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q2_a5",
                "answer_text": "E) LinguaPro: Übersetzungen Deutsch-Englisch für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q2_a6",
                "answer_text": "F) WebCraft: Website- und Onlineshop-Erstellung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q2_a7",
                "answer_text": "G) EventCatering Plus: Catering für Firmenveranstaltungen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q2_a8",
                "answer_text": "H) SecureGuard: Sicherheitsdienste für Firmengelände.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q2_a9",
                "answer_text": "I) GreenMetrics: Berechnung des CO2-Fußabdrucks für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q2_a10",
                "answer_text": "J) TalentFinder: Recruiting-Dienstleistungen für Fachkräfte.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l3_q3",
            "question_text": "Welcher Dienstleister passt zu Profil 3?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 3 passt zu C.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb2_l3_q3_a1",
                "answer_text": "A) CloudSecure: Sichere Cloud-Speicherlösungen für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q3_a2",
                "answer_text": "B) Designstudio Nova: Logo- und Markendesign für Start-ups.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q3_a3",
                "answer_text": "C) ProManage Academy: Schulungen im Projektmanagement.",
                "is_correct": true
              },
              {
                "id": "tb2_l3_q3_a4",
                "answer_text": "D) Steuerkanzlei Berger: Jahresabschlüsse und Steuerberatung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q3_a5",
                "answer_text": "E) LinguaPro: Übersetzungen Deutsch-Englisch für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q3_a6",
                "answer_text": "F) WebCraft: Website- und Onlineshop-Erstellung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q3_a7",
                "answer_text": "G) EventCatering Plus: Catering für Firmenveranstaltungen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q3_a8",
                "answer_text": "H) SecureGuard: Sicherheitsdienste für Firmengelände.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q3_a9",
                "answer_text": "I) GreenMetrics: Berechnung des CO2-Fußabdrucks für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q3_a10",
                "answer_text": "J) TalentFinder: Recruiting-Dienstleistungen für Fachkräfte.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l3_q4",
            "question_text": "Welcher Dienstleister passt zu Profil 4?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 4 passt zu D.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb2_l3_q4_a1",
                "answer_text": "A) CloudSecure: Sichere Cloud-Speicherlösungen für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q4_a2",
                "answer_text": "B) Designstudio Nova: Logo- und Markendesign für Start-ups.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q4_a3",
                "answer_text": "C) ProManage Academy: Schulungen im Projektmanagement.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q4_a4",
                "answer_text": "D) Steuerkanzlei Berger: Jahresabschlüsse und Steuerberatung.",
                "is_correct": true
              },
              {
                "id": "tb2_l3_q4_a5",
                "answer_text": "E) LinguaPro: Übersetzungen Deutsch-Englisch für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q4_a6",
                "answer_text": "F) WebCraft: Website- und Onlineshop-Erstellung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q4_a7",
                "answer_text": "G) EventCatering Plus: Catering für Firmenveranstaltungen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q4_a8",
                "answer_text": "H) SecureGuard: Sicherheitsdienste für Firmengelände.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q4_a9",
                "answer_text": "I) GreenMetrics: Berechnung des CO2-Fußabdrucks für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q4_a10",
                "answer_text": "J) TalentFinder: Recruiting-Dienstleistungen für Fachkräfte.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l3_q5",
            "question_text": "Welcher Dienstleister passt zu Profil 5?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 5 passt zu E.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb2_l3_q5_a1",
                "answer_text": "A) CloudSecure: Sichere Cloud-Speicherlösungen für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q5_a2",
                "answer_text": "B) Designstudio Nova: Logo- und Markendesign für Start-ups.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q5_a3",
                "answer_text": "C) ProManage Academy: Schulungen im Projektmanagement.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q5_a4",
                "answer_text": "D) Steuerkanzlei Berger: Jahresabschlüsse und Steuerberatung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q5_a5",
                "answer_text": "E) LinguaPro: Übersetzungen Deutsch-Englisch für Unternehmen.",
                "is_correct": true
              },
              {
                "id": "tb2_l3_q5_a6",
                "answer_text": "F) WebCraft: Website- und Onlineshop-Erstellung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q5_a7",
                "answer_text": "G) EventCatering Plus: Catering für Firmenveranstaltungen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q5_a8",
                "answer_text": "H) SecureGuard: Sicherheitsdienste für Firmengelände.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q5_a9",
                "answer_text": "I) GreenMetrics: Berechnung des CO2-Fußabdrucks für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q5_a10",
                "answer_text": "J) TalentFinder: Recruiting-Dienstleistungen für Fachkräfte.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l3_q6",
            "question_text": "Welcher Dienstleister passt zu Profil 6?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 6 passt zu F.",
            "order_index": 5,
            "answers": [
              {
                "id": "tb2_l3_q6_a1",
                "answer_text": "A) CloudSecure: Sichere Cloud-Speicherlösungen für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q6_a2",
                "answer_text": "B) Designstudio Nova: Logo- und Markendesign für Start-ups.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q6_a3",
                "answer_text": "C) ProManage Academy: Schulungen im Projektmanagement.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q6_a4",
                "answer_text": "D) Steuerkanzlei Berger: Jahresabschlüsse und Steuerberatung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q6_a5",
                "answer_text": "E) LinguaPro: Übersetzungen Deutsch-Englisch für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q6_a6",
                "answer_text": "F) WebCraft: Website- und Onlineshop-Erstellung.",
                "is_correct": true
              },
              {
                "id": "tb2_l3_q6_a7",
                "answer_text": "G) EventCatering Plus: Catering für Firmenveranstaltungen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q6_a8",
                "answer_text": "H) SecureGuard: Sicherheitsdienste für Firmengelände.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q6_a9",
                "answer_text": "I) GreenMetrics: Berechnung des CO2-Fußabdrucks für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q6_a10",
                "answer_text": "J) TalentFinder: Recruiting-Dienstleistungen für Fachkräfte.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l3_q7",
            "question_text": "Welcher Dienstleister passt zu Profil 7?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 7 passt zu G.",
            "order_index": 6,
            "answers": [
              {
                "id": "tb2_l3_q7_a1",
                "answer_text": "A) CloudSecure: Sichere Cloud-Speicherlösungen für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q7_a2",
                "answer_text": "B) Designstudio Nova: Logo- und Markendesign für Start-ups.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q7_a3",
                "answer_text": "C) ProManage Academy: Schulungen im Projektmanagement.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q7_a4",
                "answer_text": "D) Steuerkanzlei Berger: Jahresabschlüsse und Steuerberatung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q7_a5",
                "answer_text": "E) LinguaPro: Übersetzungen Deutsch-Englisch für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q7_a6",
                "answer_text": "F) WebCraft: Website- und Onlineshop-Erstellung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q7_a7",
                "answer_text": "G) EventCatering Plus: Catering für Firmenveranstaltungen.",
                "is_correct": true
              },
              {
                "id": "tb2_l3_q7_a8",
                "answer_text": "H) SecureGuard: Sicherheitsdienste für Firmengelände.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q7_a9",
                "answer_text": "I) GreenMetrics: Berechnung des CO2-Fußabdrucks für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q7_a10",
                "answer_text": "J) TalentFinder: Recruiting-Dienstleistungen für Fachkräfte.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l3_q8",
            "question_text": "Welcher Dienstleister passt zu Profil 8?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 8 passt zu H.",
            "order_index": 7,
            "answers": [
              {
                "id": "tb2_l3_q8_a1",
                "answer_text": "A) CloudSecure: Sichere Cloud-Speicherlösungen für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q8_a2",
                "answer_text": "B) Designstudio Nova: Logo- und Markendesign für Start-ups.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q8_a3",
                "answer_text": "C) ProManage Academy: Schulungen im Projektmanagement.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q8_a4",
                "answer_text": "D) Steuerkanzlei Berger: Jahresabschlüsse und Steuerberatung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q8_a5",
                "answer_text": "E) LinguaPro: Übersetzungen Deutsch-Englisch für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q8_a6",
                "answer_text": "F) WebCraft: Website- und Onlineshop-Erstellung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q8_a7",
                "answer_text": "G) EventCatering Plus: Catering für Firmenveranstaltungen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q8_a8",
                "answer_text": "H) SecureGuard: Sicherheitsdienste für Firmengelände.",
                "is_correct": true
              },
              {
                "id": "tb2_l3_q8_a9",
                "answer_text": "I) GreenMetrics: Berechnung des CO2-Fußabdrucks für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q8_a10",
                "answer_text": "J) TalentFinder: Recruiting-Dienstleistungen für Fachkräfte.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l3_q9",
            "question_text": "Welcher Dienstleister passt zu Profil 9?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 9 passt zu I.",
            "order_index": 8,
            "answers": [
              {
                "id": "tb2_l3_q9_a1",
                "answer_text": "A) CloudSecure: Sichere Cloud-Speicherlösungen für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q9_a2",
                "answer_text": "B) Designstudio Nova: Logo- und Markendesign für Start-ups.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q9_a3",
                "answer_text": "C) ProManage Academy: Schulungen im Projektmanagement.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q9_a4",
                "answer_text": "D) Steuerkanzlei Berger: Jahresabschlüsse und Steuerberatung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q9_a5",
                "answer_text": "E) LinguaPro: Übersetzungen Deutsch-Englisch für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q9_a6",
                "answer_text": "F) WebCraft: Website- und Onlineshop-Erstellung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q9_a7",
                "answer_text": "G) EventCatering Plus: Catering für Firmenveranstaltungen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q9_a8",
                "answer_text": "H) SecureGuard: Sicherheitsdienste für Firmengelände.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q9_a9",
                "answer_text": "I) GreenMetrics: Berechnung des CO2-Fußabdrucks für Unternehmen.",
                "is_correct": true
              },
              {
                "id": "tb2_l3_q9_a10",
                "answer_text": "J) TalentFinder: Recruiting-Dienstleistungen für Fachkräfte.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_l3_q10",
            "question_text": "Welcher Dienstleister passt zu Profil 10?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Profil 10 passt zu J.",
            "order_index": 9,
            "answers": [
              {
                "id": "tb2_l3_q10_a1",
                "answer_text": "A) CloudSecure: Sichere Cloud-Speicherlösungen für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q10_a2",
                "answer_text": "B) Designstudio Nova: Logo- und Markendesign für Start-ups.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q10_a3",
                "answer_text": "C) ProManage Academy: Schulungen im Projektmanagement.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q10_a4",
                "answer_text": "D) Steuerkanzlei Berger: Jahresabschlüsse und Steuerberatung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q10_a5",
                "answer_text": "E) LinguaPro: Übersetzungen Deutsch-Englisch für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q10_a6",
                "answer_text": "F) WebCraft: Website- und Onlineshop-Erstellung.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q10_a7",
                "answer_text": "G) EventCatering Plus: Catering für Firmenveranstaltungen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q10_a8",
                "answer_text": "H) SecureGuard: Sicherheitsdienste für Firmengelände.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q10_a9",
                "answer_text": "I) GreenMetrics: Berechnung des CO2-Fußabdrucks für Unternehmen.",
                "is_correct": false
              },
              {
                "id": "tb2_l3_q10_a10",
                "answer_text": "J) TalentFinder: Recruiting-Dienstleistungen für Fachkräfte.",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "sprachbausteine1",
        "name": "Sprachbausteine — Teil 1",
        "type": "language",
        "official_duration_minutes": 90,
        "instructions": "Wählen Sie die richtige Lösung.",
        "passage": null,
        "items": [
          {
            "id": "tb2_sb1_q1",
            "question_text": "Die Entscheidung wurde ___ des Vorstands getroffen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"seitens\" + Genitiv ist eine formelle Präposition für \"von Seiten\".",
            "order_index": 0,
            "answers": [
              {
                "id": "tb2_sb1_q1_a1",
                "answer_text": "seitens",
                "is_correct": true
              },
              {
                "id": "tb2_sb1_q1_a2",
                "answer_text": "wegen",
                "is_correct": false
              },
              {
                "id": "tb2_sb1_q1_a3",
                "answer_text": "trotz",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb1_q2",
            "question_text": "___ der schwierigen Marktlage konnte das Unternehmen wachsen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"Trotz\" drückt einen Gegensatz aus.",
            "order_index": 1,
            "answers": [
              {
                "id": "tb2_sb1_q2_a1",
                "answer_text": "Trotz",
                "is_correct": true
              },
              {
                "id": "tb2_sb1_q2_a2",
                "answer_text": "Wegen",
                "is_correct": false
              },
              {
                "id": "tb2_sb1_q2_a3",
                "answer_text": "Aufgrund",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb1_q3",
            "question_text": "Die Berichte müssen ___ Ende des Quartals eingereicht werden.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"bis spätestens\" nennt eine Frist.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb2_sb1_q3_a1",
                "answer_text": "bis spätestens",
                "is_correct": true
              },
              {
                "id": "tb2_sb1_q3_a2",
                "answer_text": "seit",
                "is_correct": false
              },
              {
                "id": "tb2_sb1_q3_a3",
                "answer_text": "ab",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb1_q4",
            "question_text": "Der Vorschlag wurde vom Team einstimmig ___.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Partizip II nach \"wurde\" (Passiv).",
            "order_index": 3,
            "answers": [
              {
                "id": "tb2_sb1_q4_a1",
                "answer_text": "angenommen",
                "is_correct": true
              },
              {
                "id": "tb2_sb1_q4_a2",
                "answer_text": "annehmen",
                "is_correct": false
              },
              {
                "id": "tb2_sb1_q4_a3",
                "answer_text": "annimmt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb1_q5",
            "question_text": "Man geht davon ___, dass die Zahlen steigen werden.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"davon ausgehen, dass...\" ist die feste Wendung.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb2_sb1_q5_a1",
                "answer_text": "aus",
                "is_correct": true
              },
              {
                "id": "tb2_sb1_q5_a2",
                "answer_text": "auf",
                "is_correct": false
              },
              {
                "id": "tb2_sb1_q5_a3",
                "answer_text": "an",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb1_q6",
            "question_text": "Die Firma haftet nicht ___ Schäden durch höhere Gewalt.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"haften für\" + Akkusativ.",
            "order_index": 5,
            "answers": [
              {
                "id": "tb2_sb1_q6_a1",
                "answer_text": "für",
                "is_correct": true
              },
              {
                "id": "tb2_sb1_q6_a2",
                "answer_text": "gegen",
                "is_correct": false
              },
              {
                "id": "tb2_sb1_q6_a3",
                "answer_text": "über",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb1_q7",
            "question_text": "___ Rücksprache mit der Geschäftsführung wird das Budget erhöht.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"nach Rücksprache mit\" ist die feste Wendung.",
            "order_index": 6,
            "answers": [
              {
                "id": "tb2_sb1_q7_a1",
                "answer_text": "Nach",
                "is_correct": true
              },
              {
                "id": "tb2_sb1_q7_a2",
                "answer_text": "Bei",
                "is_correct": false
              },
              {
                "id": "tb2_sb1_q7_a3",
                "answer_text": "Zu",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb1_q8",
            "question_text": "Der Vertrag tritt ___ Unterzeichnung beider Parteien in Kraft.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"mit Unterzeichnung\" beschreibt den Zeitpunkt des Inkrafttretens.",
            "order_index": 7,
            "answers": [
              {
                "id": "tb2_sb1_q8_a1",
                "answer_text": "mit",
                "is_correct": true
              },
              {
                "id": "tb2_sb1_q8_a2",
                "answer_text": "durch",
                "is_correct": false
              },
              {
                "id": "tb2_sb1_q8_a3",
                "answer_text": "bei",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb1_q9",
            "question_text": "Die Abteilung wurde beauftragt, den Prozess zu ___.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Infinitiv nach \"beauftragt, ... zu\".",
            "order_index": 8,
            "answers": [
              {
                "id": "tb2_sb1_q9_a1",
                "answer_text": "optimieren",
                "is_correct": true
              },
              {
                "id": "tb2_sb1_q9_a2",
                "answer_text": "Optimierung",
                "is_correct": false
              },
              {
                "id": "tb2_sb1_q9_a3",
                "answer_text": "optimiert",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb1_q10",
            "question_text": "___ eines internen Fehlers verzögerte sich die Lieferung.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"infolge\" + Genitiv nennt die Ursache einer Verzögerung.",
            "order_index": 9,
            "answers": [
              {
                "id": "tb2_sb1_q10_a1",
                "answer_text": "Infolge",
                "is_correct": true
              },
              {
                "id": "tb2_sb1_q10_a2",
                "answer_text": "Statt",
                "is_correct": false
              },
              {
                "id": "tb2_sb1_q10_a3",
                "answer_text": "Außer",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "sprachbausteine2",
        "name": "Sprachbausteine — Teil 2 (Zuordnung)",
        "type": "language",
        "official_duration_minutes": 90,
        "instructions": "Ordnen Sie jeder formellen Wendung die passende Bedeutung zu.",
        "passage": "Formelle Wendungen:\n1. unter Berücksichtigung der aktuellen Lage\n2. im Hinblick auf die kommenden Verhandlungen\n3. vorbehaltlich der Zustimmung des Vorstands\n4. im Rahmen des vereinbarten Budgets\n5. unter der Voraussetzung, dass alle Fristen eingehalten werden\n6. in Anbetracht der gestiegenen Kosten\n7. im Zuge der Umstrukturierung\n8. unbeschadet etwaiger Ansprüche\n9. in Abstimmung mit der Personalabteilung\n10. vorausgesetzt, die Qualität bleibt gleich\n\nBedeutungen:\nA) unter Beachtung der jetzigen Situation\nB) mit Blick auf zukünftige Gespräche\nC) abhängig von einer späteren Genehmigung\nD) innerhalb der festgelegten Finanzmittel\nE) nur wenn alle Termine eingehalten werden\nF) wegen der höheren Kosten\nG) während der Reorganisation\nH) ohne bestehende Rechte zu beeinträchtigen\nI) nach Absprache mit der Personalabteilung\nJ) nur wenn die Qualität unverändert bleibt",
        "items": [
          {
            "id": "tb2_sb2_q1",
            "question_text": "Was bedeutet Wendung 1?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Wendung 1 entspricht Bedeutung A.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb2_sb2_q1_a1",
                "answer_text": "A) unter Beachtung der jetzigen Situation",
                "is_correct": true
              },
              {
                "id": "tb2_sb2_q1_a2",
                "answer_text": "B) mit Blick auf zukünftige Gespräche",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q1_a3",
                "answer_text": "C) abhängig von einer späteren Genehmigung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q1_a4",
                "answer_text": "D) innerhalb der festgelegten Finanzmittel",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q1_a5",
                "answer_text": "E) nur wenn alle Termine eingehalten werden",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q1_a6",
                "answer_text": "F) wegen der höheren Kosten",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q1_a7",
                "answer_text": "G) während der Reorganisation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q1_a8",
                "answer_text": "H) ohne bestehende Rechte zu beeinträchtigen",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q1_a9",
                "answer_text": "I) nach Absprache mit der Personalabteilung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q1_a10",
                "answer_text": "J) nur wenn die Qualität unverändert bleibt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb2_q2",
            "question_text": "Was bedeutet Wendung 2?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Wendung 2 entspricht Bedeutung B.",
            "order_index": 1,
            "answers": [
              {
                "id": "tb2_sb2_q2_a1",
                "answer_text": "A) unter Beachtung der jetzigen Situation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q2_a2",
                "answer_text": "B) mit Blick auf zukünftige Gespräche",
                "is_correct": true
              },
              {
                "id": "tb2_sb2_q2_a3",
                "answer_text": "C) abhängig von einer späteren Genehmigung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q2_a4",
                "answer_text": "D) innerhalb der festgelegten Finanzmittel",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q2_a5",
                "answer_text": "E) nur wenn alle Termine eingehalten werden",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q2_a6",
                "answer_text": "F) wegen der höheren Kosten",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q2_a7",
                "answer_text": "G) während der Reorganisation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q2_a8",
                "answer_text": "H) ohne bestehende Rechte zu beeinträchtigen",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q2_a9",
                "answer_text": "I) nach Absprache mit der Personalabteilung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q2_a10",
                "answer_text": "J) nur wenn die Qualität unverändert bleibt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb2_q3",
            "question_text": "Was bedeutet Wendung 3?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Wendung 3 entspricht Bedeutung C.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb2_sb2_q3_a1",
                "answer_text": "A) unter Beachtung der jetzigen Situation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q3_a2",
                "answer_text": "B) mit Blick auf zukünftige Gespräche",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q3_a3",
                "answer_text": "C) abhängig von einer späteren Genehmigung",
                "is_correct": true
              },
              {
                "id": "tb2_sb2_q3_a4",
                "answer_text": "D) innerhalb der festgelegten Finanzmittel",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q3_a5",
                "answer_text": "E) nur wenn alle Termine eingehalten werden",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q3_a6",
                "answer_text": "F) wegen der höheren Kosten",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q3_a7",
                "answer_text": "G) während der Reorganisation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q3_a8",
                "answer_text": "H) ohne bestehende Rechte zu beeinträchtigen",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q3_a9",
                "answer_text": "I) nach Absprache mit der Personalabteilung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q3_a10",
                "answer_text": "J) nur wenn die Qualität unverändert bleibt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb2_q4",
            "question_text": "Was bedeutet Wendung 4?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Wendung 4 entspricht Bedeutung D.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb2_sb2_q4_a1",
                "answer_text": "A) unter Beachtung der jetzigen Situation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q4_a2",
                "answer_text": "B) mit Blick auf zukünftige Gespräche",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q4_a3",
                "answer_text": "C) abhängig von einer späteren Genehmigung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q4_a4",
                "answer_text": "D) innerhalb der festgelegten Finanzmittel",
                "is_correct": true
              },
              {
                "id": "tb2_sb2_q4_a5",
                "answer_text": "E) nur wenn alle Termine eingehalten werden",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q4_a6",
                "answer_text": "F) wegen der höheren Kosten",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q4_a7",
                "answer_text": "G) während der Reorganisation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q4_a8",
                "answer_text": "H) ohne bestehende Rechte zu beeinträchtigen",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q4_a9",
                "answer_text": "I) nach Absprache mit der Personalabteilung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q4_a10",
                "answer_text": "J) nur wenn die Qualität unverändert bleibt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb2_q5",
            "question_text": "Was bedeutet Wendung 5?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Wendung 5 entspricht Bedeutung E.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb2_sb2_q5_a1",
                "answer_text": "A) unter Beachtung der jetzigen Situation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q5_a2",
                "answer_text": "B) mit Blick auf zukünftige Gespräche",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q5_a3",
                "answer_text": "C) abhängig von einer späteren Genehmigung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q5_a4",
                "answer_text": "D) innerhalb der festgelegten Finanzmittel",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q5_a5",
                "answer_text": "E) nur wenn alle Termine eingehalten werden",
                "is_correct": true
              },
              {
                "id": "tb2_sb2_q5_a6",
                "answer_text": "F) wegen der höheren Kosten",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q5_a7",
                "answer_text": "G) während der Reorganisation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q5_a8",
                "answer_text": "H) ohne bestehende Rechte zu beeinträchtigen",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q5_a9",
                "answer_text": "I) nach Absprache mit der Personalabteilung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q5_a10",
                "answer_text": "J) nur wenn die Qualität unverändert bleibt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb2_q6",
            "question_text": "Was bedeutet Wendung 6?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Wendung 6 entspricht Bedeutung F.",
            "order_index": 5,
            "answers": [
              {
                "id": "tb2_sb2_q6_a1",
                "answer_text": "A) unter Beachtung der jetzigen Situation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q6_a2",
                "answer_text": "B) mit Blick auf zukünftige Gespräche",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q6_a3",
                "answer_text": "C) abhängig von einer späteren Genehmigung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q6_a4",
                "answer_text": "D) innerhalb der festgelegten Finanzmittel",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q6_a5",
                "answer_text": "E) nur wenn alle Termine eingehalten werden",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q6_a6",
                "answer_text": "F) wegen der höheren Kosten",
                "is_correct": true
              },
              {
                "id": "tb2_sb2_q6_a7",
                "answer_text": "G) während der Reorganisation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q6_a8",
                "answer_text": "H) ohne bestehende Rechte zu beeinträchtigen",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q6_a9",
                "answer_text": "I) nach Absprache mit der Personalabteilung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q6_a10",
                "answer_text": "J) nur wenn die Qualität unverändert bleibt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb2_q7",
            "question_text": "Was bedeutet Wendung 7?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Wendung 7 entspricht Bedeutung G.",
            "order_index": 6,
            "answers": [
              {
                "id": "tb2_sb2_q7_a1",
                "answer_text": "A) unter Beachtung der jetzigen Situation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q7_a2",
                "answer_text": "B) mit Blick auf zukünftige Gespräche",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q7_a3",
                "answer_text": "C) abhängig von einer späteren Genehmigung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q7_a4",
                "answer_text": "D) innerhalb der festgelegten Finanzmittel",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q7_a5",
                "answer_text": "E) nur wenn alle Termine eingehalten werden",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q7_a6",
                "answer_text": "F) wegen der höheren Kosten",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q7_a7",
                "answer_text": "G) während der Reorganisation",
                "is_correct": true
              },
              {
                "id": "tb2_sb2_q7_a8",
                "answer_text": "H) ohne bestehende Rechte zu beeinträchtigen",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q7_a9",
                "answer_text": "I) nach Absprache mit der Personalabteilung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q7_a10",
                "answer_text": "J) nur wenn die Qualität unverändert bleibt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb2_q8",
            "question_text": "Was bedeutet Wendung 8?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Wendung 8 entspricht Bedeutung H.",
            "order_index": 7,
            "answers": [
              {
                "id": "tb2_sb2_q8_a1",
                "answer_text": "A) unter Beachtung der jetzigen Situation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q8_a2",
                "answer_text": "B) mit Blick auf zukünftige Gespräche",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q8_a3",
                "answer_text": "C) abhängig von einer späteren Genehmigung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q8_a4",
                "answer_text": "D) innerhalb der festgelegten Finanzmittel",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q8_a5",
                "answer_text": "E) nur wenn alle Termine eingehalten werden",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q8_a6",
                "answer_text": "F) wegen der höheren Kosten",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q8_a7",
                "answer_text": "G) während der Reorganisation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q8_a8",
                "answer_text": "H) ohne bestehende Rechte zu beeinträchtigen",
                "is_correct": true
              },
              {
                "id": "tb2_sb2_q8_a9",
                "answer_text": "I) nach Absprache mit der Personalabteilung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q8_a10",
                "answer_text": "J) nur wenn die Qualität unverändert bleibt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb2_q9",
            "question_text": "Was bedeutet Wendung 9?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Wendung 9 entspricht Bedeutung I.",
            "order_index": 8,
            "answers": [
              {
                "id": "tb2_sb2_q9_a1",
                "answer_text": "A) unter Beachtung der jetzigen Situation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q9_a2",
                "answer_text": "B) mit Blick auf zukünftige Gespräche",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q9_a3",
                "answer_text": "C) abhängig von einer späteren Genehmigung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q9_a4",
                "answer_text": "D) innerhalb der festgelegten Finanzmittel",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q9_a5",
                "answer_text": "E) nur wenn alle Termine eingehalten werden",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q9_a6",
                "answer_text": "F) wegen der höheren Kosten",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q9_a7",
                "answer_text": "G) während der Reorganisation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q9_a8",
                "answer_text": "H) ohne bestehende Rechte zu beeinträchtigen",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q9_a9",
                "answer_text": "I) nach Absprache mit der Personalabteilung",
                "is_correct": true
              },
              {
                "id": "tb2_sb2_q9_a10",
                "answer_text": "J) nur wenn die Qualität unverändert bleibt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_sb2_q10",
            "question_text": "Was bedeutet Wendung 10?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Wendung 10 entspricht Bedeutung J.",
            "order_index": 9,
            "answers": [
              {
                "id": "tb2_sb2_q10_a1",
                "answer_text": "A) unter Beachtung der jetzigen Situation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q10_a2",
                "answer_text": "B) mit Blick auf zukünftige Gespräche",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q10_a3",
                "answer_text": "C) abhängig von einer späteren Genehmigung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q10_a4",
                "answer_text": "D) innerhalb der festgelegten Finanzmittel",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q10_a5",
                "answer_text": "E) nur wenn alle Termine eingehalten werden",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q10_a6",
                "answer_text": "F) wegen der höheren Kosten",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q10_a7",
                "answer_text": "G) während der Reorganisation",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q10_a8",
                "answer_text": "H) ohne bestehende Rechte zu beeinträchtigen",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q10_a9",
                "answer_text": "I) nach Absprache mit der Personalabteilung",
                "is_correct": false
              },
              {
                "id": "tb2_sb2_q10_a10",
                "answer_text": "J) nur wenn die Qualität unverändert bleibt",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "hoeren1",
        "name": "Hörverstehen — Teil 1 (Globalverstehen)",
        "type": "listening",
        "official_duration_minutes": 25,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ النص كما لو كنت تسمعه، ثم حدد صحة الجمل.",
        "passage": "Ansage vor einer Telefonkonferenz:\n\"Willkommen zur heutigen Telefonkonferenz. Bitte stellen Sie Ihr Mikrofon auf stumm, wenn Sie nicht sprechen. Die Konferenz wird aufgezeichnet und im Anschluss allen Teilnehmenden per E-Mail zugesendet. Fragen können Sie jederzeit über die Chat-Funktion stellen.\"",
        "items": [
          {
            "id": "tb2_h1_q1",
            "question_text": "Man soll das Mikrofon stummschalten, wenn man nicht spricht.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Ansage bittet genau darum.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb2_h1_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb2_h1_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_h1_q2",
            "question_text": "Die Konferenz wird nicht aufgezeichnet.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Ansage sagt, sie wird aufgezeichnet.",
            "order_index": 1,
            "answers": [
              {
                "id": "tb2_h1_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb2_h1_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "tb2_h1_q3",
            "question_text": "Die Aufzeichnung wird per E-Mail verschickt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Ansage nennt genau das.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb2_h1_q3_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb2_h1_q3_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_h1_q4",
            "question_text": "Fragen können nur am Ende gestellt werden.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Fragen können jederzeit über den Chat gestellt werden.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb2_h1_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb2_h1_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "tb2_h1_q5",
            "question_text": "Die Chat-Funktion kann für Fragen genutzt werden.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Ansage erwähnt genau das.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb2_h1_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb2_h1_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_telc_b2_beruf__hoeren1.mp3"
      },
      {
        "key": "hoeren2",
        "name": "Hörverstehen — Teil 2 (Detailverstehen)",
        "type": "listening",
        "official_duration_minutes": 25,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص الاجتماع كما لو كنت تسمعه، ثم أجب عن الأسئلة.",
        "passage": "Ausschnitt aus einer Teambesprechung:\n\"Projektleiterin: Bevor wir zum nächsten Punkt kommen — der Launch wurde um zwei Wochen verschoben, weil die Testphase noch nicht abgeschlossen ist. Wir brauchen also bis Ende des Monats zusätzliche Ressourcen im QA-Team. Herr Voss, können Sie zwei weitere Tester organisieren?\nHerr Voss: Ich kann versuchen, jemanden aus dem Entwicklerteam abzuziehen, aber das würde andere Aufgaben verzögern.\nProjektleiterin: Verstanden. Dann sprechen wir am Freitag nochmal darüber, sobald wir die genauen Zahlen vom Kunden haben. Bitte bereiten Sie bis dahin eine Kostenschätzung vor.\"",
        "items": [
          {
            "id": "tb2_h2_q1",
            "question_text": "Warum wurde der Launch verschoben?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Projektleiterin nennt genau diesen Grund.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb2_h2_q1_a1",
                "answer_text": "Die Testphase ist noch nicht abgeschlossen.",
                "is_correct": true
              },
              {
                "id": "tb2_h2_q1_a2",
                "answer_text": "Es fehlt das Budget.",
                "is_correct": false
              },
              {
                "id": "tb2_h2_q1_a3",
                "answer_text": "Der Kunde hat abgesagt.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_h2_q2",
            "question_text": "Um wie viele Wochen wurde der Launch verschoben?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie sagt \"um zwei Wochen verschoben\".",
            "order_index": 1,
            "answers": [
              {
                "id": "tb2_h2_q2_a1",
                "answer_text": "Zwei Wochen",
                "is_correct": true
              },
              {
                "id": "tb2_h2_q2_a2",
                "answer_text": "Eine Woche",
                "is_correct": false
              },
              {
                "id": "tb2_h2_q2_a3",
                "answer_text": "Vier Wochen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_h2_q3",
            "question_text": "Was wird bis Ende des Monats benötigt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie nennt zusätzliche Ressourcen im QA-Team.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb2_h2_q3_a1",
                "answer_text": "Zusätzliche Ressourcen im QA-Team",
                "is_correct": true
              },
              {
                "id": "tb2_h2_q3_a2",
                "answer_text": "Ein neues Büro",
                "is_correct": false
              },
              {
                "id": "tb2_h2_q3_a3",
                "answer_text": "Ein neuer Kunde",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_h2_q4",
            "question_text": "Wer wird gebeten, weitere Tester zu organisieren?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Projektleiterin fragt direkt Herrn Voss.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb2_h2_q4_a1",
                "answer_text": "Herr Voss",
                "is_correct": true
              },
              {
                "id": "tb2_h2_q4_a2",
                "answer_text": "Die Projektleiterin selbst",
                "is_correct": false
              },
              {
                "id": "tb2_h2_q4_a3",
                "answer_text": "Der Kunde",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_h2_q5",
            "question_text": "Herr Voss kann problemlos zwei neue Tester einstellen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er sagt, er könnte jemanden abziehen, aber das würde andere Aufgaben verzögern.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb2_h2_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb2_h2_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "tb2_h2_q6",
            "question_text": "Was würde passieren, wenn Herr Voss jemanden abzieht?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Er sagt genau das.",
            "order_index": 5,
            "answers": [
              {
                "id": "tb2_h2_q6_a1",
                "answer_text": "Andere Aufgaben würden sich verzögern.",
                "is_correct": true
              },
              {
                "id": "tb2_h2_q6_a2",
                "answer_text": "Nichts würde sich ändern.",
                "is_correct": false
              },
              {
                "id": "tb2_h2_q6_a3",
                "answer_text": "Das Budget würde steigen.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_h2_q7",
            "question_text": "Wann sprechen sie erneut über das Thema?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Projektleiterin schlägt Freitag vor.",
            "order_index": 6,
            "answers": [
              {
                "id": "tb2_h2_q7_a1",
                "answer_text": "Am Freitag",
                "is_correct": true
              },
              {
                "id": "tb2_h2_q7_a2",
                "answer_text": "Am Montag",
                "is_correct": false
              },
              {
                "id": "tb2_h2_q7_a3",
                "answer_text": "In einem Monat",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_h2_q8",
            "question_text": "Worauf warten sie, bevor sie weiter entscheiden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie warten auf die Zahlen vom Kunden.",
            "order_index": 7,
            "answers": [
              {
                "id": "tb2_h2_q8_a1",
                "answer_text": "Auf genaue Zahlen vom Kunden",
                "is_correct": true
              },
              {
                "id": "tb2_h2_q8_a2",
                "answer_text": "Auf eine neue Software",
                "is_correct": false
              },
              {
                "id": "tb2_h2_q8_a3",
                "answer_text": "Auf eine Genehmigung der Geschäftsführung",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_h2_q9",
            "question_text": "Was soll Herr Voss bis Freitag vorbereiten?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Projektleiterin bittet um eine Kostenschätzung.",
            "order_index": 8,
            "answers": [
              {
                "id": "tb2_h2_q9_a1",
                "answer_text": "Eine Kostenschätzung",
                "is_correct": true
              },
              {
                "id": "tb2_h2_q9_a2",
                "answer_text": "Einen neuen Vertrag",
                "is_correct": false
              },
              {
                "id": "tb2_h2_q9_a3",
                "answer_text": "Eine Präsentation für den Kunden",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_h2_q10",
            "question_text": "Das Gespräch findet in einer Teambesprechung statt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Titel nennt genau das.",
            "order_index": 9,
            "answers": [
              {
                "id": "tb2_h2_q10_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb2_h2_q10_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_telc_b2_beruf__hoeren2.mp3"
      },
      {
        "key": "hoeren3",
        "name": "Hörverstehen — Teil 3 (Selektives Verstehen)",
        "type": "listening",
        "official_duration_minutes": 25,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص الإعلان كما لو كنت تسمعه، ثم حدد صحة الجمل.",
        "passage": "Durchsage im Empfangsbereich:\n\"Guten Tag und herzlich willkommen. Bitte melden Sie sich am Empfang an und tragen Sie sich in die Besucherliste ein. Besucherausweise sind gut sichtbar zu tragen und beim Verlassen des Gebäudes wieder abzugeben. Der Aufzug zu den Konferenzräumen befindet sich links neben dem Empfang.\"",
        "items": [
          {
            "id": "tb2_h3_q1",
            "question_text": "Besucher müssen sich am Empfang anmelden.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Durchsage bittet genau darum.",
            "order_index": 0,
            "answers": [
              {
                "id": "tb2_h3_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb2_h3_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_h3_q2",
            "question_text": "Eine Besucherliste ist nicht notwendig.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Man soll sich in die Besucherliste eintragen.",
            "order_index": 1,
            "answers": [
              {
                "id": "tb2_h3_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb2_h3_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "tb2_h3_q3",
            "question_text": "Besucherausweise müssen beim Verlassen abgegeben werden.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Durchsage nennt genau diese Regel.",
            "order_index": 2,
            "answers": [
              {
                "id": "tb2_h3_q3_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb2_h3_q3_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "tb2_h3_q4",
            "question_text": "Der Aufzug befindet sich rechts neben dem Empfang.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er befindet sich links neben dem Empfang.",
            "order_index": 3,
            "answers": [
              {
                "id": "tb2_h3_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "tb2_h3_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "tb2_h3_q5",
            "question_text": "Die Konferenzräume sind über den Aufzug erreichbar.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Durchsage nennt den Aufzug zu den Konferenzräumen.",
            "order_index": 4,
            "answers": [
              {
                "id": "tb2_h3_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "tb2_h3_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_telc_b2_beruf__hoeren3.mp3"
      }
    ],
    "writing": {
      "name": "Schriftlicher Ausdruck (تدريب غير مُقيَّم)",
      "official_duration_minutes": 30,
      "instructions": "في الاختبار الرسمي، تكتب رسالة رسمية بناءً على نقاط إرشادية. هذا تدريب ذاتي غير مُقيَّم آليًا.",
      "prompt": "Schreiben Sie eine formelle E-Mail an Ihre Vorgesetzte (ca. 100 Wörter), in der Sie sich über eine wiederholte Verspätung der Gehaltsabrechnung beschweren. Bleiben Sie höflich, aber klar in Ihrer Forderung.",
      "sample_answer": "Sehr geehrte Frau Nadal,\n\nich möchte Sie höflich darauf hinweisen, dass meine Gehaltsabrechnung bereits zum dritten Mal in Folge verspätet eingegangen ist. Dies hat mir in den letzten Wochen finanzielle Unannehmlichkeiten bereitet.\n\nIch bitte Sie daher, die Ursache dieser wiederholten Verzögerung zu prüfen und sicherzustellen, dass die kommenden Abrechnungen pünktlich erfolgen.\n\nFür ein kurzes Gespräch stehe ich gerne zur Verfügung.\n\nMit freundlichen Grüßen\nSofia Benali"
    }
  },
  "test_osd_b1": {
    "sections": [
      {
        "key": "lesen1",
        "name": "Lesen — Teil 1",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "اقرأ النص وحدد إن كانت الجمل التالية صحيحة أم خاطئة.",
        "passage": "Mein Leben in Wien\n\nIch bin vor einem Jahr aus beruflichen Gründen nach Wien gezogen. Zuerst habe ich in einem Studentenwohnheim gewohnt, aber jetzt habe ich eine eigene kleine Wohnung im 7. Bezirk. Am liebsten fahre ich mit der U-Bahn, weil sie in Wien sehr zuverlässig ist. Am Wochenende gehe ich oft auf den Naschmarkt, um frisches Gemüse zu kaufen. Im Sommer sitze ich gerne in einem der vielen Kaffeehäuser und beobachte die Menschen. Nächstes Jahr möchte ich vielleicht in einen größeren Bezirk umziehen, wenn ich eine bessere Stelle finde.",
        "items": [
          {
            "id": "ob1_l1_q1",
            "question_text": "Die Person ist aus privaten Gründen nach Wien gezogen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt \"aus beruflichen Gründen\".",
            "order_index": 0,
            "answers": [
              {
                "id": "ob1_l1_q1_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob1_l1_q1_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob1_l1_q2",
            "question_text": "Die Person wohnt jetzt in einer eigenen Wohnung.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt \"jetzt habe ich eine eigene kleine Wohnung\".",
            "order_index": 1,
            "answers": [
              {
                "id": "ob1_l1_q2_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob1_l1_q2_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l1_q3",
            "question_text": "Die Person fährt am liebsten mit dem Bus.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie fährt am liebsten mit der U-Bahn.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob1_l1_q3_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob1_l1_q3_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob1_l1_q4",
            "question_text": "Die Person kauft am Wochenende oft Gemüse auf dem Naschmarkt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt genau das.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob1_l1_q4_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob1_l1_q4_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l1_q5",
            "question_text": "Die Person sitzt im Sommer gerne in Kaffeehäusern.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text erwähnt genau das.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob1_l1_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob1_l1_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l1_q6",
            "question_text": "Die Person plant, für immer im 7. Bezirk zu bleiben.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie möchte vielleicht in einen größeren Bezirk umziehen.",
            "order_index": 5,
            "answers": [
              {
                "id": "ob1_l1_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob1_l1_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "lesen2",
        "name": "Lesen — Teil 2 (Zuordnung)",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "Ordnen Sie jeder Situation die passende Anzeige zu.",
        "passage": "Situationen:\n1. Jemand sucht einen Sportverein für Anfänger.\n2. Eine Familie sucht eine Kinderbetreuung am Nachmittag.\n3. Jemand möchte gebraucht ein Fahrrad kaufen.\n4. Jemand sucht einen Deutschkurs am Wochenende.\n5. Eine Person sucht eine Putzhilfe für die Wohnung.\n6. Jemand sucht einen Yoga-Kurs für Anfänger.\n\nAnzeigen:\nA) Nachmittagsbetreuung für Kinder von 6–10 Jahren, Mo–Fr, 14–17 Uhr.\nB) Tennisverein sucht neue Mitglieder, auch Anfänger willkommen.\nC) Gebrauchtes Fahrrad, guter Zustand, günstig abzugeben.\nD) Wochenendkurs Deutsch A2/B1, samstags 10–13 Uhr.\nE) Reinigungskraft für Privathaushalt gesucht, 2x pro Woche.\nF) Yoga für Einsteiger, dienstags 18 Uhr, erste Stunde kostenlos.",
        "items": [
          {
            "id": "ob1_l2_q1",
            "question_text": "Welche Anzeige passt zu Situation 1?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Situation 1 passt zu Anzeige B.",
            "order_index": 0,
            "answers": [
              {
                "id": "ob1_l2_q1_a1",
                "answer_text": "A) Nachmittagsbetreuung für Kinder von 6–10 Jahren, Mo–Fr, 14–17 Uhr.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q1_a2",
                "answer_text": "B) Tennisverein sucht neue Mitglieder, auch Anfänger willkommen.",
                "is_correct": true
              },
              {
                "id": "ob1_l2_q1_a3",
                "answer_text": "C) Gebrauchtes Fahrrad, guter Zustand, günstig abzugeben.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q1_a4",
                "answer_text": "D) Wochenendkurs Deutsch A2/B1, samstags 10–13 Uhr.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q1_a5",
                "answer_text": "E) Reinigungskraft für Privathaushalt gesucht, 2x pro Woche.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q1_a6",
                "answer_text": "F) Yoga für Einsteiger, dienstags 18 Uhr, erste Stunde kostenlos.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l2_q2",
            "question_text": "Welche Anzeige passt zu Situation 2?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Situation 2 passt zu Anzeige A.",
            "order_index": 1,
            "answers": [
              {
                "id": "ob1_l2_q2_a1",
                "answer_text": "A) Nachmittagsbetreuung für Kinder von 6–10 Jahren, Mo–Fr, 14–17 Uhr.",
                "is_correct": true
              },
              {
                "id": "ob1_l2_q2_a2",
                "answer_text": "B) Tennisverein sucht neue Mitglieder, auch Anfänger willkommen.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q2_a3",
                "answer_text": "C) Gebrauchtes Fahrrad, guter Zustand, günstig abzugeben.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q2_a4",
                "answer_text": "D) Wochenendkurs Deutsch A2/B1, samstags 10–13 Uhr.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q2_a5",
                "answer_text": "E) Reinigungskraft für Privathaushalt gesucht, 2x pro Woche.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q2_a6",
                "answer_text": "F) Yoga für Einsteiger, dienstags 18 Uhr, erste Stunde kostenlos.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l2_q3",
            "question_text": "Welche Anzeige passt zu Situation 3?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Situation 3 passt zu Anzeige C.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob1_l2_q3_a1",
                "answer_text": "A) Nachmittagsbetreuung für Kinder von 6–10 Jahren, Mo–Fr, 14–17 Uhr.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q3_a2",
                "answer_text": "B) Tennisverein sucht neue Mitglieder, auch Anfänger willkommen.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q3_a3",
                "answer_text": "C) Gebrauchtes Fahrrad, guter Zustand, günstig abzugeben.",
                "is_correct": true
              },
              {
                "id": "ob1_l2_q3_a4",
                "answer_text": "D) Wochenendkurs Deutsch A2/B1, samstags 10–13 Uhr.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q3_a5",
                "answer_text": "E) Reinigungskraft für Privathaushalt gesucht, 2x pro Woche.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q3_a6",
                "answer_text": "F) Yoga für Einsteiger, dienstags 18 Uhr, erste Stunde kostenlos.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l2_q4",
            "question_text": "Welche Anzeige passt zu Situation 4?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Situation 4 passt zu Anzeige D.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob1_l2_q4_a1",
                "answer_text": "A) Nachmittagsbetreuung für Kinder von 6–10 Jahren, Mo–Fr, 14–17 Uhr.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q4_a2",
                "answer_text": "B) Tennisverein sucht neue Mitglieder, auch Anfänger willkommen.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q4_a3",
                "answer_text": "C) Gebrauchtes Fahrrad, guter Zustand, günstig abzugeben.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q4_a4",
                "answer_text": "D) Wochenendkurs Deutsch A2/B1, samstags 10–13 Uhr.",
                "is_correct": true
              },
              {
                "id": "ob1_l2_q4_a5",
                "answer_text": "E) Reinigungskraft für Privathaushalt gesucht, 2x pro Woche.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q4_a6",
                "answer_text": "F) Yoga für Einsteiger, dienstags 18 Uhr, erste Stunde kostenlos.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l2_q5",
            "question_text": "Welche Anzeige passt zu Situation 5?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Situation 5 passt zu Anzeige E.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob1_l2_q5_a1",
                "answer_text": "A) Nachmittagsbetreuung für Kinder von 6–10 Jahren, Mo–Fr, 14–17 Uhr.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q5_a2",
                "answer_text": "B) Tennisverein sucht neue Mitglieder, auch Anfänger willkommen.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q5_a3",
                "answer_text": "C) Gebrauchtes Fahrrad, guter Zustand, günstig abzugeben.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q5_a4",
                "answer_text": "D) Wochenendkurs Deutsch A2/B1, samstags 10–13 Uhr.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q5_a5",
                "answer_text": "E) Reinigungskraft für Privathaushalt gesucht, 2x pro Woche.",
                "is_correct": true
              },
              {
                "id": "ob1_l2_q5_a6",
                "answer_text": "F) Yoga für Einsteiger, dienstags 18 Uhr, erste Stunde kostenlos.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l2_q6",
            "question_text": "Welche Anzeige passt zu Situation 6?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Situation 6 passt zu Anzeige F.",
            "order_index": 5,
            "answers": [
              {
                "id": "ob1_l2_q6_a1",
                "answer_text": "A) Nachmittagsbetreuung für Kinder von 6–10 Jahren, Mo–Fr, 14–17 Uhr.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q6_a2",
                "answer_text": "B) Tennisverein sucht neue Mitglieder, auch Anfänger willkommen.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q6_a3",
                "answer_text": "C) Gebrauchtes Fahrrad, guter Zustand, günstig abzugeben.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q6_a4",
                "answer_text": "D) Wochenendkurs Deutsch A2/B1, samstags 10–13 Uhr.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q6_a5",
                "answer_text": "E) Reinigungskraft für Privathaushalt gesucht, 2x pro Woche.",
                "is_correct": false
              },
              {
                "id": "ob1_l2_q6_a6",
                "answer_text": "F) Yoga für Einsteiger, dienstags 18 Uhr, erste Stunde kostenlos.",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "lesen3",
        "name": "Lesen — Teil 3",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "Lesen Sie den Text und beantworten Sie die Fragen.",
        "passage": "Öffentliche Verkehrsmittel in Wien\n\nDie Wiener Linien betreiben U-Bahn, Straßenbahn und Busse im gesamten Stadtgebiet. Eine Jahreskarte kostet aktuell 365 Euro, also genau einen Euro pro Tag. Kinder unter 6 Jahren fahren kostenlos. Die U-Bahn fährt an Wochenenden durchgehend die ganze Nacht, unter der Woche enden die Fahrten um etwa 0:30 Uhr, danach übernehmen Nachtbusse den Verkehr. Tickets können bequem über eine App gekauft werden, es gibt aber auch Automaten an jeder Station.",
        "items": [
          {
            "id": "ob1_l3_q1",
            "question_text": "Wie viel kostet die Jahreskarte?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau 365 Euro.",
            "order_index": 0,
            "answers": [
              {
                "id": "ob1_l3_q1_a1",
                "answer_text": "365 Euro",
                "is_correct": true
              },
              {
                "id": "ob1_l3_q1_a2",
                "answer_text": "300 Euro",
                "is_correct": false
              },
              {
                "id": "ob1_l3_q1_a3",
                "answer_text": "500 Euro",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l3_q2",
            "question_text": "Kinder unter 6 Jahren zahlen für die Fahrt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie fahren laut Text kostenlos.",
            "order_index": 1,
            "answers": [
              {
                "id": "ob1_l3_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob1_l3_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob1_l3_q3",
            "question_text": "Wann fährt die U-Bahn an Wochenenden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text sagt \"durchgehend die ganze Nacht\".",
            "order_index": 2,
            "answers": [
              {
                "id": "ob1_l3_q3_a1",
                "answer_text": "Durchgehend die ganze Nacht",
                "is_correct": true
              },
              {
                "id": "ob1_l3_q3_a2",
                "answer_text": "Nur bis Mitternacht",
                "is_correct": false
              },
              {
                "id": "ob1_l3_q3_a3",
                "answer_text": "Gar nicht nachts",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l3_q4",
            "question_text": "Was übernimmt unter der Woche nach 0:30 Uhr den Verkehr?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt Nachtbusse.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob1_l3_q4_a1",
                "answer_text": "Nachtbusse",
                "is_correct": true
              },
              {
                "id": "ob1_l3_q4_a2",
                "answer_text": "Taxis",
                "is_correct": false
              },
              {
                "id": "ob1_l3_q4_a3",
                "answer_text": "Straßenbahnen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l3_q5",
            "question_text": "Tickets können über eine App gekauft werden.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text erwähnt genau das.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob1_l3_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob1_l3_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l3_q6",
            "question_text": "Es gibt keine Ticketautomaten an den Stationen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt, es gibt Automaten an jeder Station.",
            "order_index": 5,
            "answers": [
              {
                "id": "ob1_l3_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob1_l3_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "lesen4",
        "name": "Lesen — Teil 4 (Zuordnung)",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "Sechs Personen erklären, warum sie Deutsch lernen. Ordnen Sie die Aussagen zu.",
        "passage": "Forum: \"Warum lernt ihr Deutsch?\"\n\nAylin: Ich möchte in Österreich eine Ausbildung im Gesundheitswesen machen.\nBerat: Für mich ist es wichtig, mit meinen Nachbarn und Kollegen besser kommunizieren zu können.\nChiara: Ich habe einen österreichischen Partner und möchte mich mit seiner Familie unterhalten können.\nDario: Mein Ziel ist es, an einer Universität in Wien zu studieren.\nElif: Ich arbeite bereits hier und mein Chef verlangt bessere Deutschkenntnisse für eine Beförderung.\nFarid: Ich interessiere mich einfach für die deutsche Sprache und Kultur, ganz ohne konkretes Ziel.",
        "items": [
          {
            "id": "ob1_l4_q1",
            "question_text": "Wer möchte eine Ausbildung im Gesundheitswesen machen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Aylin nennt genau dieses Ziel.",
            "order_index": 0,
            "answers": [
              {
                "id": "ob1_l4_q1_a1",
                "answer_text": "Aylin",
                "is_correct": true
              },
              {
                "id": "ob1_l4_q1_a2",
                "answer_text": "Berat",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q1_a3",
                "answer_text": "Chiara",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q1_a4",
                "answer_text": "Dario",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q1_a5",
                "answer_text": "Elif",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q1_a6",
                "answer_text": "Farid",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l4_q2",
            "question_text": "Wer möchte besser mit Nachbarn und Kollegen kommunizieren?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Berat nennt genau diesen Grund.",
            "order_index": 1,
            "answers": [
              {
                "id": "ob1_l4_q2_a1",
                "answer_text": "Aylin",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q2_a2",
                "answer_text": "Berat",
                "is_correct": true
              },
              {
                "id": "ob1_l4_q2_a3",
                "answer_text": "Chiara",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q2_a4",
                "answer_text": "Dario",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q2_a5",
                "answer_text": "Elif",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q2_a6",
                "answer_text": "Farid",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l4_q3",
            "question_text": "Wer hat einen österreichischen Partner?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Chiara erwähnt ihren österreichischen Partner.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob1_l4_q3_a1",
                "answer_text": "Aylin",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q3_a2",
                "answer_text": "Berat",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q3_a3",
                "answer_text": "Chiara",
                "is_correct": true
              },
              {
                "id": "ob1_l4_q3_a4",
                "answer_text": "Dario",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q3_a5",
                "answer_text": "Elif",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q3_a6",
                "answer_text": "Farid",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l4_q4",
            "question_text": "Wer möchte an einer Universität in Wien studieren?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Dario nennt genau dieses Ziel.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob1_l4_q4_a1",
                "answer_text": "Aylin",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q4_a2",
                "answer_text": "Berat",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q4_a3",
                "answer_text": "Chiara",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q4_a4",
                "answer_text": "Dario",
                "is_correct": true
              },
              {
                "id": "ob1_l4_q4_a5",
                "answer_text": "Elif",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q4_a6",
                "answer_text": "Farid",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l4_q5",
            "question_text": "Wer braucht bessere Deutschkenntnisse für eine Beförderung?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Elif nennt genau diesen Grund.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob1_l4_q5_a1",
                "answer_text": "Aylin",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q5_a2",
                "answer_text": "Berat",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q5_a3",
                "answer_text": "Chiara",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q5_a4",
                "answer_text": "Dario",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q5_a5",
                "answer_text": "Elif",
                "is_correct": true
              },
              {
                "id": "ob1_l4_q5_a6",
                "answer_text": "Farid",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l4_q6",
            "question_text": "Wer lernt Deutsch ohne konkretes Ziel?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Farid sagt, er habe kein konkretes Ziel.",
            "order_index": 5,
            "answers": [
              {
                "id": "ob1_l4_q6_a1",
                "answer_text": "Aylin",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q6_a2",
                "answer_text": "Berat",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q6_a3",
                "answer_text": "Chiara",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q6_a4",
                "answer_text": "Dario",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q6_a5",
                "answer_text": "Elif",
                "is_correct": false
              },
              {
                "id": "ob1_l4_q6_a6",
                "answer_text": "Farid",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "lesen5",
        "name": "Lesen — Teil 5",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "Lesen Sie die Hinweise und beantworten Sie die Fragen.",
        "passage": "Hinweise für Kursteilnehmende\n\n1. Der Kurs beginnt pünktlich um 18 Uhr; bei Verspätung bitten wir um Rücksicht auf die anderen Teilnehmenden.\n2. Kursunterlagen erhalten Sie in der ersten Stunde kostenlos.\n3. Bei mehr als drei unentschuldigten Fehlstunden verlieren Sie Ihren Kursplatz.\n4. Die Prüfungsanmeldung erfolgt spätestens vier Wochen vor dem Prüfungstermin.\n5. Ein kostenloser Nachholtermin ist bei Krankheit mit ärztlichem Attest möglich.\n6. Das Kursbüro ist montags bis freitags von 9 bis 15 Uhr erreichbar.",
        "items": [
          {
            "id": "ob1_l5_q1",
            "question_text": "Wann beginnt der Kurs?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 1 nennt 18 Uhr.",
            "order_index": 0,
            "answers": [
              {
                "id": "ob1_l5_q1_a1",
                "answer_text": "Pünktlich um 18 Uhr",
                "is_correct": true
              },
              {
                "id": "ob1_l5_q1_a2",
                "answer_text": "Um 19 Uhr",
                "is_correct": false
              },
              {
                "id": "ob1_l5_q1_a3",
                "answer_text": "Flexibel, je nach Teilnehmenden",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l5_q2",
            "question_text": "Die Kursunterlagen kosten extra.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie werden kostenlos in der ersten Stunde verteilt.",
            "order_index": 1,
            "answers": [
              {
                "id": "ob1_l5_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob1_l5_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob1_l5_q3",
            "question_text": "Was passiert bei mehr als drei unentschuldigten Fehlstunden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 3 nennt genau diese Folge.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob1_l5_q3_a1",
                "answer_text": "Man verliert den Kursplatz.",
                "is_correct": true
              },
              {
                "id": "ob1_l5_q3_a2",
                "answer_text": "Man zahlt eine Strafe.",
                "is_correct": false
              },
              {
                "id": "ob1_l5_q3_a3",
                "answer_text": "Nichts passiert.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l5_q4",
            "question_text": "Bis wann muss man sich zur Prüfung anmelden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 4 nennt vier Wochen.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob1_l5_q4_a1",
                "answer_text": "Spätestens vier Wochen vorher",
                "is_correct": true
              },
              {
                "id": "ob1_l5_q4_a2",
                "answer_text": "Am Prüfungstag selbst",
                "is_correct": false
              },
              {
                "id": "ob1_l5_q4_a3",
                "answer_text": "Eine Woche vorher",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l5_q5",
            "question_text": "Ein Nachholtermin bei Krankheit ist kostenlos möglich.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Regel 5 nennt genau das, mit ärztlichem Attest.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob1_l5_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob1_l5_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_l5_q6",
            "question_text": "Wann ist das Kursbüro erreichbar?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 6 nennt genau diese Zeiten.",
            "order_index": 5,
            "answers": [
              {
                "id": "ob1_l5_q6_a1",
                "answer_text": "Montag bis Freitag, 9–15 Uhr",
                "is_correct": true
              },
              {
                "id": "ob1_l5_q6_a2",
                "answer_text": "Nur samstags",
                "is_correct": false
              },
              {
                "id": "ob1_l5_q6_a3",
                "answer_text": "Rund um die Uhr",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "sprachbausteine",
        "name": "Sprachbausteine (تدريب إضافي)",
        "type": "language",
        "official_duration_minutes": null,
        "instructions": "تدريب إضافي على القواعد والمفردات.",
        "passage": null,
        "items": [
          {
            "id": "ob1_sb_q1",
            "question_text": "Wir ___ jeden Sonntag auf den Markt.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Mit \"Wir\" verwendet man \"gehen\".",
            "order_index": 0,
            "answers": [
              {
                "id": "ob1_sb_q1_a1",
                "answer_text": "gehen",
                "is_correct": true
              },
              {
                "id": "ob1_sb_q1_a2",
                "answer_text": "geht",
                "is_correct": false
              },
              {
                "id": "ob1_sb_q1_a3",
                "answer_text": "gehst",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_sb_q2",
            "question_text": "Entschuldigung, ___ ist der Stephansdom?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"wo\" fragt nach dem Ort.",
            "order_index": 1,
            "answers": [
              {
                "id": "ob1_sb_q2_a1",
                "answer_text": "wo",
                "is_correct": true
              },
              {
                "id": "ob1_sb_q2_a2",
                "answer_text": "wohin",
                "is_correct": false
              },
              {
                "id": "ob1_sb_q2_a3",
                "answer_text": "woher",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_sb_q3",
            "question_text": "Ich freue mich schon ___ das Wochenende.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"sich freuen auf\" + Akkusativ.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob1_sb_q3_a1",
                "answer_text": "auf",
                "is_correct": true
              },
              {
                "id": "ob1_sb_q3_a2",
                "answer_text": "für",
                "is_correct": false
              },
              {
                "id": "ob1_sb_q3_a3",
                "answer_text": "an",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_sb_q4",
            "question_text": "Er hat den Zug verpasst, ___ er zu spät aufgestanden ist.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"weil\" nennt den Grund.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob1_sb_q4_a1",
                "answer_text": "weil",
                "is_correct": true
              },
              {
                "id": "ob1_sb_q4_a2",
                "answer_text": "obwohl",
                "is_correct": false
              },
              {
                "id": "ob1_sb_q4_a3",
                "answer_text": "damit",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_sb_q5",
            "question_text": "Diese Wohnung ist viel ___ als die alte.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Vergleich zwischen zwei Dingen braucht den Komparativ.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob1_sb_q5_a1",
                "answer_text": "größer",
                "is_correct": true
              },
              {
                "id": "ob1_sb_q5_a2",
                "answer_text": "groß",
                "is_correct": false
              },
              {
                "id": "ob1_sb_q5_a3",
                "answer_text": "am größten",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_sb_q6",
            "question_text": "Kannst du mir sagen, ___ der Bus fährt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"wann\" fragt nach der Zeit.",
            "order_index": 5,
            "answers": [
              {
                "id": "ob1_sb_q6_a1",
                "answer_text": "wann",
                "is_correct": true
              },
              {
                "id": "ob1_sb_q6_a2",
                "answer_text": "wo",
                "is_correct": false
              },
              {
                "id": "ob1_sb_q6_a3",
                "answer_text": "wie",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_sb_q7",
            "question_text": "Ich habe das Formular schon ___.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Perfekt: \"habe\" + Partizip II.",
            "order_index": 6,
            "answers": [
              {
                "id": "ob1_sb_q7_a1",
                "answer_text": "ausgefüllt",
                "is_correct": true
              },
              {
                "id": "ob1_sb_q7_a2",
                "answer_text": "ausfüllen",
                "is_correct": false
              },
              {
                "id": "ob1_sb_q7_a3",
                "answer_text": "füllte aus",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_sb_q8",
            "question_text": "Sie wohnt ___ ihren Eltern zusammen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"zusammenwohnen mit\" + Dativ.",
            "order_index": 7,
            "answers": [
              {
                "id": "ob1_sb_q8_a1",
                "answer_text": "mit",
                "is_correct": true
              },
              {
                "id": "ob1_sb_q8_a2",
                "answer_text": "bei",
                "is_correct": false
              },
              {
                "id": "ob1_sb_q8_a3",
                "answer_text": "zu",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_sb_q9",
            "question_text": "___ du Zeit hast, können wir uns treffen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"wenn\" leitet eine Bedingung ein.",
            "order_index": 8,
            "answers": [
              {
                "id": "ob1_sb_q9_a1",
                "answer_text": "Wenn",
                "is_correct": true
              },
              {
                "id": "ob1_sb_q9_a2",
                "answer_text": "Ob",
                "is_correct": false
              },
              {
                "id": "ob1_sb_q9_a3",
                "answer_text": "Als",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_sb_q10",
            "question_text": "Er arbeitet ___ einer großen Firma in Wien.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"arbeiten bei\" + Dativ für den Arbeitgeber.",
            "order_index": 9,
            "answers": [
              {
                "id": "ob1_sb_q10_a1",
                "answer_text": "bei",
                "is_correct": true
              },
              {
                "id": "ob1_sb_q10_a2",
                "answer_text": "in",
                "is_correct": false
              },
              {
                "id": "ob1_sb_q10_a3",
                "answer_text": "an",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "hoeren1",
        "name": "Hören — Teil 1 (Transkript)",
        "type": "listening",
        "official_duration_minutes": 30,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ كل نص قصير، ثم أجب عن سؤاله.",
        "passage": "Kurze Texte (Transkript):\n1. Der Regionalzug nach Salzburg fährt heute mit einer Verspätung von etwa 15 Minuten.\n2. Die Bibliothek schließt heute bereits um 17 Uhr wegen einer internen Veranstaltung.\n3. Auf dem Naschmarkt gibt es heute einen Sonderverkauf von frischem Obst.\n4. Die U4 fährt wegen Bauarbeiten zwischen Speising und Hütteldorf nicht.\n5. Das Wetteramt meldet für morgen sonniges Wetter mit bis zu 25 Grad.\n6. Im Rathaus findet am Samstag ein Flohmarkt zugunsten wohltätiger Zwecke statt.",
        "items": [
          {
            "id": "ob1_h1_q1",
            "question_text": "Wie viel Verspätung hat der Zug?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt 15 Minuten.",
            "order_index": 0,
            "answers": [
              {
                "id": "ob1_h1_q1_a1",
                "answer_text": "Etwa 15 Minuten",
                "is_correct": true
              },
              {
                "id": "ob1_h1_q1_a2",
                "answer_text": "Etwa 5 Minuten",
                "is_correct": false
              },
              {
                "id": "ob1_h1_q1_a3",
                "answer_text": "Etwa 30 Minuten",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_h1_q2",
            "question_text": "Wann schließt die Bibliothek heute?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt 17 Uhr.",
            "order_index": 1,
            "answers": [
              {
                "id": "ob1_h1_q2_a1",
                "answer_text": "Um 17 Uhr",
                "is_correct": true
              },
              {
                "id": "ob1_h1_q2_a2",
                "answer_text": "Um 20 Uhr",
                "is_correct": false
              },
              {
                "id": "ob1_h1_q2_a3",
                "answer_text": "Um 19 Uhr",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_h1_q3",
            "question_text": "Was gibt es heute auf dem Naschmarkt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt einen Obst-Sonderverkauf.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob1_h1_q3_a1",
                "answer_text": "Einen Sonderverkauf von Obst",
                "is_correct": true
              },
              {
                "id": "ob1_h1_q3_a2",
                "answer_text": "Ein Konzert",
                "is_correct": false
              },
              {
                "id": "ob1_h1_q3_a3",
                "answer_text": "Einen Flohmarkt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_h1_q4",
            "question_text": "Zwischen welchen Stationen fährt die U4 nicht?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt genau diese Stationen.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob1_h1_q4_a1",
                "answer_text": "Speising und Hütteldorf",
                "is_correct": true
              },
              {
                "id": "ob1_h1_q4_a2",
                "answer_text": "Karlsplatz und Stephansplatz",
                "is_correct": false
              },
              {
                "id": "ob1_h1_q4_a3",
                "answer_text": "Praterstern und Schwedenplatz",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_h1_q5",
            "question_text": "Wie wird das Wetter morgen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Meldung nennt sonniges Wetter mit 25 Grad.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob1_h1_q5_a1",
                "answer_text": "Sonnig mit bis zu 25 Grad",
                "is_correct": true
              },
              {
                "id": "ob1_h1_q5_a2",
                "answer_text": "Regnerisch und kalt",
                "is_correct": false
              },
              {
                "id": "ob1_h1_q5_a3",
                "answer_text": "Windig mit Schnee",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_h1_q6",
            "question_text": "Was findet am Samstag im Rathaus statt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt einen wohltätigen Flohmarkt.",
            "order_index": 5,
            "answers": [
              {
                "id": "ob1_h1_q6_a1",
                "answer_text": "Ein Flohmarkt für wohltätige Zwecke",
                "is_correct": true
              },
              {
                "id": "ob1_h1_q6_a2",
                "answer_text": "Ein Konzert",
                "is_correct": false
              },
              {
                "id": "ob1_h1_q6_a3",
                "answer_text": "Eine Buchmesse",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_osd_b1__hoeren1.mp3"
      },
      {
        "key": "hoeren2",
        "name": "Hören — Teil 2 (Transkript)",
        "type": "listening",
        "official_duration_minutes": 30,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص الحوار، ثم أجب عن الأسئلة.",
        "passage": "Gespräch am Würstelstand:\n\"A: Was darf's denn sein?\nB: Eine Käsekrainer mit Senf bitte, und dazu ein kleines Brot.\nA: Gerne, macht zusammen vier Euro fünfzig. Möchten Sie auch etwas trinken?\nB: Ja, ein Mineralwasser bitte.\nA: Das macht dann insgesamt sechs Euro.\nB: Hier bitte, und behalten Sie den Rest.\nA: Vielen Dank, einen schönen Tag noch!\"",
        "items": [
          {
            "id": "ob1_h2_q1",
            "question_text": "Was bestellt die Person zuerst?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "B bestellt genau das.",
            "order_index": 0,
            "answers": [
              {
                "id": "ob1_h2_q1_a1",
                "answer_text": "Eine Käsekrainer mit Senf",
                "is_correct": true
              },
              {
                "id": "ob1_h2_q1_a2",
                "answer_text": "Eine Bratwurst",
                "is_correct": false
              },
              {
                "id": "ob1_h2_q1_a3",
                "answer_text": "Einen Hamburger",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_h2_q2",
            "question_text": "Die Käsekrainer kostet allein sechs Euro.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Käsekrainer und Brot zusammen kosten 4,50 Euro.",
            "order_index": 1,
            "answers": [
              {
                "id": "ob1_h2_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob1_h2_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob1_h2_q3",
            "question_text": "Was möchte die Person trinken?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "B bestellt ein Mineralwasser.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob1_h2_q3_a1",
                "answer_text": "Ein Mineralwasser",
                "is_correct": true
              },
              {
                "id": "ob1_h2_q3_a2",
                "answer_text": "Eine Cola",
                "is_correct": false
              },
              {
                "id": "ob1_h2_q3_a3",
                "answer_text": "Einen Kaffee",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_h2_q4",
            "question_text": "Wie viel kostet alles zusammen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "A nennt sechs Euro als Gesamtpreis.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob1_h2_q4_a1",
                "answer_text": "Sechs Euro",
                "is_correct": true
              },
              {
                "id": "ob1_h2_q4_a2",
                "answer_text": "Vier Euro fünfzig",
                "is_correct": false
              },
              {
                "id": "ob1_h2_q4_a3",
                "answer_text": "Sieben Euro",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_h2_q5",
            "question_text": "Die Person gibt kein Trinkgeld.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie sagt \"behalten Sie den Rest\", also gibt sie Trinkgeld.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob1_h2_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob1_h2_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob1_h2_q6",
            "question_text": "Wo findet das Gespräch statt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Titel nennt den Würstelstand.",
            "order_index": 5,
            "answers": [
              {
                "id": "ob1_h2_q6_a1",
                "answer_text": "Am Würstelstand",
                "is_correct": true
              },
              {
                "id": "ob1_h2_q6_a2",
                "answer_text": "Im Restaurant",
                "is_correct": false
              },
              {
                "id": "ob1_h2_q6_a3",
                "answer_text": "Im Supermarkt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_h2_q7",
            "question_text": "Die Person bekommt auch ein Brot dazu.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "B bestellt \"dazu ein kleines Brot\".",
            "order_index": 6,
            "answers": [
              {
                "id": "ob1_h2_q7_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob1_h2_q7_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_h2_q8",
            "question_text": "Was sagt der Verkäufer zum Schluss?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "A wünscht \"einen schönen Tag noch\".",
            "order_index": 7,
            "answers": [
              {
                "id": "ob1_h2_q8_a1",
                "answer_text": "Einen schönen Tag noch",
                "is_correct": true
              },
              {
                "id": "ob1_h2_q8_a2",
                "answer_text": "Auf Wiedersehen",
                "is_correct": false
              },
              {
                "id": "ob1_h2_q8_a3",
                "answer_text": "Bis morgen",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_osd_b1__hoeren2.mp3"
      },
      {
        "key": "hoeren3",
        "name": "Hören — Teil 3 (Transkript)",
        "type": "listening",
        "official_duration_minutes": 30,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص الإعلان، ثم أجب عن الأسئلة.",
        "passage": "Durchsage am Wiener Hauptbahnhof:\n\"Sehr geehrte Fahrgäste, der Railjet nach Salzburg, München und Zürich fährt heute von Gleis 9 anstatt von Gleis 3. Die Abfahrtszeit bleibt unverändert um 14:35 Uhr. Wir entschuldigen uns für die kurzfristige Änderung und wünschen eine gute Reise.\"",
        "items": [
          {
            "id": "ob1_h3_q1",
            "question_text": "Wohin fährt der Railjet unter anderem?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt alle drei Ziele.",
            "order_index": 0,
            "answers": [
              {
                "id": "ob1_h3_q1_a1",
                "answer_text": "Nach Salzburg, München und Zürich",
                "is_correct": true
              },
              {
                "id": "ob1_h3_q1_a2",
                "answer_text": "Nach Graz und Linz",
                "is_correct": false
              },
              {
                "id": "ob1_h3_q1_a3",
                "answer_text": "Nur nach Salzburg",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_h3_q2",
            "question_text": "Von welchem Gleis fährt der Zug jetzt ab?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Zug fährt jetzt von Gleis 9 statt Gleis 3.",
            "order_index": 1,
            "answers": [
              {
                "id": "ob1_h3_q2_a1",
                "answer_text": "Gleis 9",
                "is_correct": true
              },
              {
                "id": "ob1_h3_q2_a2",
                "answer_text": "Gleis 3",
                "is_correct": false
              },
              {
                "id": "ob1_h3_q2_a3",
                "answer_text": "Gleis 5",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_h3_q3",
            "question_text": "Die Abfahrtszeit hat sich geändert.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Abfahrtszeit bleibt unverändert um 14:35 Uhr.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob1_h3_q3_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob1_h3_q3_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob1_h3_q4",
            "question_text": "Um wie viel Uhr fährt der Zug ab?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt 14:35 Uhr.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob1_h3_q4_a1",
                "answer_text": "14:35 Uhr",
                "is_correct": true
              },
              {
                "id": "ob1_h3_q4_a2",
                "answer_text": "15:35 Uhr",
                "is_correct": false
              },
              {
                "id": "ob1_h3_q4_a3",
                "answer_text": "14:05 Uhr",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_h3_q5",
            "question_text": "Die Bahn entschuldigt sich für die Änderung.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Durchsage endet mit einer Entschuldigung.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob1_h3_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob1_h3_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob1_h3_q6",
            "question_text": "Was für ein Zug ist es?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt \"Railjet\".",
            "order_index": 5,
            "answers": [
              {
                "id": "ob1_h3_q6_a1",
                "answer_text": "Ein Railjet",
                "is_correct": true
              },
              {
                "id": "ob1_h3_q6_a2",
                "answer_text": "Ein Regionalzug",
                "is_correct": false
              },
              {
                "id": "ob1_h3_q6_a3",
                "answer_text": "Ein Nachtzug",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_osd_b1__hoeren3.mp3"
      }
    ],
    "writing": {
      "name": "Schreiben (تدريب غير مُقيَّم)",
      "official_duration_minutes": 40,
      "instructions": "في الاختبار الرسمي، تكتب رسالة غير رسمية أو شبه رسمية. هذا تدريب ذاتي غير مُقيَّم آليًا.",
      "prompt": "Schreiben Sie einen informellen Brief an eine Freundin / einen Freund (ca. 50 Wörter). Erzählen Sie von Ihrem neuen Leben in einer anderen Stadt und laden Sie sie/ihn zu Besuch ein.",
      "sample_answer": "Liebe Amina,\n\nseit zwei Monaten lebe ich jetzt in Wien und es gefällt mir richtig gut! Die Stadt ist wunderschön, besonders die U-Bahn ist super praktisch.\n\nHättest du Lust, mich im Sommer zu besuchen? Wir könnten zusammen den Naschmarkt erkunden.\n\nGanz liebe Grüße\nYasmin"
    }
  },
  "test_osd_b2": {
    "sections": [
      {
        "key": "lesen1",
        "name": "Lesen — Teil 1",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "اقرأ المقال وحدد إن كانت الجمل التالية صحيحة أم خاطئة.",
        "passage": "Vier-Tage-Woche: Ein Modell auf dem Prüfstand\n\nIn der Schweiz und in Österreich testen derzeit mehrere Unternehmen die Vier-Tage-Woche bei vollem Lohnausgleich. Erste Ergebnisse aus einem Pilotprojekt in Zürich zeigen, dass die Krankenstände um über 30 Prozent zurückgegangen sind. Gleichzeitig berichten einige Betriebe von organisatorischen Herausforderungen, etwa bei der Erreichbarkeit für Kundinnen und Kunden. Die Gewerkschaften fordern nun eine breitere gesetzliche Grundlage, während Arbeitgeberverbände vor einer verpflichtenden Einführung ohne ausreichende Erprobungsphase warnen.",
        "items": [
          {
            "id": "ob2_l1_q1",
            "question_text": "Das Pilotprojekt findet nur in Deutschland statt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text nennt die Schweiz und Österreich, nicht Deutschland.",
            "order_index": 0,
            "answers": [
              {
                "id": "ob2_l1_q1_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_l1_q1_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_l1_q2",
            "question_text": "Die Mitarbeitenden bekommen bei der Vier-Tage-Woche weniger Lohn.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt \"bei vollem Lohnausgleich\".",
            "order_index": 1,
            "answers": [
              {
                "id": "ob2_l1_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_l1_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_l1_q3",
            "question_text": "Die Krankenstände sind im Pilotprojekt in Zürich gesunken.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text nennt einen Rückgang von über 30 Prozent.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob2_l1_q3_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_l1_q3_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_l1_q4",
            "question_text": "Alle Betriebe berichten ausschließlich von positiven Erfahrungen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Einige berichten auch von organisatorischen Herausforderungen.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob2_l1_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_l1_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_l1_q5",
            "question_text": "Die Gewerkschaften fordern eine gesetzliche Grundlage.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text nennt genau diese Forderung.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob2_l1_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_l1_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_l1_q6",
            "question_text": "Die Arbeitgeberverbände befürworten eine sofortige verpflichtende Einführung.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie warnen vor einer verpflichtenden Einführung ohne Erprobungsphase.",
            "order_index": 5,
            "answers": [
              {
                "id": "ob2_l1_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_l1_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "lesen2",
        "name": "Lesen — Teil 2 (Zuordnung)",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "Sechs Personen äußern ihre Meinung zur Vier-Tage-Woche. Ordnen Sie die Aussagen zu.",
        "passage": "Meinungen zur Vier-Tage-Woche:\n\nElif: Ich halte davon nichts. Bei gleichem Lohn und weniger Arbeitszeit steigt doch nur der Druck an einem normalen Arbeitstag.\nFelix: Für mich ist es die beste Entscheidung, die mein Arbeitgeber je getroffen hat. Ich habe jetzt endlich Zeit für meine Familie.\nGül: Ich bin unentschlossen. Es klingt gut, aber ich habe Zweifel, ob es in meiner Branche wirklich funktioniert.\nHannes: Aus meiner Sicht ist es vor allem ein Marketinginstrument, um neue Mitarbeitende anzuziehen.\nInes: Ich finde es fair gegenüber Eltern, die sich so besser um ihre Kinder kümmern können.\nJonas: Meiner Erfahrung nach hängt der Erfolg stark davon ab, wie gut die Arbeitsabläufe organisiert sind.",
        "items": [
          {
            "id": "ob2_l2_q1",
            "question_text": "Wer sieht die Vier-Tage-Woche kritisch wegen des höheren Drucks?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Elif spricht vom steigenden Druck an einem normalen Arbeitstag.",
            "order_index": 0,
            "answers": [
              {
                "id": "ob2_l2_q1_a1",
                "answer_text": "Elif",
                "is_correct": true
              },
              {
                "id": "ob2_l2_q1_a2",
                "answer_text": "Felix",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q1_a3",
                "answer_text": "Gül",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q1_a4",
                "answer_text": "Hannes",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q1_a5",
                "answer_text": "Ines",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q1_a6",
                "answer_text": "Jonas",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_l2_q2",
            "question_text": "Wer ist begeistert, weil er mehr Familienzeit hat?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Felix sagt, er habe jetzt Zeit für seine Familie.",
            "order_index": 1,
            "answers": [
              {
                "id": "ob2_l2_q2_a1",
                "answer_text": "Elif",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q2_a2",
                "answer_text": "Felix",
                "is_correct": true
              },
              {
                "id": "ob2_l2_q2_a3",
                "answer_text": "Gül",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q2_a4",
                "answer_text": "Hannes",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q2_a5",
                "answer_text": "Ines",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q2_a6",
                "answer_text": "Jonas",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_l2_q3",
            "question_text": "Wer ist sich noch nicht sicher?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Gül sagt, sie sei unentschlossen.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob2_l2_q3_a1",
                "answer_text": "Elif",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q3_a2",
                "answer_text": "Felix",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q3_a3",
                "answer_text": "Gül",
                "is_correct": true
              },
              {
                "id": "ob2_l2_q3_a4",
                "answer_text": "Hannes",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q3_a5",
                "answer_text": "Ines",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q3_a6",
                "answer_text": "Jonas",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_l2_q4",
            "question_text": "Wer sieht darin vor allem ein Marketinginstrument?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Hannes nennt es ein Marketinginstrument.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob2_l2_q4_a1",
                "answer_text": "Elif",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q4_a2",
                "answer_text": "Felix",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q4_a3",
                "answer_text": "Gül",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q4_a4",
                "answer_text": "Hannes",
                "is_correct": true
              },
              {
                "id": "ob2_l2_q4_a5",
                "answer_text": "Ines",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q4_a6",
                "answer_text": "Jonas",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_l2_q5",
            "question_text": "Wer findet es fair gegenüber Eltern?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Ines nennt genau diesen Punkt.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob2_l2_q5_a1",
                "answer_text": "Elif",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q5_a2",
                "answer_text": "Felix",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q5_a3",
                "answer_text": "Gül",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q5_a4",
                "answer_text": "Hannes",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q5_a5",
                "answer_text": "Ines",
                "is_correct": true
              },
              {
                "id": "ob2_l2_q5_a6",
                "answer_text": "Jonas",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_l2_q6",
            "question_text": "Wer sagt, der Erfolg hänge von der Organisation ab?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Jonas nennt die Organisation als entscheidenden Faktor.",
            "order_index": 5,
            "answers": [
              {
                "id": "ob2_l2_q6_a1",
                "answer_text": "Elif",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q6_a2",
                "answer_text": "Felix",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q6_a3",
                "answer_text": "Gül",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q6_a4",
                "answer_text": "Hannes",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q6_a5",
                "answer_text": "Ines",
                "is_correct": false
              },
              {
                "id": "ob2_l2_q6_a6",
                "answer_text": "Jonas",
                "is_correct": true
              }
            ]
          }
        ]
      },
      {
        "key": "lesen3",
        "name": "Lesen — Teil 3",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "Lesen Sie den Artikel und beantworten Sie die Fragen.",
        "passage": "Trinkwasserqualität in der Schweiz\n\nDie Schweiz gilt international als Vorbild bei der Trinkwasserqualität: Über 80 Prozent des Trinkwassers stammen aus Grundwasser und Quellen, die kaum aufbereitet werden müssen. Dennoch warnen Umweltverbände vor zunehmender Belastung durch Pestizide in landwirtschaftlich genutzten Gebieten. Mehrere Kantone haben deshalb strengere Auflagen für die Landwirtschaft in Wassereinzugsgebieten eingeführt. Kritiker aus der Landwirtschaft befürchten dadurch sinkende Erträge und fordern finanzielle Unterstützung für die Umstellung auf alternative Anbaumethoden.",
        "items": [
          {
            "id": "ob2_l3_q1",
            "question_text": "Woher stammt der Großteil des Schweizer Trinkwassers?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt Grundwasser und Quellen.",
            "order_index": 0,
            "answers": [
              {
                "id": "ob2_l3_q1_a1",
                "answer_text": "Aus Grundwasser und Quellen",
                "is_correct": true
              },
              {
                "id": "ob2_l3_q1_a2",
                "answer_text": "Aus Flüssen",
                "is_correct": false
              },
              {
                "id": "ob2_l3_q1_a3",
                "answer_text": "Aus Meerwasseraufbereitung",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_l3_q2",
            "question_text": "Das Schweizer Trinkwasser muss meist stark aufbereitet werden.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es muss kaum aufbereitet werden.",
            "order_index": 1,
            "answers": [
              {
                "id": "ob2_l3_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_l3_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_l3_q3",
            "question_text": "Wovor warnen Umweltverbände?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt Pestizidbelastung als Sorge.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob2_l3_q3_a1",
                "answer_text": "Vor zunehmender Belastung durch Pestizide",
                "is_correct": true
              },
              {
                "id": "ob2_l3_q3_a2",
                "answer_text": "Vor Wasserknappheit",
                "is_correct": false
              },
              {
                "id": "ob2_l3_q3_a3",
                "answer_text": "Vor zu hohen Wasserpreisen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_l3_q4",
            "question_text": "Was haben mehrere Kantone eingeführt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt strengere Auflagen.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob2_l3_q4_a1",
                "answer_text": "Strengere Auflagen für die Landwirtschaft",
                "is_correct": true
              },
              {
                "id": "ob2_l3_q4_a2",
                "answer_text": "Ein Verbot der Landwirtschaft",
                "is_correct": false
              },
              {
                "id": "ob2_l3_q4_a3",
                "answer_text": "Höhere Wasserpreise",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_l3_q5",
            "question_text": "Was befürchten Kritiker aus der Landwirtschaft?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt sinkende Erträge als Befürchtung.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob2_l3_q5_a1",
                "answer_text": "Sinkende Erträge",
                "is_correct": true
              },
              {
                "id": "ob2_l3_q5_a2",
                "answer_text": "Höhere Gewinne",
                "is_correct": false
              },
              {
                "id": "ob2_l3_q5_a3",
                "answer_text": "Mehr Bürokratie ohne Folgen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_l3_q6",
            "question_text": "Die Landwirtschaft fordert finanzielle Unterstützung für die Umstellung.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der letzte Satz nennt genau diese Forderung.",
            "order_index": 5,
            "answers": [
              {
                "id": "ob2_l3_q6_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_l3_q6_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "lesen4",
        "name": "Lesen — Teil 4",
        "type": "reading",
        "official_duration_minutes": 90,
        "instructions": "Lesen Sie den Vertragsauszug und beantworten Sie die Fragen.",
        "passage": "Mietvertrag — Auszug aus den allgemeinen Bedingungen\n\n1. Die Kündigungsfrist beträgt drei Monate zum Monatsende.\n2. Haustiere dürfen nur mit schriftlicher Zustimmung der Vermieterschaft gehalten werden.\n3. Kleinere Schönheitsreparaturen sind vom Mieter selbst durchzuführen.\n4. Die Kaution beträgt das Dreifache der monatlichen Nettomiete.\n5. Untervermietung ist nur mit vorheriger schriftlicher Genehmigung erlaubt.\n6. Bauliche Veränderungen dürfen nur nach Rücksprache mit der Hausverwaltung vorgenommen werden.",
        "items": [
          {
            "id": "ob2_l4_q1",
            "question_text": "Wie lange ist die Kündigungsfrist?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 1 nennt drei Monate.",
            "order_index": 0,
            "answers": [
              {
                "id": "ob2_l4_q1_a1",
                "answer_text": "Drei Monate zum Monatsende",
                "is_correct": true
              },
              {
                "id": "ob2_l4_q1_a2",
                "answer_text": "Ein Monat",
                "is_correct": false
              },
              {
                "id": "ob2_l4_q1_a3",
                "answer_text": "Sechs Monate",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_l4_q2",
            "question_text": "Haustiere sind ohne Einschränkung erlaubt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie benötigen schriftliche Zustimmung der Vermieterschaft.",
            "order_index": 1,
            "answers": [
              {
                "id": "ob2_l4_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_l4_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_l4_q3",
            "question_text": "Wer führt kleinere Schönheitsreparaturen durch?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 3 nennt den Mieter.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob2_l4_q3_a1",
                "answer_text": "Der Mieter selbst",
                "is_correct": true
              },
              {
                "id": "ob2_l4_q3_a2",
                "answer_text": "Die Hausverwaltung",
                "is_correct": false
              },
              {
                "id": "ob2_l4_q3_a3",
                "answer_text": "Ein externer Handwerker auf Kosten der Vermieterschaft",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_l4_q4",
            "question_text": "Wie hoch ist die Kaution?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 4 nennt das Dreifache.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob2_l4_q4_a1",
                "answer_text": "Das Dreifache der Nettomiete",
                "is_correct": true
              },
              {
                "id": "ob2_l4_q4_a2",
                "answer_text": "Eine Monatsmiete",
                "is_correct": false
              },
              {
                "id": "ob2_l4_q4_a3",
                "answer_text": "Das Doppelte der Nettomiete",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_l4_q5",
            "question_text": "Untervermietung ist ohne Genehmigung möglich.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie benötigt vorherige schriftliche Genehmigung.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob2_l4_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_l4_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_l4_q6",
            "question_text": "Was ist vor baulichen Veränderungen nötig?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Regel 6 nennt Rücksprache mit der Hausverwaltung.",
            "order_index": 5,
            "answers": [
              {
                "id": "ob2_l4_q6_a1",
                "answer_text": "Rücksprache mit der Hausverwaltung",
                "is_correct": true
              },
              {
                "id": "ob2_l4_q6_a2",
                "answer_text": "Nichts, sie sind frei erlaubt",
                "is_correct": false
              },
              {
                "id": "ob2_l4_q6_a3",
                "answer_text": "Nur eine mündliche Ankündigung",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "sprachbausteine",
        "name": "Sprachbausteine (تدريب إضافي)",
        "type": "language",
        "official_duration_minutes": null,
        "instructions": "تدريب إضافي على القواعد المتقدمة والمفردات.",
        "passage": null,
        "items": [
          {
            "id": "ob2_sb_q1",
            "question_text": "___ des schlechten Wetters fand das Fest trotzdem statt.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"Trotz\" drückt einen Gegensatz aus.",
            "order_index": 0,
            "answers": [
              {
                "id": "ob2_sb_q1_a1",
                "answer_text": "Trotz",
                "is_correct": true
              },
              {
                "id": "ob2_sb_q1_a2",
                "answer_text": "Wegen",
                "is_correct": false
              },
              {
                "id": "ob2_sb_q1_a3",
                "answer_text": "Während",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_sb_q2",
            "question_text": "Je mehr Erfahrung man hat, ___ leichter fällt einem die Arbeit.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"je... desto...\" ist die feste Konstruktion.",
            "order_index": 1,
            "answers": [
              {
                "id": "ob2_sb_q2_a1",
                "answer_text": "desto",
                "is_correct": true
              },
              {
                "id": "ob2_sb_q2_a2",
                "answer_text": "so",
                "is_correct": false
              },
              {
                "id": "ob2_sb_q2_a3",
                "answer_text": "als",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_sb_q3",
            "question_text": "Der Vertrag muss noch ___ dem Anwalt geprüft werden.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Passiv mit Handelndem: \"von\" + Dativ.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob2_sb_q3_a1",
                "answer_text": "von",
                "is_correct": true
              },
              {
                "id": "ob2_sb_q3_a2",
                "answer_text": "durch",
                "is_correct": false
              },
              {
                "id": "ob2_sb_q3_a3",
                "answer_text": "bei",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_sb_q4",
            "question_text": "___ man die Statistik betrachtet, erkennt man einen klaren Trend.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"Wenn\" leitet hier einen Bedingungssatz ein.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob2_sb_q4_a1",
                "answer_text": "Wenn",
                "is_correct": true
              },
              {
                "id": "ob2_sb_q4_a2",
                "answer_text": "Damit",
                "is_correct": false
              },
              {
                "id": "ob2_sb_q4_a3",
                "answer_text": "Obwohl",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_sb_q5",
            "question_text": "Die Firma sieht sich ___, ihre Strategie zu überdenken.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"sich gezwungen sehen, etwas zu tun\" ist die feste Wendung.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob2_sb_q5_a1",
                "answer_text": "gezwungen",
                "is_correct": true
              },
              {
                "id": "ob2_sb_q5_a2",
                "answer_text": "zwingend",
                "is_correct": false
              },
              {
                "id": "ob2_sb_q5_a3",
                "answer_text": "zwingt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_sb_q6",
            "question_text": "___ ich das gewusst hätte, wäre ich früher gekommen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Konjunktiv II Bedingungssatz mit \"Wenn\".",
            "order_index": 5,
            "answers": [
              {
                "id": "ob2_sb_q6_a1",
                "answer_text": "Wenn",
                "is_correct": true
              },
              {
                "id": "ob2_sb_q6_a2",
                "answer_text": "Ob",
                "is_correct": false
              },
              {
                "id": "ob2_sb_q6_a3",
                "answer_text": "Als",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_sb_q7",
            "question_text": "Das Unternehmen hat sich ___ verpflichtet, klimaneutral zu werden.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"sich dazu verpflichten\" ist die feste Wendung.",
            "order_index": 6,
            "answers": [
              {
                "id": "ob2_sb_q7_a1",
                "answer_text": "dazu",
                "is_correct": true
              },
              {
                "id": "ob2_sb_q7_a2",
                "answer_text": "darauf",
                "is_correct": false
              },
              {
                "id": "ob2_sb_q7_a3",
                "answer_text": "damit",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_sb_q8",
            "question_text": "Der Bericht enthält Informationen, ___ für die Entscheidung wichtig sind.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Relativpronomen für Plural: \"die\".",
            "order_index": 7,
            "answers": [
              {
                "id": "ob2_sb_q8_a1",
                "answer_text": "die",
                "is_correct": true
              },
              {
                "id": "ob2_sb_q8_a2",
                "answer_text": "was",
                "is_correct": false
              },
              {
                "id": "ob2_sb_q8_a3",
                "answer_text": "wo",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_sb_q9",
            "question_text": "___ ihrer Qualifikation wurde sie sofort eingestellt.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"Aufgrund\" nennt den Grund.",
            "order_index": 8,
            "answers": [
              {
                "id": "ob2_sb_q9_a1",
                "answer_text": "Aufgrund",
                "is_correct": true
              },
              {
                "id": "ob2_sb_q9_a2",
                "answer_text": "Trotz",
                "is_correct": false
              },
              {
                "id": "ob2_sb_q9_a3",
                "answer_text": "Statt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_sb_q10",
            "question_text": "Es ist wichtig, ___ alle Regeln einzuhalten.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"Es ist wichtig, dass...\" leitet einen Nebensatz ein.",
            "order_index": 9,
            "answers": [
              {
                "id": "ob2_sb_q10_a1",
                "answer_text": "dass",
                "is_correct": true
              },
              {
                "id": "ob2_sb_q10_a2",
                "answer_text": "ob",
                "is_correct": false
              },
              {
                "id": "ob2_sb_q10_a3",
                "answer_text": "wie",
                "is_correct": false
              }
            ]
          }
        ]
      },
      {
        "key": "hoeren1",
        "name": "Hören — Teil 1 (Transkript)",
        "type": "listening",
        "official_duration_minutes": 30,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ كل جملة قصيرة كما لو كنت تسمعها، ثم حدد صحتها.",
        "passage": "Kurze Ansagen/Meldungen (Transkript):\n1. Die Ausstellung im Museum für angewandte Kunst läuft noch bis Ende des Monats.\n2. Der Vortrag über Nachhaltigkeit beginnt um 18 Uhr im großen Saal.\n3. Die Universität Wien bietet dieses Semester keine neuen Deutschkurse an.\n4. Der Radweg entlang der Donau wurde kürzlich um zehn Kilometer verlängert.\n5. Das neue Einkaufszentrum eröffnet erst im nächsten Jahr.\n6. Die Stadtbücherei verlangt für die Mitgliedschaft eine einmalige Gebühr von 50 Euro.\n7. Der Wetterdienst erwartet am Wochenende starke Gewitter.\n8. Die Firma stellt aktuell keine neuen Mitarbeitenden ein.\n9. Der Flughafen Wien meldet für heute keine Verspätungen.\n10. Die Volkshochschule bietet ab Herbst auch Onlinekurse an.\n11. Der Marathon findet dieses Jahr wegen Bauarbeiten nicht statt.\n12. Das Schwimmbad hat im Winter geschlossene Öffnungszeiten am Montag.\n13. Die neue Buslinie 42 verbindet den Bahnhof mit dem Flughafen.\n14. Der Konzertsaal wurde wegen Renovierung für ein Jahr komplett geschlossen.\n15. Die Stadtverwaltung erhöht ab Januar die Parkgebühren.\n16. Für die Ausstellung wird kein Eintritt verlangt.\n17. Die Universität schließt ihre Mensa während der Semesterferien komplett.\n18. Der neue Fahrplan der Straßenbahn gilt ab dem 1. September.\n19. Im Stadtpark ist das Grillen ganzjährig ohne Einschränkung erlaubt.\n20. Die Volkshochschule bietet kostenlose Beratungsgespräche für neue Kursteilnehmende an.",
        "items": [
          {
            "id": "ob2_h1_q1",
            "question_text": "Die Ausstellung im Museum für angewandte Kunst läuft noch bis Ende des Monats.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Aussage nennt genau das Enddatum.",
            "order_index": 0,
            "answers": [
              {
                "id": "ob2_h1_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h1_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h1_q2",
            "question_text": "Der Vortrag über Nachhaltigkeit beginnt um 18 Uhr im großen Saal.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Zeit und Ort werden genannt.",
            "order_index": 1,
            "answers": [
              {
                "id": "ob2_h1_q2_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h1_q2_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h1_q3",
            "question_text": "Die Universität Wien bietet dieses Semester keine neuen Deutschkurse an.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es werden neue Kurse angeboten, das Gegenteil wird gesagt.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob2_h1_q3_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h1_q3_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h1_q4",
            "question_text": "Der Radweg entlang der Donau wurde kürzlich um zehn Kilometer verlängert.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Verlängerung wird bestätigt.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob2_h1_q4_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h1_q4_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h1_q5",
            "question_text": "Das neue Einkaufszentrum eröffnet erst im nächsten Jahr.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Eröffnung ist erst im nächsten Jahr.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob2_h1_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h1_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h1_q6",
            "question_text": "Die Stadtbücherei verlangt für die Mitgliedschaft eine einmalige Gebühr von 50 Euro.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Mitgliedschaft ist kostenlos oder günstiger, nicht 50 Euro einmalig laut Ansage.",
            "order_index": 5,
            "answers": [
              {
                "id": "ob2_h1_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h1_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h1_q7",
            "question_text": "Der Wetterdienst erwartet am Wochenende starke Gewitter.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Vorhersage nennt starke Gewitter.",
            "order_index": 6,
            "answers": [
              {
                "id": "ob2_h1_q7_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h1_q7_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h1_q8",
            "question_text": "Die Firma stellt aktuell keine neuen Mitarbeitenden ein.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Firma sucht aktuell neue Mitarbeitende.",
            "order_index": 7,
            "answers": [
              {
                "id": "ob2_h1_q8_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h1_q8_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h1_q9",
            "question_text": "Der Flughafen Wien meldet für heute keine Verspätungen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es werden Verspätungen gemeldet.",
            "order_index": 8,
            "answers": [
              {
                "id": "ob2_h1_q9_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h1_q9_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h1_q10",
            "question_text": "Die Volkshochschule bietet ab Herbst auch Onlinekurse an.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Onlinekurse werden ab Herbst angeboten.",
            "order_index": 9,
            "answers": [
              {
                "id": "ob2_h1_q10_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h1_q10_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h1_q11",
            "question_text": "Der Marathon findet dieses Jahr wegen Bauarbeiten nicht statt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Marathon findet trotz Bauarbeiten statt, nur die Route ändert sich.",
            "order_index": 10,
            "answers": [
              {
                "id": "ob2_h1_q11_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h1_q11_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h1_q12",
            "question_text": "Das Schwimmbad hat im Winter geschlossene Öffnungszeiten am Montag.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Montags ist im Winter geschlossen.",
            "order_index": 11,
            "answers": [
              {
                "id": "ob2_h1_q12_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h1_q12_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h1_q13",
            "question_text": "Die neue Buslinie 42 verbindet den Bahnhof mit dem Flughafen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Verbindung wird bestätigt.",
            "order_index": 12,
            "answers": [
              {
                "id": "ob2_h1_q13_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h1_q13_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h1_q14",
            "question_text": "Der Konzertsaal wurde wegen Renovierung für ein Jahr komplett geschlossen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er ist nur für einige Monate geschlossen, nicht ein Jahr.",
            "order_index": 13,
            "answers": [
              {
                "id": "ob2_h1_q14_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h1_q14_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h1_q15",
            "question_text": "Die Stadtverwaltung erhöht ab Januar die Parkgebühren.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Erhöhung ab Januar wird bestätigt.",
            "order_index": 14,
            "answers": [
              {
                "id": "ob2_h1_q15_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h1_q15_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h1_q16",
            "question_text": "Für die Ausstellung wird kein Eintritt verlangt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Eintritt ist frei.",
            "order_index": 15,
            "answers": [
              {
                "id": "ob2_h1_q16_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h1_q16_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h1_q17",
            "question_text": "Die Universität schließt ihre Mensa während der Semesterferien komplett.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Mensa bleibt eingeschränkt geöffnet.",
            "order_index": 16,
            "answers": [
              {
                "id": "ob2_h1_q17_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h1_q17_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h1_q18",
            "question_text": "Der neue Fahrplan der Straßenbahn gilt ab dem 1. September.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Das Datum wird genau genannt.",
            "order_index": 17,
            "answers": [
              {
                "id": "ob2_h1_q18_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h1_q18_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h1_q19",
            "question_text": "Im Stadtpark ist das Grillen ganzjährig ohne Einschränkung erlaubt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es gibt spezielle Grillzonen und Zeiten.",
            "order_index": 18,
            "answers": [
              {
                "id": "ob2_h1_q19_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h1_q19_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h1_q20",
            "question_text": "Die Volkshochschule bietet kostenlose Beratungsgespräche für neue Kursteilnehmende an.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Kostenlose Beratung wird angeboten.",
            "order_index": 19,
            "answers": [
              {
                "id": "ob2_h1_q20_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h1_q20_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          }
        ],
        "audio_url": "/audio/test_osd_b2__hoeren1.mp3"
      },
      {
        "key": "hoeren2",
        "name": "Hören — Teil 2 (Transkript)",
        "type": "listening",
        "official_duration_minutes": 30,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص المقابلة كما لو كنت تسمعها، ثم حدد صحة كل جملة.",
        "passage": "Interview mit einem Ökonomen:\n\"Moderatorin: Herr Doktor Wagner, wie bewerten Sie die Ergebnisse der Pilotprojekte zur Vier-Tage-Woche?\nHerr Wagner: Insgesamt sehr positiv. Die Produktivität pro Stunde ist sogar leicht gestiegen, weil die Mitarbeitenden konzentrierter arbeiten. Allerdings brauchen kleinere Betriebe oft mehr Zeit für die Umstellung als große Konzerne, weil ihnen die Ressourcen für eine professionelle Prozessanalyse fehlen. Ein weiterer wichtiger Faktor ist die Branche: Im Dienstleistungssektor funktioniert das Modell meist besser als in der Produktion, wo Maschinen ohnehin durchgehend laufen müssen. Wir empfehlen Unternehmen daher, zunächst eine Testphase von sechs Monaten einzuplanen, bevor sie sich endgültig festlegen. Interessant ist auch, dass die Fluktuation in den getesteten Betrieben um etwa 15 Prozent gesunken ist, was langfristig erhebliche Kosten für die Personalsuche spart.\"",
        "items": [
          {
            "id": "ob2_h2_q1",
            "question_text": "Herr Wagner bewertet die Ergebnisse insgesamt positiv.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er sagt \"insgesamt sehr positiv\".",
            "order_index": 0,
            "answers": [
              {
                "id": "ob2_h2_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h2_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h2_q2",
            "question_text": "Die Produktivität pro Stunde ist gesunken.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie ist laut Wagner leicht gestiegen.",
            "order_index": 1,
            "answers": [
              {
                "id": "ob2_h2_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h2_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h2_q3",
            "question_text": "Mitarbeitende arbeiten laut Wagner konzentrierter.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er nennt genau diesen Grund für die höhere Produktivität.",
            "order_index": 2,
            "answers": [
              {
                "id": "ob2_h2_q3_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h2_q3_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h2_q4",
            "question_text": "Kleinere Betriebe brauchen weniger Zeit für die Umstellung als große Konzerne.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie brauchen laut Wagner mehr Zeit.",
            "order_index": 3,
            "answers": [
              {
                "id": "ob2_h2_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h2_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h2_q5",
            "question_text": "Kleineren Betrieben fehlen oft Ressourcen für eine Prozessanalyse.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Wagner nennt genau diesen Grund.",
            "order_index": 4,
            "answers": [
              {
                "id": "ob2_h2_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h2_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h2_q6",
            "question_text": "Das Modell funktioniert laut Wagner in der Produktion meist besser als im Dienstleistungssektor.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es ist umgekehrt: im Dienstleistungssektor funktioniert es meist besser.",
            "order_index": 5,
            "answers": [
              {
                "id": "ob2_h2_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h2_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h2_q7",
            "question_text": "In der Produktion müssen Maschinen oft durchgehend laufen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Wagner nennt genau diesen Grund.",
            "order_index": 6,
            "answers": [
              {
                "id": "ob2_h2_q7_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h2_q7_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h2_q8",
            "question_text": "Wagner empfiehlt eine Testphase von sechs Monaten.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er nennt genau diese Empfehlung.",
            "order_index": 7,
            "answers": [
              {
                "id": "ob2_h2_q8_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h2_q8_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h2_q9",
            "question_text": "Unternehmen sollen sich sofort endgültig festlegen, ohne Testphase.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Wagner empfiehlt zuerst eine Testphase.",
            "order_index": 8,
            "answers": [
              {
                "id": "ob2_h2_q9_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h2_q9_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h2_q10",
            "question_text": "Die Fluktuation ist in den getesteten Betrieben gestiegen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie ist um etwa 15 Prozent gesunken.",
            "order_index": 9,
            "answers": [
              {
                "id": "ob2_h2_q10_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h2_q10_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h2_q11",
            "question_text": "Die gesunkene Fluktuation spart langfristig Kosten für die Personalsuche.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Wagner nennt genau diesen Effekt.",
            "order_index": 10,
            "answers": [
              {
                "id": "ob2_h2_q11_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h2_q11_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h2_q12",
            "question_text": "Wagner ist Moderator des Interviews.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er ist der interviewte Ökonom, nicht der Moderator.",
            "order_index": 11,
            "answers": [
              {
                "id": "ob2_h2_q12_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h2_q12_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h2_q13",
            "question_text": "Das Interview handelt von der Vier-Tage-Woche.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Das gesamte Interview dreht sich um dieses Thema.",
            "order_index": 12,
            "answers": [
              {
                "id": "ob2_h2_q13_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h2_q13_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h2_q14",
            "question_text": "Große Konzerne brauchen laut Wagner mehr Zeit für die Umstellung als kleine Betriebe.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es ist umgekehrt.",
            "order_index": 13,
            "answers": [
              {
                "id": "ob2_h2_q14_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h2_q14_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h2_q15",
            "question_text": "Die Fluktuation sank um etwa 15 Prozent.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Wagner nennt genau diese Zahl.",
            "order_index": 14,
            "answers": [
              {
                "id": "ob2_h2_q15_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h2_q15_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h2_q16",
            "question_text": "Wagner sagt, das Thema Branche spiele keine Rolle.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er sagt ausdrücklich, die Branche sei ein wichtiger Faktor.",
            "order_index": 15,
            "answers": [
              {
                "id": "ob2_h2_q16_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h2_q16_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h2_q17",
            "question_text": "Im Dienstleistungssektor funktioniert das Modell laut Wagner meist besser.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er sagt das ausdrücklich.",
            "order_index": 16,
            "answers": [
              {
                "id": "ob2_h2_q17_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h2_q17_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h2_q18",
            "question_text": "Wagner nennt keine konkreten Zahlen im Interview.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er nennt mehrere konkrete Zahlen, z.B. 15 Prozent.",
            "order_index": 17,
            "answers": [
              {
                "id": "ob2_h2_q18_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h2_q18_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "ob2_h2_q19",
            "question_text": "Die Moderatorin fragt nach Wagners Bewertung der Pilotprojekte.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Das ist ihre erste Frage.",
            "order_index": 18,
            "answers": [
              {
                "id": "ob2_h2_q19_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "ob2_h2_q19_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "ob2_h2_q20",
            "question_text": "Laut Wagner ist die Umstellung für alle Betriebe gleich einfach.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er unterscheidet zwischen kleinen und großen Betrieben.",
            "order_index": 19,
            "answers": [
              {
                "id": "ob2_h2_q20_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "ob2_h2_q20_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ],
        "audio_url": "/audio/test_osd_b2__hoeren2.mp3"
      }
    ],
    "writing": {
      "name": "Schreiben (تدريب غير مُقيَّم)",
      "official_duration_minutes": 90,
      "instructions": "في الاختبار الرسمي، تكتب رسالة رسمية وموقفًا رأيًا. هذا تدريب ذاتي غير مُقيَّم آليًا.",
      "prompt": "Schreiben Sie eine Meinungsäußerung (ca. 120 Wörter) zum Thema: \"Sollte die Vier-Tage-Woche gesetzlich verpflichtend werden?\" Nennen Sie Argumente dafür und dagegen und formulieren Sie einen klaren Standpunkt.",
      "sample_answer": "Die Frage, ob die Vier-Tage-Woche gesetzlich verpflichtend werden sollte, wird kontrovers diskutiert. Befürworter argumentieren, dass kürzere Arbeitszeiten die Gesundheit der Beschäftigten verbessern und die Produktivität sogar steigern können, wie erste Pilotprojekte zeigen. Gegner hingegen warnen, dass nicht jede Branche gleich davon profitieren kann, etwa im Gesundheitswesen oder im Handel, wo durchgehende Anwesenheit notwendig ist.\n\nMeiner Meinung nach wäre eine gesetzliche Pflicht zu starr. Sinnvoller erscheint mir, Unternehmen finanzielle Anreize zu bieten, damit sie das Modell freiwillig testen können. So ließe sich herausfinden, in welchen Branchen es tatsächlich funktioniert, ohne alle Betriebe pauschal zu zwingen."
    }
  },
  "test_skill_reading": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Ein Tag im Café\n\nMarwa arbeitet seit drei Monaten als Barista in einem kleinen Café in der Innenstadt. Ihr Arbeitstag beginnt um sieben Uhr morgens, wenn sie den ersten Kaffee für die Frühkunden zubereitet. Am liebsten mag sie die Zeit zwischen acht und neun Uhr, wenn viele Studierende vor der Uni noch schnell einen Cappuccino holen. Nach der Arbeit lernt sie meistens zwei Stunden Deutsch, weil sie nächstes Jahr eine Ausbildung im Gesundheitswesen beginnen möchte.",
        "items": [
          {
            "id": "sr_q1",
            "question_text": "Marwa arbeitet seit drei Monaten als Barista.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt genau das.",
            "order_index": 0,
            "answers": [
              {
                "id": "sr_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "sr_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sr_q2",
            "question_text": "Ihr Arbeitstag beginnt um neun Uhr.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er beginnt um sieben Uhr morgens.",
            "order_index": 1,
            "answers": [
              {
                "id": "sr_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "sr_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "sr_q3",
            "question_text": "Welche Zeit mag Marwa am liebsten?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau diese Zeit.",
            "order_index": 2,
            "answers": [
              {
                "id": "sr_q3_a1",
                "answer_text": "Zwischen acht und neun Uhr",
                "is_correct": true
              },
              {
                "id": "sr_q3_a2",
                "answer_text": "Zwischen sieben und acht Uhr",
                "is_correct": false
              },
              {
                "id": "sr_q3_a3",
                "answer_text": "Am Nachmittag",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sr_q4",
            "question_text": "Wer kommt in dieser Zeit oft ins Café?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt Studierende vor der Uni.",
            "order_index": 3,
            "answers": [
              {
                "id": "sr_q4_a1",
                "answer_text": "Studierende vor der Uni",
                "is_correct": true
              },
              {
                "id": "sr_q4_a2",
                "answer_text": "Kinder nach der Schule",
                "is_correct": false
              },
              {
                "id": "sr_q4_a3",
                "answer_text": "Touristen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sr_q5",
            "question_text": "Marwa lernt nach der Arbeit Deutsch.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt, sie lernt danach zwei Stunden Deutsch.",
            "order_index": 4,
            "answers": [
              {
                "id": "sr_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "sr_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sr_q6",
            "question_text": "Was möchte Marwa nächstes Jahr beginnen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau dieses Ziel.",
            "order_index": 5,
            "answers": [
              {
                "id": "sr_q6_a1",
                "answer_text": "Eine Ausbildung im Gesundheitswesen",
                "is_correct": true
              },
              {
                "id": "sr_q6_a2",
                "answer_text": "Ein Studium",
                "is_correct": false
              },
              {
                "id": "sr_q6_a3",
                "answer_text": "Eine eigene Firma",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص المكالمة كما لو كنت تسمعها، ثم أجب عن الأسئلة.",
        "passage": "Anruf bei der Arztpraxis:\n\"Praxis Dr. Berger, guten Tag.\nGuten Tag, hier ist Amina Saidi. Ich hätte gerne einen Termin für eine allgemeine Untersuchung.\nGerne, haben Sie schon einmal einen Termin bei uns gehabt?\nNein, das ist mein erster Termin hier.\nKein Problem. Ich habe am Donnerstag um 14:30 Uhr einen freien Platz, passt Ihnen das?\nJa, das passt sehr gut.\nPerfekt, bitte bringen Sie Ihre Versichertenkarte und einen Ausweis mit.\nMache ich, vielen Dank!\"",
        "audio_url": "/audio/test_skill_listening__listening1.mp3",
        "items": [
          {
            "id": "sl_q1",
            "question_text": "Wie heißt die anrufende Person?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie stellt sich als Amina Saidi vor.",
            "order_index": 0,
            "answers": [
              {
                "id": "sl_q1_a1",
                "answer_text": "Amina Saidi",
                "is_correct": true
              },
              {
                "id": "sl_q1_a2",
                "answer_text": "Amina Berger",
                "is_correct": false
              },
              {
                "id": "sl_q1_a3",
                "answer_text": "Sara Saidi",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sl_q2",
            "question_text": "Worum bittet sie?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie bittet um einen Termin für eine allgemeine Untersuchung.",
            "order_index": 1,
            "answers": [
              {
                "id": "sl_q2_a1",
                "answer_text": "Um einen Termin für eine allgemeine Untersuchung",
                "is_correct": true
              },
              {
                "id": "sl_q2_a2",
                "answer_text": "Um ein Rezept",
                "is_correct": false
              },
              {
                "id": "sl_q2_a3",
                "answer_text": "Um eine Krankschreibung",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sl_q3",
            "question_text": "Sie hatte schon einmal einen Termin in dieser Praxis.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie sagt, das sei ihr erster Termin dort.",
            "order_index": 2,
            "answers": [
              {
                "id": "sl_q3_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "sl_q3_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "sl_q4",
            "question_text": "An welchem Tag ist der freie Termin?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der freie Platz ist am Donnerstag.",
            "order_index": 3,
            "answers": [
              {
                "id": "sl_q4_a1",
                "answer_text": "Donnerstag",
                "is_correct": true
              },
              {
                "id": "sl_q4_a2",
                "answer_text": "Montag",
                "is_correct": false
              },
              {
                "id": "sl_q4_a3",
                "answer_text": "Freitag",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sl_q5",
            "question_text": "Um wie viel Uhr ist der Termin?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Termin ist um 14:30 Uhr.",
            "order_index": 4,
            "answers": [
              {
                "id": "sl_q5_a1",
                "answer_text": "14:30 Uhr",
                "is_correct": true
              },
              {
                "id": "sl_q5_a2",
                "answer_text": "13:30 Uhr",
                "is_correct": false
              },
              {
                "id": "sl_q5_a3",
                "answer_text": "15:00 Uhr",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sl_q6",
            "question_text": "Was soll sie zum Termin mitbringen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie soll Versichertenkarte und Ausweis mitbringen.",
            "order_index": 5,
            "answers": [
              {
                "id": "sl_q6_a1",
                "answer_text": "Versichertenkarte und Ausweis",
                "is_correct": true
              },
              {
                "id": "sl_q6_a2",
                "answer_text": "Nur den Ausweis",
                "is_correct": false
              },
              {
                "id": "sl_q6_a3",
                "answer_text": "Eine Überweisung vom Hausarzt",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_writing": {
    "sections": [
      {
        "key": "writing1",
        "name": "أساسيات الكتابة",
        "type": "language",
        "official_duration_minutes": null,
        "instructions": "اختر الكلمة أو الأداة الصحيحة لبناء جملة سليمة.",
        "items": [
          {
            "id": "sw_q1",
            "question_text": "Ich habe keine Zeit, ___ ich muss arbeiten.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"weil\" يعطي السبب — مناسب للربط هنا.",
            "order_index": 0,
            "answers": [
              {
                "id": "sw_q1_a1",
                "answer_text": "weil",
                "is_correct": true
              },
              {
                "id": "sw_q1_a2",
                "answer_text": "obwohl",
                "is_correct": false
              },
              {
                "id": "sw_q1_a3",
                "answer_text": "damit",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sw_q2",
            "question_text": "Zuerst frühstücke ich, ___ gehe ich zur Arbeit.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"danach\" يشير إلى الترتيب الزمني.",
            "order_index": 1,
            "answers": [
              {
                "id": "sw_q2_a1",
                "answer_text": "danach",
                "is_correct": true
              },
              {
                "id": "sw_q2_a2",
                "answer_text": "deshalb",
                "is_correct": false
              },
              {
                "id": "sw_q2_a3",
                "answer_text": "obwohl",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sw_q3",
            "question_text": "Er hat viel gelernt, ___ hat er die Prüfung bestanden.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"deshalb\" يعبّر عن النتيجة.",
            "order_index": 2,
            "answers": [
              {
                "id": "sw_q3_a1",
                "answer_text": "deshalb",
                "is_correct": true
              },
              {
                "id": "sw_q3_a2",
                "answer_text": "aber",
                "is_correct": false
              },
              {
                "id": "sw_q3_a3",
                "answer_text": "wenn",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sw_q4",
            "question_text": "Sehr geehrte Damen und Herren, ich schreibe Ihnen ___.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"bezüglich\" + مضاف إليه هي الصيغة الرسمية الصحيحة.",
            "order_index": 3,
            "answers": [
              {
                "id": "sw_q4_a1",
                "answer_text": "bezüglich Ihrer Anzeige",
                "is_correct": true
              },
              {
                "id": "sw_q4_a2",
                "answer_text": "wegen Ihre Anzeige",
                "is_correct": false
              },
              {
                "id": "sw_q4_a3",
                "answer_text": "über Ihre Anzeige, dass",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sw_q5",
            "question_text": "Ich möchte ___ betonen, dass der Termin wichtig ist.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"ausdrücklich betonen\" تعبير صحيح ومتماسك.",
            "order_index": 4,
            "answers": [
              {
                "id": "sw_q5_a1",
                "answer_text": "ausdrücklich",
                "is_correct": true
              },
              {
                "id": "sw_q5_a2",
                "answer_text": "ausdrücklichere",
                "is_correct": false
              },
              {
                "id": "sw_q5_a3",
                "answer_text": "ausdrücken",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sw_q6",
            "question_text": "___ des schlechten Wetters fand die Veranstaltung statt.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"Trotz\" تفيد التضاد (رغم الطقس السيئ).",
            "order_index": 5,
            "answers": [
              {
                "id": "sw_q6_a1",
                "answer_text": "Trotz",
                "is_correct": true
              },
              {
                "id": "sw_q6_a2",
                "answer_text": "Wegen",
                "is_correct": false
              },
              {
                "id": "sw_q6_a3",
                "answer_text": "Ohne",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sw_q7",
            "question_text": "Ich freue mich ___ Ihre Antwort.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"sich freuen auf\" + حالة النصب هي التركيبة الصحيحة.",
            "order_index": 6,
            "answers": [
              {
                "id": "sw_q7_a1",
                "answer_text": "auf",
                "is_correct": true
              },
              {
                "id": "sw_q7_a2",
                "answer_text": "für",
                "is_correct": false
              },
              {
                "id": "sw_q7_a3",
                "answer_text": "an",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_market": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Im Supermarkt\n\nJeden Samstagmorgen geht Yassin mit seiner Mutter zum Supermarkt in der Nähe ihrer Wohnung. Zuerst kaufen sie frisches Obst und Gemüse, weil es dort am günstigsten ist, wenn der Markt gerade geöffnet hat. Danach gehen sie zur Fleischabteilung, wo Yassins Mutter immer mit dem Verkäufer spricht, den sie schon seit Jahren kennt. Am Ende der Einkaufsrunde stehen sie oft lange an der Kasse, weil samstags sehr viele Leute einkaufen. Yassin findet das manchmal anstrengend, aber er hilft trotzdem gerne beim Tragen der Taschen.",
        "items": [
          {
            "id": "srm_q1",
            "question_text": "Yassin geht jeden Samstag mit seiner Mutter einkaufen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt genau das.",
            "order_index": 0,
            "answers": [
              {
                "id": "srm_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "srm_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srm_q2",
            "question_text": "Was kaufen sie zuerst?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt Obst und Gemüse als erste Station.",
            "order_index": 1,
            "answers": [
              {
                "id": "srm_q2_a1",
                "answer_text": "Frisches Obst und Gemüse",
                "is_correct": true
              },
              {
                "id": "srm_q2_a2",
                "answer_text": "Fleisch",
                "is_correct": false
              },
              {
                "id": "srm_q2_a3",
                "answer_text": "Brot",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srm_q3",
            "question_text": "Warum kaufen sie das zuerst?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau diesen Grund.",
            "order_index": 2,
            "answers": [
              {
                "id": "srm_q3_a1",
                "answer_text": "Weil es dann am günstigsten ist",
                "is_correct": true
              },
              {
                "id": "srm_q3_a2",
                "answer_text": "Weil es dann am frischesten ist",
                "is_correct": false
              },
              {
                "id": "srm_q3_a3",
                "answer_text": "Weil dort keine Schlange ist",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srm_q4",
            "question_text": "Yassins Mutter kennt den Verkäufer an der Fleischabteilung nicht.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie kennt ihn schon seit Jahren.",
            "order_index": 3,
            "answers": [
              {
                "id": "srm_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "srm_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "srm_q5",
            "question_text": "Warum stehen sie oft lange an der Kasse?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau diesen Grund.",
            "order_index": 4,
            "answers": [
              {
                "id": "srm_q5_a1",
                "answer_text": "Weil samstags viele Leute einkaufen",
                "is_correct": true
              },
              {
                "id": "srm_q5_a2",
                "answer_text": "Weil die Kasse kaputt ist",
                "is_correct": false
              },
              {
                "id": "srm_q5_a3",
                "answer_text": "Weil sie viel Geld zählen müssen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srm_q6",
            "question_text": "Yassin hilft beim Tragen der Taschen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt, er hilft gerne dabei.",
            "order_index": 5,
            "answers": [
              {
                "id": "srm_q6_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "srm_q6_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_trip": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Ein Ausflug am Wochenende\n\nLetztes Wochenende ist Fatima mit zwei Freundinnen in die Berge gefahren. Sie sind früh um sechs Uhr losgefahren, um den schönen Sonnenaufgang nicht zu verpassen. Nach zwei Stunden Autofahrt haben sie ihr Auto geparkt und sind eine kleine Wanderung gestartet. Der Weg war nicht sehr schwierig, aber ziemlich lang, ungefähr drei Stunden bis zum Gipfel. Oben haben sie zusammen ein Picknick gemacht und die Aussicht genossen. Fatima war so müde, dass sie im Auto auf der Rückfahrt fast eingeschlafen wäre.",
        "items": [
          {
            "id": "srt_q1",
            "question_text": "Wohin ist Fatima gefahren?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt die Berge als Ziel.",
            "order_index": 0,
            "answers": [
              {
                "id": "srt_q1_a1",
                "answer_text": "In die Berge",
                "is_correct": true
              },
              {
                "id": "srt_q1_a2",
                "answer_text": "Ans Meer",
                "is_correct": false
              },
              {
                "id": "srt_q1_a3",
                "answer_text": "In eine andere Stadt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srt_q2",
            "question_text": "Um wie viel Uhr sind sie losgefahren?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt sechs Uhr morgens.",
            "order_index": 1,
            "answers": [
              {
                "id": "srt_q2_a1",
                "answer_text": "Um sechs Uhr",
                "is_correct": true
              },
              {
                "id": "srt_q2_a2",
                "answer_text": "Um acht Uhr",
                "is_correct": false
              },
              {
                "id": "srt_q2_a3",
                "answer_text": "Um zehn Uhr",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srt_q3",
            "question_text": "Sie sind losgefahren, um den Sonnenaufgang zu sehen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text nennt genau diesen Grund.",
            "order_index": 2,
            "answers": [
              {
                "id": "srt_q3_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "srt_q3_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srt_q4",
            "question_text": "Wie lange hat die Wanderung bis zum Gipfel gedauert?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt ungefähr drei Stunden.",
            "order_index": 3,
            "answers": [
              {
                "id": "srt_q4_a1",
                "answer_text": "Ungefähr drei Stunden",
                "is_correct": true
              },
              {
                "id": "srt_q4_a2",
                "answer_text": "Eine Stunde",
                "is_correct": false
              },
              {
                "id": "srt_q4_a3",
                "answer_text": "Fünf Stunden",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srt_q5",
            "question_text": "Der Wanderweg war sehr schwierig.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt, er war nicht sehr schwierig, aber lang.",
            "order_index": 4,
            "answers": [
              {
                "id": "srt_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "srt_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "srt_q6",
            "question_text": "Was haben sie oben gemacht?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt ein Picknick.",
            "order_index": 5,
            "answers": [
              {
                "id": "srt_q6_a1",
                "answer_text": "Ein Picknick gemacht",
                "is_correct": true
              },
              {
                "id": "srt_q6_a2",
                "answer_text": "Fotos verkauft",
                "is_correct": false
              },
              {
                "id": "srt_q6_a3",
                "answer_text": "Ein Zelt aufgebaut",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_neighbor": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Der neue Nachbar\n\nSeit letzter Woche wohnt ein neuer Nachbar im dritten Stock, direkt über der Wohnung von Herrn Alaoui. Der junge Mann heißt Tom und kommt ursprünglich aus Hamburg, wo er als Ingenieur gearbeitet hat. Er ist wegen einer neuen Stelle in die Stadt gezogen und kennt hier noch niemanden. Gestern hat Herr Alaoui ihn zufällig im Treppenhaus getroffen und ihn zu einem Kaffee eingeladen. Tom hat sich sehr gefreut, weil er sich in der neuen Stadt noch etwas einsam gefühlt hat. Sie haben sich fast zwei Stunden lang unterhalten.",
        "items": [
          {
            "id": "srn_q1",
            "question_text": "In welchem Stock wohnt der neue Nachbar?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt den dritten Stock.",
            "order_index": 0,
            "answers": [
              {
                "id": "srn_q1_a1",
                "answer_text": "Im dritten Stock",
                "is_correct": true
              },
              {
                "id": "srn_q1_a2",
                "answer_text": "Im ersten Stock",
                "is_correct": false
              },
              {
                "id": "srn_q1_a3",
                "answer_text": "Im Erdgeschoss",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srn_q2",
            "question_text": "Woher kommt Tom ursprünglich?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt Hamburg.",
            "order_index": 1,
            "answers": [
              {
                "id": "srn_q2_a1",
                "answer_text": "Aus Hamburg",
                "is_correct": true
              },
              {
                "id": "srn_q2_a2",
                "answer_text": "Aus Berlin",
                "is_correct": false
              },
              {
                "id": "srn_q2_a3",
                "answer_text": "Aus München",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srn_q3",
            "question_text": "Tom ist wegen einer neuen Stelle umgezogen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text nennt genau diesen Grund.",
            "order_index": 2,
            "answers": [
              {
                "id": "srn_q3_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "srn_q3_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srn_q4",
            "question_text": "Wo haben sich Herr Alaoui und Tom getroffen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt das Treppenhaus.",
            "order_index": 3,
            "answers": [
              {
                "id": "srn_q4_a1",
                "answer_text": "Im Treppenhaus",
                "is_correct": true
              },
              {
                "id": "srn_q4_a2",
                "answer_text": "Im Supermarkt",
                "is_correct": false
              },
              {
                "id": "srn_q4_a3",
                "answer_text": "Im Park",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srn_q5",
            "question_text": "Tom kannte schon viele Leute in der neuen Stadt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er kannte noch niemanden und fühlte sich einsam.",
            "order_index": 4,
            "answers": [
              {
                "id": "srn_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "srn_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "srn_q6",
            "question_text": "Wie lange haben sie sich unterhalten?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt fast zwei Stunden.",
            "order_index": 5,
            "answers": [
              {
                "id": "srn_q6_a1",
                "answer_text": "Fast zwei Stunden",
                "is_correct": true
              },
              {
                "id": "srn_q6_a2",
                "answer_text": "Zehn Minuten",
                "is_correct": false
              },
              {
                "id": "srn_q6_a3",
                "answer_text": "Den ganzen Tag",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_restaurant": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص المكالمة كما لو كنت تسمعها، ثم أجب عن الأسئلة.",
        "passage": "Anruf im Restaurant:\n\"Restaurant Alpenblick, guten Abend.\nGuten Abend, ich möchte gerne einen Tisch reservieren, für Freitagabend.\nGerne, für wie viele Personen?\nFür vier Personen, bitte.\nUm wie viel Uhr möchten Sie kommen?\nUm 20 Uhr, wenn das möglich ist.\nJa, das passt gut. Auf welchen Namen darf ich reservieren?\nAuf den Namen Karim Idrissi.\nSehr gerne, Herr Idrissi. Haben Sie noch besondere Wünsche, zum Beispiel einen Tisch am Fenster?\nJa, wenn möglich, gerne am Fenster.\nKein Problem, wir notieren das. Bis Freitag!\"",
        "audio_url": "/audio/test_skill_listening_restaurant__listening1.mp3",
        "items": [
          {
            "id": "slr_q1",
            "question_text": "Für welchen Tag reserviert die Person?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Anrufer nennt Freitagabend.",
            "order_index": 0,
            "answers": [
              {
                "id": "slr_q1_a1",
                "answer_text": "Freitagabend",
                "is_correct": true
              },
              {
                "id": "slr_q1_a2",
                "answer_text": "Samstagabend",
                "is_correct": false
              },
              {
                "id": "slr_q1_a3",
                "answer_text": "Sonntagmittag",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slr_q2",
            "question_text": "Für wie viele Personen ist die Reservierung?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Anrufer nennt vier Personen.",
            "order_index": 1,
            "answers": [
              {
                "id": "slr_q2_a1",
                "answer_text": "Vier Personen",
                "is_correct": true
              },
              {
                "id": "slr_q2_a2",
                "answer_text": "Zwei Personen",
                "is_correct": false
              },
              {
                "id": "slr_q2_a3",
                "answer_text": "Sechs Personen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slr_q3",
            "question_text": "Um wie viel Uhr möchte er kommen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Anrufer nennt 20 Uhr.",
            "order_index": 2,
            "answers": [
              {
                "id": "slr_q3_a1",
                "answer_text": "Um 20 Uhr",
                "is_correct": true
              },
              {
                "id": "slr_q3_a2",
                "answer_text": "Um 19 Uhr",
                "is_correct": false
              },
              {
                "id": "slr_q3_a3",
                "answer_text": "Um 21 Uhr",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slr_q4",
            "question_text": "Auf welchen Namen wird reserviert?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Anrufer nennt den Namen Karim Idrissi.",
            "order_index": 3,
            "answers": [
              {
                "id": "slr_q4_a1",
                "answer_text": "Karim Idrissi",
                "is_correct": true
              },
              {
                "id": "slr_q4_a2",
                "answer_text": "Karim Alaoui",
                "is_correct": false
              },
              {
                "id": "slr_q4_a3",
                "answer_text": "Yassin Idrissi",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slr_q5",
            "question_text": "Er möchte einen Tisch am Fenster.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er bittet um einen Tisch am Fenster.",
            "order_index": 4,
            "answers": [
              {
                "id": "slr_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "slr_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slr_q6",
            "question_text": "Die Reservierung war nicht möglich.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Reservierung wurde bestätigt.",
            "order_index": 5,
            "answers": [
              {
                "id": "slr_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "slr_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_directions": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص الحوار كما لو كنت تسمعه، ثم أجب عن الأسئلة.",
        "passage": "Auf der Straße:\n\"Entschuldigung, wissen Sie, wo die Post ist?\nJa klar, gehen Sie hier geradeaus bis zur Ampel, dann links.\nUnd dann?\nDann sehen Sie eine Bäckerei auf der rechten Seite, direkt danach ist die Post.\nWie weit ist das von hier?\nUngefähr zehn Minuten zu Fuß.\nVielen Dank für Ihre Hilfe!\nKein Problem, einen schönen Tag noch!\"",
        "audio_url": "/audio/test_skill_listening_directions__listening1.mp3",
        "items": [
          {
            "id": "sld_q1",
            "question_text": "Wonach fragt die Person?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Person fragt nach der Post.",
            "order_index": 0,
            "answers": [
              {
                "id": "sld_q1_a1",
                "answer_text": "Nach dem Weg zur Post",
                "is_correct": true
              },
              {
                "id": "sld_q1_a2",
                "answer_text": "Nach dem Weg zum Bahnhof",
                "is_correct": false
              },
              {
                "id": "sld_q1_a3",
                "answer_text": "Nach der Uhrzeit",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sld_q2",
            "question_text": "Was soll man zuerst tun?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Man soll zuerst geradeaus bis zur Ampel gehen.",
            "order_index": 1,
            "answers": [
              {
                "id": "sld_q2_a1",
                "answer_text": "Geradeaus bis zur Ampel gehen",
                "is_correct": true
              },
              {
                "id": "sld_q2_a2",
                "answer_text": "Sofort links abbiegen",
                "is_correct": false
              },
              {
                "id": "sld_q2_a3",
                "answer_text": "Die Straße überqueren",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sld_q3",
            "question_text": "In welche Richtung soll man an der Ampel abbiegen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "An der Ampel soll man links abbiegen.",
            "order_index": 2,
            "answers": [
              {
                "id": "sld_q3_a1",
                "answer_text": "Links",
                "is_correct": true
              },
              {
                "id": "sld_q3_a2",
                "answer_text": "Rechts",
                "is_correct": false
              },
              {
                "id": "sld_q3_a3",
                "answer_text": "Geradeaus weiter",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sld_q4",
            "question_text": "Neben der Post ist eine Bäckerei.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Direkt vor der Post ist eine Bäckerei.",
            "order_index": 3,
            "answers": [
              {
                "id": "sld_q4_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "sld_q4_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sld_q5",
            "question_text": "Wie lange dauert der Weg zu Fuß?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Weg dauert ungefähr zehn Minuten.",
            "order_index": 4,
            "answers": [
              {
                "id": "sld_q5_a1",
                "answer_text": "Ungefähr zehn Minuten",
                "is_correct": true
              },
              {
                "id": "sld_q5_a2",
                "answer_text": "Fünf Minuten",
                "is_correct": false
              },
              {
                "id": "sld_q5_a3",
                "answer_text": "Eine halbe Stunde",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sld_q6",
            "question_text": "Die Bäckerei ist auf der linken Seite.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Bäckerei ist auf der rechten Seite.",
            "order_index": 5,
            "answers": [
              {
                "id": "sld_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "sld_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_writing_formal": {
    "sections": [
      {
        "key": "writing1",
        "name": "الأسلوب الرسمي",
        "type": "language",
        "official_duration_minutes": null,
        "instructions": "اختر الصيغة الرسمية الصحيحة المناسبة لرسالة أو بريد إلكتروني رسمي.",
        "items": [
          {
            "id": "swf_q1",
            "question_text": "بداية رسالة رسمية إلى شخص لا تعرف اسمه:",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"Sehr geehrte Damen und Herren\" هي الصيغة الرسمية المعتمدة.",
            "order_index": 0,
            "answers": [
              {
                "id": "swf_q1_a1",
                "answer_text": "Sehr geehrte Damen und Herren,",
                "is_correct": true
              },
              {
                "id": "swf_q1_a2",
                "answer_text": "Hallo zusammen,",
                "is_correct": false
              },
              {
                "id": "swf_q1_a3",
                "answer_text": "Hi,",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swf_q2",
            "question_text": "طلب معلومات بشكل رسمي:",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "الصيغة الشرطية المهذبة مناسبة للسياق الرسمي.",
            "order_index": 1,
            "answers": [
              {
                "id": "swf_q2_a1",
                "answer_text": "Ich würde mich freuen, wenn Sie mir mitteilen könnten...",
                "is_correct": true
              },
              {
                "id": "swf_q2_a2",
                "answer_text": "Sag mir bitte...",
                "is_correct": false
              },
              {
                "id": "swf_q2_a3",
                "answer_text": "Ich will wissen...",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swf_q3",
            "question_text": "إنهاء رسالة رسمية:",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"Mit freundlichen Grüßen\" هي الخاتمة الرسمية المعتادة.",
            "order_index": 2,
            "answers": [
              {
                "id": "swf_q3_a1",
                "answer_text": "Mit freundlichen Grüßen",
                "is_correct": true
              },
              {
                "id": "swf_q3_a2",
                "answer_text": "Bis bald",
                "is_correct": false
              },
              {
                "id": "swf_q3_a3",
                "answer_text": "Tschüss",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swf_q4",
            "question_text": "الإشارة إلى مرفق في البريد الإلكتروني:",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "صيغة رسمية معتادة للإشارة إلى مرفقات.",
            "order_index": 3,
            "answers": [
              {
                "id": "swf_q4_a1",
                "answer_text": "Anbei finden Sie die gewünschten Unterlagen.",
                "is_correct": true
              },
              {
                "id": "swf_q4_a2",
                "answer_text": "Hier sind die Sachen.",
                "is_correct": false
              },
              {
                "id": "swf_q4_a3",
                "answer_text": "Ich habe was angehängt.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swf_q5",
            "question_text": "الاعتذار بشكل رسمي عن تأخير:",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "صيغة رسمية للاعتذار.",
            "order_index": 4,
            "answers": [
              {
                "id": "swf_q5_a1",
                "answer_text": "Ich bitte um Entschuldigung für die Verzögerung.",
                "is_correct": true
              },
              {
                "id": "swf_q5_a2",
                "answer_text": "Sorry für die Verspätung.",
                "is_correct": false
              },
              {
                "id": "swf_q5_a3",
                "answer_text": "Tut mir leid, war spät dran.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swf_q6",
            "question_text": "طلب رد بشكل رسمي:",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "صيغة رسمية لطلب الرد.",
            "order_index": 5,
            "answers": [
              {
                "id": "swf_q6_a1",
                "answer_text": "Ich freue mich auf Ihre Rückmeldung.",
                "is_correct": true
              },
              {
                "id": "swf_q6_a2",
                "answer_text": "Schreib mir zurück.",
                "is_correct": false
              },
              {
                "id": "swf_q6_a3",
                "answer_text": "Antworte schnell.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swf_q7",
            "question_text": "الإشارة إلى مكالمة سابقة رسميًا:",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "صيغة رسمية للإشارة إلى مكالمة سابقة.",
            "order_index": 6,
            "answers": [
              {
                "id": "swf_q7_a1",
                "answer_text": "Bezugnehmend auf unser Telefongespräch...",
                "is_correct": true
              },
              {
                "id": "swf_q7_a2",
                "answer_text": "Wegen dem Anruf...",
                "is_correct": false
              },
              {
                "id": "swf_q7_a3",
                "answer_text": "Also, das Telefonat...",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_writing_clauses": {
    "sections": [
      {
        "key": "writing1",
        "name": "الجمل الفرعية",
        "type": "language",
        "official_duration_minutes": null,
        "instructions": "اختر الأداة الصحيحة لربط الجملتين في جملة واحدة سليمة.",
        "items": [
          {
            "id": "swc_q1",
            "question_text": "Ich bleibe zu Hause, ___ es regnet.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"weil\" يعطي السبب.",
            "order_index": 0,
            "answers": [
              {
                "id": "swc_q1_a1",
                "answer_text": "weil",
                "is_correct": true
              },
              {
                "id": "swc_q1_a2",
                "answer_text": "obwohl",
                "is_correct": false
              },
              {
                "id": "swc_q1_a3",
                "answer_text": "damit",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swc_q2",
            "question_text": "___ ich Zeit habe, rufe ich dich an.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"Wenn\" يفيد الشرط الزمني.",
            "order_index": 1,
            "answers": [
              {
                "id": "swc_q2_a1",
                "answer_text": "Wenn",
                "is_correct": true
              },
              {
                "id": "swc_q2_a2",
                "answer_text": "Obwohl",
                "is_correct": false
              },
              {
                "id": "swc_q2_a3",
                "answer_text": "Damit",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swc_q3",
            "question_text": "Sie lernt jeden Tag, ___ die Prüfung zu bestehen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"um ... zu\" يعبّر عن الهدف.",
            "order_index": 2,
            "answers": [
              {
                "id": "swc_q3_a1",
                "answer_text": "um",
                "is_correct": true
              },
              {
                "id": "swc_q3_a2",
                "answer_text": "weil",
                "is_correct": false
              },
              {
                "id": "swc_q3_a3",
                "answer_text": "obwohl",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swc_q4",
            "question_text": "Er ist müde, ___ er hat gut geschlafen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"obwohl\" يفيد التضاد المنطقي.",
            "order_index": 3,
            "answers": [
              {
                "id": "swc_q4_a1",
                "answer_text": "obwohl",
                "is_correct": true
              },
              {
                "id": "swc_q4_a2",
                "answer_text": "weil",
                "is_correct": false
              },
              {
                "id": "swc_q4_a3",
                "answer_text": "wenn",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swc_q5",
            "question_text": "Ich weiß nicht, ___ er heute kommt.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"ob\" تُستخدم للسؤال غير المباشر.",
            "order_index": 4,
            "answers": [
              {
                "id": "swc_q5_a1",
                "answer_text": "ob",
                "is_correct": true
              },
              {
                "id": "swc_q5_a2",
                "answer_text": "dass",
                "is_correct": false
              },
              {
                "id": "swc_q5_a3",
                "answer_text": "weil",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swc_q6",
            "question_text": "Sie hat mir gesagt, ___ sie später kommt.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"dass\" تُستخدم لنقل جملة خبرية.",
            "order_index": 5,
            "answers": [
              {
                "id": "swc_q6_a1",
                "answer_text": "dass",
                "is_correct": true
              },
              {
                "id": "swc_q6_a2",
                "answer_text": "ob",
                "is_correct": false
              },
              {
                "id": "swc_q6_a3",
                "answer_text": "wenn",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swc_q7",
            "question_text": "___ das Wetter schlecht war, sind wir spazieren gegangen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"Obwohl\" يفيد التضاد.",
            "order_index": 6,
            "answers": [
              {
                "id": "swc_q7_a1",
                "answer_text": "Obwohl",
                "is_correct": true
              },
              {
                "id": "swc_q7_a2",
                "answer_text": "Weil",
                "is_correct": false
              },
              {
                "id": "swc_q7_a3",
                "answer_text": "Damit",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_dentist": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Beim Zahnarzt\n\nOmar hatte seit zwei Tagen starke Zahnschmerzen und hat deshalb sofort einen Termin bei seiner Zahnärztin vereinbart. Im Wartezimmer musste er nur zehn Minuten warten, bevor er aufgerufen wurde. Die Zahnärztin hat den Zahn genau untersucht und festgestellt, dass er behandelt werden muss. Die Behandlung hat ungefähr eine halbe Stunde gedauert und war weniger schmerzhaft, als Omar erwartet hatte. Am Ende hat ihm die Assistentin erklärt, wie er den Zahn in den nächsten Tagen pflegen soll. Omar war froh, dass er nicht länger gewartet hatte.",
        "items": [
          {
            "id": "srd_q1",
            "question_text": "Omar hatte zwei Tage lang Zahnschmerzen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt genau das.",
            "order_index": 0,
            "answers": [
              {
                "id": "srd_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "srd_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srd_q2",
            "question_text": "Wie lange musste er im Wartezimmer warten?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt zehn Minuten.",
            "order_index": 1,
            "answers": [
              {
                "id": "srd_q2_a1",
                "answer_text": "Zehn Minuten",
                "is_correct": true
              },
              {
                "id": "srd_q2_a2",
                "answer_text": "Eine Stunde",
                "is_correct": false
              },
              {
                "id": "srd_q2_a3",
                "answer_text": "Fünf Minuten",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srd_q3",
            "question_text": "Der Zahn musste nicht behandelt werden.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Zahnärztin stellte fest, dass er behandelt werden muss.",
            "order_index": 2,
            "answers": [
              {
                "id": "srd_q3_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "srd_q3_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "srd_q4",
            "question_text": "Wie lange hat die Behandlung gedauert?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt eine halbe Stunde.",
            "order_index": 3,
            "answers": [
              {
                "id": "srd_q4_a1",
                "answer_text": "Ungefähr eine halbe Stunde",
                "is_correct": true
              },
              {
                "id": "srd_q4_a2",
                "answer_text": "Fünf Minuten",
                "is_correct": false
              },
              {
                "id": "srd_q4_a3",
                "answer_text": "Zwei Stunden",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srd_q5",
            "question_text": "Wie war die Behandlung im Vergleich zu Omars Erwartung?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text sagt, sie war weniger schmerzhaft.",
            "order_index": 4,
            "answers": [
              {
                "id": "srd_q5_a1",
                "answer_text": "Weniger schmerzhaft als erwartet",
                "is_correct": true
              },
              {
                "id": "srd_q5_a2",
                "answer_text": "Schmerzhafter als erwartet",
                "is_correct": false
              },
              {
                "id": "srd_q5_a3",
                "answer_text": "Genau wie erwartet",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srd_q6",
            "question_text": "Wer hat Omar erklärt, wie er den Zahn pflegen soll?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt die Assistentin.",
            "order_index": 5,
            "answers": [
              {
                "id": "srd_q6_a1",
                "answer_text": "Die Assistentin",
                "is_correct": true
              },
              {
                "id": "srd_q6_a2",
                "answer_text": "Die Zahnärztin",
                "is_correct": false
              },
              {
                "id": "srd_q6_a3",
                "answer_text": "Ein anderer Patient",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_birthday": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Ein Geburtstagsfest\n\nNächsten Samstag wird Leila dreißig Jahre alt, und ihre beste Freundin Sara organisiert heimlich eine Überraschungsparty. Sie hat schon zwölf Freunde eingeladen und einen kleinen Saal in der Nähe des Parks gemietet. Damit Leila nichts merkt, hat Sara ihr erzählt, sie würden nur zu zweit essen gehen. Am Samstagabend soll Leila zuerst zu Saras Wohnung kommen, und von dort gehen beide gemeinsam zum Saal. Alle Gäste warten schon drinnen und werden \"Herzlichen Glückwunsch\" rufen, sobald Leila die Tür öffnet. Sara hofft, dass ihre Freundin sich wirklich freut.",
        "items": [
          {
            "id": "sbd_q1",
            "question_text": "Wie alt wird Leila?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt dreißig Jahre.",
            "order_index": 0,
            "answers": [
              {
                "id": "sbd_q1_a1",
                "answer_text": "Dreißig Jahre",
                "is_correct": true
              },
              {
                "id": "sbd_q1_a2",
                "answer_text": "Fünfundzwanzig Jahre",
                "is_correct": false
              },
              {
                "id": "sbd_q1_a3",
                "answer_text": "Vierzig Jahre",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbd_q2",
            "question_text": "Wer organisiert die Party?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt Sara als Organisatorin.",
            "order_index": 1,
            "answers": [
              {
                "id": "sbd_q2_a1",
                "answer_text": "Sara, ihre beste Freundin",
                "is_correct": true
              },
              {
                "id": "sbd_q2_a2",
                "answer_text": "Leilas Mutter",
                "is_correct": false
              },
              {
                "id": "sbd_q2_a3",
                "answer_text": "Ein Kollege",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbd_q3",
            "question_text": "Sara hat Leila von der Party erzählt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es ist eine Überraschungsparty, Leila weiß nichts davon.",
            "order_index": 2,
            "answers": [
              {
                "id": "sbd_q3_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "sbd_q3_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "sbd_q4",
            "question_text": "Wie viele Freunde hat Sara eingeladen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt zwölf Freunde.",
            "order_index": 3,
            "answers": [
              {
                "id": "sbd_q4_a1",
                "answer_text": "Zwölf",
                "is_correct": true
              },
              {
                "id": "sbd_q4_a2",
                "answer_text": "Fünf",
                "is_correct": false
              },
              {
                "id": "sbd_q4_a3",
                "answer_text": "Zwanzig",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbd_q5",
            "question_text": "Was hat Sara Leila erzählt, um sie nicht misstrauisch zu machen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau diese Ausrede.",
            "order_index": 4,
            "answers": [
              {
                "id": "sbd_q5_a1",
                "answer_text": "Dass sie nur zu zweit essen gehen",
                "is_correct": true
              },
              {
                "id": "sbd_q5_a2",
                "answer_text": "Dass sie zu Hause bleiben",
                "is_correct": false
              },
              {
                "id": "sbd_q5_a3",
                "answer_text": "Dass die Party abgesagt wurde",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbd_q6",
            "question_text": "Die Gäste warten schon im Saal.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt, alle Gäste warten schon drinnen.",
            "order_index": 5,
            "answers": [
              {
                "id": "sbd_q6_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "sbd_q6_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_library": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Die öffentliche Bibliothek\n\nAls Karim in seine neue Stadt gezogen ist, wollte er sich sofort einen Bibliotheksausweis besorgen, weil er gerne liest. An der Anmeldung musste er seinen Personalausweis und einen Nachweis seiner neuen Adresse vorlegen. Die Mitarbeiterin hat ihm erklärt, dass die Anmeldung für das erste Jahr kostenlos ist. Danach kostet sie zehn Euro pro Jahr. Karim darf jetzt bis zu fünf Bücher gleichzeitig ausleihen, für eine Dauer von vier Wochen. Wenn er ein Buch später zurückbringt, muss er eine kleine Gebühr bezahlen. Karim war sehr zufrieden und hat sich direkt drei Bücher ausgeliehen.",
        "items": [
          {
            "id": "sbl_q1",
            "question_text": "Karim wollte einen Bibliotheksausweis, weil er gerne liest.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text nennt genau diesen Grund.",
            "order_index": 0,
            "answers": [
              {
                "id": "sbl_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "sbl_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbl_q2",
            "question_text": "Was musste Karim bei der Anmeldung vorlegen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt beide Dokumente.",
            "order_index": 1,
            "answers": [
              {
                "id": "sbl_q2_a1",
                "answer_text": "Personalausweis und Adressnachweis",
                "is_correct": true
              },
              {
                "id": "sbl_q2_a2",
                "answer_text": "Nur seinen Reisepass",
                "is_correct": false
              },
              {
                "id": "sbl_q2_a3",
                "answer_text": "Eine Bankkarte",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbl_q3",
            "question_text": "Wie viel kostet die Anmeldung im ersten Jahr?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Das erste Jahr ist kostenlos laut Text.",
            "order_index": 2,
            "answers": [
              {
                "id": "sbl_q3_a1",
                "answer_text": "Nichts, sie ist kostenlos",
                "is_correct": true
              },
              {
                "id": "sbl_q3_a2",
                "answer_text": "Zehn Euro",
                "is_correct": false
              },
              {
                "id": "sbl_q3_a3",
                "answer_text": "Zwanzig Euro",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbl_q4",
            "question_text": "Wie viele Bücher darf Karim gleichzeitig ausleihen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt bis zu fünf Bücher.",
            "order_index": 3,
            "answers": [
              {
                "id": "sbl_q4_a1",
                "answer_text": "Bis zu fünf",
                "is_correct": true
              },
              {
                "id": "sbl_q4_a2",
                "answer_text": "Nur zwei",
                "is_correct": false
              },
              {
                "id": "sbl_q4_a3",
                "answer_text": "Zehn",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbl_q5",
            "question_text": "Karim muss keine Gebühr zahlen, wenn er ein Buch zu spät zurückbringt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er muss eine kleine Gebühr bezahlen.",
            "order_index": 4,
            "answers": [
              {
                "id": "sbl_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "sbl_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "sbl_q6",
            "question_text": "Wie viele Bücher hat sich Karim direkt ausgeliehen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt drei Bücher.",
            "order_index": 5,
            "answers": [
              {
                "id": "sbl_q6_a1",
                "answer_text": "Drei",
                "is_correct": true
              },
              {
                "id": "sbl_q6_a2",
                "answer_text": "Fünf",
                "is_correct": false
              },
              {
                "id": "sbl_q6_a3",
                "answer_text": "Eins",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_phone": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Ein neues Handy kaufen\n\nNadias altes Handy funktioniert seit einigen Wochen nicht mehr richtig, deshalb hat sie beschlossen, ein neues zu kaufen. Sie ist in ein großes Elektronikgeschäft gegangen und hat sich von einem Verkäufer beraten lassen. Zuerst wollte sie ein sehr teures Modell kaufen, aber der Verkäufer hat ihr ein günstigeres Handy mit ähnlichen Funktionen empfohlen. Nadia hat sich für dieses Modell entschieden, weil es einen großen Speicher und eine gute Kamera hat. Sie hat auch eine Schutzhülle und eine Versicherung dazugekauft. Insgesamt hat sie etwas weniger bezahlt, als sie geplant hatte.",
        "items": [
          {
            "id": "sbp_q1",
            "question_text": "Warum wollte Nadia ein neues Handy kaufen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau diesen Grund.",
            "order_index": 0,
            "answers": [
              {
                "id": "sbp_q1_a1",
                "answer_text": "Ihr altes funktioniert nicht mehr richtig",
                "is_correct": true
              },
              {
                "id": "sbp_q1_a2",
                "answer_text": "Sie wollte ein Geschenk kaufen",
                "is_correct": false
              },
              {
                "id": "sbp_q1_a3",
                "answer_text": "Ihr Handy wurde gestohlen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbp_q2",
            "question_text": "Nadia hat sich von einem Verkäufer beraten lassen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt genau das.",
            "order_index": 1,
            "answers": [
              {
                "id": "sbp_q2_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "sbp_q2_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbp_q3",
            "question_text": "Welches Modell hat der Verkäufer empfohlen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau diese Empfehlung.",
            "order_index": 2,
            "answers": [
              {
                "id": "sbp_q3_a1",
                "answer_text": "Ein günstigeres Modell mit ähnlichen Funktionen",
                "is_correct": true
              },
              {
                "id": "sbp_q3_a2",
                "answer_text": "Das teuerste Modell im Geschäft",
                "is_correct": false
              },
              {
                "id": "sbp_q3_a3",
                "answer_text": "Ein gebrauchtes Handy",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbp_q4",
            "question_text": "Warum hat sich Nadia für dieses Modell entschieden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt Speicher und Kamera als Gründe.",
            "order_index": 3,
            "answers": [
              {
                "id": "sbp_q4_a1",
                "answer_text": "Wegen des Speichers und der Kamera",
                "is_correct": true
              },
              {
                "id": "sbp_q4_a2",
                "answer_text": "Wegen der Farbe",
                "is_correct": false
              },
              {
                "id": "sbp_q4_a3",
                "answer_text": "Weil es das billigste war",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbp_q5",
            "question_text": "Nadia hat nur das Handy gekauft, sonst nichts.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie hat auch eine Hülle und eine Versicherung gekauft.",
            "order_index": 4,
            "answers": [
              {
                "id": "sbp_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "sbp_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "sbp_q6",
            "question_text": "Wie viel hat Nadia am Ende bezahlt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt etwas weniger als geplant.",
            "order_index": 5,
            "answers": [
              {
                "id": "sbp_q6_a1",
                "answer_text": "Etwas weniger, als sie geplant hatte",
                "is_correct": true
              },
              {
                "id": "sbp_q6_a2",
                "answer_text": "Genau wie geplant",
                "is_correct": false
              },
              {
                "id": "sbp_q6_a3",
                "answer_text": "Deutlich mehr als geplant",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_firstday": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Der erste Arbeitstag\n\nHeute war Yassins erster Tag in seiner neuen Ausbildungsstelle, und er war sehr aufgeregt. Er ist eine halbe Stunde früher angekommen, um pünktlich zu sein. Sein Ausbilder hat ihn freundlich begrüßt und ihm zuerst die Kollegen vorgestellt. Danach hat er ihm die wichtigsten Räume gezeigt, zum Beispiel die Werkstatt und die Kantine. Am Vormittag durfte Yassin einem erfahrenen Kollegen bei einer einfachen Aufgabe zusehen. Am Nachmittag hat er selbst zum ersten Mal mitgearbeitet. Am Ende des Tages war er müde, aber auch stolz auf seinen ersten Arbeitstag.",
        "items": [
          {
            "id": "sbf_q1",
            "question_text": "Yassin ist eine halbe Stunde früher angekommen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt genau das.",
            "order_index": 0,
            "answers": [
              {
                "id": "sbf_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "sbf_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbf_q2",
            "question_text": "Wer hat Yassin am Anfang begrüßt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt den Ausbilder.",
            "order_index": 1,
            "answers": [
              {
                "id": "sbf_q2_a1",
                "answer_text": "Sein Ausbilder",
                "is_correct": true
              },
              {
                "id": "sbf_q2_a2",
                "answer_text": "Ein anderer Auszubildender",
                "is_correct": false
              },
              {
                "id": "sbf_q2_a3",
                "answer_text": "Der Firmenchef",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbf_q3",
            "question_text": "Was hat der Ausbilder Yassin zuerst gezeigt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt zuerst die Kollegen.",
            "order_index": 2,
            "answers": [
              {
                "id": "sbf_q3_a1",
                "answer_text": "Die Kollegen",
                "is_correct": true
              },
              {
                "id": "sbf_q3_a2",
                "answer_text": "Die Gehaltsabrechnung",
                "is_correct": false
              },
              {
                "id": "sbf_q3_a3",
                "answer_text": "Den Parkplatz",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbf_q4",
            "question_text": "Welche Räume hat er Yassin gezeigt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt Werkstatt und Kantine.",
            "order_index": 3,
            "answers": [
              {
                "id": "sbf_q4_a1",
                "answer_text": "Die Werkstatt und die Kantine",
                "is_correct": true
              },
              {
                "id": "sbf_q4_a2",
                "answer_text": "Nur sein eigenes Büro",
                "is_correct": false
              },
              {
                "id": "sbf_q4_a3",
                "answer_text": "Das Lager und die Garage",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbf_q5",
            "question_text": "Yassin hat am Vormittag selbst gearbeitet.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Am Vormittag hat er nur zugesehen, am Nachmittag mitgearbeitet.",
            "order_index": 4,
            "answers": [
              {
                "id": "sbf_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "sbf_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "sbf_q6",
            "question_text": "Wie hat sich Yassin am Ende des Tages gefühlt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt müde und stolz.",
            "order_index": 5,
            "answers": [
              {
                "id": "sbf_q6_a1",
                "answer_text": "Müde, aber stolz",
                "is_correct": true
              },
              {
                "id": "sbf_q6_a2",
                "answer_text": "Enttäuscht",
                "is_correct": false
              },
              {
                "id": "sbf_q6_a3",
                "answer_text": "Gelangweilt",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_train": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Mit dem Zug verreisen\n\nHiba wollte am Wochenende ihre Schwester besuchen, die in einer anderen Stadt wohnt. Sie hat ihr Zugticket schon eine Woche vorher online gekauft, weil es dann günstiger war. Am Bahnhof hat sie zuerst auf der Anzeigetafel nachgeschaut, von welchem Gleis ihr Zug abfährt. Der Zug hatte leider zehn Minuten Verspätung, aber das war für Hiba kein Problem, weil sie genug Zeit eingeplant hatte. Während der Fahrt hat sie ein Buch gelesen und aus dem Fenster geschaut. Nach zwei Stunden ist sie sicher angekommen, und ihre Schwester hat sie am Bahnhof abgeholt.",
        "items": [
          {
            "id": "sbt_q1",
            "question_text": "Wen wollte Hiba besuchen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt ihre Schwester.",
            "order_index": 0,
            "answers": [
              {
                "id": "sbt_q1_a1",
                "answer_text": "Ihre Schwester",
                "is_correct": true
              },
              {
                "id": "sbt_q1_a2",
                "answer_text": "Ihre Eltern",
                "is_correct": false
              },
              {
                "id": "sbt_q1_a3",
                "answer_text": "Eine Freundin",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbt_q2",
            "question_text": "Wann hat Hiba ihr Ticket gekauft?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt eine Woche vorher, online.",
            "order_index": 1,
            "answers": [
              {
                "id": "sbt_q2_a1",
                "answer_text": "Eine Woche vorher, online",
                "is_correct": true
              },
              {
                "id": "sbt_q2_a2",
                "answer_text": "Erst am Bahnhof",
                "is_correct": false
              },
              {
                "id": "sbt_q2_a3",
                "answer_text": "Einen Monat vorher",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbt_q3",
            "question_text": "Hiba hat ihr Ticket gekauft, weil es online günstiger war.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text nennt genau diesen Grund.",
            "order_index": 2,
            "answers": [
              {
                "id": "sbt_q3_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "sbt_q3_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbt_q4",
            "question_text": "Wie viel Verspätung hatte der Zug?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt zehn Minuten Verspätung.",
            "order_index": 3,
            "answers": [
              {
                "id": "sbt_q4_a1",
                "answer_text": "Zehn Minuten",
                "is_correct": true
              },
              {
                "id": "sbt_q4_a2",
                "answer_text": "Eine Stunde",
                "is_correct": false
              },
              {
                "id": "sbt_q4_a3",
                "answer_text": "Keine Verspätung",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbt_q5",
            "question_text": "Die Verspätung war für Hiba ein großes Problem.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie hatte genug Zeit eingeplant, also kein Problem.",
            "order_index": 4,
            "answers": [
              {
                "id": "sbt_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "sbt_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "sbt_q6",
            "question_text": "Wie lange hat die Zugfahrt gedauert?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt zwei Stunden.",
            "order_index": 5,
            "answers": [
              {
                "id": "sbt_q6_a1",
                "answer_text": "Zwei Stunden",
                "is_correct": true
              },
              {
                "id": "sbt_q6_a2",
                "answer_text": "Eine halbe Stunde",
                "is_correct": false
              },
              {
                "id": "sbt_q6_a3",
                "answer_text": "Fünf Stunden",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_moving": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Ein Wohnungsumzug\n\nNächste Woche zieht Ahmed in seine erste eigene Wohnung um, und im Moment packt er jeden Abend ein paar Kartons. Seine Freunde haben versprochen, ihm am Umzugstag mit dem schweren Möbeln zu helfen. Ahmed hat außerdem einen kleinen Transporter für einen Tag gemietet, weil er einen Kühlschrank und ein Sofa transportieren muss. Er hat schon bei der alten Wohnung gekündigt und der neuen Vermieterin seine neue Telefonnummer gegeben. Am meisten Sorgen macht er sich um seine Bücher, weil er sehr viele besitzt und die Kartons sehr schwer werden. Trotzdem freut er sich sehr auf die neue Wohnung.",
        "items": [
          {
            "id": "sbm_q1",
            "question_text": "Ahmed zieht in seine erste eigene Wohnung um.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt genau das.",
            "order_index": 0,
            "answers": [
              {
                "id": "sbm_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "sbm_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbm_q2",
            "question_text": "Wer hilft Ahmed am Umzugstag mit den Möbeln?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt seine Freunde.",
            "order_index": 1,
            "answers": [
              {
                "id": "sbm_q2_a1",
                "answer_text": "Seine Freunde",
                "is_correct": true
              },
              {
                "id": "sbm_q2_a2",
                "answer_text": "Ein Umzugsunternehmen",
                "is_correct": false
              },
              {
                "id": "sbm_q2_a3",
                "answer_text": "Seine Familie",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbm_q3",
            "question_text": "Warum hat Ahmed einen Transporter gemietet?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau diesen Grund.",
            "order_index": 2,
            "answers": [
              {
                "id": "sbm_q3_a1",
                "answer_text": "Um Kühlschrank und Sofa zu transportieren",
                "is_correct": true
              },
              {
                "id": "sbm_q3_a2",
                "answer_text": "Um Kartons zu kaufen",
                "is_correct": false
              },
              {
                "id": "sbm_q3_a3",
                "answer_text": "Um zur Arbeit zu fahren",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbm_q4",
            "question_text": "Ahmed hat der neuen Vermieterin seine neue Telefonnummer gegeben.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt genau das.",
            "order_index": 3,
            "answers": [
              {
                "id": "sbm_q4_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "sbm_q4_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbm_q5",
            "question_text": "Worüber macht sich Ahmed am meisten Sorgen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt die Bücher.",
            "order_index": 4,
            "answers": [
              {
                "id": "sbm_q5_a1",
                "answer_text": "Seine Bücher",
                "is_correct": true
              },
              {
                "id": "sbm_q5_a2",
                "answer_text": "Seine Möbel",
                "is_correct": false
              },
              {
                "id": "sbm_q5_a3",
                "answer_text": "Sein Auto",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sbm_q6",
            "question_text": "Wie fühlt sich Ahmed trotz der Sorgen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text sagt, er freut sich sehr.",
            "order_index": 5,
            "answers": [
              {
                "id": "sbm_q6_a1",
                "answer_text": "Er freut sich auf die neue Wohnung",
                "is_correct": true
              },
              {
                "id": "sbm_q6_a2",
                "answer_text": "Er ist traurig",
                "is_correct": false
              },
              {
                "id": "sbm_q6_a3",
                "answer_text": "Er ist wütend",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_bank": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص المكالمة كما لو كنت تسمعها، ثم أجب عن الأسئلة.",
        "passage": "Anruf bei der Bank:\n\"Sparkasse, guten Tag, was kann ich für Sie tun?\nGuten Tag, meine Karte funktioniert seit gestern nicht mehr am Automaten.\nDas tut mir leid. Haben Sie die Karte vielleicht beschädigt oder ist sie schon älter?\nSie ist ungefähr drei Jahre alt, aber sie sah eigentlich noch gut aus.\nDann schicke ich Ihnen eine neue Karte zu. Das dauert normalerweise fünf bis sieben Werktage.\nUnd was mache ich bis dahin, wenn ich Geld brauche?\nSie können weiterhin am Schalter Geld abheben, einfach mit Ihrem Personalausweis.\nAlles klar, vielen Dank für die Hilfe.\nGerne, einen schönen Tag noch!\"",
        "audio_url": "/audio/test_skill_listening_bank__listening1.mp3",
        "items": [
          {
            "id": "slba_q1",
            "question_text": "Worüber beschwert sich der Anrufer?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Anrufer sagt, die Karte funktioniert nicht mehr.",
            "order_index": 0,
            "answers": [
              {
                "id": "slba_q1_a1",
                "answer_text": "Seine Karte funktioniert nicht mehr",
                "is_correct": true
              },
              {
                "id": "slba_q1_a2",
                "answer_text": "Er hat sein Konto verloren",
                "is_correct": false
              },
              {
                "id": "slba_q1_a3",
                "answer_text": "Er hat eine falsche Rechnung erhalten",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slba_q2",
            "question_text": "Wie alt ist die Karte?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Anrufer nennt drei Jahre.",
            "order_index": 1,
            "answers": [
              {
                "id": "slba_q2_a1",
                "answer_text": "Ungefähr drei Jahre",
                "is_correct": true
              },
              {
                "id": "slba_q2_a2",
                "answer_text": "Ein Jahr",
                "is_correct": false
              },
              {
                "id": "slba_q2_a3",
                "answer_text": "Zehn Jahre",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slba_q3",
            "question_text": "Was macht die Bank für den Kunden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Mitarbeiterin sagt, sie schickt eine neue Karte.",
            "order_index": 2,
            "answers": [
              {
                "id": "slba_q3_a1",
                "answer_text": "Sie schickt ihm eine neue Karte",
                "is_correct": true
              },
              {
                "id": "slba_q3_a2",
                "answer_text": "Sie schließt sein Konto",
                "is_correct": false
              },
              {
                "id": "slba_q3_a3",
                "answer_text": "Sie sendet ihm eine Rechnung",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slba_q4",
            "question_text": "Wie lange dauert es, bis die neue Karte ankommt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Mitarbeiterin nennt fünf bis sieben Werktage.",
            "order_index": 3,
            "answers": [
              {
                "id": "slba_q4_a1",
                "answer_text": "Fünf bis sieben Werktage",
                "is_correct": true
              },
              {
                "id": "slba_q4_a2",
                "answer_text": "Ein bis zwei Tage",
                "is_correct": false
              },
              {
                "id": "slba_q4_a3",
                "answer_text": "Einen Monat",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slba_q5",
            "question_text": "Der Kunde kann bis dahin kein Geld abheben.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er kann weiterhin am Schalter mit Ausweis Geld abheben.",
            "order_index": 4,
            "answers": [
              {
                "id": "slba_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "slba_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "slba_q6",
            "question_text": "Was braucht der Kunde, um am Schalter Geld abzuheben?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Mitarbeiterin nennt den Personalausweis.",
            "order_index": 5,
            "answers": [
              {
                "id": "slba_q6_a1",
                "answer_text": "Seinen Personalausweis",
                "is_correct": true
              },
              {
                "id": "slba_q6_a2",
                "answer_text": "Seine alte Karte",
                "is_correct": false
              },
              {
                "id": "slba_q6_a3",
                "answer_text": "Eine Vollmacht",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_station": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص الإعلان كما لو كنت تسمعه، ثم أجب عن الأسئلة.",
        "passage": "Meine Damen und Herren, eine wichtige Durchsage. Der Regionalzug nach Frankfurt, der um 14:15 Uhr auf Gleis 3 abfahren sollte, hat heute leider zwanzig Minuten Verspätung. Der Zug fährt stattdessen von Gleis 5 ab. Wir entschuldigen uns für die Unannehmlichkeiten. Reisende mit Anschluss nach Mainz erreichen ihren Anschlusszug trotzdem, da dieser ebenfalls Verspätung hat. Für weitere Informationen wenden Sie sich bitte an das Servicepersonal am Gleis oder an den Informationsschalter in der Bahnhofshalle. Wir danken für Ihr Verständnis und wünschen eine angenehme Reise.",
        "audio_url": "/audio/test_skill_listening_station__listening1.mp3",
        "items": [
          {
            "id": "sls_q1",
            "question_text": "Wohin fährt der Zug in der Durchsage?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt Frankfurt als Ziel.",
            "order_index": 0,
            "answers": [
              {
                "id": "sls_q1_a1",
                "answer_text": "Nach Frankfurt",
                "is_correct": true
              },
              {
                "id": "sls_q1_a2",
                "answer_text": "Nach Mainz",
                "is_correct": false
              },
              {
                "id": "sls_q1_a3",
                "answer_text": "Nach München",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sls_q2",
            "question_text": "Wie viel Verspätung hat der Zug?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt zwanzig Minuten.",
            "order_index": 1,
            "answers": [
              {
                "id": "sls_q2_a1",
                "answer_text": "Zwanzig Minuten",
                "is_correct": true
              },
              {
                "id": "sls_q2_a2",
                "answer_text": "Zehn Minuten",
                "is_correct": false
              },
              {
                "id": "sls_q2_a3",
                "answer_text": "Eine Stunde",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sls_q3",
            "question_text": "Von welchem Gleis fährt der Zug jetzt ab?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt Gleis 5 statt Gleis 3.",
            "order_index": 2,
            "answers": [
              {
                "id": "sls_q3_a1",
                "answer_text": "Gleis 5",
                "is_correct": true
              },
              {
                "id": "sls_q3_a2",
                "answer_text": "Gleis 3",
                "is_correct": false
              },
              {
                "id": "sls_q3_a3",
                "answer_text": "Gleis 7",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sls_q4",
            "question_text": "Reisende nach Mainz verpassen ihren Anschlusszug.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Anschlusszug hat ebenfalls Verspätung, sie erreichen ihn trotzdem.",
            "order_index": 3,
            "answers": [
              {
                "id": "sls_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "sls_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "sls_q5",
            "question_text": "Wo bekommen Reisende weitere Informationen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt beide Anlaufstellen.",
            "order_index": 4,
            "answers": [
              {
                "id": "sls_q5_a1",
                "answer_text": "Beim Servicepersonal oder am Informationsschalter",
                "is_correct": true
              },
              {
                "id": "sls_q5_a2",
                "answer_text": "Nur online",
                "is_correct": false
              },
              {
                "id": "sls_q5_a3",
                "answer_text": "Beim Zugführer",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sls_q6",
            "question_text": "Um wie viel Uhr sollte der Zug ursprünglich abfahren?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt 14:15 Uhr als ursprüngliche Zeit.",
            "order_index": 5,
            "answers": [
              {
                "id": "sls_q6_a1",
                "answer_text": "14:15 Uhr",
                "is_correct": true
              },
              {
                "id": "sls_q6_a2",
                "answer_text": "14:30 Uhr",
                "is_correct": false
              },
              {
                "id": "sls_q6_a3",
                "answer_text": "15:00 Uhr",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_interview": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص المقابلة كما لو كنت تسمعها، ثم أجب عن الأسئلة.",
        "passage": "Vorstellungsgespräch:\n\"Erzählen Sie uns bitte kurz etwas über sich.\nGerne. Ich habe vor zwei Jahren meine Ausbildung als Bürokauffrau abgeschlossen und seitdem in einem kleinen Unternehmen gearbeitet.\nWarum möchten Sie bei uns arbeiten?\nIhr Unternehmen ist deutlich größer, und ich möchte gerne mehr Verantwortung übernehmen und neue Aufgaben lernen.\nWas sind Ihre Stärken?\nIch bin sehr organisiert und arbeite gerne im Team, aber ich kann auch gut selbstständig arbeiten.\nHaben Sie noch Fragen an uns?\nJa, wie sieht ein typischer Arbeitstag in dieser Position aus?\nDas beantworte ich Ihnen gerne im Detail.\"",
        "audio_url": "/audio/test_skill_listening_interview__listening1.mp3",
        "items": [
          {
            "id": "sli_q1",
            "question_text": "Was hat die Bewerberin vor zwei Jahren abgeschlossen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie nennt die Ausbildung als Bürokauffrau.",
            "order_index": 0,
            "answers": [
              {
                "id": "sli_q1_a1",
                "answer_text": "Ihre Ausbildung als Bürokauffrau",
                "is_correct": true
              },
              {
                "id": "sli_q1_a2",
                "answer_text": "Ein Studium",
                "is_correct": false
              },
              {
                "id": "sli_q1_a3",
                "answer_text": "Einen Sprachkurs",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sli_q2",
            "question_text": "Sie arbeitet seit der Ausbildung in einem großen Unternehmen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie arbeitet in einem kleinen Unternehmen.",
            "order_index": 1,
            "answers": [
              {
                "id": "sli_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "sli_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "sli_q3",
            "question_text": "Warum möchte sie wechseln?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie nennt mehr Verantwortung als Grund.",
            "order_index": 2,
            "answers": [
              {
                "id": "sli_q3_a1",
                "answer_text": "Um mehr Verantwortung zu übernehmen",
                "is_correct": true
              },
              {
                "id": "sli_q3_a2",
                "answer_text": "Wegen eines Streits mit dem Chef",
                "is_correct": false
              },
              {
                "id": "sli_q3_a3",
                "answer_text": "Weil sie umzieht",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sli_q4",
            "question_text": "Was nennt sie als ihre Stärken?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie nennt organisiert und teamfähig.",
            "order_index": 3,
            "answers": [
              {
                "id": "sli_q4_a1",
                "answer_text": "Organisiert und teamfähig",
                "is_correct": true
              },
              {
                "id": "sli_q4_a2",
                "answer_text": "Kreativ und schnell",
                "is_correct": false
              },
              {
                "id": "sli_q4_a3",
                "answer_text": "Geduldig und ruhig",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sli_q5",
            "question_text": "Sie kann auch gut selbstständig arbeiten.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie sagt das genau so.",
            "order_index": 4,
            "answers": [
              {
                "id": "sli_q5_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "sli_q5_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sli_q6",
            "question_text": "Welche Frage stellt sie am Ende?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie fragt nach einem typischen Arbeitstag.",
            "order_index": 5,
            "answers": [
              {
                "id": "sli_q6_a1",
                "answer_text": "Wie ein typischer Arbeitstag aussieht",
                "is_correct": true
              },
              {
                "id": "sli_q6_a2",
                "answer_text": "Wie hoch das Gehalt ist",
                "is_correct": false
              },
              {
                "id": "sli_q6_a3",
                "answer_text": "Wann sie anfangen kann",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_hairdresser": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص المكالمة كما لو كنت تسمعها، ثم أجب عن الأسئلة.",
        "passage": "Anruf beim Friseur:\n\"Friseursalon Beauty, guten Tag.\nGuten Tag, ich hätte gerne einen Termin zum Haareschneiden.\nGerne, für heute oder für einen anderen Tag?\nAm liebsten für morgen, wenn möglich.\nMorgen habe ich um 11 Uhr oder um 16 Uhr noch frei.\nDann nehme ich lieber den Nachmittag, also 16 Uhr.\nSehr gerne. Möchten Sie nur die Haare schneiden lassen, oder auch färben?\nNur schneiden, danke.\nAlles klar, dann trage ich Sie für morgen um 16 Uhr ein. Auf welchen Namen, bitte?\nAuf den Namen Layla Benani.\nPerfekt, bis morgen!\"",
        "audio_url": "/audio/test_skill_listening_hairdresser__listening1.mp3",
        "items": [
          {
            "id": "slh_q1",
            "question_text": "Worum bittet die Anruferin?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie bittet um einen Termin zum Haareschneiden.",
            "order_index": 0,
            "answers": [
              {
                "id": "slh_q1_a1",
                "answer_text": "Um einen Termin zum Haareschneiden",
                "is_correct": true
              },
              {
                "id": "slh_q1_a2",
                "answer_text": "Um eine Preisliste",
                "is_correct": false
              },
              {
                "id": "slh_q1_a3",
                "answer_text": "Um eine Stornierung",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slh_q2",
            "question_text": "Für welchen Tag möchte sie den Termin?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie möchte den Termin für morgen.",
            "order_index": 1,
            "answers": [
              {
                "id": "slh_q2_a1",
                "answer_text": "Für morgen",
                "is_correct": true
              },
              {
                "id": "slh_q2_a2",
                "answer_text": "Für heute",
                "is_correct": false
              },
              {
                "id": "slh_q2_a3",
                "answer_text": "Für nächste Woche",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slh_q3",
            "question_text": "Welche zwei Uhrzeiten sind morgen frei?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Friseur nennt 11 Uhr und 16 Uhr.",
            "order_index": 2,
            "answers": [
              {
                "id": "slh_q3_a1",
                "answer_text": "11 Uhr und 16 Uhr",
                "is_correct": true
              },
              {
                "id": "slh_q3_a2",
                "answer_text": "9 Uhr und 12 Uhr",
                "is_correct": false
              },
              {
                "id": "slh_q3_a3",
                "answer_text": "14 Uhr und 18 Uhr",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slh_q4",
            "question_text": "Sie entscheidet sich für den Vormittagstermin.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie entscheidet sich für 16 Uhr, den Nachmittag.",
            "order_index": 3,
            "answers": [
              {
                "id": "slh_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "slh_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "slh_q5",
            "question_text": "Möchte sie auch ihre Haare färben lassen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie sagt, nur schneiden.",
            "order_index": 4,
            "answers": [
              {
                "id": "slh_q5_a1",
                "answer_text": "Nein, nur schneiden",
                "is_correct": true
              },
              {
                "id": "slh_q5_a2",
                "answer_text": "Ja, färben und schneiden",
                "is_correct": false
              },
              {
                "id": "slh_q5_a3",
                "answer_text": "Nur färben",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slh_q6",
            "question_text": "Auf welchen Namen wird der Termin eingetragen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie nennt den Namen Layla Benani.",
            "order_index": 5,
            "answers": [
              {
                "id": "slh_q6_a1",
                "answer_text": "Layla Benani",
                "is_correct": true
              },
              {
                "id": "slh_q6_a2",
                "answer_text": "Layla Idrissi",
                "is_correct": false
              },
              {
                "id": "slh_q6_a3",
                "answer_text": "Sara Benani",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_return": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص الحوار كما لو كنت تسمعه، ثم أجب عن الأسئلة.",
        "passage": "Im Geschäft:\n\"Guten Tag, ich möchte diesen Pullover zurückgeben.\nKein Problem, haben Sie den Kassenbon noch?\nJa, hier bitte.\nGibt es einen Grund für die Rückgabe, oder war es nur nicht die richtige Größe?\nDie Größe passt leider nicht, er ist zu klein.\nMöchten Sie eine größere Größe, oder lieber Ihr Geld zurück?\nHaben Sie ihn auch in Größe L?\nJa, wir haben noch zwei Stück in Größe L.\nDann tausche ich ihn lieber um, das wäre super.\nGerne, ich hole Ihnen sofort die richtige Größe.\"",
        "audio_url": "/audio/test_skill_listening_return__listening1.mp3",
        "items": [
          {
            "id": "slre_q1",
            "question_text": "Was möchte der Kunde zurückgeben?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Kunde nennt einen Pullover.",
            "order_index": 0,
            "answers": [
              {
                "id": "slre_q1_a1",
                "answer_text": "Einen Pullover",
                "is_correct": true
              },
              {
                "id": "slre_q1_a2",
                "answer_text": "Ein Hemd",
                "is_correct": false
              },
              {
                "id": "slre_q1_a3",
                "answer_text": "Eine Hose",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slre_q2",
            "question_text": "Der Kunde hat keinen Kassenbon.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er hat den Kassenbon dabei.",
            "order_index": 1,
            "answers": [
              {
                "id": "slre_q2_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "slre_q2_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "slre_q3",
            "question_text": "Warum möchte der Kunde den Pullover zurückgeben?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Kunde sagt, die Größe passt nicht, er ist zu klein.",
            "order_index": 2,
            "answers": [
              {
                "id": "slre_q3_a1",
                "answer_text": "Er ist zu klein",
                "is_correct": true
              },
              {
                "id": "slre_q3_a2",
                "answer_text": "Er ist beschädigt",
                "is_correct": false
              },
              {
                "id": "slre_q3_a3",
                "answer_text": "Die Farbe gefällt ihm nicht",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slre_q4",
            "question_text": "Welche Größe fragt der Kunde nach?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Kunde fragt nach Größe L.",
            "order_index": 3,
            "answers": [
              {
                "id": "slre_q4_a1",
                "answer_text": "Größe L",
                "is_correct": true
              },
              {
                "id": "slre_q4_a2",
                "answer_text": "Größe M",
                "is_correct": false
              },
              {
                "id": "slre_q4_a3",
                "answer_text": "Größe XL",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slre_q5",
            "question_text": "Das Geschäft hat keine Größe L mehr.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es gibt noch zwei Stück in Größe L.",
            "order_index": 4,
            "answers": [
              {
                "id": "slre_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "slre_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "slre_q6",
            "question_text": "Wofür entscheidet sich der Kunde am Ende?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Er entscheidet sich, den Pullover umzutauschen.",
            "order_index": 5,
            "answers": [
              {
                "id": "slre_q6_a1",
                "answer_text": "Für einen Umtausch",
                "is_correct": true
              },
              {
                "id": "slre_q6_a2",
                "answer_text": "Für eine Geldrückgabe",
                "is_correct": false
              },
              {
                "id": "slre_q6_a3",
                "answer_text": "Für einen Gutschein",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_landlord": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص المكالمة كما لو كنت تسمعها، ثم أجب عن الأسئلة.",
        "passage": "Anruf beim Vermieter:\n\"Hallo Herr Krause, hier ist Fatima Zahra aus der Wohnung im dritten Stock.\nHallo Frau Zahra, was kann ich für Sie tun?\nDie Heizung funktioniert seit gestern Abend nicht mehr richtig, es ist ziemlich kalt in der Wohnung.\nDas tut mir leid zu hören. Ich schicke Ihnen morgen früh einen Techniker vorbei.\nUm wie viel Uhr ungefähr?\nZwischen 9 und 11 Uhr, ist das für Sie möglich?\nJa, das passt gut, ich bin morgen zu Hause.\nGut, ich gebe Ihnen noch Bescheid, sobald der Techniker unterwegs ist.\nVielen Dank, das ist sehr freundlich.\"",
        "audio_url": "/audio/test_skill_listening_landlord__listening1.mp3",
        "items": [
          {
            "id": "sll_q1",
            "question_text": "Wer ruft den Vermieter an?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie stellt sich als Mieterin vor.",
            "order_index": 0,
            "answers": [
              {
                "id": "sll_q1_a1",
                "answer_text": "Fatima Zahra, eine Mieterin",
                "is_correct": true
              },
              {
                "id": "sll_q1_a2",
                "answer_text": "Ein Techniker",
                "is_correct": false
              },
              {
                "id": "sll_q1_a3",
                "answer_text": "Eine Nachbarin",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sll_q2",
            "question_text": "In welchem Stock wohnt sie?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie nennt den dritten Stock.",
            "order_index": 1,
            "answers": [
              {
                "id": "sll_q2_a1",
                "answer_text": "Im dritten Stock",
                "is_correct": true
              },
              {
                "id": "sll_q2_a2",
                "answer_text": "Im ersten Stock",
                "is_correct": false
              },
              {
                "id": "sll_q2_a3",
                "answer_text": "Im Erdgeschoss",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sll_q3",
            "question_text": "Was ist das Problem?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie nennt die Heizung als Problem.",
            "order_index": 2,
            "answers": [
              {
                "id": "sll_q3_a1",
                "answer_text": "Die Heizung funktioniert nicht richtig",
                "is_correct": true
              },
              {
                "id": "sll_q3_a2",
                "answer_text": "Die Dusche ist kaputt",
                "is_correct": false
              },
              {
                "id": "sll_q3_a3",
                "answer_text": "Der Fahrstuhl funktioniert nicht",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sll_q4",
            "question_text": "Der Vermieter schickt sofort jemanden vorbei.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er schickt morgen früh einen Techniker.",
            "order_index": 3,
            "answers": [
              {
                "id": "sll_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "sll_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "sll_q5",
            "question_text": "Zwischen welchen Uhrzeiten kommt der Techniker?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Vermieter nennt zwischen 9 und 11 Uhr.",
            "order_index": 4,
            "answers": [
              {
                "id": "sll_q5_a1",
                "answer_text": "Zwischen 9 und 11 Uhr",
                "is_correct": true
              },
              {
                "id": "sll_q5_a2",
                "answer_text": "Zwischen 14 und 16 Uhr",
                "is_correct": false
              },
              {
                "id": "sll_q5_a3",
                "answer_text": "Am Abend",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sll_q6",
            "question_text": "Fatima ist morgen nicht zu Hause.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie sagt, das passt gut, sie ist morgen zu Hause.",
            "order_index": 5,
            "answers": [
              {
                "id": "sll_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "sll_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_weather": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص النشرة كما لو كنت تسمعها، ثم أجب عن الأسئلة.",
        "passage": "Und nun der Wetterbericht für morgen. Am Vormittag bleibt es meistens bewölkt, mit Temperaturen um 14 Grad. Ab dem Mittag lockern die Wolken langsam auf, und wir erwarten sonnige Abschnitte mit Höchsttemperaturen von 19 Grad. Am Nachmittag kann es im Süden vereinzelt zu kurzen Schauern kommen, im Norden bleibt es dagegen meist trocken. Der Wind weht schwach aus westlicher Richtung. Am Abend kühlt es wieder auf etwa 11 Grad ab. Für das Wochenende erwarten wir stabileres und wärmeres Wetter mit Temperaturen bis zu 22 Grad.",
        "audio_url": "/audio/test_skill_listening_weather__listening1.mp3",
        "items": [
          {
            "id": "slw_q1",
            "question_text": "Wie ist das Wetter am Vormittag?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Nachricht nennt meistens bewölkt.",
            "order_index": 0,
            "answers": [
              {
                "id": "slw_q1_a1",
                "answer_text": "Meistens bewölkt",
                "is_correct": true
              },
              {
                "id": "slw_q1_a2",
                "answer_text": "Sonnig",
                "is_correct": false
              },
              {
                "id": "slw_q1_a3",
                "answer_text": "Regnerisch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slw_q2",
            "question_text": "Wie hoch ist die Höchsttemperatur am Mittag?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Nachricht nennt 19 Grad als Höchsttemperatur.",
            "order_index": 1,
            "answers": [
              {
                "id": "slw_q2_a1",
                "answer_text": "19 Grad",
                "is_correct": true
              },
              {
                "id": "slw_q2_a2",
                "answer_text": "14 Grad",
                "is_correct": false
              },
              {
                "id": "slw_q2_a3",
                "answer_text": "25 Grad",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slw_q3",
            "question_text": "Wo kann es am Nachmittag Schauer geben?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Nachricht nennt den Süden.",
            "order_index": 2,
            "answers": [
              {
                "id": "slw_q3_a1",
                "answer_text": "Im Süden",
                "is_correct": true
              },
              {
                "id": "slw_q3_a2",
                "answer_text": "Im Norden",
                "is_correct": false
              },
              {
                "id": "slw_q3_a3",
                "answer_text": "Überall",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slw_q4",
            "question_text": "Im Norden bleibt es am Nachmittag meist trocken.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Nachricht sagt das genau so.",
            "order_index": 3,
            "answers": [
              {
                "id": "slw_q4_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "slw_q4_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slw_q5",
            "question_text": "Aus welcher Richtung weht der Wind?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Nachricht nennt westliche Richtung.",
            "order_index": 4,
            "answers": [
              {
                "id": "slw_q5_a1",
                "answer_text": "Aus westlicher Richtung",
                "is_correct": true
              },
              {
                "id": "slw_q5_a2",
                "answer_text": "Aus östlicher Richtung",
                "is_correct": false
              },
              {
                "id": "slw_q5_a3",
                "answer_text": "Aus dem Norden",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slw_q6",
            "question_text": "Wie wird das Wetter am Wochenende?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Nachricht nennt stabileres und wärmeres Wetter.",
            "order_index": 5,
            "answers": [
              {
                "id": "slw_q6_a1",
                "answer_text": "Stabiler und wärmer",
                "is_correct": true
              },
              {
                "id": "slw_q6_a2",
                "answer_text": "Kälter und regnerisch",
                "is_correct": false
              },
              {
                "id": "slw_q6_a3",
                "answer_text": "Windig und wechselhaft",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_writing_leave_email": {
    "sections": [],
    "writing": {
      "name": "بريد إلكتروني رسمي",
      "official_duration_minutes": 15,
      "instructions": "اكتب بريدًا إلكترونيًا رسميًا من 80 إلى 100 كلمة تقريبًا.",
      "prompt": "اكتب بريدًا إلكترونيًا لصاحب العمل تطلب فيه إجازة لمدة أسبوع. اذكر السبب، والتواريخ التي تريد أخذ الإجازة فيها، وكيف ستنظّم عملك أثناء غيابك.",
      "sample_answer": "Sehr geehrte Damen und Herren,\n\nich möchte Sie bitten, mir für die Woche vom 12. bis zum 18. Juni Urlaub zu genehmigen. Ich habe familiäre Verpflichtungen, die meine Anwesenheit erfordern.\n\nWährend meiner Abwesenheit wird mein Kollege Herr Amrani meine wichtigsten Aufgaben übernehmen. Ich werde alle laufenden Projekte vor meinem Urlaub abschließen oder ordentlich übergeben.\n\nIch bitte um eine kurze Rückmeldung, ob der Termin möglich ist.\n\nMit freundlichen Grüßen,\nYasmin Idrissi"
    }
  },
  "test_skill_writing_daily_life": {
    "sections": [],
    "writing": {
      "name": "نص وصفي",
      "official_duration_minutes": 15,
      "instructions": "اكتب نصًا من 80 إلى 100 كلمة تقريبًا.",
      "prompt": "صف يومًا عاديًا في حياتك، من الصباح حتى المساء. اذكر ماذا تفعل عادة، ومن تقابل، وكيف تشعر في نهاية اليوم.",
      "sample_answer": "Mein Tag beginnt normalerweise um sieben Uhr morgens. Ich frühstücke schnell und fahre dann zur Arbeit, wo ich um acht Uhr ankomme. Vormittags arbeite ich meistens am Computer und treffe mich manchmal mit Kollegen für kurze Besprechungen. Mittags esse ich zusammen mit meiner Kollegin in der Kantine. Nachmittags setze ich meine Arbeit fort, bis ich um siebzehn Uhr nach Hause fahre. Abends koche ich gerne oder treffe Freunde. Am Ende des Tages bin ich meistens müde, aber zufrieden mit dem, was ich geschafft habe."
    }
  },
  "test_skill_writing_invite_friend": {
    "sections": [],
    "writing": {
      "name": "رسالة غير رسمية",
      "official_duration_minutes": 15,
      "instructions": "اكتب رسالة غير رسمية من 80 إلى 100 كلمة تقريبًا.",
      "prompt": "اكتب رسالة إلى صديق تدعوه فيها لحضور حفلة عيد ميلادك. اذكر التاريخ والمكان، ولماذا تريد منه أن يحضر، واسأله إن كان يستطيع القدوم.",
      "sample_answer": "Liebe Sara,\n\nich feiere am 20. Mai meinen Geburtstag und würde mich sehr freuen, wenn du kommen könntest! Die Feier findet bei mir zu Hause statt, ab 18 Uhr.\n\nEs werden auch ein paar andere Freunde da sein, und ich habe schon angefangen, das Essen zu planen. Es wäre einfach nicht dasselbe ohne dich.\n\nHast du an diesem Tag schon etwas vor? Lass es mich bitte bald wissen.\n\nGanz liebe Grüße,\nNadia"
    }
  },
  "test_skill_reading_optician": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Beim Optiker\n\nSeit einigen Wochen bemerkt Karim, dass er beim Lesen Kopfschmerzen bekommt, deshalb hat er einen Termin beim Optiker vereinbart. Zuerst musste er mehrere einfache Sehtests machen, bei denen er Buchstaben auf einer Tafel lesen sollte. Der Optiker hat festgestellt, dass Karim eine leichte Sehschwäche hat und eine Brille zum Lesen braucht. Danach hat Karim gemeinsam mit einer Verkäuferin verschiedene Brillengestelle ausprobiert. Er hat sich für ein einfaches schwarzes Gestell entschieden, weil es gut zu seinem Gesicht passte. Die neue Brille wird in einer Woche fertig sein.",
        "items": [
          {
            "id": "sro_q1",
            "question_text": "Warum ist Karim zum Optiker gegangen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt Kopfschmerzen beim Lesen als Grund.",
            "order_index": 0,
            "answers": [
              {
                "id": "sro_q1_a1",
                "answer_text": "Er bekommt Kopfschmerzen beim Lesen",
                "is_correct": true
              },
              {
                "id": "sro_q1_a2",
                "answer_text": "Er kann nichts mehr sehen",
                "is_correct": false
              },
              {
                "id": "sro_q1_a3",
                "answer_text": "Seine alte Brille ist kaputt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sro_q2",
            "question_text": "Karim musste Buchstaben auf einer Tafel lesen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt genau das.",
            "order_index": 1,
            "answers": [
              {
                "id": "sro_q2_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "sro_q2_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sro_q3",
            "question_text": "Was hat der Optiker festgestellt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt eine leichte Sehschwäche.",
            "order_index": 2,
            "answers": [
              {
                "id": "sro_q3_a1",
                "answer_text": "Eine leichte Sehschwäche",
                "is_correct": true
              },
              {
                "id": "sro_q3_a2",
                "answer_text": "Eine schwere Augenkrankheit",
                "is_correct": false
              },
              {
                "id": "sro_q3_a3",
                "answer_text": "Dass er nichts braucht",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sro_q4",
            "question_text": "Wofür braucht Karim die Brille?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt eine Lesebrille.",
            "order_index": 3,
            "answers": [
              {
                "id": "sro_q4_a1",
                "answer_text": "Zum Lesen",
                "is_correct": true
              },
              {
                "id": "sro_q4_a2",
                "answer_text": "Zum Autofahren",
                "is_correct": false
              },
              {
                "id": "sro_q4_a3",
                "answer_text": "Zum Sport",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sro_q5",
            "question_text": "Warum hat er sich für das schwarze Gestell entschieden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau diesen Grund.",
            "order_index": 4,
            "answers": [
              {
                "id": "sro_q5_a1",
                "answer_text": "Es passte gut zu seinem Gesicht",
                "is_correct": true
              },
              {
                "id": "sro_q5_a2",
                "answer_text": "Es war das günstigste",
                "is_correct": false
              },
              {
                "id": "sro_q5_a3",
                "answer_text": "Die Verkäuferin hat es ausgesucht",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sro_q6",
            "question_text": "Die Brille ist sofort fertig.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie wird erst in einer Woche fertig sein.",
            "order_index": 5,
            "answers": [
              {
                "id": "sro_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "sro_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_bikeshop": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Im Fahrradladen\n\nDas Fahrrad von Sara hat seit letzter Woche ein Problem mit der Bremse, deshalb hat sie es zu einem Fahrradladen in der Nähe gebracht. Der Mechaniker hat das Fahrrad genau untersucht und gesagt, dass die Bremsen komplett erneuert werden müssen. Er hat ihr auch empfohlen, die Kette zu wechseln, weil sie schon sehr alt war. Sara war zuerst unsicher, ob das nötig ist, hat sich aber am Ende dafür entschieden. Die Reparatur wird zwei Tage dauern und ungefähr sechzig Euro kosten. Sara hat sich für diese Zeit ein Leihfahrrad ausgeliehen.",
        "items": [
          {
            "id": "srbi_q1",
            "question_text": "Welches Problem hat Saras Fahrrad?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt die Bremse.",
            "order_index": 0,
            "answers": [
              {
                "id": "srbi_q1_a1",
                "answer_text": "Ein Problem mit der Bremse",
                "is_correct": true
              },
              {
                "id": "srbi_q1_a2",
                "answer_text": "Ein platter Reifen",
                "is_correct": false
              },
              {
                "id": "srbi_q1_a3",
                "answer_text": "Ein kaputtes Licht",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srbi_q2",
            "question_text": "Was muss laut Mechaniker komplett erneuert werden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Mechaniker sagt, die Bremsen müssen erneuert werden.",
            "order_index": 1,
            "answers": [
              {
                "id": "srbi_q2_a1",
                "answer_text": "Die Bremsen",
                "is_correct": true
              },
              {
                "id": "srbi_q2_a2",
                "answer_text": "Die Räder",
                "is_correct": false
              },
              {
                "id": "srbi_q2_a3",
                "answer_text": "Der Sattel",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srbi_q3",
            "question_text": "Der Mechaniker empfiehlt auch, die Kette zu wechseln.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt das genau so.",
            "order_index": 2,
            "answers": [
              {
                "id": "srbi_q3_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "srbi_q3_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srbi_q4",
            "question_text": "Wie lange wird die Reparatur dauern?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt zwei Tage.",
            "order_index": 3,
            "answers": [
              {
                "id": "srbi_q4_a1",
                "answer_text": "Zwei Tage",
                "is_correct": true
              },
              {
                "id": "srbi_q4_a2",
                "answer_text": "Einen Tag",
                "is_correct": false
              },
              {
                "id": "srbi_q4_a3",
                "answer_text": "Eine Woche",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srbi_q5",
            "question_text": "Wie viel wird die Reparatur ungefähr kosten?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt ungefähr sechzig Euro.",
            "order_index": 4,
            "answers": [
              {
                "id": "srbi_q5_a1",
                "answer_text": "Ungefähr sechzig Euro",
                "is_correct": true
              },
              {
                "id": "srbi_q5_a2",
                "answer_text": "Zwanzig Euro",
                "is_correct": false
              },
              {
                "id": "srbi_q5_a3",
                "answer_text": "Hundertfünfzig Euro",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srbi_q6",
            "question_text": "Sara hat sich ein Leihfahrrad ausgeliehen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt das genau so.",
            "order_index": 5,
            "answers": [
              {
                "id": "srbi_q6_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "srbi_q6_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_gym": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Im Fitnessstudio anmelden\n\nAmine möchte seit Langem regelmäßig Sport treiben und hat deshalb ein Fitnessstudio in seiner Stadt besucht, um sich anzumelden. Ein Mitarbeiter hat ihm zuerst die verschiedenen Räume gezeigt, zum Beispiel den Kraftraum und den Raum für Kurse. Danach hat er ihm erklärt, dass es drei verschiedene Mitgliedschaften gibt: für sechs Monate, für ein Jahr, oder ohne feste Laufzeit. Amine hat sich für die Mitgliedschaft ohne feste Laufzeit entschieden, weil er nicht sicher war, wie oft er wirklich kommen wird. Am Ende hat er einen kostenlosen Probetermin für die nächste Woche bekommen, um das Studio besser kennenzulernen.",
        "items": [
          {
            "id": "srgy_q1",
            "question_text": "Warum ist Amine ins Fitnessstudio gegangen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt die Anmeldung als Grund.",
            "order_index": 0,
            "answers": [
              {
                "id": "srgy_q1_a1",
                "answer_text": "Um sich anzumelden",
                "is_correct": true
              },
              {
                "id": "srgy_q1_a2",
                "answer_text": "Um Sport zu verkaufen",
                "is_correct": false
              },
              {
                "id": "srgy_q1_a3",
                "answer_text": "Um einen Freund zu treffen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srgy_q2",
            "question_text": "Was hat der Mitarbeiter Amine zuerst gezeigt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt die Räume zuerst.",
            "order_index": 1,
            "answers": [
              {
                "id": "srgy_q2_a1",
                "answer_text": "Die verschiedenen Räume",
                "is_correct": true
              },
              {
                "id": "srgy_q2_a2",
                "answer_text": "Die Preisliste",
                "is_correct": false
              },
              {
                "id": "srgy_q2_a3",
                "answer_text": "Die Umkleidekabine",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srgy_q3",
            "question_text": "Wie viele Arten von Mitgliedschaften gibt es?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt drei Mitgliedschaften.",
            "order_index": 2,
            "answers": [
              {
                "id": "srgy_q3_a1",
                "answer_text": "Drei",
                "is_correct": true
              },
              {
                "id": "srgy_q3_a2",
                "answer_text": "Zwei",
                "is_correct": false
              },
              {
                "id": "srgy_q3_a3",
                "answer_text": "Vier",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srgy_q4",
            "question_text": "Amine entscheidet sich für die Mitgliedschaft für ein Jahr.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er entscheidet sich für die Mitgliedschaft ohne feste Laufzeit.",
            "order_index": 3,
            "answers": [
              {
                "id": "srgy_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "srgy_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "srgy_q5",
            "question_text": "Warum wählt er diese Mitgliedschaft?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau diesen Grund.",
            "order_index": 4,
            "answers": [
              {
                "id": "srgy_q5_a1",
                "answer_text": "Er war nicht sicher, wie oft er kommen wird",
                "is_correct": true
              },
              {
                "id": "srgy_q5_a2",
                "answer_text": "Sie war die günstigste",
                "is_correct": false
              },
              {
                "id": "srgy_q5_a3",
                "answer_text": "Sein Freund hat sie auch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srgy_q6",
            "question_text": "Amine bekommt einen kostenlosen Probetermin.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt das genau so.",
            "order_index": 5,
            "answers": [
              {
                "id": "srgy_q6_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "srgy_q6_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_apartment_viewing": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Eine Wohnung besichtigen\n\nHiba sucht seit zwei Monaten eine neue Wohnung und hat endlich einen Termin bekommen, um eine Zweizimmerwohnung zu besichtigen. Die Vermieterin hat ihr zuerst das Wohnzimmer und die Küche gezeigt, die beide sehr hell waren. Das Schlafzimmer war leider kleiner, als Hiba auf den Fotos gedacht hatte. Sie hat auch gefragt, ob Haustiere erlaubt sind, und die Vermieterin hat gesagt, dass kleine Tiere kein Problem sind. Die Miete liegt etwas über Hibas Budget, aber die Lage gefällt ihr sehr gut, weil die U-Bahn-Station nur zwei Minuten entfernt ist. Sie will es sich noch überlegen und bis morgen antworten.",
        "items": [
          {
            "id": "srav_q1",
            "question_text": "Wie lange sucht Hiba schon eine neue Wohnung?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt zwei Monate.",
            "order_index": 0,
            "answers": [
              {
                "id": "srav_q1_a1",
                "answer_text": "Zwei Monate",
                "is_correct": true
              },
              {
                "id": "srav_q1_a2",
                "answer_text": "Eine Woche",
                "is_correct": false
              },
              {
                "id": "srav_q1_a3",
                "answer_text": "Ein Jahr",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srav_q2",
            "question_text": "Was hat die Vermieterin zuerst gezeigt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt Wohnzimmer und Küche zuerst.",
            "order_index": 1,
            "answers": [
              {
                "id": "srav_q2_a1",
                "answer_text": "Das Wohnzimmer und die Küche",
                "is_correct": true
              },
              {
                "id": "srav_q2_a2",
                "answer_text": "Das Bad",
                "is_correct": false
              },
              {
                "id": "srav_q2_a3",
                "answer_text": "Den Balkon",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srav_q3",
            "question_text": "Das Schlafzimmer war größer, als Hiba gedacht hatte.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es war kleiner, als sie gedacht hatte.",
            "order_index": 2,
            "answers": [
              {
                "id": "srav_q3_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "srav_q3_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "srav_q4",
            "question_text": "Sind Haustiere in der Wohnung erlaubt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Vermieterin sagt, kleine Tiere sind kein Problem.",
            "order_index": 3,
            "answers": [
              {
                "id": "srav_q4_a1",
                "answer_text": "Ja, kleine Tiere sind kein Problem",
                "is_correct": true
              },
              {
                "id": "srav_q4_a2",
                "answer_text": "Nein, gar keine Tiere",
                "is_correct": false
              },
              {
                "id": "srav_q4_a3",
                "answer_text": "Nur Hunde",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srav_q5",
            "question_text": "Was gefällt Hiba an der Lage besonders?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt die nahe U-Bahn-Station.",
            "order_index": 4,
            "answers": [
              {
                "id": "srav_q5_a1",
                "answer_text": "Die U-Bahn-Station ist nah",
                "is_correct": true
              },
              {
                "id": "srav_q5_a2",
                "answer_text": "Der Park in der Nähe",
                "is_correct": false
              },
              {
                "id": "srav_q5_a3",
                "answer_text": "Die ruhige Straße",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srav_q6",
            "question_text": "Hiba entscheidet sich sofort für die Wohnung.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie will es sich noch überlegen und morgen antworten.",
            "order_index": 5,
            "answers": [
              {
                "id": "srav_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "srav_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_airport": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Am Flughafen\n\nYassin ist zum ersten Mal alleine geflogen und war deshalb ein wenig aufgeregt. Er ist drei Stunden vor dem Abflug am Flughafen angekommen, wie es ihm sein Vater empfohlen hatte. Am Check-in-Schalter hat er seinen Koffer abgegeben und seine Bordkarte bekommen. Danach musste er durch die Sicherheitskontrolle gehen, wo er seine Jacke und seinen Gürtel ausziehen musste. Das hat ihn überrascht, aber es ging schneller, als er gedacht hatte. Er hatte noch viel Zeit und hat deshalb in einem Café gewartet, bevor er zum richtigen Gate gegangen ist. Der Flug hatte am Ende keine Verspätung.",
        "items": [
          {
            "id": "srap_q1",
            "question_text": "Yassin ist zum ersten Mal alleine geflogen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt genau das.",
            "order_index": 0,
            "answers": [
              {
                "id": "srap_q1_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "srap_q1_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srap_q2",
            "question_text": "Wie lange vor dem Abflug ist er angekommen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt drei Stunden.",
            "order_index": 1,
            "answers": [
              {
                "id": "srap_q2_a1",
                "answer_text": "Drei Stunden",
                "is_correct": true
              },
              {
                "id": "srap_q2_a2",
                "answer_text": "Eine Stunde",
                "is_correct": false
              },
              {
                "id": "srap_q2_a3",
                "answer_text": "Fünf Stunden",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srap_q3",
            "question_text": "Was hat er am Check-in-Schalter gemacht?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt die Koffer-Abgabe.",
            "order_index": 2,
            "answers": [
              {
                "id": "srap_q3_a1",
                "answer_text": "Seinen Koffer abgegeben",
                "is_correct": true
              },
              {
                "id": "srap_q3_a2",
                "answer_text": "Sein Ticket gekauft",
                "is_correct": false
              },
              {
                "id": "srap_q3_a3",
                "answer_text": "Sein Gepäck verloren",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srap_q4",
            "question_text": "Was musste er bei der Sicherheitskontrolle ausziehen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt Jacke und Gürtel.",
            "order_index": 3,
            "answers": [
              {
                "id": "srap_q4_a1",
                "answer_text": "Jacke und Gürtel",
                "is_correct": true
              },
              {
                "id": "srap_q4_a2",
                "answer_text": "Nur die Schuhe",
                "is_correct": false
              },
              {
                "id": "srap_q4_a3",
                "answer_text": "Seine Uhr",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srap_q5",
            "question_text": "Die Sicherheitskontrolle hat länger gedauert, als er gedacht hatte.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es ging schneller, als er gedacht hatte.",
            "order_index": 4,
            "answers": [
              {
                "id": "srap_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "srap_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "srap_q6",
            "question_text": "Hatte der Flug am Ende Verspätung?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text sagt, der Flug hatte keine Verspätung.",
            "order_index": 5,
            "answers": [
              {
                "id": "srap_q6_a1",
                "answer_text": "Nein, keine Verspätung",
                "is_correct": true
              },
              {
                "id": "srap_q6_a2",
                "answer_text": "Ja, eine Stunde",
                "is_correct": false
              },
              {
                "id": "srap_q6_a3",
                "answer_text": "Ja, dreißig Minuten",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_package": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Ein Paket bei der Post abholen\n\nAls Nadia letzte Woche nicht zu Hause war, konnte der Postbote ihr Paket nicht zustellen und hat stattdessen eine Benachrichtigung in den Briefkasten gelegt. Auf dem Zettel stand, dass sie das Paket bei der Postfiliale in ihrer Straße abholen kann. Am nächsten Tag ist Nadia dorthin gegangen und musste zuerst kurz warten, weil viele Kunden in der Schlange standen. Als sie an der Reihe war, hat sie ihren Personalausweis und die Benachrichtigung gezeigt. Die Mitarbeiterin hat kurz nach dem Paket gesucht und es ihr dann gegeben. Nadia war überrascht, wie schnell alles am Ende ging.",
        "items": [
          {
            "id": "srpk_q1",
            "question_text": "Warum konnte der Postbote das Paket nicht zustellen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt genau diesen Grund.",
            "order_index": 0,
            "answers": [
              {
                "id": "srpk_q1_a1",
                "answer_text": "Nadia war nicht zu Hause",
                "is_correct": true
              },
              {
                "id": "srpk_q1_a2",
                "answer_text": "Die Adresse war falsch",
                "is_correct": false
              },
              {
                "id": "srpk_q1_a3",
                "answer_text": "Das Paket war beschädigt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srpk_q2",
            "question_text": "Was hat der Postbote stattdessen gemacht?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt die Benachrichtigung.",
            "order_index": 1,
            "answers": [
              {
                "id": "srpk_q2_a1",
                "answer_text": "Eine Benachrichtigung in den Briefkasten gelegt",
                "is_correct": true
              },
              {
                "id": "srpk_q2_a2",
                "answer_text": "Das Paket zurückgeschickt",
                "is_correct": false
              },
              {
                "id": "srpk_q2_a3",
                "answer_text": "Einen Nachbarn gefragt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srpk_q3",
            "question_text": "Wo kann Nadia das Paket abholen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt die Postfiliale in ihrer Straße.",
            "order_index": 2,
            "answers": [
              {
                "id": "srpk_q3_a1",
                "answer_text": "Bei der Postfiliale in ihrer Straße",
                "is_correct": true
              },
              {
                "id": "srpk_q3_a2",
                "answer_text": "Bei einem Nachbarn",
                "is_correct": false
              },
              {
                "id": "srpk_q3_a3",
                "answer_text": "Im Rathaus",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srpk_q4",
            "question_text": "Nadia musste nicht warten, weil niemand da war.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie musste kurz warten, weil viele Kunden in der Schlange standen.",
            "order_index": 3,
            "answers": [
              {
                "id": "srpk_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "srpk_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "srpk_q5",
            "question_text": "Was musste Nadia zeigen, um das Paket zu bekommen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt beide Dokumente.",
            "order_index": 4,
            "answers": [
              {
                "id": "srpk_q5_a1",
                "answer_text": "Personalausweis und Benachrichtigung",
                "is_correct": true
              },
              {
                "id": "srpk_q5_a2",
                "answer_text": "Nur ihren Reisepass",
                "is_correct": false
              },
              {
                "id": "srpk_q5_a3",
                "answer_text": "Eine Quittung",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srpk_q6",
            "question_text": "Nadia war überrascht, wie schnell alles ging.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Text sagt das genau so.",
            "order_index": 5,
            "answers": [
              {
                "id": "srpk_q6_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "srpk_q6_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_reading_copyshop": {
    "sections": [
      {
        "key": "reading1",
        "name": "قراءة سريعة",
        "type": "reading",
        "official_duration_minutes": null,
        "instructions": "اقرأ النص التالي ثم أجب عن الأسئلة.",
        "passage": "Im Copyshop\n\nOmar brauchte dringend gedruckte Kopien seiner Bewerbungsunterlagen für ein Vorstellungsgespräch am nächsten Tag, deshalb ist er in einen Copyshop in der Nähe gegangen. Er hat der Mitarbeiterin einen USB-Stick mit seinen Dokumenten gegeben und gebeten, alles dreimal in Farbe auszudrucken. Sie hat ihm auch angeboten, die Dokumente zu binden, damit sie ordentlicher aussehen. Omar fand die Idee gut und hat sich dafür entschieden. Der ganze Vorgang hat nur zehn Minuten gedauert, und er hat am Ende weniger bezahlt, als er erwartet hatte. Zufrieden ist er nach Hause gegangen, um sich auf das Gespräch vorzubereiten.",
        "items": [
          {
            "id": "srcs_q1",
            "question_text": "Warum ist Omar in den Copyshop gegangen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt die Bewerbungsunterlagen.",
            "order_index": 0,
            "answers": [
              {
                "id": "srcs_q1_a1",
                "answer_text": "Für Kopien seiner Bewerbungsunterlagen",
                "is_correct": true
              },
              {
                "id": "srcs_q1_a2",
                "answer_text": "Um ein Foto machen zu lassen",
                "is_correct": false
              },
              {
                "id": "srcs_q1_a3",
                "answer_text": "Um einen Computer zu kaufen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srcs_q2",
            "question_text": "Was hat er der Mitarbeiterin gegeben?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt einen USB-Stick.",
            "order_index": 1,
            "answers": [
              {
                "id": "srcs_q2_a1",
                "answer_text": "Einen USB-Stick",
                "is_correct": true
              },
              {
                "id": "srcs_q2_a2",
                "answer_text": "Ein Buch",
                "is_correct": false
              },
              {
                "id": "srcs_q2_a3",
                "answer_text": "Eine Speicherkarte",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srcs_q3",
            "question_text": "Wie oft sollten die Dokumente gedruckt werden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt dreimal.",
            "order_index": 2,
            "answers": [
              {
                "id": "srcs_q3_a1",
                "answer_text": "Dreimal",
                "is_correct": true
              },
              {
                "id": "srcs_q3_a2",
                "answer_text": "Einmal",
                "is_correct": false
              },
              {
                "id": "srcs_q3_a3",
                "answer_text": "Fünfmal",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srcs_q4",
            "question_text": "Omar lehnt das Angebot ab, die Dokumente zu binden.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er findet die Idee gut und entscheidet sich dafür.",
            "order_index": 3,
            "answers": [
              {
                "id": "srcs_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "srcs_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "srcs_q5",
            "question_text": "Wie lange hat der ganze Vorgang gedauert?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Text nennt zehn Minuten.",
            "order_index": 4,
            "answers": [
              {
                "id": "srcs_q5_a1",
                "answer_text": "Zehn Minuten",
                "is_correct": true
              },
              {
                "id": "srcs_q5_a2",
                "answer_text": "Eine Stunde",
                "is_correct": false
              },
              {
                "id": "srcs_q5_a3",
                "answer_text": "Dreißig Minuten",
                "is_correct": false
              }
            ]
          },
          {
            "id": "srcs_q6",
            "question_text": "Omar hat mehr bezahlt, als er erwartet hatte.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er hat weniger bezahlt, als er erwartet hatte.",
            "order_index": 5,
            "answers": [
              {
                "id": "srcs_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "srcs_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_taxi": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص الحوار كما لو كنت تسمعه، ثم أجب عن الأسئلة.",
        "passage": "Im Taxi:\n\"Guten Abend, wohin möchten Sie?\nGuten Abend, zum Hauptbahnhof bitte, ich muss einen Zug um neun Uhr erreichen.\nKein Problem, das dauert normalerweise fünfzehn Minuten, aber heute ist etwas mehr Verkehr.\nWird das ein Problem sein? Ich habe nicht mehr so viel Zeit.\nIch nehme eine andere Straße, dann sollten wir es rechtzeitig schaffen.\nDanke, das beruhigt mich.\nSind Sie zum ersten Mal in der Stadt?\nNein, ich wohne hier, aber ich fahre selten mit dem Taxi.\nAlles klar, wir sind gleich da.\"",
        "audio_url": "/audio/test_skill_listening_taxi__listening1.mp3",
        "items": [
          {
            "id": "slt_q1",
            "question_text": "Wohin möchte der Fahrgast?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Fahrgast nennt den Hauptbahnhof.",
            "order_index": 0,
            "answers": [
              {
                "id": "slt_q1_a1",
                "answer_text": "Zum Hauptbahnhof",
                "is_correct": true
              },
              {
                "id": "slt_q1_a2",
                "answer_text": "Zum Flughafen",
                "is_correct": false
              },
              {
                "id": "slt_q1_a3",
                "answer_text": "Zu einem Hotel",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slt_q2",
            "question_text": "Warum hat der Fahrgast es eilig?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Fahrgast nennt genau diesen Grund.",
            "order_index": 1,
            "answers": [
              {
                "id": "slt_q2_a1",
                "answer_text": "Er muss einen Zug um neun Uhr erreichen",
                "is_correct": true
              },
              {
                "id": "slt_q2_a2",
                "answer_text": "Er hat ein Meeting",
                "is_correct": false
              },
              {
                "id": "slt_q2_a3",
                "answer_text": "Er hat einen Arzttermin",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slt_q3",
            "question_text": "Die Fahrt dauert normalerweise fünfzehn Minuten.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Der Fahrer sagt das genau so.",
            "order_index": 2,
            "answers": [
              {
                "id": "slt_q3_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "slt_q3_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slt_q4",
            "question_text": "Warum könnte die Fahrt heute länger dauern?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Fahrer nennt mehr Verkehr als Grund.",
            "order_index": 3,
            "answers": [
              {
                "id": "slt_q4_a1",
                "answer_text": "Es ist mehr Verkehr als sonst",
                "is_correct": true
              },
              {
                "id": "slt_q4_a2",
                "answer_text": "Das Taxi hat eine Panne",
                "is_correct": false
              },
              {
                "id": "slt_q4_a3",
                "answer_text": "Die Straße ist gesperrt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slt_q5",
            "question_text": "Was macht der Fahrer, um pünktlich anzukommen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Fahrer sagt, er nimmt eine andere Straße.",
            "order_index": 4,
            "answers": [
              {
                "id": "slt_q5_a1",
                "answer_text": "Er nimmt eine andere Straße",
                "is_correct": true
              },
              {
                "id": "slt_q5_a2",
                "answer_text": "Er fährt schneller",
                "is_correct": false
              },
              {
                "id": "slt_q5_a3",
                "answer_text": "Er ruft einen Kollegen an",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slt_q6",
            "question_text": "Der Fahrgast ist zum ersten Mal in der Stadt.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er wohnt dort, fährt aber selten mit dem Taxi.",
            "order_index": 5,
            "answers": [
              {
                "id": "slt_q6_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "slt_q6_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_flight_announcement": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص الإعلان كما لو كنت تسمعه، ثم أجب عن الأسئلة.",
        "passage": "Sehr geehrte Fluggäste, wir bitten alle Passagiere des Fluges nach Frankfurt, sich jetzt zum Gate 14 zu begeben, da das Boarding in wenigen Minuten beginnt. Bitte halten Sie Ihre Bordkarte und Ihren Reisepass bereit. Passagiere mit Kindern oder eingeschränkter Mobilität können bereits jetzt einsteigen. Wir weisen darauf hin, dass Handgepäck nur ein Stück pro Person sein darf. Der Flug ist aktuell voll besetzt, deshalb bitten wir um pünktliches Erscheinen am Gate. Bei Fragen wenden Sie sich bitte an das Personal am Gate. Wir wünschen Ihnen einen angenehmen Flug.",
        "audio_url": "/audio/test_skill_listening_flight_announcement__listening1.mp3",
        "items": [
          {
            "id": "slfa_q1",
            "question_text": "Wohin fliegt dieser Flug?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt Frankfurt.",
            "order_index": 0,
            "answers": [
              {
                "id": "slfa_q1_a1",
                "answer_text": "Nach Frankfurt",
                "is_correct": true
              },
              {
                "id": "slfa_q1_a2",
                "answer_text": "Nach Berlin",
                "is_correct": false
              },
              {
                "id": "slfa_q1_a3",
                "answer_text": "Nach München",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slfa_q2",
            "question_text": "Zu welchem Gate sollen sich die Passagiere begeben?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt Gate 14.",
            "order_index": 1,
            "answers": [
              {
                "id": "slfa_q2_a1",
                "answer_text": "Gate 14",
                "is_correct": true
              },
              {
                "id": "slfa_q2_a2",
                "answer_text": "Gate 4",
                "is_correct": false
              },
              {
                "id": "slfa_q2_a3",
                "answer_text": "Gate 40",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slfa_q3",
            "question_text": "Passagiere mit Kindern dürfen zuerst einsteigen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Durchsage sagt das genau so.",
            "order_index": 2,
            "answers": [
              {
                "id": "slfa_q3_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "slfa_q3_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slfa_q4",
            "question_text": "Wie viele Handgepäckstücke sind pro Person erlaubt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt ein Stück pro Person.",
            "order_index": 3,
            "answers": [
              {
                "id": "slfa_q4_a1",
                "answer_text": "Nur eins",
                "is_correct": true
              },
              {
                "id": "slfa_q4_a2",
                "answer_text": "Zwei",
                "is_correct": false
              },
              {
                "id": "slfa_q4_a3",
                "answer_text": "Drei",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slfa_q5",
            "question_text": "Warum wird um pünktliches Erscheinen gebeten?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt den vollen Flug als Grund.",
            "order_index": 4,
            "answers": [
              {
                "id": "slfa_q5_a1",
                "answer_text": "Der Flug ist voll besetzt",
                "is_correct": true
              },
              {
                "id": "slfa_q5_a2",
                "answer_text": "Es gibt technische Probleme",
                "is_correct": false
              },
              {
                "id": "slfa_q5_a3",
                "answer_text": "Das Wetter ist schlecht",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slfa_q6",
            "question_text": "An wen sollen sich Passagiere mit Fragen wenden?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Durchsage nennt das Personal am Gate.",
            "order_index": 5,
            "answers": [
              {
                "id": "slfa_q6_a1",
                "answer_text": "An das Personal am Gate",
                "is_correct": true
              },
              {
                "id": "slfa_q6_a2",
                "answer_text": "An den Piloten",
                "is_correct": false
              },
              {
                "id": "slfa_q6_a3",
                "answer_text": "An die Information in der Halle",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_car_repair": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص المكالمة كما لو كنت تسمعها، ثم أجب عن الأسئلة.",
        "passage": "Autowerkstatt Müller, guten Tag.\nGuten Tag, mein Auto macht seit gestern ein komisches Geräusch, wenn ich bremse.\nDas sollten wir uns ansehen. Können Sie das Auto heute noch vorbeibringen?\nJa, das würde gehen. Um wie viel Uhr passt es Ihnen?\nAm besten so gegen vierzehn Uhr, dann haben wir noch Zeit für eine Untersuchung.\nGut, dann komme ich um vierzehn Uhr.\nBringen Sie bitte auch die Fahrzeugpapiere mit. Falls die Bremsen erneuert werden müssen, rufen wir Sie vorher an.\nAlles klar, vielen Dank für die Information.\nGerne, bis später.\"",
        "audio_url": "/audio/test_skill_listening_car_repair__listening1.mp3",
        "items": [
          {
            "id": "slcr_q1",
            "question_text": "Was ist das Problem mit dem Auto?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Anrufer nennt ein Geräusch beim Bremsen.",
            "order_index": 0,
            "answers": [
              {
                "id": "slcr_q1_a1",
                "answer_text": "Ein komisches Geräusch beim Bremsen",
                "is_correct": true
              },
              {
                "id": "slcr_q1_a2",
                "answer_text": "Das Auto startet nicht",
                "is_correct": false
              },
              {
                "id": "slcr_q1_a3",
                "answer_text": "Ein Ölverlust",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slcr_q2",
            "question_text": "Seit wann macht das Auto das Geräusch?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Anrufer nennt seit gestern.",
            "order_index": 1,
            "answers": [
              {
                "id": "slcr_q2_a1",
                "answer_text": "Seit gestern",
                "is_correct": true
              },
              {
                "id": "slcr_q2_a2",
                "answer_text": "Seit einer Woche",
                "is_correct": false
              },
              {
                "id": "slcr_q2_a3",
                "answer_text": "Seit heute Morgen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slcr_q3",
            "question_text": "Um wie viel Uhr soll der Kunde vorbeikommen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie einigen sich auf vierzehn Uhr.",
            "order_index": 2,
            "answers": [
              {
                "id": "slcr_q3_a1",
                "answer_text": "Um vierzehn Uhr",
                "is_correct": true
              },
              {
                "id": "slcr_q3_a2",
                "answer_text": "Um zehn Uhr",
                "is_correct": false
              },
              {
                "id": "slcr_q3_a3",
                "answer_text": "Um achtzehn Uhr",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slcr_q4",
            "question_text": "Der Kunde soll die Fahrzeugpapiere mitbringen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Die Werkstatt bittet genau darum.",
            "order_index": 3,
            "answers": [
              {
                "id": "slcr_q4_r",
                "answer_text": "Richtig",
                "is_correct": true
              },
              {
                "id": "slcr_q4_f",
                "answer_text": "Falsch",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slcr_q5",
            "question_text": "Was passiert, wenn die Bremsen erneuert werden müssen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Werkstatt sagt, sie ruft vorher an.",
            "order_index": 4,
            "answers": [
              {
                "id": "slcr_q5_a1",
                "answer_text": "Die Werkstatt ruft vorher an",
                "is_correct": true
              },
              {
                "id": "slcr_q5_a2",
                "answer_text": "Sie machen es ohne Rückfrage",
                "is_correct": false
              },
              {
                "id": "slcr_q5_a3",
                "answer_text": "Der Kunde muss es selbst reparieren",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slcr_q6",
            "question_text": "Wofür wird noch Zeit sein, wenn der Kunde um vierzehn Uhr kommt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Werkstatt nennt eine Untersuchung.",
            "order_index": 5,
            "answers": [
              {
                "id": "slcr_q6_a1",
                "answer_text": "Für eine Untersuchung",
                "is_correct": true
              },
              {
                "id": "slcr_q6_a2",
                "answer_text": "Für eine Probefahrt",
                "is_correct": false
              },
              {
                "id": "slcr_q6_a3",
                "answer_text": "Für ein Ersatzauto",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_radio_news": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص النشرة كما لو كنت تسمعها، ثم أجب عن الأسئلة.",
        "passage": "Und hier die Nachrichten. In der Innenstadt beginnen ab morgen Bauarbeiten an der Hauptstraße, die voraussichtlich drei Wochen dauern werden. Autofahrer sollten während dieser Zeit eine andere Strecke wählen, da die Straße für den Verkehr gesperrt wird. Busse fahren weiterhin, allerdings über eine Umleitung, die etwa zehn Minuten länger dauert. Die Stadtverwaltung entschuldigt sich für die entstehenden Unannehmlichkeiten und bittet um Verständnis. Weitere Informationen zur Umleitung finden Sie auf der Webseite der Stadt. Nun zum Wetter für morgen...",
        "audio_url": "/audio/test_skill_listening_radio_news__listening1.mp3",
        "items": [
          {
            "id": "slrn_q1",
            "question_text": "Was beginnt ab morgen in der Innenstadt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Nachricht nennt Bauarbeiten.",
            "order_index": 0,
            "answers": [
              {
                "id": "slrn_q1_a1",
                "answer_text": "Bauarbeiten an der Hauptstraße",
                "is_correct": true
              },
              {
                "id": "slrn_q1_a2",
                "answer_text": "Ein Straßenfest",
                "is_correct": false
              },
              {
                "id": "slrn_q1_a3",
                "answer_text": "Eine Demonstration",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slrn_q2",
            "question_text": "Wie lange werden die Bauarbeiten voraussichtlich dauern?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Nachricht nennt drei Wochen.",
            "order_index": 1,
            "answers": [
              {
                "id": "slrn_q2_a1",
                "answer_text": "Drei Wochen",
                "is_correct": true
              },
              {
                "id": "slrn_q2_a2",
                "answer_text": "Eine Woche",
                "is_correct": false
              },
              {
                "id": "slrn_q2_a3",
                "answer_text": "Zwei Monate",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slrn_q3",
            "question_text": "Die Hauptstraße bleibt für den Verkehr offen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Sie wird für den Verkehr gesperrt.",
            "order_index": 2,
            "answers": [
              {
                "id": "slrn_q3_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "slrn_q3_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "slrn_q4",
            "question_text": "Was passiert mit den Bussen während der Bauarbeiten?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Nachricht nennt eine Umleitung für Busse.",
            "order_index": 3,
            "answers": [
              {
                "id": "slrn_q4_a1",
                "answer_text": "Sie fahren über eine Umleitung",
                "is_correct": true
              },
              {
                "id": "slrn_q4_a2",
                "answer_text": "Sie fahren gar nicht mehr",
                "is_correct": false
              },
              {
                "id": "slrn_q4_a3",
                "answer_text": "Sie fahren häufiger",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slrn_q5",
            "question_text": "Wie viel länger dauert die Umleitung ungefähr?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Nachricht nennt etwa zehn Minuten.",
            "order_index": 4,
            "answers": [
              {
                "id": "slrn_q5_a1",
                "answer_text": "Etwa zehn Minuten",
                "is_correct": true
              },
              {
                "id": "slrn_q5_a2",
                "answer_text": "Etwa eine Stunde",
                "is_correct": false
              },
              {
                "id": "slrn_q5_a3",
                "answer_text": "Etwa zwei Minuten",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slrn_q6",
            "question_text": "Wo finden Bürger weitere Informationen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Nachricht nennt die Webseite der Stadt.",
            "order_index": 5,
            "answers": [
              {
                "id": "slrn_q6_a1",
                "answer_text": "Auf der Webseite der Stadt",
                "is_correct": true
              },
              {
                "id": "slrn_q6_a2",
                "answer_text": "In der Zeitung",
                "is_correct": false
              },
              {
                "id": "slrn_q6_a3",
                "answer_text": "Beim Busfahrer",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_apartment_ad": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص المكالمة كما لو كنت تسمعها، ثم أجب عن الأسئلة.",
        "passage": "Guten Tag, ich rufe wegen der Wohnungsanzeige an, die Sie online veröffentlicht haben.\nGuten Tag, ja, die Wohnung ist noch frei. Möchten Sie mehr darüber wissen?\nJa gerne, wie viele Zimmer hat die Wohnung genau?\nEs sind zwei Zimmer, plus Küche und Bad, insgesamt etwa fünfundfünfzig Quadratmeter.\nUnd ist ein Balkon dabei? In der Anzeige stand das nicht so klar.\nJa, es gibt einen kleinen Balkon zum Innenhof.\nDas klingt gut. Wäre eine Besichtigung diese Woche möglich?\nJa, am Donnerstagnachmittag hätte ich Zeit. Passt Ihnen sechzehn Uhr?\nJa, das passt mir sehr gut. Vielen Dank.\"",
        "audio_url": "/audio/test_skill_listening_apartment_ad__listening1.mp3",
        "items": [
          {
            "id": "slaa_q1",
            "question_text": "Warum ruft die Person an?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Anruferin nennt eine Wohnungsanzeige.",
            "order_index": 0,
            "answers": [
              {
                "id": "slaa_q1_a1",
                "answer_text": "Wegen einer Wohnungsanzeige",
                "is_correct": true
              },
              {
                "id": "slaa_q1_a2",
                "answer_text": "Wegen eines Jobangebots",
                "is_correct": false
              },
              {
                "id": "slaa_q1_a3",
                "answer_text": "Wegen eines Autoverkaufs",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slaa_q2",
            "question_text": "Wie viele Zimmer hat die Wohnung?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Vermieter nennt zwei Zimmer.",
            "order_index": 1,
            "answers": [
              {
                "id": "slaa_q2_a1",
                "answer_text": "Zwei Zimmer",
                "is_correct": true
              },
              {
                "id": "slaa_q2_a2",
                "answer_text": "Ein Zimmer",
                "is_correct": false
              },
              {
                "id": "slaa_q2_a3",
                "answer_text": "Drei Zimmer",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slaa_q3",
            "question_text": "Wie groß ist die Wohnung ungefähr?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Vermieter nennt etwa fünfundfünfzig Quadratmeter.",
            "order_index": 2,
            "answers": [
              {
                "id": "slaa_q3_a1",
                "answer_text": "Etwa fünfundfünfzig Quadratmeter",
                "is_correct": true
              },
              {
                "id": "slaa_q3_a2",
                "answer_text": "Etwa dreißig Quadratmeter",
                "is_correct": false
              },
              {
                "id": "slaa_q3_a3",
                "answer_text": "Etwa hundert Quadratmeter",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slaa_q4",
            "question_text": "Die Wohnung hat keinen Balkon.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es gibt einen kleinen Balkon zum Innenhof.",
            "order_index": 3,
            "answers": [
              {
                "id": "slaa_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "slaa_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "slaa_q5",
            "question_text": "Wann ist die Besichtigung geplant?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Sie einigen sich auf Donnerstagnachmittag.",
            "order_index": 4,
            "answers": [
              {
                "id": "slaa_q5_a1",
                "answer_text": "Donnerstagnachmittag",
                "is_correct": true
              },
              {
                "id": "slaa_q5_a2",
                "answer_text": "Montagvormittag",
                "is_correct": false
              },
              {
                "id": "slaa_q5_a3",
                "answer_text": "Samstagabend",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slaa_q6",
            "question_text": "Um wie viel Uhr ist die Besichtigung?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Vermieter nennt sechzehn Uhr.",
            "order_index": 5,
            "answers": [
              {
                "id": "slaa_q6_a1",
                "answer_text": "Um sechzehn Uhr",
                "is_correct": true
              },
              {
                "id": "slaa_q6_a2",
                "answer_text": "Um zehn Uhr",
                "is_correct": false
              },
              {
                "id": "slaa_q6_a3",
                "answer_text": "Um zwanzig Uhr",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_food_delivery": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص المكالمة كما لو كنت تسمعها، ثم أجب عن الأسئلة.",
        "passage": "Pizzeria Roma, guten Abend.\nGuten Abend, ich möchte gerne etwas bestellen, wenn das noch möglich ist.\nJa klar, was hätten Sie gerne?\nEinmal eine Pizza Margherita und einmal einen Salat mit Hähnchen, bitte.\nMöchten Sie dazu auch ein Getränk?\nJa, eine Flasche Wasser bitte.\nAlles klar, das macht dann zusammen achtzehn Euro fünfzig. Zahlen Sie bar oder mit Karte bei Lieferung?\nMit Karte, wenn das geht.\nKein Problem. Die Lieferung dauert ungefähr vierzig Minuten.\nGut, vielen Dank.\"",
        "audio_url": "/audio/test_skill_listening_food_delivery__listening1.mp3",
        "items": [
          {
            "id": "slfd_q1",
            "question_text": "Was bestellt der Kunde zuerst?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Kunde bestellt eine Pizza Margherita.",
            "order_index": 0,
            "answers": [
              {
                "id": "slfd_q1_a1",
                "answer_text": "Eine Pizza Margherita",
                "is_correct": true
              },
              {
                "id": "slfd_q1_a2",
                "answer_text": "Eine Pizza Salami",
                "is_correct": false
              },
              {
                "id": "slfd_q1_a3",
                "answer_text": "Eine Lasagne",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slfd_q2",
            "question_text": "Was bestellt der Kunde außerdem?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Kunde nennt einen Salat mit Hähnchen.",
            "order_index": 1,
            "answers": [
              {
                "id": "slfd_q2_a1",
                "answer_text": "Einen Salat mit Hähnchen",
                "is_correct": true
              },
              {
                "id": "slfd_q2_a2",
                "answer_text": "Eine Suppe",
                "is_correct": false
              },
              {
                "id": "slfd_q2_a3",
                "answer_text": "Ein Dessert",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slfd_q3",
            "question_text": "Welches Getränk bestellt der Kunde?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Der Kunde nennt eine Flasche Wasser.",
            "order_index": 2,
            "answers": [
              {
                "id": "slfd_q3_a1",
                "answer_text": "Eine Flasche Wasser",
                "is_correct": true
              },
              {
                "id": "slfd_q3_a2",
                "answer_text": "Eine Cola",
                "is_correct": false
              },
              {
                "id": "slfd_q3_a3",
                "answer_text": "Einen Saft",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slfd_q4",
            "question_text": "Wie viel kostet die Bestellung insgesamt?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Mitarbeiterin nennt achtzehn Euro fünfzig.",
            "order_index": 3,
            "answers": [
              {
                "id": "slfd_q4_a1",
                "answer_text": "Achtzehn Euro fünfzig",
                "is_correct": true
              },
              {
                "id": "slfd_q4_a2",
                "answer_text": "Zwölf Euro",
                "is_correct": false
              },
              {
                "id": "slfd_q4_a3",
                "answer_text": "Fünfundzwanzig Euro",
                "is_correct": false
              }
            ]
          },
          {
            "id": "slfd_q5",
            "question_text": "Der Kunde möchte bar bezahlen.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Er möchte mit Karte bezahlen.",
            "order_index": 4,
            "answers": [
              {
                "id": "slfd_q5_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "slfd_q5_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "slfd_q6",
            "question_text": "Wie lange dauert die Lieferung ungefähr?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Mitarbeiterin nennt ungefähr vierzig Minuten.",
            "order_index": 5,
            "answers": [
              {
                "id": "slfd_q6_a1",
                "answer_text": "Ungefähr vierzig Minuten",
                "is_correct": true
              },
              {
                "id": "slfd_q6_a2",
                "answer_text": "Ungefähr zehn Minuten",
                "is_correct": false
              },
              {
                "id": "slfd_q6_a3",
                "answer_text": "Ungefähr zwei Stunden",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_listening_dentist_booking": {
    "sections": [
      {
        "key": "listening1",
        "name": "استماع سريع",
        "type": "listening",
        "official_duration_minutes": null,
        "instructions": "لا يتضمن هذا التدريب ملفًا صوتيًا حقيقيًا بعد — اقرأ نص المكالمة كما لو كنت تسمعها، ثم أجب عن الأسئلة.",
        "passage": "Zahnarztpraxis Dr. Weber, guten Tag.\nGuten Tag, ich hätte gerne einen Termin, ich habe seit zwei Tagen Zahnschmerzen.\nDas tut mir leid zu hören. Wir haben morgen Nachmittag noch einen freien Termin, würde das passen?\nJa, das wäre super. Um wie viel Uhr genau?\nUm fünfzehn Uhr dreißig. Waren Sie schon einmal bei uns?\nNein, das wäre mein erster Besuch hier.\nDann bringen Sie bitte Ihre Versichertenkarte mit und kommen Sie zehn Minuten früher, damit wir ein paar Formulare ausfüllen können.\nAlles klar, vielen Dank, bis morgen.\"",
        "audio_url": "/audio/test_skill_listening_dentist_booking__listening1.mp3",
        "items": [
          {
            "id": "sldb_q1",
            "question_text": "Warum ruft die Person an?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Anruferin nennt Zahnschmerzen seit zwei Tagen.",
            "order_index": 0,
            "answers": [
              {
                "id": "sldb_q1_a1",
                "answer_text": "Sie hat seit zwei Tagen Zahnschmerzen",
                "is_correct": true
              },
              {
                "id": "sldb_q1_a2",
                "answer_text": "Sie möchte eine Rechnung bezahlen",
                "is_correct": false
              },
              {
                "id": "sldb_q1_a3",
                "answer_text": "Sie möchte einen Termin absagen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sldb_q2",
            "question_text": "Wann ist der nächste freie Termin?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Praxis nennt morgen Nachmittag.",
            "order_index": 1,
            "answers": [
              {
                "id": "sldb_q2_a1",
                "answer_text": "Morgen Nachmittag",
                "is_correct": true
              },
              {
                "id": "sldb_q2_a2",
                "answer_text": "Heute Abend",
                "is_correct": false
              },
              {
                "id": "sldb_q2_a3",
                "answer_text": "Nächste Woche",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sldb_q3",
            "question_text": "Um wie viel Uhr genau ist der Termin?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Praxis nennt fünfzehn Uhr dreißig.",
            "order_index": 2,
            "answers": [
              {
                "id": "sldb_q3_a1",
                "answer_text": "Um fünfzehn Uhr dreißig",
                "is_correct": true
              },
              {
                "id": "sldb_q3_a2",
                "answer_text": "Um neun Uhr",
                "is_correct": false
              },
              {
                "id": "sldb_q3_a3",
                "answer_text": "Um achtzehn Uhr",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sldb_q4",
            "question_text": "Die Anruferin war schon einmal in dieser Praxis.",
            "question_type": "true_false",
            "points": 1,
            "explanation": "Es wäre ihr erster Besuch dort.",
            "order_index": 3,
            "answers": [
              {
                "id": "sldb_q4_r",
                "answer_text": "Richtig",
                "is_correct": false
              },
              {
                "id": "sldb_q4_f",
                "answer_text": "Falsch",
                "is_correct": true
              }
            ]
          },
          {
            "id": "sldb_q5",
            "question_text": "Was soll die Anruferin mitbringen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Praxis nennt die Versichertenkarte.",
            "order_index": 4,
            "answers": [
              {
                "id": "sldb_q5_a1",
                "answer_text": "Ihre Versichertenkarte",
                "is_correct": true
              },
              {
                "id": "sldb_q5_a2",
                "answer_text": "Einen Ausweis mit Foto",
                "is_correct": false
              },
              {
                "id": "sldb_q5_a3",
                "answer_text": "Eine Überweisung",
                "is_correct": false
              }
            ]
          },
          {
            "id": "sldb_q6",
            "question_text": "Wie viel früher soll sie kommen?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die Praxis nennt zehn Minuten früher.",
            "order_index": 5,
            "answers": [
              {
                "id": "sldb_q6_a1",
                "answer_text": "Zehn Minuten früher",
                "is_correct": true
              },
              {
                "id": "sldb_q6_a2",
                "answer_text": "Eine Stunde früher",
                "is_correct": false
              },
              {
                "id": "sldb_q6_a3",
                "answer_text": "Fünf Minuten früher",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": null
  },
  "test_skill_writing_prepositions": {
    "sections": [
      {
        "key": "language1",
        "name": "حروف الجر",
        "type": "language",
        "official_duration_minutes": null,
        "instructions": "اختر حرف الجر الصحيح في كل جملة.",
        "passage": null,
        "items": [
          {
            "id": "swp_q1",
            "question_text": "Ich warte schon eine halbe Stunde ___ den Bus.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"warten auf\" + Akkusativ ist die feste Verbindung.",
            "order_index": 0,
            "answers": [
              {
                "id": "swp_q1_a1",
                "answer_text": "auf",
                "is_correct": true
              },
              {
                "id": "swp_q1_a2",
                "answer_text": "mit",
                "is_correct": false
              },
              {
                "id": "swp_q1_a3",
                "answer_text": "bei",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swp_q2",
            "question_text": "Er wohnt zurzeit ___ seiner Schwester.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"wohnen bei\" (jemandem) + Dativ.",
            "order_index": 1,
            "answers": [
              {
                "id": "swp_q2_a1",
                "answer_text": "bei",
                "is_correct": true
              },
              {
                "id": "swp_q2_a2",
                "answer_text": "auf",
                "is_correct": false
              },
              {
                "id": "swp_q2_a3",
                "answer_text": "zu",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swp_q3",
            "question_text": "Wir fahren nächste Woche ___ Hamburg.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Bei Städten ohne Artikel verwendet man \"nach\".",
            "order_index": 2,
            "answers": [
              {
                "id": "swp_q3_a1",
                "answer_text": "nach",
                "is_correct": true
              },
              {
                "id": "swp_q3_a2",
                "answer_text": "in",
                "is_correct": false
              },
              {
                "id": "swp_q3_a3",
                "answer_text": "zu",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swp_q4",
            "question_text": "Dieses Geschenk ist ___ dich.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"für\" + Akkusativ drückt aus, für wen etwas bestimmt ist.",
            "order_index": 3,
            "answers": [
              {
                "id": "swp_q4_a1",
                "answer_text": "für",
                "is_correct": true
              },
              {
                "id": "swp_q4_a2",
                "answer_text": "auf",
                "is_correct": false
              },
              {
                "id": "swp_q4_a3",
                "answer_text": "bei",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swp_q5",
            "question_text": "Sie kommt gerade ___ der Arbeit nach Hause.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"von der Arbeit kommen\" ist die übliche Wendung.",
            "order_index": 4,
            "answers": [
              {
                "id": "swp_q5_a1",
                "answer_text": "von",
                "is_correct": true
              },
              {
                "id": "swp_q5_a2",
                "answer_text": "aus",
                "is_correct": false
              },
              {
                "id": "swp_q5_a3",
                "answer_text": "mit",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swp_q6",
            "question_text": "Ich interessiere mich sehr ___ klassische Musik.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"sich interessieren für\" + Akkusativ ist die feste Verbindung.",
            "order_index": 5,
            "answers": [
              {
                "id": "swp_q6_a1",
                "answer_text": "für",
                "is_correct": true
              },
              {
                "id": "swp_q6_a2",
                "answer_text": "an",
                "is_correct": false
              },
              {
                "id": "swp_q6_a3",
                "answer_text": "mit",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": {
      "name": "رسالة شكوى",
      "official_duration_minutes": 15,
      "instructions": "اكتب رسالة من 80 إلى 100 كلمة تقريبًا.",
      "prompt": "اكتب رسالة شكوى إلى متجر إلكتروني اشتريت منه منتجًا وصل تالفًا. اذكر ماذا طلبت، ومتى وصل الطلب، وما هي المشكلة بالضبط، وماذا تريد من المتجر أن يفعل (استرجاع المال أو استبدال المنتج).",
      "sample_answer": "Sehr geehrte Damen und Herren,\n\nam 3. Juni habe ich bei Ihnen eine Kaffeemaschine bestellt, die gestern bei mir angekommen ist. Leider war der Karton beim Öffnen bereits beschädigt, und die Maschine selbst funktioniert nicht richtig - sie schaltet sich nach wenigen Sekunden von selbst aus.\n\nIch bitte Sie daher um einen Umtausch gegen ein neues Gerät. Falls das nicht möglich ist, möchte ich mein Geld zurückerstattet bekommen.\n\nIch würde mich über eine schnelle Rückmeldung freuen.\n\nMit freundlichen Grüßen,\nLina Berrada"
    }
  },
  "test_skill_writing_past_tense": {
    "sections": [
      {
        "key": "language1",
        "name": "صيغ الماضي",
        "type": "language",
        "official_duration_minutes": null,
        "instructions": "اختر الصيغة الصحيحة في كل جملة.",
        "passage": null,
        "items": [
          {
            "id": "swpt_q1",
            "question_text": "Ich ___ gestern Abend ins Kino gegangen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Verben der Bewegung bilden das Perfekt mit \"sein\".",
            "order_index": 0,
            "answers": [
              {
                "id": "swpt_q1_a1",
                "answer_text": "bin",
                "is_correct": true
              },
              {
                "id": "swpt_q1_a2",
                "answer_text": "habe",
                "is_correct": false
              },
              {
                "id": "swpt_q1_a3",
                "answer_text": "war",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swpt_q2",
            "question_text": "Er ___ das ganze Buch in einem Tag gelesen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"lesen\" bildet das Perfekt mit \"haben\".",
            "order_index": 1,
            "answers": [
              {
                "id": "swpt_q2_a1",
                "answer_text": "hat",
                "is_correct": true
              },
              {
                "id": "swpt_q2_a2",
                "answer_text": "ist",
                "is_correct": false
              },
              {
                "id": "swpt_q2_a3",
                "answer_text": "war",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swpt_q3",
            "question_text": "In der gesprochenen Sprache verwendet man meistens...",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Im mündlichen Erzählen wird meist das Perfekt bevorzugt.",
            "order_index": 2,
            "answers": [
              {
                "id": "swpt_q3_a1",
                "answer_text": "das Perfekt",
                "is_correct": true
              },
              {
                "id": "swpt_q3_a2",
                "answer_text": "das Präteritum",
                "is_correct": false
              },
              {
                "id": "swpt_q3_a3",
                "answer_text": "den Konjunktiv",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swpt_q4",
            "question_text": "Sie ___ letztes Jahr in Berlin. (Präteritum von \"sein\")",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"war\" ist das Präteritum von \"sein\", auch mündlich sehr gebräuchlich.",
            "order_index": 3,
            "answers": [
              {
                "id": "swpt_q4_a1",
                "answer_text": "war",
                "is_correct": true
              },
              {
                "id": "swpt_q4_a2",
                "answer_text": "ist gewesen",
                "is_correct": false
              },
              {
                "id": "swpt_q4_a3",
                "answer_text": "hatte",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swpt_q5",
            "question_text": "Wie lautet das Partizip II von \"fahren\"?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"fahren\" ist ein unregelmäßiges Verb: gefahren.",
            "order_index": 4,
            "answers": [
              {
                "id": "swpt_q5_a1",
                "answer_text": "gefahren",
                "is_correct": true
              },
              {
                "id": "swpt_q5_a2",
                "answer_text": "gefahrt",
                "is_correct": false
              },
              {
                "id": "swpt_q5_a3",
                "answer_text": "fahrte",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swpt_q6",
            "question_text": "Wir ___ damals keine Zeit für Urlaub. (Präteritum von \"haben\")",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"hatten\" ist das Präteritum von \"haben\", auch mündlich üblich.",
            "order_index": 5,
            "answers": [
              {
                "id": "swpt_q6_a1",
                "answer_text": "hatten",
                "is_correct": true
              },
              {
                "id": "swpt_q6_a2",
                "answer_text": "haben gehabt",
                "is_correct": false
              },
              {
                "id": "swpt_q6_a3",
                "answer_text": "sind gewesen",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": {
      "name": "سرد تجربة",
      "official_duration_minutes": 15,
      "instructions": "اكتب نصًا من 80 إلى 100 كلمة تقريبًا.",
      "prompt": "احك عن تجربة سافرت فيها لأول مرة إلى مكان جديد. اذكر إلى أين ذهبت، ومع من، وماذا حدث، وكيف شعرت في تلك الرحلة.",
      "sample_answer": "Vor zwei Jahren bin ich zum ersten Mal alleine nach Deutschland gereist. Ich war sehr aufgeregt, weil ich noch nie so weit von zu Hause weg gewesen war. Am Flughafen habe ich eine nette Frau kennengelernt, die mir bei der Passkontrolle geholfen hat. In Berlin habe ich bei einer Gastfamilie gewohnt, die mich sehr herzlich empfangen hat. Wir haben zusammen gekocht und viel geredet. Am Anfang hatte ich Angst, dass ich nicht genug Deutsch verstehen würde, aber es ging besser, als ich gedacht hatte. Diese Reise war eine der schönsten Erfahrungen meines Lebens."
    }
  },
  "test_skill_writing_modal_verbs": {
    "sections": [
      {
        "key": "language1",
        "name": "الأفعال الشرطية",
        "type": "language",
        "official_duration_minutes": null,
        "instructions": "اختر الفعل الشرطي الصحيح في كل جملة.",
        "passage": null,
        "items": [
          {
            "id": "swmv_q1",
            "question_text": "Du ___ mehr Wasser trinken, das ist gut für die Gesundheit.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"solltest\" (Konjunktiv II von sollen) drückt eine Empfehlung aus.",
            "order_index": 0,
            "answers": [
              {
                "id": "swmv_q1_a1",
                "answer_text": "solltest",
                "is_correct": true
              },
              {
                "id": "swmv_q1_a2",
                "answer_text": "darfst",
                "is_correct": false
              },
              {
                "id": "swmv_q1_a3",
                "answer_text": "kannst",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swmv_q2",
            "question_text": "Er ___ früher ins Bett gehen, wenn er müde ist.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"sollte\" ist die höfliche Form für einen Ratschlag.",
            "order_index": 1,
            "answers": [
              {
                "id": "swmv_q2_a1",
                "answer_text": "sollte",
                "is_correct": true
              },
              {
                "id": "swmv_q2_a2",
                "answer_text": "muss",
                "is_correct": false
              },
              {
                "id": "swmv_q2_a3",
                "answer_text": "darf",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swmv_q3",
            "question_text": "Wie lautet die richtige Form von \"können\" für \"ich\"?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Die 1. Person Singular von \"können\" ist \"kann\".",
            "order_index": 2,
            "answers": [
              {
                "id": "swmv_q3_a1",
                "answer_text": "kann",
                "is_correct": true
              },
              {
                "id": "swmv_q3_a2",
                "answer_text": "kannst",
                "is_correct": false
              },
              {
                "id": "swmv_q3_a3",
                "answer_text": "könnt",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swmv_q4",
            "question_text": "Sie ___ das nicht so ernst nehmen, es ist nicht so wichtig.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"sollte\" passt hier als sanfter Ratschlag.",
            "order_index": 3,
            "answers": [
              {
                "id": "swmv_q4_a1",
                "answer_text": "sollte",
                "is_correct": true
              },
              {
                "id": "swmv_q4_a2",
                "answer_text": "muss",
                "is_correct": false
              },
              {
                "id": "swmv_q4_a3",
                "answer_text": "will",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swmv_q5",
            "question_text": "Welches Modalverb drückt eine Möglichkeit aus?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"können\" drückt Fähigkeit oder Möglichkeit aus.",
            "order_index": 4,
            "answers": [
              {
                "id": "swmv_q5_a1",
                "answer_text": "können",
                "is_correct": true
              },
              {
                "id": "swmv_q5_a2",
                "answer_text": "müssen",
                "is_correct": false
              },
              {
                "id": "swmv_q5_a3",
                "answer_text": "sollen",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swmv_q6",
            "question_text": "Ich ___ dir gerne bei den Hausaufgaben helfen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"kann\" drückt hier ein Angebot/eine Fähigkeit aus.",
            "order_index": 5,
            "answers": [
              {
                "id": "swmv_q6_a1",
                "answer_text": "kann",
                "is_correct": true
              },
              {
                "id": "swmv_q6_a2",
                "answer_text": "soll",
                "is_correct": false
              },
              {
                "id": "swmv_q6_a3",
                "answer_text": "darf",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": {
      "name": "تقديم نصيحة",
      "official_duration_minutes": 15,
      "instructions": "اكتب نصًا من 80 إلى 100 كلمة تقريبًا.",
      "prompt": "صديقك يشعر بالتوتر الشديد بسبب اختبار مهم قادم ويطلب نصيحتك. اكتب رسالة تقدم له فيها ثلاث نصائح على الأقل لمساعدته على التحضير والتعامل مع التوتر.",
      "sample_answer": "Liebe Amina,\n\ndas tut mir leid, dass du dich so gestresst fühlst. Hier sind ein paar Tipps, die dir vielleicht helfen können.\n\nDu solltest dir einen klaren Lernplan machen und jeden Tag nur kleine Abschnitte lernen, statt alles auf einmal. Du könntest auch regelmäßige Pausen einplanen, damit dein Kopf sich erholen kann. Außerdem solltest du in der Nacht vor der Prüfung genug schlafen, statt bis spät zu lernen.\n\nDu musst nicht perfekt sein - du kannst nur dein Bestes geben. Ich bin sicher, dass du das schaffst!\n\nLiebe Grüße,\nSelma"
    }
  },
  "test_skill_writing_adjective_endings": {
    "sections": [
      {
        "key": "language1",
        "name": "نهايات الصفات",
        "type": "language",
        "official_duration_minutes": null,
        "instructions": "اختر نهاية الصفة الصحيحة في كل جملة.",
        "passage": null,
        "items": [
          {
            "id": "swae_q1",
            "question_text": "Das ist ein sehr gut___ Produkt.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Nominativ, Neutrum, unbestimmter Artikel: \"gutes\".",
            "order_index": 0,
            "answers": [
              {
                "id": "swae_q1_a1",
                "answer_text": "es",
                "is_correct": true
              },
              {
                "id": "swae_q1_a2",
                "answer_text": "e",
                "is_correct": false
              },
              {
                "id": "swae_q1_a3",
                "answer_text": "en",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swae_q2",
            "question_text": "Ich kaufe die neu___ Tasche.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Akkusativ, Femininum, bestimmter Artikel: \"neue\".",
            "order_index": 1,
            "answers": [
              {
                "id": "swae_q2_a1",
                "answer_text": "e",
                "is_correct": true
              },
              {
                "id": "swae_q2_a2",
                "answer_text": "es",
                "is_correct": false
              },
              {
                "id": "swae_q2_a3",
                "answer_text": "en",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swae_q3",
            "question_text": "Er trägt einen schwarz___ Anzug.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Akkusativ, Maskulinum, unbestimmter Artikel: \"schwarzen\".",
            "order_index": 2,
            "answers": [
              {
                "id": "swae_q3_a1",
                "answer_text": "en",
                "is_correct": true
              },
              {
                "id": "swae_q3_a2",
                "answer_text": "e",
                "is_correct": false
              },
              {
                "id": "swae_q3_a3",
                "answer_text": "es",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swae_q4",
            "question_text": "Der neu___ Laptop ist sehr leicht. (Nominativ, Maskulinum, bestimmter Artikel)",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Nach dem bestimmten Artikel im Nominativ Maskulinum: \"neue\".",
            "order_index": 3,
            "answers": [
              {
                "id": "swae_q4_a1",
                "answer_text": "e",
                "is_correct": true
              },
              {
                "id": "swae_q4_a2",
                "answer_text": "en",
                "is_correct": false
              },
              {
                "id": "swae_q4_a3",
                "answer_text": "es",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swae_q5",
            "question_text": "Mit dem neu___ Auto fahren wir in den Urlaub.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Dativ, Neutrum, bestimmter Artikel: \"neuen\".",
            "order_index": 4,
            "answers": [
              {
                "id": "swae_q5_a1",
                "answer_text": "en",
                "is_correct": true
              },
              {
                "id": "swae_q5_a2",
                "answer_text": "e",
                "is_correct": false
              },
              {
                "id": "swae_q5_a3",
                "answer_text": "es",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swae_q6",
            "question_text": "Das sind schön___ Blumen. (Nominativ, Plural, ohne Artikel)",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Ohne Artikel im Nominativ Plural: \"schöne\".",
            "order_index": 5,
            "answers": [
              {
                "id": "swae_q6_a1",
                "answer_text": "e",
                "is_correct": true
              },
              {
                "id": "swae_q6_a2",
                "answer_text": "en",
                "is_correct": false
              },
              {
                "id": "swae_q6_a3",
                "answer_text": "es",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": {
      "name": "وصف منتج",
      "official_duration_minutes": 15,
      "instructions": "اكتب نصًا من 80 إلى 100 كلمة تقريبًا.",
      "prompt": "صف منتجًا اشتريته مؤخرًا وأعجبك كثيرًا. اذكر ما هو المنتج، ولماذا اشتريته، وما هي مميزاته التي أعجبتك، وهل توصي به لغيرك.",
      "sample_answer": "Vor zwei Wochen habe ich mir eine neue Kaffeemaschine gekauft, weil meine alte kaputt gegangen war. Die neue Maschine ist sehr modern und hat ein praktisches Design. Sie macht in wenigen Minuten einen leckeren, starken Kaffee, ohne dass man viel einstellen muss. Besonders gut gefällt mir, dass sie sehr leise ist und nicht viel Platz auf der Küchentheke braucht. Der einzige Nachteil ist der etwas hohe Preis. Trotzdem würde ich das Produkt jedem empfehlen, der Wert auf guten Kaffee am Morgen legt."
    }
  },
  "test_skill_writing_connectors_advanced": {
    "sections": [
      {
        "key": "language1",
        "name": "أدوات الربط",
        "type": "language",
        "official_duration_minutes": null,
        "instructions": "اختر أداة الربط الصحيحة في كل جملة.",
        "passage": null,
        "items": [
          {
            "id": "swca_q1",
            "question_text": "Ich bleibe heute zu Hause, ___ es den ganzen Tag regnet.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"weil\" leitet einen Grund ein.",
            "order_index": 0,
            "answers": [
              {
                "id": "swca_q1_a1",
                "answer_text": "weil",
                "is_correct": true
              },
              {
                "id": "swca_q1_a2",
                "answer_text": "obwohl",
                "is_correct": false
              },
              {
                "id": "swca_q1_a3",
                "answer_text": "trotzdem",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swca_q2",
            "question_text": "___ er sehr müde war, ist er noch spazieren gegangen.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"obwohl\" drückt einen Gegensatz aus (Konzession).",
            "order_index": 1,
            "answers": [
              {
                "id": "swca_q2_a1",
                "answer_text": "Obwohl",
                "is_correct": true
              },
              {
                "id": "swca_q2_a2",
                "answer_text": "Weil",
                "is_correct": false
              },
              {
                "id": "swca_q2_a3",
                "answer_text": "Deshalb",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swca_q3",
            "question_text": "Nach \"weil\" steht das konjugierte Verb...",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "In Nebensätzen mit \"weil\" steht das Verb am Ende.",
            "order_index": 2,
            "answers": [
              {
                "id": "swca_q3_a1",
                "answer_text": "am Satzende",
                "is_correct": true
              },
              {
                "id": "swca_q3_a2",
                "answer_text": "an zweiter Stelle",
                "is_correct": false
              },
              {
                "id": "swca_q3_a3",
                "answer_text": "am Satzanfang",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swca_q4",
            "question_text": "Er hat viel gelernt, ___ hat er die Prüfung bestanden.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"deshalb\" leitet eine Folge ein (Hauptsatz-Konnektor).",
            "order_index": 3,
            "answers": [
              {
                "id": "swca_q4_a1",
                "answer_text": "deshalb",
                "is_correct": true
              },
              {
                "id": "swca_q4_a2",
                "answer_text": "obwohl",
                "is_correct": false
              },
              {
                "id": "swca_q4_a3",
                "answer_text": "weil",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swca_q5",
            "question_text": "Welches Wort bedeutet \"obwohl\" auf Arabisch am besten?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"obwohl\" entspricht \"على الرغم من\" im Sinne eines Gegensatzes.",
            "order_index": 4,
            "answers": [
              {
                "id": "swca_q5_a1",
                "answer_text": "على الرغم من",
                "is_correct": true
              },
              {
                "id": "swca_q5_a2",
                "answer_text": "لأن",
                "is_correct": false
              },
              {
                "id": "swca_q5_a3",
                "answer_text": "لذلك",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swca_q6",
            "question_text": "Sie ist sehr müde, ___ arbeitet sie noch bis spät in die Nacht.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "\"trotzdem\" drückt einen Gegensatz im Hauptsatz aus.",
            "order_index": 5,
            "answers": [
              {
                "id": "swca_q6_a1",
                "answer_text": "trotzdem",
                "is_correct": true
              },
              {
                "id": "swca_q6_a2",
                "answer_text": "weil",
                "is_correct": false
              },
              {
                "id": "swca_q6_a3",
                "answer_text": "damit",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": {
      "name": "التعبير عن رأي",
      "official_duration_minutes": 15,
      "instructions": "اكتب نصًا من 80 إلى 100 كلمة تقريبًا.",
      "prompt": "ما رأيك في العمل من المنزل مقارنة بالعمل في المكتب؟ اذكر رأيك بوضوح، مع ذكر سببين على الأقل يدعمان رأيك، مستخدمًا أدوات ربط مثل weil وobwohl وtrotzdem.",
      "sample_answer": "Meiner Meinung nach ist Arbeiten von zu Hause aus besser als im Büro zu arbeiten. Ich spare viel Zeit, weil ich nicht jeden Tag zur Arbeit fahren muss. Außerdem kann ich meine Zeit flexibler einteilen und trotzdem produktiv sein. Obwohl man im Büro direkten Kontakt zu Kollegen hat, finde ich, dass Videoanrufe für die meisten Gespräche völlig ausreichen. Natürlich fehlt manchmal der persönliche Austausch, trotzdem überwiegen für mich die Vorteile der Arbeit von zu Hause aus deutlich."
    }
  },
  "test_skill_writing_passive_voice": {
    "sections": [
      {
        "key": "language1",
        "name": "المبني للمجهول",
        "type": "language",
        "official_duration_minutes": null,
        "instructions": "اختر الصيغة الصحيحة في كل جملة.",
        "passage": null,
        "items": [
          {
            "id": "swpv_q1",
            "question_text": "\"Der Chef unterschreibt den Vertrag.\" Wie lautet der Satz im Passiv?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Im Passiv wird das Akkusativobjekt zum Subjekt: \"Der Vertrag wird...unterschrieben\".",
            "order_index": 0,
            "answers": [
              {
                "id": "swpv_q1_a1",
                "answer_text": "Der Vertrag wird vom Chef unterschrieben.",
                "is_correct": true
              },
              {
                "id": "swpv_q1_a2",
                "answer_text": "Der Vertrag hat den Chef unterschrieben.",
                "is_correct": false
              },
              {
                "id": "swpv_q1_a3",
                "answer_text": "Der Chef wird unterschrieben.",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swpv_q2",
            "question_text": "Welches Hilfsverb bildet das Passiv im Präsens?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Das Passiv wird mit \"werden\" + Partizip II gebildet.",
            "order_index": 1,
            "answers": [
              {
                "id": "swpv_q2_a1",
                "answer_text": "werden",
                "is_correct": true
              },
              {
                "id": "swpv_q2_a2",
                "answer_text": "haben",
                "is_correct": false
              },
              {
                "id": "swpv_q2_a3",
                "answer_text": "sein",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swpv_q3",
            "question_text": "Das Formular ___ von der Mitarbeiterin ausgefüllt.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Präsens Passiv: \"wird...ausgefüllt\".",
            "order_index": 2,
            "answers": [
              {
                "id": "swpv_q3_a1",
                "answer_text": "wird",
                "is_correct": true
              },
              {
                "id": "swpv_q3_a2",
                "answer_text": "hat",
                "is_correct": false
              },
              {
                "id": "swpv_q3_a3",
                "answer_text": "ist",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swpv_q4",
            "question_text": "Im Passiv steht das Verb in der Form...",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Das Passiv braucht immer das Partizip II des Hauptverbs.",
            "order_index": 3,
            "answers": [
              {
                "id": "swpv_q4_a1",
                "answer_text": "Partizip II",
                "is_correct": true
              },
              {
                "id": "swpv_q4_a2",
                "answer_text": "Infinitiv",
                "is_correct": false
              },
              {
                "id": "swpv_q4_a3",
                "answer_text": "Präteritum",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swpv_q5",
            "question_text": "Die Pakete ___ morgen geliefert.",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Präsens Passiv, 3. Person Plural: \"werden...geliefert\".",
            "order_index": 4,
            "answers": [
              {
                "id": "swpv_q5_a1",
                "answer_text": "werden",
                "is_correct": true
              },
              {
                "id": "swpv_q5_a2",
                "answer_text": "sind",
                "is_correct": false
              },
              {
                "id": "swpv_q5_a3",
                "answer_text": "haben",
                "is_correct": false
              }
            ]
          },
          {
            "id": "swpv_q6",
            "question_text": "Wie lautet \"werden\" im Präteritum für \"es\" (Passiv Präteritum)?",
            "question_type": "multiple_choice",
            "points": 1,
            "explanation": "Präteritum Passiv: \"wurde...gemacht\" usw.",
            "order_index": 5,
            "answers": [
              {
                "id": "swpv_q6_a1",
                "answer_text": "wurde",
                "is_correct": true
              },
              {
                "id": "swpv_q6_a2",
                "answer_text": "wird",
                "is_correct": false
              },
              {
                "id": "swpv_q6_a3",
                "answer_text": "worden",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ],
    "writing": {
      "name": "وصف إجراء",
      "official_duration_minutes": 15,
      "instructions": "اكتب نصًا من 80 إلى 100 كلمة تقريبًا.",
      "prompt": "صف خطوات إجراء عمل بسيط تعرفه جيدًا (مثل كيفية تقديم طلب في مكان عملك أو كيفية تحضير وجبة بسيطة)، مستخدمًا صيغة المبني للمجهول (Passiv) قدر الإمكان.",
      "sample_answer": "In unserem Büro wird jeder neue Antrag zuerst am Empfang entgegengenommen. Danach wird er an die zuständige Abteilung weitergeleitet. Dort werden alle Dokumente sorgfältig geprüft. Wenn etwas fehlt, wird der Antragsteller telefonisch kontaktiert. Sobald alle Unterlagen vollständig sind, wird der Antrag bearbeitet und innerhalb von fünf Werktagen wird eine Antwort verschickt. Am Ende wird das Ergebnis auch in der internen Datenbank gespeichert."
    }
  }
};

module.exports = { mockTests, mockContent };
