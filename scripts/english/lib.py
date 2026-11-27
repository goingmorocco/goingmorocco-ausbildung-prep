"""Tiny DSL for describing English tests; gen_sql.py turns them into a migration."""

TFNG = ["True", "False", "Not Given"]
YNNG = ["Yes", "No", "Not Given"]


def Q(text, opts, correct, why):
    """Multiple choice. `correct` is the index in `opts`."""
    assert 2 <= len(opts) <= 5, text
    assert 0 <= correct < len(opts), text
    return {"text": text, "opts": opts, "correct": correct, "why": why}


def TF(text, ans, why):
    """True / False / Not Given."""
    return Q(text, TFNG, TFNG.index(ans), why)


def YN(text, ans, why):
    return Q(text, YNNG, YNNG.index(ans), why)


def S(key, name, typ, passage, qs, instr=None, minutes=None):
    assert typ in ("reading", "listening", "language")
    if instr is None and typ == "listening":
        instr = ("لا يتضمن هذا القسم ملفًا صوتيًا بعد — اقرأ نص التسجيل كما لو كنت تسمعه "
                 "(مرة واحدة فقط في الامتحان الحقيقي)، ثم أجب عن الأسئلة.")
    return {"key": key, "name": name, "type": typ, "passage": passage, "qs": qs,
            "instr": instr, "minutes": minutes}


def W(name, minutes, instr, prompt, sample):
    return {"name": name, "minutes": minutes, "instr": instr, "prompt": prompt, "sample": sample}


def T(test_type, title, desc, level, minutes, sections=None, writing=None,
      skill=None, essay=False, passing=60):
    skill_practice = skill is not None
    return {"test_type": test_type, "title": title, "desc": desc, "level": level,
            "minutes": minutes, "sections": sections or [], "writing": writing,
            "skill": skill, "is_skill_practice": skill_practice, "essay": essay,
            "passing": passing}
