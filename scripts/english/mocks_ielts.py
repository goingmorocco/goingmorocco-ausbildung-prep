from lib import *

# ---------------------------------------------------------------- IELTS Academic
ACAD_R1 = """Urban Beekeeping

Over the past two decades, beekeeping has quietly moved from the countryside to the city. Rooftop hives now sit above offices in London, Paris and New York, and municipal governments in several countries encourage residents to keep bees on balconies and in community gardens. Supporters argue that cities can actually be better habitats for bees than modern farmland. Intensive agriculture often relies on a single crop and on pesticides, leaving bees with little to eat for much of the year. By contrast, parks, gardens and street trees provide a wide range of flowers that bloom at different times from spring to autumn.

However, the trend has its critics. Some ecologists warn that a sharp increase in honeybee colonies may put pressure on wild pollinators such as bumblebees and solitary bees, which compete for the same nectar. A study in one European capital found that in areas with the most hives, wild bee visits to flowers were noticeably lower. The researchers did not claim that honeybees were the only cause, but they recommended that cities plant more flowers before allowing additional hives.

Honey produced in cities has also attracted attention. Tests show that it is generally safe to eat, since bees filter out most of the heavy metals found in urban air. Beekeepers say that city honey tastes different from country honey because the bees feed on dozens of garden plants rather than one crop."""

ACAD_R2 = """Sleep and Memory

Psychologists have long known that sleep helps people remember what they have learned, but only recently have they begun to understand how. During the deepest stages of sleep, the brain replays patterns of activity that occurred while we were awake, strengthening the connections that matter and allowing others to fade. This process, known as consolidation, appears to move new information from the hippocampus, where memories are first stored, to the cortex, where they can be kept for years.

In one well-known experiment, two groups of students learned a list of word pairs. One group learned the list in the evening and slept before being tested; the other learned it in the morning and stayed awake all day. When both groups were tested twelve hours later, the sleepers recalled around 20 per cent more pairs. The difference was largest for pairs that were hard to remember.

These findings have practical consequences. Many students believe that staying up all night to study is an efficient strategy, yet the evidence suggests the opposite. A short nap after learning can also help, but it cannot fully replace a night of normal sleep. Researchers add one note of caution: the studies so far involve mostly young, healthy adults, so it is not yet clear whether the same effects apply to older people."""

ACAD_L1 = """Telephone conversation: joining a sports centre

Receptionist: Good morning, Riverside Sports Centre. How can I help?
Customer: Hi, I'd like to join the centre. I'm a student at the university.
Receptionist: Certainly. We have a student membership at thirty-five pounds a month, which includes the gym and the swimming pool. Classes such as yoga are an extra eight pounds each.
Customer: Is there a joining fee?
Receptionist: Normally it's fifty pounds, but it's free this month for students.
Customer: Great. What are the opening hours?
Receptionist: Monday to Friday from six in the morning until ten at night, and on weekends from eight until six.
Customer: And do I need to bring anything to sign up?
Receptionist: Just your student card and a passport-size photo. You can complete the form online if you like.
Customer: I'll come in on Thursday afternoon, then.
Receptionist: Perfect. Ask for Mrs Patel; she'll show you round."""

ACAD_L2 = """Talk: orientation tour of the university library

"Welcome to the university library. I'll give you a brief tour. We are on the ground floor, where you will find the help desk and the café. Please note that food and drink are allowed only here, not on the upper floors. The first floor contains the main book collection and the silent study area, where phones must be switched off. The second floor has group study rooms; these can be booked online for up to two hours at a time. The third floor holds the archives, and you need a special permission card to enter. The library closes at midnight during exam weeks, but at ten in the evening for the rest of the year. If you need to borrow a laptop, ask at the help desk; you can keep one for four hours.\""""

ACAD_W_PROMPT = """WRITING TASK 2 (about 40 minutes)

You should spend about 40 minutes on this task.

Write about the following topic:

Some people believe that university students should study only subjects that will help them find a job. Others think that students should be free to study any subject they enjoy.

Discuss both views and give your own opinion.

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words."""

