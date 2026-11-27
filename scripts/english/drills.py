from lib import *

def drill_read(tt, title, level, passage, qs):
    return T(tt, title, "نص قصير مع أسئلة استيعاب — حوالي 6 دقائق", level, 6,
             sections=[S("reading1", "Reading", "reading", passage, qs)], skill="reading")

def drill_listen(tt, title, level, passage, qs):
    return T(tt, title, "حوار أو حديث قصير مع أسئلة استيعاب — حوالي 6 دقائق", level, 6,
             sections=[S("listening1", "Listening", "listening", passage, qs)], skill="listening")

def drill_essay(tt, title, desc, level, minutes, name, instr, prompt, sample):
    return T(tt, title, desc, level, minutes, writing=W(name, minutes, instr, prompt, sample),
             skill="writing", essay=True)

TESTS = [
    drill_read("skill_en_reading_gym", "Reading Practice: Joining a Gym", "A2",
        """Fit4Life Gym — Special Offer

Join Fit4Life this month and get your first two weeks free! Our gym is open every day from 6 a.m. to 11 p.m. Membership costs £25 a month, and there is no joining fee. All members can use the gym, the sauna and the changing rooms. Group classes such as yoga and spinning cost an extra £5 per class, but members can try one class for free.

To join, visit our reception desk with a photo ID, or sign up online at www.fit4life.example. Please bring your own towel and a bottle of water. Children under 16 cannot use the gym without an adult.""",
        [Q("How much is the monthly membership?", ["£5", "£25", "£11", "Free"], 1, "£25 a month."),
         Q("What is free for new members?", ["The first two weeks", "The first class and sauna", "The towel", "All group classes"], 0, "'Your first two weeks free'."),
         TF("There is a joining fee.", "False", "'There is no joining fee.'"),
         TF("Group classes cost extra.", "True", "Classes cost £5 each."),
         Q("What should members bring?", ["A towel and a bottle of water", "A sports bag", "A doctor's note", "A parent"], 0, "'Bring your own towel and a bottle of water.'"),
         TF("Children under 16 may use the gym alone.", "False", "They cannot use it without an adult.")]),
    drill_read("skill_en_reading_remote_work", "Reading Practice: Working from Home", "B1",
        """More and more people now work from home at least some of the week. Employees say the biggest advantage is saving time: without a daily commute, many gain one or two hours. They also report being able to concentrate better without office noise. Companies, too, can benefit, because they need less office space.

However, remote work has drawbacks. Some people feel lonely and find it hard to separate work from private life, especially if they do not have a separate room for working. Managers sometimes worry that it is harder to build a team when people rarely meet. As a result, many firms now choose a hybrid model: two or three days at home and the rest in the office.""",
        [Q("What is the biggest advantage for employees, according to the text?", ["Higher salaries", "Saving commuting time", "Longer holidays", "Free equipment"], 1, "They gain one or two hours without a daily commute."),
         TF("Companies can benefit by needing less office space.", "True", "The text says this directly."),
         TF("All employees find it easy to separate work and private life.", "False", "Some find it hard."),
         Q("What is a hybrid model?", ["Working only in the office", "Working only from home", "Some days at home and some in the office", "Working in two companies"], 2, "'Two or three days at home and the rest in the office.'"),
         Q("Why do managers sometimes worry about remote work?", ["It costs more", "It is harder to build a team", "Employees work too much", "Offices are empty"], 1, "'It is harder to build a team when people rarely meet.'"),
         TF("The text says remote work makes employees earn less.", "Not Given", "Salaries are not mentioned.")]),
    drill_read("skill_en_reading_toefl_glaciers", "Reading Practice (TOEFL style): Glaciers", "B2",
        """Glaciers are large masses of ice that form where more snow falls in winter than melts in summer. Over many years, the weight of the accumulating snow compresses the lower layers into dense ice, and when the ice becomes thick enough, it begins to flow slowly downhill under its own weight. Some glaciers move only a few centimetres a day, while others, such as those in Greenland, can advance several metres daily.

As glaciers move, they erode the landscape beneath them. Rocks frozen into the base of the ice scrape the valley floor like sandpaper, widening and deepening it into a characteristic U shape. When the ice finally melts, it leaves behind lakes, ridges and piles of rock that were carried along. Many of the lakes in northern Europe and Canada were formed in this way during the last Ice Age.""",
        [Q("According to the passage, how do glaciers form?", ["When rivers freeze", "When more snow falls than melts", "When ice is brought by wind", "When mountains cool"], 1, "They form where more snow falls in winter than melts in summer."),
         Q("The word \"compresses\" in the passage is closest in meaning to…", ["presses together", "melts", "spreads out", "lifts"], 0, "'Compress' means to press into a smaller space."),
         Q("What shape do glaciers give to the valleys they pass through?", ["V", "U", "L", "Flat"], 1, "The valley is widened and deepened into a U shape."),
         Q("What do rocks in the base of the ice do?", ["Protect the valley", "Scrape the valley floor", "Melt the ice", "Slow the glacier down"], 1, "They scrape the valley floor like sandpaper."),
         Q("Which of the following is TRUE about glaciers in Greenland?", ["They never move", "They can advance several metres a day", "They are the smallest in the world", "They formed after the Ice Age"], 1, "Greenland glaciers can advance several metres daily."),
         Q("What is mentioned as a result of melting glaciers?", ["Volcanoes", "Lakes and ridges", "Deserts", "Earthquakes"], 1, "The melted ice leaves behind lakes, ridges and piles of rock.")]),

    drill_listen("skill_en_listening_airport", "Listening Practice: At the Airport", "A2",
        """Conversation at check-in
Agent: Good morning. Where are you flying to today?
Passenger: To Madrid, flight IB 3411.
Agent: May I see your passport, please? Thank you. Do you have any luggage to check in?
Passenger: Yes, one suitcase.
Agent: Please put it on the scale. It's twenty-two kilos, which is fine. Would you like a window or an aisle seat?
Passenger: A window seat, please.
Agent: Here is your boarding pass. Boarding starts at ten forty at gate B12.
Passenger: Thank you. Is the flight on time?
Agent: Yes, it leaves at eleven fifteen.""",
        [Q("Where is the passenger flying?", ["London", "Madrid", "Paris", "Rome"], 1, "To Madrid."),
         Q("How much does the suitcase weigh?", ["12 kilos", "22 kilos", "32 kilos", "42 kilos"], 1, "Twenty-two kilos."),
         Q("Which seat does the passenger choose?", ["Window", "Aisle", "Middle", "Front"], 0, "A window seat."),
         Q("When does boarding start?", ["10.15", "10.40", "11.15", "11.40"], 1, "Boarding starts at ten forty."),
         Q("Which gate is it?", ["A12", "B2", "B12", "C12"], 2, "Gate B12."),
         TF("The flight is delayed.", "False", "It is on time, leaving at eleven fifteen.")]),
    drill_listen("skill_en_listening_job_interview", "Listening Practice: A Job Interview", "B1",
        """Interview
Interviewer: Thank you for coming, Ms Haddad. Could you tell me about your previous job?
Candidate: Of course. For the past three years I've worked as a sales assistant in a large electronics store. I helped customers choose products and trained new colleagues.
Interviewer: Why are you leaving?
Candidate: I'm looking for more responsibility, and I'd like to work in a role where I can use my languages. I speak English, French and Arabic.
Interviewer: That's very useful for us. This position involves working some weekends. Is that a problem?
Candidate: Not at all. I'm flexible.
Interviewer: Excellent. When could you start?
Candidate: I have to give one month's notice, so I could begin on the first of next month.""",
        [Q("How long has the candidate worked at her current job?", ["One year", "Two years", "Three years", "Five years"], 2, "'For the past three years.'"),
         Q("What did she do in her previous job?", ["Taught languages", "Worked as a sales assistant", "Managed a bank", "Drove a taxi"], 1, "She was a sales assistant in an electronics store."),
         Q("Why does she want to leave?", ["Low salary", "She wants more responsibility and to use her languages", "She dislikes her colleagues", "She is moving abroad"], 1, "More responsibility and use of her languages."),
         Q("Which languages does she speak?", ["English, French and Arabic", "English and German", "French and Spanish", "Arabic and Italian"], 0, "English, French and Arabic."),
         TF("She cannot work at weekends.", "False", "'Not at all. I'm flexible.'"),
         Q("When can she start?", ["Immediately", "In one week", "In one month", "In six months"], 2, "She has to give one month's notice.")]),
    drill_listen("skill_en_listening_lecture_bees", "Listening Practice (TOEFL style): Short Lecture on Pollination", "B2",
        """Lecture
Professor: Today I'd like to talk about pollination. Many flowering plants cannot produce seeds unless pollen is transferred from one flower to another. Wind can do this for plants such as grasses, but around three quarters of the world's major food crops rely at least partly on animals, mostly insects. Bees are the most important pollinators because they feed on nectar and pollen throughout their lives and visit large numbers of flowers.
This relationship benefits both sides: the plant is pollinated, and the bee gets food. However, in recent decades, bee populations have declined in many regions, largely because of habitat loss and pesticides. Without bees, farmers would need to pollinate some crops by hand, as is already happening in parts of China, which is extremely costly. For next week, prepare a short summary of one study on bee decline.""",
        [Q("What is the main topic of the lecture?", ["Pollination", "Honey production", "Wind energy", "Plant diseases"], 0, "The professor introduces pollination."),
         Q("Which plants are pollinated by wind?", ["Fruit trees", "Grasses", "Roses", "Vegetables"], 1, "Wind pollinates plants such as grasses."),
         Q("Why are bees the most important pollinators?", ["They are the largest insects", "They visit many flowers while feeding on nectar and pollen", "They live in the cold", "They do not need food"], 1, "They feed on nectar and pollen and visit large numbers of flowers."),
         Q("What has caused the decline in bee populations?", ["Habitat loss and pesticides", "Too much rain", "Too many flowers", "Wind"], 0, "'Largely because of habitat loss and pesticides.'"),
         Q("What is happening in parts of China, according to the professor?", ["Bees are being imported", "Some crops are pollinated by hand", "Pesticides are banned", "Farmers keep more bees"], 1, "Crops are pollinated by hand, which is extremely costly."),
         Q("What are the students asked to do?", ["Visit a farm", "Prepare a short summary of a study on bee decline", "Take an exam", "Watch a documentary"], 1, "Prepare a short summary of one study on bee decline.")]),

    T("skill_en_writing_linking_words", "Writing Practice: Linking Words", "اختر أداة الربط الصحيحة لتحسين تنظيم كتابتك — حوالي 6 دقائق", "B1", 6,
      sections=[S("writing1", "Linking words", "language", None, [
          Q("I wanted to go out; ------- , it was raining heavily.", ["however", "because", "so that", "unless"], 0, "'However' contrasts two ideas."),
          Q("She studied hard ------- she could pass the exam.", ["so that", "although", "but", "despite"], 0, "'So that' expresses purpose."),
          Q("------- the traffic, we arrived on time.", ["Although", "Despite", "Because", "However"], 1, "'Despite' + noun phrase."),
          Q("Many people prefer cities. ------- , others like the countryside.", ["On the other hand", "Therefore", "For example", "As a result"], 0, "Contrast."),
          Q("He didn't study. ------- , he failed the test.", ["As a result", "Although", "Unless", "Whereas"], 0, "Result."),
          Q("------- it was cold, we went swimming.", ["Although", "Because", "So", "Therefore"], 0, "'Although' + clause."),
          Q("Exercise is good for you. ------- , it helps you sleep better.", ["Moreover", "However", "Unless", "Despite"], 0, "Adding information."),
      ])], skill="writing"),
    T("skill_en_writing_tenses", "Writing Practice: Verb Tenses", "تدريب على الأزمنة الأساسية في الكتابة — حوالي 6 دقائق", "B1", 6,
      sections=[S("writing1", "Verb tenses", "language", None, [
          Q("Yesterday I ------- my friend at the station.", ["meet", "met", "have met", "was meet"], 1, "Past simple with 'yesterday'."),
          Q("I ------- here since 2019.", ["live", "lived", "have lived", "am living"], 2, "Present perfect with 'since'."),
          Q("While I ------- TV, the phone rang.", ["watched", "was watching", "have watched", "watch"], 1, "Past continuous interrupted by past simple."),
          Q("She ------- her homework before she went out.", ["finished", "had finished", "has finished", "finishes"], 1, "Past perfect for the earlier action."),
          Q("Next week we ------- a new project.", ["start", "are starting", "started", "have started"], 1, "Present continuous for planned arrangements."),
          Q("I ------- coffee every morning.", ["drinks", "drink", "am drinking", "drank"], 1, "Present simple for habits."),
          Q("He said he ------- tired.", ["is", "was", "be", "were being"], 1, "Reported speech back-shifts the tense."),
      ])], skill="writing"),

    drill_essay("skill_en_writing_ielts_task2_cities", "Writing Activity: IELTS Task 2 — City vs Countryside",
        "مقال رأي بنمط IELTS Task 2 — تقييم فوري بالذكاء الاصطناعي", "B2", 40,
        "IELTS Writing Task 2", "اكتب 250 كلمة على الأقل. سيُقيَّم نصك آليًا ثم يمكنك مقارنته بالنموذج.",
        "Some people think that it is better to live in a big city, while others prefer to live in the countryside.\n\nDiscuss both views and give your own opinion. Write at least 250 words.",
        """Where to live is one of the most important decisions in life. Some people prefer the energy of a big city, whereas others value the peace of the countryside. I believe both places have clear advantages, but the best choice depends on a person's age and priorities.

Cities offer jobs, education and entertainment. A young graduate is far more likely to find a well-paid position in a large city than in a village. Hospitals, universities and public transport are also better developed, which makes daily life more convenient. In addition, cities are culturally diverse, so residents can meet people from many backgrounds.

On the other hand, the countryside offers a calmer and healthier life. The air is cleaner, houses are cheaper and neighbours often know each other, which creates a strong sense of community. For families with young children, having a garden and safe streets can be more valuable than nightlife.

In my opinion, young people who are starting their careers benefit most from living in a city, while families and older people may prefer rural areas. Remote work is also making the countryside more attractive, since employees no longer need to live near the office.

In conclusion, neither option is better for everyone; each suits different stages of life."""),
    drill_essay("skill_en_writing_ielts_gt_letter", "Writing Activity: IELTS General — Letter to a Landlord",
        "رسالة شبه رسمية بنمط IELTS General Task 1 — تقييم فوري بالذكاء الاصطناعي", "B1", 20,
        "IELTS General Writing Task 1", "اكتب 150 كلمة على الأقل. ابدأ بـ Dear Mr/Ms … وانهِ بما يناسب نبرة الرسالة.",
        "You live in a rented flat. The heating has not worked for two weeks.\n\nWrite a letter to your landlord. In your letter:\n• explain what the problem is\n• describe how it affects you\n• say what you would like him or her to do\n\nWrite at least 150 words.",
        """Dear Mr Collins,

I am writing about the heating in my flat at 14 Mill Street, which has not worked for the past two weeks. When I turn on the radiators, they stay cold, and the boiler makes a strange noise.

This is becoming a serious problem for me. The temperature in the flat is very low in the evenings, and my younger sister, who lives with me, has already caught a cold. I have had to buy two electric heaters, which are expensive to use.

I would be grateful if you could send an engineer to inspect the boiler as soon as possible. I am at home after 5 p.m. on weekdays and all day on Saturday, so please let me know which time suits you. If the boiler cannot be repaired, I would like to discuss replacing it.

Thank you for your help. I look forward to hearing from you soon.

Yours sincerely,
Karim Benali"""),
    drill_essay("skill_en_writing_toefl_discussion_remote", "Writing Activity: TOEFL Academic Discussion — Online Classes",
        "مشاركة نقاش أكاديمي بنمط TOEFL — تقييم فوري بالذكاء الاصطناعي", "B2", 10,
        "TOEFL Academic Discussion", "اكتب 100 كلمة على الأقل، عبّر عن رأيك وأضف فكرة جديدة للنقاش.",
        "Your professor is teaching a class on education. Write a post responding to the professor's question. Write at least 100 words.\n\nProfessor Green: Many universities now offer degree programmes that are taught entirely online. Do you think online learning is as effective as studying on campus? Explain your opinion.\n\nStudent 1 (Lina): Online learning is flexible. I can watch lectures at any time and balance study with a job.\n\nStudent 2 (Omar): I disagree. Without face-to-face contact, it's easy to lose motivation, and you miss the discussions that happen in a classroom.",
        """I agree with Omar that campus learning is more effective for most students, although Lina is right that online courses are flexible. Flexibility is valuable for people who work, but it also requires a high level of self-discipline. Many students start online programmes enthusiastically and then fall behind because nobody is checking their progress.

On campus, you can ask a question immediately, join study groups and build relationships with professors, which often leads to internships and recommendation letters. These benefits are difficult to reproduce on a screen.

However, I think a blended approach could work best: online lectures for the theory and in-person sessions for discussion and practical work. That would combine Lina's flexibility with the interaction that Omar values."""),
]
