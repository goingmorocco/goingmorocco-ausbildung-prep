from lib import *

# ---------------------------------------------------------------- TOEFL iBT
TOEFL_R = """The Origins of Writing

Writing is one of humanity's most important inventions, yet it appeared surprisingly late in history. For tens of thousands of years, people communicated only through speech, images and objects. The earliest known writing system emerged in Mesopotamia around 3400 BCE, when merchants in the city of Uruk began pressing marks into soft clay tablets. These first marks were not designed to record stories or poems; they were a practical tool for keeping track of goods such as grain, sheep and beer.

Scholars believe the system developed from small clay tokens that had been used for centuries as counters. A token in the shape of a cone might represent a measure of grain, for instance. When traders began sealing tokens inside clay envelopes, they also pressed the tokens' shapes onto the outside so that the contents could be checked without breaking the envelope. Eventually, people realised that the marks alone were enough, and the tokens were no longer necessary.

Over the following centuries the marks became more abstract. Scribes used a reed pen with a wedge-shaped tip, which gave the script its modern name, cuneiform, from the Latin word for "wedge". Gradually the signs came to represent the sounds of spoken words as well as objects, allowing scribes to write names, letters and eventually literature. The same pattern appears to have occurred independently in Egypt, China and Central America, which suggests that writing arises naturally wherever societies become complex enough to need records."""

TOEFL_L1 = """Lecture — Astronomy: Why Is Mars Red?

Professor: Last week we talked about the surface of Mars. Today I want to explain why the planet looks red from Earth. The answer is rust. The Martian soil contains a lot of iron, and over billions of years that iron has reacted with oxygen to form iron oxide, which is the same substance we see when a bicycle rusts.
Now, you might ask, where did the oxygen come from if there is hardly any in the atmosphere today? Scientists think that in the distant past Mars had liquid water, and water molecules can release oxygen when they are broken apart by sunlight. Some of that oxygen combined with the iron in the rocks. Later, the planet lost most of its water and its thick atmosphere, because Mars is small and has weak gravity.
The red dust is also lifted by wind. Mars has dust storms that sometimes cover the whole planet for weeks. That is why, even though some parts of the surface are actually dark grey or brown, the planet appears red overall. For next class, please read the chapter on the Martian moons."""

TOEFL_L2 = """Conversation — a student and a professor

Student: Professor Hall, do you have a minute? I wanted to ask about the research paper that's due on Friday.
Professor: Of course, Maria. What's the problem?
Student: I've been working on it all week, but I got sick on Tuesday and lost two days. I'm worried I can't finish a good draft in time.
Professor: I'm sorry to hear that. Are you feeling better now?
Student: Yes, much better, thanks. Would it be possible to hand it in on Monday instead?
Professor: Normally I don't give extensions, but since you were ill, I can allow it. Do you have a doctor's note?
Student: I do. I'll bring it tomorrow.
Professor: Good. One thing, though. Monday is the absolute limit, because I need to return all the papers before the exam period.
Student: That's no problem. Thank you so much. Also, could I ask you about my sources? I'm not sure whether a website from a government agency counts as a reliable source.
Professor: Generally yes, if it publishes data and names the authors. Come to my office hours on Thursday and we can go through your list."""

TOEFL_W_PROMPT = """WRITING FOR AN ACADEMIC DISCUSSION (10 minutes)

Your professor is teaching a class on education. Write a post responding to the professor's question. In your response, you should express and support your opinion and contribute to the discussion in your own words. An effective response will contain at least 100 words.

Professor Lewis: This week we are discussing technology in the classroom. Some people say that students learn better when they use laptops and tablets in class, while others think these devices are distracting and that students should take notes by hand. Which view do you agree with, and why?

Student 1 (Ahmed): I think laptops are a great tool. I can search for information instantly, and my typing is much faster than my handwriting, so I don't miss anything the teacher says.

Student 2 (Julia): I disagree. Whenever I use my laptop, I end up checking messages or social media. When I write by hand, I stay focused and I remember the material better."""

