// Gives a student a hint for a specific question, using whichever LLM
// provider is currently configured for 'hints' (public/admin.html, تبويب
// "الذكاء الاصطناعي") -- explains the underlying grammar/reading concept
// being tested WITHOUT revealing which option is correct, so it helps
// understanding rather than just handing over the answer.
//
//   supabase.functions.invoke('get-hint', { body: { question_id } })
//
// The question is looked up server-side by ID (never trust a
// client-supplied question text), using the service role -- same
// reasoning as test-detail: the answer key must never pass through a
// path a student's own client could intercept or spoof.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return json({ success: false, message: 'غير مصرح به' }, 401);

    const { question_id } = await req.json();
    if (!question_id) return json({ success: false, message: 'question_id مطلوب' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const vaultKey = Deno.env.get('LLM_VAULT_KEY');
    if (!vaultKey) return json({ success: false, message: 'ميزة التلميحات غير مُفعّلة حاليًا' }, 500);
    const { data: configRows, error: configErr } = await admin.rpc('get_llm_config', {
      p_purpose: 'hints',
      p_vault_key: vaultKey
    });
    if (configErr) throw configErr;
    const llmConfig = configRows?.[0];
    if (!llmConfig || !llmConfig.api_key) {
      return json({ success: false, message: 'لم يتم إعداد مزوّد الذكاء الاصطناعي لهذه الميزة بعد' }, 500);
    }

    const { data: question, error: qErr } = await admin
      .from('test_questions')
      .select('question_text, explanation, test_answers(answer_text, is_correct)')
      .eq('id', question_id)
      .single();
    if (qErr || !question) return json({ success: false, message: 'السؤال غير موجود' }, 404);

    const correct = (question.test_answers || []).find((a: any) => a.is_correct);
    const optionsList = (question.test_answers || []).map((a: any) => a.answer_text).join(' / ');

    const systemPrompt = `أنت مساعد تعليمي للغة الألمانية يساعد طلاب مستوى B1/B2 أثناء أداء تدريب.

قاعدة صارمة: لا تذكر إطلاقًا أي إجابة محددة هي الصحيحة، ولا تُلمّح بشكل مباشر إليها (مثل ذكر نصها حرفيًا كإجابة، أو قول "الخيار الأول/الثاني صحيح"). مهمتك فقط شرح القاعدة النحوية أو استراتيجية الفهم المتعلقة بالسؤال، بحيث يستطيع الطالب التفكير والوصول للإجابة بنفسه.

اكتب تلميحًا قصيرًا (جملتين إلى ثلاث جمل) بالعربية، واضحًا ومباشرًا، دون الكشف عن الإجابة.`;

    const userPrompt = `السؤال: ${question.question_text}
الخيارات المتاحة: ${optionsList}
(معلومة داخلية لك فقط، لا تكشفها: الإجابة الصحيحة هي "${correct ? correct.answer_text : 'غير محددة'}"، وسبب ذلك: ${question.explanation || 'غير متوفر'})

اكتب تلميحًا يشرح القاعدة أو المفهوم المتعلق بهذا السؤال دون ذكر أي إجابة محددة.`;

    const llmRes = await fetch(`${llmConfig.base_url.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${llmConfig.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: llmConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 200
      })
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error('LLM API error:', llmRes.status, errText);
      return json({ success: false, message: 'تعذّر الحصول على تلميح' }, 502);
    }

    const llmData = await llmRes.json();
    const hint = llmData?.choices?.[0]?.message?.content?.trim();
    if (!hint) return json({ success: false, message: 'لم يتم استلام تلميح' }, 502);

    return json({ success: true, hint });
  } catch (err) {
    console.error(err);
    return json({ success: false, message: 'حدث خطأ أثناء طلب التلميح' }, 500);
  }
});