ACAD_W_SAMPLE = """Education is often described as preparation for working life, yet it is also a chance to develop curiosity. Opinions differ on whether students should choose only job-oriented subjects or follow their interests, and I believe a balance between the two serves most students best.

Those who support practical degrees make a reasonable point. University is expensive, and graduates who cannot find work may struggle to repay their loans. Subjects such as engineering, medicine or computer science lead to clear careers, and governments need more people with these skills. For a student from a family with limited resources, choosing a course with good job prospects can feel like the only responsible decision.

On the other hand, students who study what they enjoy tend to work harder and achieve better results. A person who is fascinated by history or philosophy will read more widely and think more deeply than someone who is bored by a "useful" course. Moreover, the labour market changes quickly. Many jobs that exist today did not exist twenty years ago, so skills such as critical thinking, writing and problem solving may be more valuable than any single technical subject.

In my opinion, students should not be forced to choose one path. Universities could encourage them to combine interests with practical skills, for example by studying literature alongside data analysis, or art alongside business. This approach would keep students motivated while also improving their employability.

In conclusion, although job-focused degrees offer security, freedom of choice produces more engaged graduates, and a mixture of both is the most sensible solution."""

ielts_academic = T(
    "ielts_academic_mock_1",
    "IELTS Academic — Full Mock Test 1",
    "اختبار تجريبي كامل بنمط IELTS Academic: قراءة (نصان)، استماع (قسمان) وكتابة (Task 2). النسخة مختصرة عن الامتحان الرسمي.",
    "B2", 90,
    sections=[
        S("reading1", "Reading — Passage 1", "reading", ACAD_R1, [
            TF("Municipal governments in some countries encourage residents to keep bees.", "True",
               "The text says municipal governments in several countries encourage residents to keep bees."),
            TF("Farmland always offers bees more food than cities do.", "False",
               "The text argues that cities can be better habitats than modern farmland."),
            TF("In areas with the most hives, wild bees visited flowers less often.", "True",
               "A study found wild bee visits were noticeably lower where hives were most numerous."),
            TF("The researchers proved that honeybees were the only cause of fewer wild bees.", "False",
               "They 'did not claim that honeybees were the only cause'."),
            TF("City honey is more expensive than country honey.", "Not Given",
               "The passage does not mention the price of honey."),
            Q("What did the researchers recommend?",
              ["Stopping all beekeeping in cities", "Planting more flowers before allowing additional hives",
               "Banning pesticides in cities", "Moving hives from cities to farmland"], 1,
              "They recommended that cities plant more flowers before allowing additional hives."),
        ], minutes=20),
        S("reading2", "Reading — Passage 2", "reading", ACAD_R2, [
            Q("According to the passage, consolidation is the process by which…",
              ["the brain creates new brain cells during sleep", "new information is moved into longer-term storage",
               "deep sleep becomes lighter towards morning", "people forget all unimportant facts at once"], 1,
              "Consolidation moves information from the hippocampus to the cortex, where it can be kept for years."),
            Q("In the experiment, the students who slept…",
              ["recalled about 20 per cent more word pairs", "recalled fewer word pairs than the others",
               "recalled exactly the same number of pairs", "learned the list more quickly"], 0,
              "The sleepers recalled around 20 per cent more pairs."),
            Q("The difference between the two groups was largest for…",
              ["the pairs learned first", "the pairs that were easiest to remember",
               "the pairs that were hard to remember", "the pairs the students liked"], 2,
              "The difference was largest for pairs that were hard to remember."),
            YN("The writer believes that staying up all night to study is an efficient strategy.", "No",
               "The writer says the evidence suggests the opposite."),
            YN("A short nap can completely replace a night of normal sleep.", "No",
               "A nap can help, but 'it cannot fully replace a night of normal sleep'."),
            YN("The studies so far have involved people of a wide range of ages.", "No",
               "The studies mostly involve young, healthy adults."),
        ], minutes=20),
        S("listening1", "Listening — Section 1", "listening", ACAD_L1, [
            Q("How much is the monthly student membership?", ["£25", "£35", "£50", "£8"], 1,
              "'Thirty-five pounds a month.'"),
            Q("What is the joining fee for students this month?",
              ["£50", "£35", "£8", "There is no fee"], 3, "'It's free this month for students.'"),
            Q("What are the weekend opening hours?",
              ["6 a.m. – 10 p.m.", "8 a.m. – 6 p.m.", "8 a.m. – 10 p.m.", "6 a.m. – 6 p.m."], 1,
              "'On weekends from eight until six.'"),
            Q("What must the customer bring to sign up?",
              ["A passport and a bank statement", "A student card and a photo",
               "Proof of address", "A doctor's letter"], 1, "'Just your student card and a passport-size photo.'"),
            Q("When will the customer visit the centre?",
              ["Thursday morning", "Thursday afternoon", "Friday afternoon", "Saturday morning"], 1,
              "'I'll come in on Thursday afternoon.'"),
        ], minutes=10),
        S("listening2", "Listening — Section 2", "listening", ACAD_L2, [
            Q("Where is the café?", ["Ground floor", "First floor", "Second floor", "Third floor"], 0,
              "'On the ground floor, where you will find the help desk and the café.'"),
            Q("Where must phones be switched off?",
              ["In the café", "In the silent study area", "In the group study rooms", "In the archives"], 1,
              "'The silent study area, where phones must be switched off.'"),
            Q("For how long can a group study room be booked?",
              ["One hour", "Two hours", "Three hours", "All day"], 1, "'Up to two hours at a time.'"),
            Q("What do you need in order to enter the archives?",
              ["A booking confirmation", "A special permission card", "A teacher's signature", "A laptop"], 1,
              "'You need a special permission card to enter.'"),
            Q("What time does the library normally close?",
              ["Midnight", "10 p.m.", "8 p.m.", "6 p.m."], 1,
              "Midnight only in exam weeks; 'ten in the evening for the rest of the year'."),
            Q("How long can a student keep a borrowed laptop?",
              ["Two hours", "Four hours", "One day", "One week"], 1, "'You can keep one for four hours.'"),
        ], minutes=10),
    ],
    writing=W("Writing — Task 2 (ungraded practice)", 40,
              "اكتب مقالًا من 250 كلمة على الأقل. هذا تدريب ذاتي؛ قارن نصك بالنموذج بعد الانتهاء.",
              ACAD_W_PROMPT, ACAD_W_SAMPLE),
)