TOEFL_W_SAMPLE = """I agree more with Julia, although Ahmed makes a fair point about speed. Typing lets students record more of what a teacher says, but that is exactly the problem: if you try to write every word, you are not really thinking about the meaning. When I take notes by hand, I have to choose the key ideas and put them in my own words, and that process helps me understand and remember them.

Laptops are also a constant source of distraction. Even a student who intends to use one only for notes may be tempted by a notification, and research suggests that this also distracts the classmates sitting nearby.

That said, I do not think devices should be banned completely. They are useful for looking up a definition or for students with learning difficulties. A sensible compromise would be to use laptops only for specific activities and to take notes by hand during lectures."""

toefl = T(
    "toefl_ibt_mock_1",
    "TOEFL iBT — Full Mock Test 1",
    "اختبار تجريبي بنمط TOEFL iBT: قراءة أكاديمية، استماع (محاضرة + محادثة) وكتابة (Academic Discussion). النسخة مختصرة عن الامتحان الرسمي.",
    "B2", 75,
    sections=[
        S("reading1", "Reading — Academic passage", "reading", TOEFL_R, [
            Q("According to paragraph 1, the first marks on clay tablets were mainly used to…",
              ["record poems and stories", "keep track of goods", "teach children", "decorate buildings"], 1,
              "They were 'a practical tool for keeping track of goods'."),
            Q("The word \"abstract\" in paragraph 3 is closest in meaning to…",
              ["less like real objects", "more colourful", "larger", "more expensive"], 0,
              "'More abstract' means the marks looked less and less like the real objects they represented."),
            Q("Why did traders press the tokens' shapes onto the outside of the clay envelopes?",
              ["To make the envelopes stronger", "To allow the contents to be checked without opening them",
               "To decorate the envelopes", "To show who had made them"], 1,
              "So that contents could be checked without breaking the envelope."),
            Q("Which of the following is TRUE about cuneiform?",
              ["It was first used in Egypt", "Its name comes from a Latin word meaning \"wedge\"",
               "It was written with a brush", "It never represented sounds"], 1,
              "The name comes from the Latin word for 'wedge'."),
            Q("What can be inferred about writing from the final sentence of the passage?",
              ["It was invented only once and then spread everywhere", "It tends to appear in complex societies",
               "It is older than speech", "It was invented to write literature"], 1,
              "The same pattern occurred independently, suggesting writing arises wherever societies become complex."),
            Q("What happened to the tokens, according to the passage?",
              ["They were improved and used for centuries more", "They became unnecessary once the marks alone were enough",
               "They were replaced by metal coins", "They were used to write names"], 1,
              "'The tokens were no longer necessary.'"),
        ], minutes=18),
        S("listening1", "Listening — Lecture", "listening", TOEFL_L1, [
            Q("What is the main topic of the lecture?", ["The size of Mars", "Why Mars looks red", "The moons of Mars", "Life on Mars"], 1,
              "The professor explains why the planet looks red from Earth."),
            Q("According to the professor, what causes the red colour?", ["Red algae", "Iron oxide (rust)", "Red sunlight", "Volcanic ash"], 1,
              "The iron in the soil has formed iron oxide, i.e. rust."),
            Q("Why does Mars have little water and atmosphere today?",
              ["It is too close to the Sun", "It is small and has weak gravity", "Meteorites destroyed them", "It has no magnetic field"], 1,
              "'Mars is small and has weak gravity.'"),
            Q("What is the effect of the dust storms?",
              ["They make the planet look red overall", "They cool the planet", "They create the moons", "They produce oxygen"], 0,
              "The dust makes the planet appear red even though some surfaces are grey or brown."),
            Q("What does the professor ask the students to do next?",
              ["Write a report on rust", "Read about the Martian moons", "Visit the observatory", "Watch a video on dust storms"], 1,
              "'Please read the chapter on the Martian moons.'"),
        ], minutes=10),
        S("listening2", "Listening — Conversation", "listening", TOEFL_L2, [
            Q("Why does the student visit the professor?", ["To ask for an extension", "To ask for a better grade", "To change her topic", "To borrow a book"], 0,
              "She asks to hand in the paper on Monday instead of Friday."),
            Q("Why does she need more time?", ["She was ill for two days", "She lost her notes", "She changed her topic", "She was travelling"], 0,
              "She got sick on Tuesday and lost two days."),
            Q("What does the professor ask her to bring?", ["A doctor's note", "A printed draft", "A list of sources", "A parent's letter"], 0,
              "'Do you have a doctor's note?'"),
            Q("What is the latest day she can submit the paper?", ["Friday", "Saturday", "Monday", "Thursday"], 2,
              "'Monday is the absolute limit.'"),
            Q("When can she discuss her sources with the professor?", ["Tomorrow morning", "Thursday, during office hours", "Friday afternoon", "On Monday"], 1,
              "'Come to my office hours on Thursday.'"),
        ], minutes=10),
    ],
    writing=W("Writing — Academic Discussion (ungraded practice)", 10,
              "اكتب ردًا من 100 كلمة على الأقل تعبّر فيه عن رأيك وتضيف فكرة جديدة للنقاش. قارن مع النموذج بعد الانتهاء.",
              TOEFL_W_PROMPT, TOEFL_W_SAMPLE),
)

# ---------------------------------------------------------------- TOEIC
TOEIC_P5 = [
    Q("The manager asked all employees to submit ------- time sheets by Friday.",
      ["they", "their", "them", "theirs"], 1, "A possessive adjective is needed before a noun: 'their time sheets'."),
    Q("Ms Tanaka has worked at the company ------- more than ten years.",
      ["since", "for", "during", "while"], 1, "'For' is used with a period of time."),
    Q("The new printer is ------- faster than the old one.",
      ["much", "more", "most", "very"], 0, "'Much' modifies the comparative 'faster'."),
    Q("Please ------- the attached document before the meeting.",
      ["review", "reviewing", "reviewed", "reviews"], 0, "An imperative uses the base form."),
    Q("The conference was cancelled ------- the bad weather.",
      ["because", "due to", "although", "so"], 1, "'Due to' is followed by a noun phrase."),
    Q("All visitors must ------- at the front desk before entering the building.",
      ["register", "registration", "registered", "registering"], 0, "After 'must' use the base verb."),
    Q("The report was completed ------- the deadline.",
      ["before", "between", "among", "beside"], 0, "'Before the deadline' is the natural collocation."),
    Q("If the shipment ------- on time, we will start production on Monday.",
      ["arrive", "arrives", "arrived", "will arrive"], 1, "First conditional: present simple in the if-clause."),
]

TOEIC_R1 = """To: All staff
From: Linda Moreno, Office Manager
Subject: Office closure on 12 December

Please be informed that the head office will be closed on Friday 12 December so that the electrical system can be upgraded. All employees are asked to save their work and log out of the network before leaving on Thursday evening. Staff who need access to files during the closure should contact the IT department by Wednesday to arrange remote access.

The office will reopen as normal on Monday 15 December at 8.30 a.m. We apologise for any inconvenience."""

TOEIC_R2 = """Hotel Marais — Guest notice

Dear guests, breakfast is served daily from 6.30 a.m. to 10.00 a.m. in the Garden Restaurant on the ground floor. Guests who have booked a room with breakfast included should show their key card at the entrance. Others may pay at the restaurant: €14 for adults and €7 for children under 12.

Check-out is at 11.00 a.m. If you would like a late check-out until 2.00 p.m., please ask at reception; a fee of €20 applies. Luggage can be stored free of charge until 6.00 p.m."""

TOEIC_L1 = """Conversation 1
Man: Hi, Sofia. Did you book the meeting room for tomorrow's presentation?
Woman: Yes, I reserved Room 4 for ten o'clock, but I just heard that the projector there isn't working.
Man: Oh no. Can we move to Room 6? It's a bit smaller, but the equipment is new.
Woman: Good idea. I'll call the front desk and change the booking now. How many people are coming?
Man: About twelve, I think. Room 6 holds fifteen, so that should be fine."""

TOEIC_L2 = """Conversation 2
Woman: Good afternoon. I'd like to return this jacket. I bought it last week, but it's too small.
Man: No problem. Do you have the receipt?
Woman: Yes, here it is.
Man: Thank you. Would you like a refund, or would you prefer to exchange it for a larger size?
Woman: I'd like a larger size, if you have one in blue.
Man: Let me check. Yes, we have a large in blue. I'll get it for you."""