# ---------------------------------------------------------------- IELTS General Training
GEN_R1 = """Notice — Harbour Community Pool: Changes from 1 March

From 1 March the Harbour Community Pool will change its opening hours. The pool will open at 6.30 a.m. on weekdays instead of 7.00 a.m., and will close at 9.00 p.m. instead of 8.00 p.m. on Tuesdays and Thursdays to allow for evening swimming lessons. Weekend hours stay the same: 8.00 a.m. to 6.00 p.m.

Please note that children under 12 must be accompanied by an adult at all times. Lockers are available for a refundable deposit of £1. Swimming caps are required in the main pool but not in the shallow family pool.

The café will remain open until one hour before closing. Membership holders can book lessons at the front desk or through the pool's website. Non-members are welcome to use the pool, but day tickets cost £2 more than the member price."""

GEN_R2 = """Job advertisement — Customer Service Assistant, BlueLine Travel

BlueLine Travel is looking for a friendly and organised Customer Service Assistant to join our busy city-centre office. You will answer phone and email enquiries, help customers to choose and book holidays, and deal with any complaints politely and efficiently.

Requirements: at least one year of experience in a customer-facing role; excellent spoken and written English; a good knowledge of a second language would be an advantage. Full training will be provided, so no knowledge of the travel industry is necessary.

Hours: 37.5 hours per week, including one Saturday in every four. Salary: £22,000 a year, rising to £24,000 after six months. Staff receive 25 days' holiday and discounted holidays with BlueLine.

To apply, send your CV and a covering letter to the Human Resources Manager by 15 April. Interviews will take place in the week beginning 22 April."""