toeic = T(
    "toeic_mock_1",
    "TOEIC Listening & Reading — Mock Test 1",
    "اختبار تجريبي بنمط TOEIC: جمل ناقصة (Part 5)، قراءة نصوص مهنية (Part 7) واستماع لمحادثات قصيرة. مناسب للتوظيف والعمل في الشركات.",
    "B1", 45,
    sections=[
        S("part5", "Part 5 — Incomplete Sentences", "language", None, TOEIC_P5,
          instr="اختر الكلمة أو العبارة المناسبة لإكمال كل جملة."),
        S("part7a", "Part 7 — Reading: Memo", "reading", TOEIC_R1, [
            Q("Why will the office be closed on 12 December?", ["A public holiday", "Electrical work", "A staff party", "Flooding"], 1,
              "The electrical system will be upgraded."),
            Q("What should employees do on Thursday evening?", ["Take their computers home", "Save their work and log out", "Meet the manager", "Clean their desks"], 1,
              "They must save their work and log out of the network."),
            Q("Who should staff contact for access to files during the closure?", ["The Office Manager", "The IT department", "The Human Resources department", "The security guard"], 1,
              "They should contact the IT department by Wednesday."),
            Q("When will the office reopen?", ["Friday 12 December", "Saturday 13 December", "Monday 15 December at 8.30 a.m.", "Monday 15 December at 9.00 a.m."], 2,
              "'Monday 15 December at 8.30 a.m.'"),
        ]),
        S("part7b", "Part 7 — Reading: Hotel notice", "reading", TOEIC_R2, [
            Q("What time does breakfast end?", ["6.30 a.m.", "10.00 a.m.", "11.00 a.m.", "2.00 p.m."], 1, "Breakfast is served until 10.00 a.m."),
            Q("How much does breakfast cost for a child under 12?", ["€7", "€14", "€20", "Free"], 0, "€7 for children under 12."),
            Q("What does a late check-out cost?", ["€7", "€14", "€20", "Nothing"], 2, "'A fee of €20 applies.'"),
            Q("Until what time can luggage be stored?", ["11.00 a.m.", "2.00 p.m.", "6.00 p.m.", "10.00 p.m."], 2, "Luggage can be stored until 6.00 p.m."),
        ]),
        S("listening1", "Listening — Conversation 1", "listening", TOEIC_L1, [
            Q("What problem do the speakers discuss?", ["A room is too small", "A projector isn't working", "A presentation was cancelled", "A booking is missing"], 1,
              "The projector in Room 4 isn't working."),
            Q("What will the woman do next?", ["Call the front desk", "Buy a new projector", "Cancel the presentation", "Email the clients"], 0,
              "'I'll call the front desk and change the booking now.'"),
            Q("How many people does the man expect?", ["About 6", "About 12", "About 15", "About 20"], 1, "About twelve."),
        ]),
        S("listening2", "Listening — Conversation 2", "listening", TOEIC_L2, [
            Q("Why does the woman want to return the jacket?", ["It is the wrong colour", "It is too small", "It is damaged", "It is too expensive"], 1, "'It's too small.'"),
            Q("What does the woman want?", ["A refund", "A larger size in blue", "A discount", "A different jacket"], 1,
              "She'd like a larger size in blue."),
            Q("What will the man do next?", ["Bring the jacket in blue", "Call the manager", "Check the receipt again", "Give a refund"], 0,
              "He says he'll get it for her."),
        ]),
    ],
)

# ---------------------------------------------------------------- Cambridge B2 First
FCE_UOE = [
    Q("I'm not used ------- up so early in the morning.", ["to get", "to getting", "getting", "get"], 1, "'Be used to' + -ing form."),
    Q("She suggested ------- to the cinema after dinner.", ["to go", "going", "go", "went"], 1, "'Suggest' is followed by the -ing form."),
    Q("If I ------- you, I would accept the job offer.", ["am", "was", "were", "will be"], 2, "Second conditional: 'If I were you'."),
    Q("The film was so ------- that many people fell asleep.", ["bored", "boring", "bore", "boredom"], 1, "'Boring' describes the film."),
    Q("He has been learning Spanish ------- three years.", ["since", "for", "during", "ago"], 1, "'For' + period of time."),
    Q("By the time we arrived, the concert ------- already started.", ["has", "had", "was", "have"], 1, "Past perfect for an earlier action."),
    Q("I'd rather you ------- smoke in the house.", ["don't", "didn't", "won't", "aren't"], 1, "'Would rather' + person + past simple."),
    Q("The teacher made us ------- the exercise again.", ["to do", "do", "doing", "did"], 1, "'Make' + object + bare infinitive."),
]
FCE_R = """A Day at the Market

Every Saturday, the old market in our town fills with colour and noise. Stalls selling fruit, flowers and second-hand books line the narrow streets, and the smell of fresh bread drifts from a small bakery at the corner. I have been going there since I was a child, when my grandfather used to take me to buy cheese from a man called Mr Garcia.

Last month, I discovered that the market might close. The council wants to turn the square into a car park, saying that fewer people shop at market stalls these days. Many of the traders are worried, since some of them have worked there for more than thirty years. A group of local people has started a petition, and I signed it immediately.

I don't think a car park would solve anything. People come to the market not just to buy things but to meet friends and talk. Supermarkets can offer low prices, but they cannot offer that feeling of community."""
FCE_L = """Monologue: a woman talks about her first job

"I got my first job when I was sixteen, working in a bookshop at weekends. I wasn't paid much, but I loved it, because I could read during quiet moments. The owner, Mr Evans, was very strict about punctuality, and I once lost half an hour's pay for being five minutes late. At the time I thought that was unfair, but I learned a lot from it. The busiest day was always Saturday, when tourists came in looking for guidebooks. I stayed there for two years, until I left for university. Looking back, I think that job taught me more about dealing with people than any course I took later.\""""
FCE_W_PROMPT = """WRITING PART 1 — Essay (140–190 words)

In your English class you have been talking about technology. Now your teacher has asked you to write an essay.

Write an essay using ALL the points below:

"Mobile phones have made our lives better."
Do you agree?

Write about:
1. communication
2. education
3. (your own idea)

Write your essay in 140–190 words."""
FCE_W_SAMPLE = """Mobile phones are now a part of everyday life, and in my opinion they have mostly made our lives better, although they also bring some problems.

First of all, phones have revolutionised communication. We can talk to friends and family anywhere in the world, send photos in seconds and call for help in an emergency. For people who live far from their relatives, this is extremely valuable.

Secondly, phones can support education. Students can look up information, use dictionary apps and watch lessons online. A learner of English, for example, can practise vocabulary on the bus. However, phones can also distract students in class, so they must be used sensibly.

Another important point is safety and convenience: maps, banking and transport apps save us a lot of time. On the other hand, many people spend too many hours on social media, which can affect sleep and concentration.

To sum up, mobile phones offer great benefits for communication, learning and everyday life, provided that we control how much we use them."""

fce = T(
    "cambridge_b2_first_mock_1",
    "Cambridge B2 First (FCE) — Mock Test 1",
    "اختبار تجريبي بنمط Cambridge B2 First: Use of English، قراءة، استماع وكتابة مقال. مناسب للدراسة في بريطانيا وللحصول على شهادة معتمدة.",
    "B2", 75,
    sections=[
        S("uoe", "Use of English — Multiple-choice", "language", None, FCE_UOE,
          instr="اختر الإجابة الصحيحة لإكمال كل جملة."),
        S("reading1", "Reading — Part 1", "reading", FCE_R, [
            Q("What does the writer say about the market on Saturdays?", ["It is quiet and empty", "It is full of colour and noise", "It only sells food", "It is closed"], 1,
              "'The old market… fills with colour and noise.'"),
            Q("Why does the council want to close the market?", ["It is dangerous", "It wants a car park because fewer people shop there", "The traders asked it to", "The square is too small"], 1,
              "The council wants a car park, saying fewer people shop at market stalls."),
            Q("What did the writer do about the plan?", ["Joined the traders", "Signed a petition", "Wrote to the council", "Ignored it"], 1,
              "'I signed it immediately.'"),
            Q("What does the writer think people come to the market for?", ["Cheap prices only", "To buy things and to meet people", "To walk their dogs", "To avoid supermarkets"], 1,
              "People come 'not just to buy things but to meet friends and talk'."),
        ]),
        S("listening1", "Listening — Part 1", "listening", FCE_L, [
            Q("How old was the speaker when she got the job?", ["Fourteen", "Sixteen", "Eighteen", "Twenty"], 1, "'When I was sixteen.'"),
            Q("What did she like most about the job?", ["The salary", "Being able to read in quiet moments", "The customers", "The owner"], 1,
              "She loved it because she could read during quiet moments."),
            Q("Why did she lose half an hour's pay?", ["She broke a book", "She was five minutes late", "She left early", "She forgot to lock up"], 1,
              "She was five minutes late."),
            Q("What does she say she learned from the job?", ["How to sell books", "How to deal with people", "How to manage money", "How to study"], 1,
              "The job taught her about dealing with people."),
        ]),
    ],
    writing=W("Writing — Part 1: Essay (ungraded practice)", 40,
              "اكتب مقالًا من 140–190 كلمة. قارن مع النموذج بعد الانتهاء.", FCE_W_PROMPT, FCE_W_SAMPLE),
)