GEN_L1 = """Telephone conversation: enquiring about a flat to rent

Agent: Hello, Greenfield Lettings.
Caller: Hello, I'm calling about the one-bedroom flat in Park Road that you advertised online.
Agent: Yes, that's still available. The rent is six hundred and fifty pounds a month, and bills are not included.
Caller: Is it furnished?
Agent: Partly. There's a bed and a wardrobe, but you would need to bring your own sofa and kitchen table.
Caller: What about the deposit?
Agent: It's equal to one month's rent, so six hundred and fifty pounds. It's returned when you leave, if there's no damage.
Caller: I see. Is it near public transport?
Agent: Yes, the bus stop is just outside, and the train station is a ten-minute walk.
Caller: Could I come and see it?
Agent: Of course. How about Saturday at eleven o'clock?
Caller: That's fine. My name is Daniel Reyes.
Agent: Thank you, Mr Reyes. Please bring some photo ID with you."""

GEN_L2 = """Radio talk: a new recycling scheme in the town of Eastbury

"Good morning, listeners. From the first of June, Eastbury Council is introducing a new recycling scheme. Every household will receive three bins: a green bin for glass and cans, a blue bin for paper and cardboard, and a small brown bin for food waste. Plastic bottles can go in the green bin, but plastic bags cannot be recycled and should be put in ordinary rubbish.
Collections will take place every second Wednesday, rather than every week, so residents are asked to check the calendar that will be posted through their door. Anyone who needs a larger bin because of a big family can request one on the council's website, free of charge.
The council hopes the scheme will reduce the amount of waste sent to landfill by a third within two years. Information evenings will be held at the library on the fifth and twelfth of May."""

GEN_W_PROMPT = """WRITING TASK 1 (about 20 minutes)

You recently bought a laptop online, but it stopped working after one week.

Write a letter to the company. In your letter:
• explain what you bought and when
• describe the problem
• say what you would like the company to do

Write at least 150 words. You do NOT need to write any addresses.
Begin your letter: Dear Sir or Madam,

------------------------------------------------------------

WRITING TASK 2 (about 40 minutes)

Some people think that children should start learning a foreign language at primary school, while others believe it is better to wait until secondary school.

Discuss both views and give your own opinion. Write at least 250 words."""

GEN_W_SAMPLE = """TASK 1

Dear Sir or Madam,

I am writing to complain about a laptop that I bought from your website on 3 October (order number 48213). It cost £549 and was delivered five days later.

Unfortunately, the laptop stopped working after only one week. The screen suddenly went black while I was using it, and it will not turn on even when it is plugged in. I have tried charging it overnight and holding down the power button, but nothing has changed.

As the laptop is still under guarantee, I would like you to either replace it with a new one or give me a full refund. I would also appreciate it if you could tell me how to return the faulty laptop, as I have not received any instructions.

I look forward to hearing from you as soon as possible.

Yours faithfully,
Daniel Reyes

TASK 2

Opinions differ about the best age to begin learning a foreign language. Some people argue that primary school is the right moment, while others prefer to wait until children are older. I believe that an early start has more advantages.

Supporters of starting later say that young children still need to master their mother tongue. They worry that a second language may confuse them or take time away from reading and mathematics. In addition, primary schools often have fewer specialist teachers, so the quality of lessons may be poor.

However, research suggests that young children pick up pronunciation and basic vocabulary more naturally than teenagers. They are also less afraid of making mistakes, which makes learning more enjoyable. If lessons are based on songs, games and stories, children can develop a positive attitude towards languages that lasts for life.

In my view, schools should introduce a foreign language in the early years, provided that teachers are properly trained and lessons are short and playful. Those children will then reach a higher level by the time they leave school, which will give them better opportunities for university and work.

In conclusion, although there are some risks, the benefits of an early start are greater than the disadvantages."""