# ---------------------------------------------------------------- Placement test
PL = [
    Q("She ------- from Morocco.", ["am", "is", "are", "be"], 1, "A1: third person singular of 'be'."),
    Q("We ------- dinner at eight every evening.", ["has", "have", "having", "haves"], 1, "A1: present simple with 'we'."),
    Q("There ------- two books on the table.", ["is", "are", "be", "am"], 1, "A1: 'there are' with a plural noun."),
    Q("I ------- a film last night.", ["watch", "watched", "watching", "have watch"], 1, "A2: past simple."),
    Q("How ------- water do you drink every day?", ["many", "much", "lot", "few"], 1, "A2: 'water' is uncountable, so 'much'."),
    Q("He is ------- than his brother.", ["tall", "taller", "tallest", "more tall"], 1, "A2: comparative."),
    Q("I ------- to London twice.", ["have been", "was", "am going", "go"], 0, "B1: present perfect for life experience."),
    Q("If it rains tomorrow, we ------- at home.", ["stay", "will stay", "would stay", "stayed"], 1, "B1: first conditional."),
    Q("The bridge ------- in 1990.", ["built", "was built", "has built", "is building"], 1, "B1: past passive."),
    Q("She asked me where ------- .", ["did I live", "I lived", "do I live", "I do live"], 1, "B1: reported question word order."),
    Q("I'm looking forward ------- you next week.", ["to see", "to seeing", "seeing", "see"], 1, "B1+: 'look forward to' + -ing."),
    Q("If I ------- harder, I would have passed the exam.", ["studied", "had studied", "would study", "study"], 1, "B2: third conditional."),
    Q("He denied ------- the window.", ["to break", "breaking", "break", "to have break"], 1, "B2: 'deny' + -ing."),
    Q("By next year, she ------- here for ten years.", ["will work", "will have worked", "has worked", "works"], 1, "B2: future perfect."),
    Q("The meeting was postponed ------- the manager's illness.", ["owing to", "in spite", "despite of", "although"], 0, "B2: 'owing to' + noun."),
    Q("Choose the word closest in meaning to \"reluctant\".", ["eager", "unwilling", "careful", "relaxed"], 1, "'Reluctant' means unwilling."),
    Q("Not only ------- late, but he also forgot the documents.", ["he was", "was he", "he is", "is he"], 1, "C1: inversion after 'Not only'."),
    Q("Had I known about the traffic, I ------- earlier.", ["would leave", "would have left", "left", "had left"], 1, "C1: inverted third conditional."),
    Q("The proposal was met ------- fierce opposition.", ["by", "with", "for", "from"], 1, "'Be met with opposition' is the fixed expression."),
    Q("She is ------- to be promoted soon, according to the rumours.", ["said", "told", "spoken", "agreed"], 0, "C1: 'is said to be…' (passive reporting)."),
]
placement = T(
    "english_placement_test",
    "English Level Placement Test (A1–C1)",
    "اختبار تحديد مستوى في اللغة الإنجليزية: 20 سؤالًا متدرجًا من A1 إلى C1 لمعرفة مستواك قبل اختيار الدورة المناسبة.",
    "A1-C1", 20,
    sections=[S("placement", "Grammar & vocabulary", "language", None, PL,
                instr="الأسئلة مرتبة من الأسهل إلى الأصعب. نتيجتك التقريبية: أقل من 30% ≈ A1-A2، 30–55% ≈ B1، 55–80% ≈ B2، أكثر من 80% ≈ C1.")],
)

TESTS = [toefl, toeic, fce, placement]