ielts_general = T(
    "ielts_general_mock_1",
    "IELTS General Training — Full Mock Test 1",
    "اختبار تجريبي كامل بنمط IELTS General Training: قراءة (نصان عمليان)، استماع (قسمان) وكتابة (رسالة + مقال). مناسب لمن يحضّر للهجرة أو الدراسة.",
    "B1", 90,
    sections=[
        S("reading1", "Reading — Section 1 (Notice)", "reading", GEN_R1, [
            Q("From 1 March, on weekdays the pool will open at…", ["6.30 a.m.", "7.00 a.m.", "8.00 a.m.", "9.00 a.m."], 0,
              "It opens at 6.30 a.m. instead of 7.00 a.m."),
            Q("Why does the pool close later on Tuesdays and Thursdays?",
              ["For cleaning", "For evening swimming lessons", "For private parties", "For staff training"], 1,
              "'To allow for evening swimming lessons.'"),
            TF("Weekend opening hours will change on 1 March.", "False", "Weekend hours stay the same."),
            TF("A swimming cap is required in the shallow family pool.", "False",
               "Caps are required in the main pool but not in the shallow family pool."),
            TF("A day ticket costs £2 more for non-members.", "True", "'Day tickets cost £2 more than the member price.'"),
        ], minutes=10),
        S("reading2", "Reading — Section 2 (Job advertisement)", "reading", GEN_R2, [
            Q("What will the Customer Service Assistant NOT be required to do?",
              ["Answer emails", "Deal with complaints", "Sell insurance", "Help customers book holidays"], 2,
              "Selling insurance is not mentioned among the duties."),
            TF("Applicants must have worked in the travel industry before.", "False",
               "Full training is provided, so no knowledge of the travel industry is necessary."),
            Q("How often will the employee work on a Saturday?",
              ["Every week", "Every second week", "One Saturday in four", "Never"], 2,
              "'One Saturday in every four.'"),
            Q("What will the salary be after six months?", ["£22,000", "£24,000", "£25,000", "£37,500"], 1,
              "It rises to £24,000 after six months."),
            Q("What must applicants send?",
              ["A CV and a covering letter", "A CV and two references", "A letter only", "A completed form"], 0,
              "'Send your CV and a covering letter.'"),
        ], minutes=10),
        S("listening1", "Listening — Section 1", "listening", GEN_L1, [
            Q("How much is the monthly rent?", ["£550", "£600", "£650", "£750"], 2, "'Six hundred and fifty pounds a month.'"),
            Q("What is NOT provided in the flat?", ["A bed", "A wardrobe", "A sofa", "All of these are provided"], 2,
              "The caller must bring their own sofa and kitchen table."),
            Q("How much is the deposit?", ["£325", "£650", "£1,300", "There is no deposit"], 1,
              "One month's rent: £650."),
            Q("How far is the train station?", ["Outside the flat", "A 10-minute walk", "A 20-minute walk", "A 10-minute bus ride"], 1,
              "'A ten-minute walk.'"),
            Q("When will the caller view the flat?", ["Saturday at 10", "Saturday at 11", "Sunday at 11", "Friday at 11"], 1,
              "'Saturday at eleven o'clock.'"),
        ], minutes=10),
        S("listening2", "Listening — Section 2", "listening", GEN_L2, [
            Q("Which bin is for food waste?", ["Green", "Blue", "Brown", "Black"], 2, "The small brown bin is for food waste."),
            Q("Which item can NOT be recycled?", ["Plastic bottles", "Plastic bags", "Glass", "Cans"], 1,
              "Plastic bags cannot be recycled."),
            Q("How often will collections take place?", ["Every week", "Every second Wednesday", "Every month", "Every second Friday"], 1,
              "'Every second Wednesday.'"),
            Q("How can a larger bin be requested?", ["By phone", "At the library", "On the council's website", "By letter"], 2,
              "Through the council's website, free of charge."),
            Q("What does the council hope to achieve within two years?",
              ["Halve the waste", "Reduce landfill waste by a third", "Close the landfill", "Double recycling prices"], 1,
              "'Reduce the amount of waste sent to landfill by a third.'"),
        ], minutes=10),
    ],
    writing=W("Writing — Task 1 (letter) and Task 2 (essay) — ungraded practice", 60,
              "اكتب الرسالة (150 كلمة على الأقل) ثم المقال (250 كلمة على الأقل). هذا تدريب ذاتي؛ قارن مع النموذج بعد الانتهاء.",
              GEN_W_PROMPT, GEN_W_SAMPLE),
)

TESTS = [ielts_academic, ielts_general]
