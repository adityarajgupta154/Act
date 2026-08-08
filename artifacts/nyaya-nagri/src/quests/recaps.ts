/**
 * Nyaya Nagri — Adaptive "Let's revisit" recap content (Task 9)
 *
 * One hard-coded recap per quiz question, keyed by questId and aligned by
 * question index. Shown ONLY when a player's silent pre-quiz score was very
 * low (see engine.ts): after the post-quiz, the player gets a short,
 * simplified restatement of each concept they started out unsure about,
 * plus one gentle reinforcing question.
 *
 * Safety rules (PRD §9.8): every word here is static, hand-written content
 * derived from the already-reviewed quest explanations — never AI-generated,
 * never a new legal claim. Helpline text (Childline 1098, Cyber Crime
 * Helpline 155260) appears exactly as mandated. No emojis. The recap never
 * tells the child they "failed" or reveals pre-quiz scores — it is framed
 * as one more friendly look at a big idea.
 */

import { RECAPS_HI } from './recaps.hi';

export interface RecapItem {
  /** 2-3 short, simplified sentences restating the concept. */
  summary: string;
  /** One reinforcing question (different wording from the quiz question). */
  question: string;
  /** 2-3 options; kept simple on purpose. */
  options: string[];
  correctIndex: number;
  /** Encouraging explanation shown after answering, right or wrong. */
  explanation: string;
}

export const RECAPS: Record<string, RecapItem[]> = {
  // ---------------------------------------------------------- zone0: 8-11
  know_yourself_8_11: [
    {
      summary:
        'Rights are like invisible shields that every child in India is born with. You do not have to earn them — no marks, prizes, or money decide them, and nobody can take them away.',
      question: 'When did your rights become yours?',
      options: ['The day I was born', 'Only after I win something'],
      correctIndex: 0,
      explanation:
        'Yes! Your shields have been with you from your very first day, and they stay with you always.',
    },
    {
      summary:
        "Every child carries the very same shields. Speaking a different language, wearing different clothes, or coming from a different place never makes a child's rights smaller.",
      question: 'Which children have the same rights as you?',
      options: ['Every child, everywhere in India', 'Only children just like me'],
      correctIndex: 0,
      explanation: 'Right! Same rights, same respect — for every single child.',
    },
    {
      summary:
        'If someone makes you or a friend feel scared or small, telling is the strongest move. A trusted grown-up can help, and Childline 1098 is a free phone number for any child, day or night.',
      question: 'What is a strong thing to do when something feels wrong?',
      options: [
        'Keep it secret forever',
        'Tell a trusted grown-up or call Childline 1098',
      ],
      correctIndex: 1,
      explanation: 'Exactly. Telling is brave — and 1098 is always free and always open.',
    },
  ],
  // --------------------------------------------------------- zone0: 12-15
  know_yourself_12_15: [
    {
      summary:
        "The Constitution of India is the country's master rulebook. Every other law and rule must follow it, and the fundamental rights inside it belong to every person — including every child.",
      question: 'Which book is the highest rulebook in India?',
      options: ['The Constitution of India', 'A school rule book'],
      correctIndex: 0,
      explanation: 'Yes — and because it is the highest, no rule that breaks it can stand.',
    },
    {
      summary:
        'Article 14 says everyone is equal before the law and gets the equal protection of the laws. The same legal shield covers rich and poor, young and old.',
      question: 'Under Article 14, who does the law protect equally?',
      options: ['Everyone', 'Only adults'],
      correctIndex: 0,
      explanation: 'Correct. One law, one shield, for every person.',
    },
    {
      summary:
        'Article 15 forbids the State from discriminating against anyone only because of religion, race, caste, sex, or place of birth. Separate taps or separate treatment for one community is exactly what it stands against.',
      question: 'A rule treats one community differently just because of their caste. Is that allowed?',
      options: ['No — Article 15 forbids it', 'Yes, if a powerful person made the rule'],
      correctIndex: 0,
      explanation:
        'Right. And if you see it happen, the safe, strong step is to stand with the person and tell a teacher or trusted adult.',
    },
    {
      summary:
        "Article 21 protects life and personal liberty, and courts have read 'life' to mean a life with dignity — not just staying alive. Many protections for children grow out of it.",
      question: "What does 'life' mean in Article 21?",
      options: ['A life with dignity and safety', 'Only not being physically attacked'],
      correctIndex: 0,
      explanation: 'Yes. Dignity is part of the right to life itself.',
    },
  ],
  // --------------------------------------------------------- zone0: 16-18
  know_yourself_16_18: [
    {
      summary:
        'Article 14 puts every person and every official under the same law. Equality before the law plus equal protection of the laws means the State cannot act with arbitrary favouritism — only reasonable, justified classifications are allowed.',
      question: 'Can any official claim to be above the law?',
      options: ['No — Article 14 places everyone under it', 'Yes, senior officials are exempt'],
      correctIndex: 0,
      explanation:
        'Correct. One legal standard for everyone is the foundation the rest of your rights stand on.',
    },
    {
      summary:
        'Article 15 bars State discrimination on religion, race, caste, sex, or place of birth — and Article 15(3) expressly allows special provisions for women and children. Child-protection laws are constitutionally encouraged protection, not discrimination.',
      question: 'Are special protections for children a kind of discrimination?',
      options: [
        'No — Article 15(3) expressly permits them',
        'Yes, all different treatment is discrimination',
      ],
      correctIndex: 0,
      explanation: 'Right. Protecting those who need it is the Constitution working as designed.',
    },
    {
      summary:
        'Under Article 21, personal liberty can be limited only through a fair, just, and reasonable procedure established by law. For anyone under 18, the Juvenile Justice Act adds mandatory child-protective safeguards on top.',
      question: 'How can personal liberty lawfully be taken away?',
      options: ['Only by a fair legal procedure', 'By any sufficiently senior officer'],
      correctIndex: 0,
      explanation: 'Yes. No fair procedure, no deprivation — that is the Article 21 line.',
    },
    {
      summary:
        'Money never decides justice: every child is entitled to free legal aid through the Legal Services Authorities (national, state, and district). Childline 1098 can also connect a child to help — free, 24 hours.',
      question: 'A family cannot afford a lawyer for their child. What follows?',
      options: [
        'The child is entitled to free legal aid',
        'The child simply goes unrepresented',
      ],
      correctIndex: 0,
      explanation:
        'Correct. Free legal aid is a right, and 1098 is a free door to reach help any time.',
    },
  ],
  // ---------------------------------------------------------- zone1: 8-11
  safe_zone_8_11: [
    {
      summary:
        'Your body belongs to YOU and no one else. A special law in India called POCSO protects every child\u2019s body from wrong touch.',
      question: 'Whose permission matters for your own body?',
      options: ['Mine! My body is mine.', 'Anyone older than me'],
      correctIndex: 0,
      explanation: 'Yes! Your body is yours, and the law protects it, always.',
    },
    {
      summary:
        'Some secrets feel scary or mixed-up inside. Those are bad secrets, and bad secrets must always be told to a trusted grown-up. Childline 1098 is a free phone friend for any child, any time.',
      question: 'A secret makes you feel scared inside. What do you do with it?',
      options: ['Keep it forever', 'Tell a trusted grown-up'],
      correctIndex: 1,
      explanation:
        'That\u2019s right! Scary secrets must be told. A trusted grown-up can help, and Childline 1098 is always there too.',
    },
    {
      summary:
        'If someone touches a child in a wrong way, the fault belongs to the person who did it. It is NEVER the child\u2019s fault. Telling a trusted grown-up is always the right thing to do.',
      question: 'Is wrong touch ever the child\u2019s fault?',
      options: ['Never. Not even a little.', 'Sometimes'],
      correctIndex: 0,
      explanation: 'Never. The law is on the child\u2019s side, always.',
    },
  ],
  safe_zone_12_15: [
    {
      summary:
        'Consent means a free, clear yes. If pressure, tricks, or fear made someone say yes, it does not count. You can also change your mind or say no at any time.',
      question: 'Which of these is real consent?',
      options: [
        'A yes given freely, which you can take back any time',
        'A yes given because you were scared or pressured',
      ],
      correctIndex: 0,
      explanation:
        'Exactly. Real consent is free and clear. A pressured yes is not consent at all.',
    },
    {
      summary:
        'Grooming often looks friendly at first: heavy compliments, gifts, and then \u201ckeep our chats secret\u201d. A secrecy demand from an online stranger is a warning sign, not friendship.',
      question:
        'An online stranger sends gifts and says to keep your chats secret. What is that?',
      options: [
        'A warning sign: stop and tell a trusted adult',
        'Proof that they really care about you',
      ],
      correctIndex: 0,
      explanation:
        'Right. Gifts plus secrecy is a classic grooming move, designed to cut you off from the people who protect you.',
    },
    {
      summary:
        'The POCSO Act protects every person under 18, of every gender. It covers harassment and abuse online as well as offline.',
      question: 'Who does the POCSO Act protect?',
      options: [
        'Everyone under 18, online and offline',
        'Only some children, and only offline',
      ],
      correctIndex: 0,
      explanation: 'Yes. POCSO covers every under-18, everywhere, including the internet.',
    },
    {
      summary:
        'If someone online pressures you for private photos: refuse and send nothing. Keep the messages as a record and tell a trusted adult, or call Childline 1098. The child who reports is protected by law, never punished.',
      question: 'Someone keeps pressuring you for private photos. What is the best move?',
      options: [
        'Refuse, keep the messages, and tell a trusted adult or call Childline 1098',
        'Send one photo so they stop asking',
      ],
      correctIndex: 0,
      explanation:
        'Exactly. Refusing and telling is the safe play, and the law stands with the child who reports.',
    },
  ],
  safe_zone_16_18: [
    {
      summary:
        'POCSO protects every person under 18, of all genders. Adults who learn of an offence are legally required to report it, so the burden never rests on the child alone.',
      question: 'Who does POCSO protect?',
      options: ['Every person under 18, of all genders', 'Only young children'],
      correctIndex: 0,
      explanation:
        'Correct. It is universal below 18 and gender-neutral, and adults who know of an offence must report it.',
    },
    {
      summary:
        'Below 18, consent is not a legal defence. Even if a 17-year-old \u201cagreed\u201d, the adult is fully liable. The law places the entire responsibility on the adult.',
      question: 'Does a minor saying yes make it legal?',
      options: [
        'No. Below 18, consent has no legal validity, and the adult is fully liable.',
        'Yes, if they said yes',
      ],
      correctIndex: 0,
      explanation: 'Right. The responsibility sits entirely with the adult, always.',
    },
    {
      summary:
        'Reporting under POCSO is designed to be child-friendly. The child\u2019s identity is protected by law, and the statement is recorded in a comfortable setting. Childline 1098 can guide anyone through it.',
      question: 'What is the POCSO reporting process designed to be?',
      options: [
        'Child-friendly, with the child\u2019s identity protected',
        'Frightening and public',
      ],
      correctIndex: 0,
      explanation:
        'Yes. The process is built around the child, and 1098 can guide every step.',
    },
    {
      summary:
        'POCSO Special Courts hold closed hearings. The law requires measures, like screens or video links, so the child is not exposed to the accused while testifying. The trial is designed not to re-traumatise.',
      question: 'In a POCSO Special Court, hearings are...',
      options: [
        'Closed, with measures so the child does not face the accused',
        'Public, like any other trial',
      ],
      correctIndex: 0,
      explanation:
        'Correct. In-camera hearings and child-appropriate questioning are the design, not the exception.',
    },
    {
      summary:
        'When a friend discloses abuse: listen, believe them, and help them reach a trusted adult or Childline 1098. Investigation belongs to trained authorities, never to friends.',
      question: 'A friend discloses abuse to you. Your role is to...',
      options: [
        'Listen, believe, and connect them to a trusted adult or Childline 1098',
        'Investigate it yourself first',
      ],
      correctIndex: 0,
      explanation:
        'Exactly. Listen, believe, connect. 1098 is free and available 24/7.',
    },
  ],
  // ---------------------------------------------------------- zone2
  right_childhood_8_11: [
    {
      summary:
        'Every child has the right to learn, play, and rest. A law in India protects children\u2019s time to grow instead of working in jobs.',
      question: 'Which three things are every child\u2019s right?',
      options: ['Learn, play, and rest', 'Work, work, and work'],
      correctIndex: 0,
      explanation: 'Yes! Learning, playing, and resting are every child\u2019s right.',
    },
    {
      summary:
        'When a child is working all day instead of learning, grown-up helpers are needed. The best move is telling a trusted grown-up, like a teacher. They can call Childline 1098, free, day and night.',
      question: 'You see a child working all day instead of going to school. What is the best thing to do?',
      options: ['Tell a trusted grown-up, like a teacher', 'Keep it a secret'],
      correctIndex: 0,
      explanation:
        'That\u2019s right. Big problems need grown-up helpers, and 1098 is always open.',
    },
    {
      summary:
        'If a child has to work instead of going to school, it is never the child\u2019s fault. Helpers are there to help the child and the family, not to punish children.',
      question: 'Is it the child\u2019s fault if they have to work?',
      options: ['No, never', 'Yes'],
      correctIndex: 0,
      explanation:
        'Never. Helpers like teachers and Childline 1098 help children get back to learning and playing.',
    },
  ],
  right_childhood_12_15: [
    {
      summary:
        'The law generally prohibits employing children below 14 in any occupation. The one narrow exception is safe help in your OWN family\u2019s work, outside school hours, without harming your education.',
      question: 'Below what age does the law generally prohibit employment?',
      options: ['Below 14', 'Below 10'],
      correctIndex: 0,
      explanation:
        'Right. Under 14, employment is prohibited; only safe family help outside school hours is allowed.',
    },
    {
      summary:
        'Light, safe help in your own family\u2019s work after school is allowed. Employment, hazardous work, and anything that replaces school are prohibited for children under 14.',
      question: 'Which of these is allowed for a 13-year-old?',
      options: [
        'Safe help in the family\u2019s own shop after school',
        'A job that replaces going to school',
      ],
      correctIndex: 0,
      explanation:
        'Yes. Family help must be safe, outside school hours, and never at the cost of education.',
    },
    {
      summary:
        'If you discover a child working in dangerous conditions, never confront the employer yourself. Tell a trusted teacher or call Childline 1098, free and 24/7. They can involve child-protection authorities such as the CWC.',
      question: 'You find a child in dangerous work. Who should you tell?',
      options: [
        'A trusted teacher, or Childline 1098',
        'The employer, face to face',
      ],
      correctIndex: 0,
      explanation:
        'Exactly. Route it through the helpers who are trained for this; never confront anyone yourself.',
    },
    {
      summary:
        'A child rescued from illegal labour is treated as a child needing care and protection, never as a wrongdoer. The penalty falls on the employer, and the system\u2019s role is to support the child back into school.',
      question: 'What happens to a child rescued from illegal child labour?',
      options: [
        'They are supported back into school',
        'They are punished for working',
      ],
      correctIndex: 0,
      explanation:
        'Right. The employer faces the penalty; the child gets support, never blame.',
    },
  ],
  right_childhood_16_18: [
    {
      summary:
        'Adolescents aged 14 to 18 may work, but hazardous occupations and processes are prohibited until 18: mines, inflammable substances or explosives, and hazardous processes.',
      question: 'What does the law say about work for 14 to 18 year olds?',
      options: [
        'Work is permitted, but hazardous occupations are banned until 18',
        'Any work at all is allowed after 14',
      ],
      correctIndex: 0,
      explanation:
        'Correct. Adolescent work is allowed only outside the hazardous list.',
    },
    {
      summary:
        'Firecracker work involves inflammable and explosive substances, so it is banned for everyone under 18. Article 24 of the Constitution separately bars children below 14 from factories, mines, and hazardous employment.',
      question: 'Is packing work at a firecracker unit legal for a 17-year-old?',
      options: [
        'No. It is a banned hazardous occupation for anyone under 18.',
        'Yes, at 17 any job is allowed',
      ],
      correctIndex: 0,
      explanation:
        'Right. Explosives and inflammable substances are on the prohibited list until 18.',
    },
    {
      summary:
        'Even permitted adolescent work is regulated: capped daily hours with rest breaks, no work between 7 p.m. and 8 a.m., a weekly day off, and no overtime. These protections cannot be waived by agreement.',
      question: 'Which working condition applies to legally employed adolescents?',
      options: [
        'No work between 7 p.m. and 8 a.m., capped hours, and a weekly day off',
        'Unlimited hours, if the adolescent agrees',
      ],
      correctIndex: 0,
      explanation:
        'Yes. The limits are fixed by law and cannot be signed away, not even voluntarily.',
    },
    {
      summary:
        'When an employer illegally employs a child or adolescent, the law punishes the employer, with imprisonment and fine. The young worker is never punished; the law helps them back into education.',
      question: 'Who does the law punish for illegal child labour?',
      options: ['The employer', 'The working adolescent'],
      correctIndex: 0,
      explanation:
        'Correct. Penalties fall on the employer; the child is protected and supported.',
    },
    {
      summary:
        'RTE guarantees free schooling up to 14, and the labour law\u2019s limits on adolescent work exist so education can continue through the teen years. If work is crowding out school, Childline 1098 can help.',
      question: 'Why does labour law limit adolescent work?',
      options: [
        'So that work fits around education instead of replacing it',
        'To stop teenagers from earning anything',
      ],
      correctIndex: 0,
      explanation:
        'Exactly. The two laws work together to protect a student\u2019s time, health, and future.',
    },
  ],
  // ---------------------------------------------------------- zone3
  school_rights_8_11: [
    {
      summary:
        'Article 21A and the RTE Act make education free and compulsory for every child aged 6 to 14. In government schools there are no fees, and textbooks and uniforms are free too.',
      question: 'What is school like for ages 6 to 14 in a government school?',
      options: [
        'Free: no fees, and free books and uniforms too',
        'Only for families who can pay',
      ],
      correctIndex: 0,
      explanation:
        'Yes! Education is a right for every child aged 6 to 14, and money is not allowed to stand in the way.',
    },
    {
      summary:
        'No child can be turned away or expelled from school because of money. Education is a right for every child aged 6 to 14, not a favour.',
      question: 'Can a child lose school because the family cannot pay?',
      options: ['No, never', 'Yes, if the fees are late'],
      correctIndex: 0,
      explanation: 'Never. School is a right, not something money can take away.',
    },
    {
      summary:
        'Worries about school get smaller when you share them. A trusted grown-up like a parent or teacher can help, and Childline 1098 is a free helpline for every child, open day and night.',
      question: 'Who can you talk to about a school worry?',
      options: [
        'A trusted grown-up, or Childline 1098',
        'No one. Worries should stay secret.',
      ],
      correctIndex: 0,
      explanation:
        'That\u2019s right. Sharing a worry is always allowed, and 1098 never closes.',
    },
  ],
  school_rights_12_15: [
    {
      summary:
        'Under the RTE Act, eligible private unaided schools must keep 25 percent of their entry-level seats (Class 1 or pre-primary) free for children from disadvantaged groups and weaker sections, with the government reimbursing the school. Unaided minority institutions are exempt.',
      question: 'Where does the 25 percent EWS quota apply?',
      options: [
        'At the entry level of eligible private unaided schools',
        'In any class of any school, at any time',
      ],
      correctIndex: 0,
      explanation:
        'Right. It is an entry-level admission right at eligible schools, not a mid-school transfer right.',
    },
    {
      summary:
        'No child can be expelled before completing Class 8, and no board exam can be required before that. Being held back is possible only in Classes 5 and 8, only in states that adopted it, and only after a second-chance re-exam.',
      question: 'Can a Class 7 student be expelled for failing an exam?',
      options: [
        'No. Expulsion is not allowed before completing Class 8.',
        'Yes. Failing means expulsion.',
      ],
      correctIndex: 0,
      explanation:
        'Correct. Elementary school is protected space; even holding back has strict limits.',
    },
    {
      summary:
        'The RTE Act bans physical punishment AND mental harassment in elementary school. It can be raised with the principal, the School Management Committee, or the local education authority, and Childline 1098 is free for any child.',
      question: 'A teacher repeatedly humiliates a student in class. What does the law say?',
      options: [
        'Mental harassment is banned, and it can be raised with school authorities',
        'Teachers may discipline however they like',
      ],
      correctIndex: 0,
      explanation:
        'Yes. Humiliation is not discipline; the law bans it and gives real places to raise it.',
    },
    {
      summary:
        'For children aged 6 to 14, government schools charge no tuition fees and provide free textbooks and uniforms. Money is never meant to be the barrier to elementary education.',
      question: 'What does free elementary education include in a government school?',
      options: [
        'No fees, plus free textbooks and uniforms',
        'Only a small discount on fees',
      ],
      correctIndex: 0,
      explanation: 'Right. Free means free: fees, books, and uniforms.',
    },
  ],
  school_rights_16_18: [
    {
      summary:
        'The RTE guarantee of free and compulsory education covers ages 6 to 14, through elementary school. After 14, education can remain available through government secondary schools, state schemes, and scholarships.',
      question: 'Which ages does the RTE free-and-compulsory guarantee cover?',
      options: ['6 to 14', '6 to 18'],
      correctIndex: 0,
      explanation:
        'Correct. The statutory guarantee runs to 14; school options continue after it.',
    },
    {
      summary:
        'Turning 14 ends only the free-and-compulsory guarantee. Education can remain available through government schools, state schemes, and scholarships, and every under-18 protection continues.',
      question: 'What changes when a student turns 14?',
      options: [
        'Only the RTE guarantee ends. School options and under-18 protections continue.',
        'All rights connected to school end',
      ],
      correctIndex: 0,
      explanation:
        'Yes. One guarantee ends; the doors to education and every protection stay open.',
    },
    {
      summary:
        'The adolescent work protections, no hazardous work, capped hours, no night work, help protect the time, health, and safety a 14 to 18 year old student needs to keep studying.',
      question: 'How does labour law help students aged 14 to 18?',
      options: [
        'Its work limits protect study time, health, and safety',
        'It does not. Work and school are unrelated.',
      ],
      correctIndex: 0,
      explanation:
        'Right. The work limits exist so that work never swallows education.',
    },
    {
      summary:
        'Child protection law covers every person under 18, in any class. Cruelty by an adult in charge is an offence under the Juvenile Justice Act, and POCSO protects against sexual offences at school too.',
      question: 'Who is protected from abusive treatment at school?',
      options: [
        'Every person under 18, in any class',
        'Only students below Class 8',
      ],
      correctIndex: 0,
      explanation:
        'Correct. Protection from cruelty and abuse runs to 18, in every classroom and beyond.',
    },
    {
      summary:
        'A serious school grievance can climb a ladder: teacher, principal, school management, district education authorities, and the child rights commissions (NCPCR/SCPCR). Childline 1098 is available any time along the way.',
      question: 'Where can a secondary student take a serious school grievance?',
      options: [
        'Up the ladder, from the school to education authorities and child rights commissions',
        'Nowhere. Grievances end at 14.',
      ],
      correctIndex: 0,
      explanation: 'Yes. The ladder is real, and 1098 is open at every step.',
    },
  ],
  // ---------------------------------------------------------- zone4
  justice_system_8_11: [
    {
      summary:
        'Childline 1098 is a free phone number just for children. It works day and night, and anyone, a child or a grown-up, can call it to get help for a child.',
      question: 'Which free number can anyone call to help a child?',
      options: ['1098', 'There is no such number'],
      correctIndex: 0,
      explanation: 'Yes! 1098 is free, for every child, day and night.',
    },
    {
      summary:
        'A child who needs help is never in trouble. India\u2019s child helpers, like Childline and the Child Welfare Committee, have one job only: helping children.',
      question: 'Is a child who needs help in trouble?',
      options: ['No, never', 'Yes'],
      correctIndex: 0,
      explanation:
        'Never. The helpers\u2019 only job is to keep children safe, not to punish them.',
    },
    {
      summary:
        'The Child Welfare Committee is a group of kind grown-ups in each district. Their job is keeping children safe, listening to them, and helping find their family or a loving home.',
      question: 'What is the Child Welfare Committee\u2019s job?',
      options: [
        'Keeping children safe and helping them find a loving home',
        'Punishing children',
      ],
      correctIndex: 0,
      explanation:
        'That\u2019s right. The Committee listens to children and looks after them.',
    },
  ],
  justice_system_12_15: [
    {
      summary:
        'The JJ Act requires a child in need of care and protection to be brought before the Child Welfare Committee within 24 hours, not counting travel time. The CWC is child-friendly and exists to protect, not punish.',
      question: 'How fast must a child in need of protection reach the CWC?',
      options: [
        'Within 24 hours, excluding travel time',
        'Within one month',
      ],
      correctIndex: 0,
      explanation:
        'Right. The clock is short on purpose: protection is meant to start fast.',
    },
    {
      summary:
        'The protection system\u2019s front door opens from anywhere. A neighbour, a teacher, any concerned person can call Childline 1098, free and 24/7, and even the child can approach the system directly.',
      question: 'Who can bring a child\u2019s situation into the protection system?',
      options: [
        'Almost anyone, including the child directly',
        'Only a police commissioner',
      ],
      correctIndex: 0,
      explanation:
        'Yes. Anyone who is worried about a child can start the help, including the child.',
    },
    {
      summary:
        'A child can never be kept in a police lockup or jail. While the CWC works out a plan, the child stays somewhere safe: a children\u2019s home or with a trusted adult the committee approves.',
      question: 'Where does a child in need of protection stay in the meantime?',
      options: [
        'Somewhere safe. Never a lockup or jail.',
        'A police lockup',
      ],
      correctIndex: 0,
      explanation: 'Correct. Lockups and jails are absolutely off-limits for children.',
    },
    {
      summary:
        'The law\u2019s ladder is family first: restoring the child to their own family if safe, then foster care, adoption, or sponsorship. An institution is meant to be the last resort, never the default.',
      question: 'What is the system\u2019s first-choice goal for a child?',
      options: [
        'Family first, if it is safe',
        'An institution, always',
      ],
      correctIndex: 0,
      explanation:
        'Yes. Family, with support, comes first; institutions are the last rung.',
    },
  ],
  justice_system_16_18: [
    {
      summary:
        'A child in need of care and protection goes before the district\u2019s Child Welfare Committee within 24 hours, excluding travel time. Children accused of offences go before the Juvenile Justice Board instead.',
      question: 'A child in need of care and protection is routed to...',
      options: [
        'The Child Welfare Committee',
        'A regular criminal court',
      ],
      correctIndex: 0,
      explanation:
        'Correct. CNCP cases belong to the CWC; the child-protection track is separate from any criminal court.',
    },
    {
      summary:
        'A child accused of an offence is handled by specially trained police, the Special Juvenile Police Unit or a child welfare police officer, and then the Juvenile Justice Board: a magistrate plus two social-work members, holding a child-friendly inquiry.',
      question: 'Who deals with a child in conflict with law?',
      options: [
        'The Juvenile Justice Board, reached through specially trained police',
        'The regular adult police-and-jail system',
      ],
      correctIndex: 0,
      explanation:
        'Right. The JJB\u2019s inquiry is built to be child-friendly from the first hour.',
    },
    {
      summary:
        'The JJ Act absolutely prohibits keeping any child in a police lockup or jail. Bail is the norm for children, and a child not released stays in an observation home, a facility for children.',
      question: 'Which of these is absolutely prohibited for any child?',
      options: [
        'Being kept in a police lockup or jail',
        'Being released on bail',
      ],
      correctIndex: 0,
      explanation: 'Yes. No child, in any case, may be lodged in a lockup or jail.',
    },
    {
      summary:
        'The Board\u2019s primary aim is reform and rehabilitation: counselling, community service, probation, education and skills. Publishing a child\u2019s identity is generally prohibited, unless the Board or Court permits disclosure in the child\u2019s own interest.',
      question: 'The Juvenile Justice Board\u2019s primary aim is...',
      options: ['Reform and rehabilitation', 'Maximum punishment'],
      correctIndex: 0,
      explanation:
        'Correct. The Act is built so a child can rebuild, not so a child is broken.',
    },
    {
      summary:
        'For a 16 or 17 year old accused of a heinous offence, the Board first makes a preliminary assessment and may transfer the case to a Children\u2019s Court. Even then, the death penalty and life imprisonment without the possibility of release are absolutely barred for anyone under 18 at the time of the offence.',
      question: 'Can anyone under 18 at the time of the offence face the death penalty?',
      options: [
        'No. It is absolutely barred, along with life without possibility of release.',
        'Yes, for the very worst cases',
      ],
      correctIndex: 0,
      explanation:
        'Right. The transfer route is a narrow exception, and those two outcomes stay barred no matter what.',
    },
  ],
  // ---------------------------------------------------------- zone5
  digital_safety_8_11: [
    {
      summary:
        'Your photo, your school\u2019s name, your address, and your phone number are personal. They are never for people you only know online. When a stranger asks for them, tell a trusted grown-up.',
      question: 'An online-game friend asks for your photo and school name. What do you do?',
      options: [
        'Do not share it, and tell a trusted grown-up',
        'Send it, to be polite',
      ],
      correctIndex: 0,
      explanation:
        'Yes! Personal things stay private, and a trusted grown-up should always know when a stranger asks.',
    },
    {
      summary:
        'Online, anyone can pretend to be anyone. You cannot see who is really typing, so a cute picture and friendly messages prove nothing.',
      question: 'Are people online always who they say they are?',
      options: ['No. Anyone can pretend.', 'Yes, always'],
      correctIndex: 0,
      explanation:
        'Right. That is exactly why personal things stay private from online strangers.',
    },
    {
      summary:
        'That weird, wobbly feeling inside is a helper. When something online feels wrong: stop, do not reply, and tell a trusted grown-up, who can help with the block and report buttons. Childline 1098 is free for any child, day and night.',
      question: 'Something online makes you feel scared or weird. What is the best move?',
      options: [
        'Stop, do not reply, and tell a trusted grown-up',
        'Keep replying so they stay happy',
      ],
      correctIndex: 0,
      explanation:
        'That\u2019s it! Stop, don\u2019t reply, tell. And 1098 is always there.',
    },
  ],
  digital_safety_12_15: [
    {
      summary:
        'Repeatedly targeting and humiliating one person online is cyberbullying. The playbook: never join in or forward, keep screenshots as a record, report and block, tell a trusted adult, and never retaliate publicly.',
      question: 'People are piling on a fake account that mocks one classmate. What do you do?',
      options: [
        'Do not join in. Save screenshots, report and block, and tell a trusted adult.',
        'Post embarrassing photos of the bullies to fight back',
      ],
      correctIndex: 0,
      explanation:
        'Exactly. Support the target, keep records, report. Retaliation only feeds the fire.',
    },
    {
      summary:
        'Flattery, gifts, secrecy demands, and then a photo request form the classic grooming pattern. Never negotiate with it: stop replying, send nothing, block, and tell a trusted adult.',
      question:
        'Weeks of compliments and free game credits, then \u201ckeep it secret\u201d and a photo request. What is this?',
      options: [
        'Grooming red flags. Stop, block, and tell a trusted adult.',
        'Just how online friendship normally works',
      ],
      correctIndex: 0,
      explanation:
        'Right. The pattern is the warning. Stop, block, tell, every time.',
    },
    {
      summary:
        'When someone threatens a child over a photo, the blackmailer is the one committing an offence. It is never the child\u2019s fault, giving in often just leads to more demands, and telling a trusted adult brings the child support and protection, not punishment.',
      question: 'Whose fault is it when a child is blackmailed over a photo they sent?',
      options: [
        'The blackmailer\u2019s. Never the child\u2019s.',
        'The child\u2019s, for sending it',
      ],
      correctIndex: 0,
      explanation:
        'Yes. The law targets the blackmailer, and the child who tells gets help, never blame.',
    },
    {
      summary:
        'Online crime in India can be reported to the Cyber Crime Helpline 155260 and the National Cyber Crime Reporting Portal. Childline 1098 is free for any child, day and night, and in-app report and block tools plus a trusted adult complete the toolkit.',
      question: 'Which of these are real channels for reporting online crime?',
      options: [
        'The Cyber Crime Helpline 155260, the National Cyber Crime Reporting Portal, and Childline 1098',
        'None. The internet is outside the law.',
      ],
      correctIndex: 0,
      explanation:
        'Correct. The channels are real and they exist exactly for this.',
    },
  ],
  digital_safety_16_18: [
    {
      summary:
        'Forwarding IS sharing. Passing on someone\u2019s private image without consent can be an offence under the IT Act, whoever started the chain. And if an image shows someone under 18 in a sexually explicit way, Section 67B can make even transmitting or collecting it an offence.',
      question: 'Is \u201cI only forwarded it\u201d a defence?',
      options: [
        'No. Forwarding without consent can itself be an offence.',
        'Yes. Only the first person to leak it is responsible.',
      ],
      correctIndex: 0,
      explanation:
        'Right. The law does not care where you stood in the chain. Do not forward, do not save; report instead.',
    },
    {
      summary:
        'Consent is specific. Agreeing to share a photo with one person is not consent for it to be shared with others, and no relationship implies consent. Responsibility sits with those who spread it, never with the person whose trust was broken.',
      question: 'Consent to share a photo with one person means...',
      options: [
        'Consent for that one person only, nothing more',
        'Consent for anyone else to see it too',
      ],
      correctIndex: 0,
      explanation:
        'Exactly. Consent given once, to one person, never travels with the image.',
    },
    {
      summary:
        'The IT Rules 2021 require intermediaries to provide a grievance mechanism. For complaints about covered private, nude, sexual, or impersonation or morphed content, the rules require them to remove or disable access within 24 hours of the complaint.',
      question: 'What do the IT Rules 2021 require of online platforms?',
      options: [
        'A grievance mechanism, with a 24-hour removal requirement for covered intimate-image complaints',
        'Nothing. Platforms are outside Indian law.',
      ],
      correctIndex: 0,
      explanation:
        'Correct. That requirement is what gives in-app reporting real legal weight.',
    },
    {
      summary:
        'With blackmail over images: do not pay and do not comply, giving in often leads to further demands. Tell a trusted adult and report: the National Cyber Crime Reporting Portal, the Cyber Crime Helpline 155260, or Childline 1098. POCSO protects anyone under 18.',
      question: 'A blackmailer demands money over someone\u2019s photos. The way through is...',
      options: [
        'Do not comply or pay. Tell a trusted adult and report through the proper channels.',
        'Pay once, so it quietly ends',
      ],
      correctIndex: 0,
      explanation:
        'Yes. Reporting brings support and help responding, and the victim is never the one at fault.',
    },
    {
      summary:
        'Records of harassment mean usernames, links, and screenshots of abusive messages. Never save or forward sexually explicit images of anyone under 18, even \u201cas evidence\u201d. Note where it was posted and report instead.',
      question: 'While keeping records of harassment, what must you never do?',
      options: [
        'Save or forward sexually explicit images of anyone under 18',
        'Note down usernames and links',
      ],
      correctIndex: 0,
      explanation:
        'Correct. Messages, usernames, links: yes. That material: never. Note the location and report.',
    },
  ],

  // ---------------------------------------------------------- zone6: 8-11
  family_shield_8_11: [
    {
      summary:
        'When grown-ups fight or home feels scary, it is never, ever the child\'s fault. Children do not cause grown-up storms — and every child has the right to feel safe at home.',
      question: 'Home feels stormy. Who is to blame?',
      options: ['Not the child — never', 'The child'],
      correctIndex: 0,
      explanation:
        'Exactly. The storms are never your fault. And helpers can always make things calmer.',
    },
    {
      summary:
        'Fun secrets — like surprise gifts — are fine to keep. But a secret that makes you scared or sad inside is too heavy to carry alone. That kind should be told to a trusted adult.',
      question: 'Which secret should you share with a trusted adult?',
      options: ['One that makes you feel scared inside', 'A surprise birthday gift'],
      correctIndex: 0,
      explanation:
        'Yes! Scary secrets go to trusted adults — a teacher, a parent, or Childline 1098. That is brave, not tattling.',
    },
    {
      summary:
        'Childline 1098 is a free phone number for every child in India. It works day and night, and the kind people there know how to help children.',
      question: 'What is Childline 1098?',
      options: ['A free helpline any child can call, any time', 'A number only grown-ups can use'],
      correctIndex: 0,
      explanation:
        'Right! 1098 is free, always open, and made just for children. One call reaches real helpers.',
    },
  ],

  // ---------------------------------------------------------- zone6: 12-15
  family_shield_12_15: [
    {
      summary:
        'The Prohibition of Child Marriage Act, 2006 sets the minimum ages for marriage: 18 for girls and 21 for boys. Below that, it is a child marriage — against the law even if the family agrees.',
      question: 'Before which ages does the law say marriage cannot happen?',
      options: ['18 for girls, 21 for boys', '16 for girls, 18 for boys'],
      correctIndex: 0,
      explanation:
        'Correct. 18 and 21 — so every young person gets to grow, study, and choose their own future first.',
    },
    {
      summary:
        'No child can be forced into marriage. A child being pressured has the right to say no and to ask for help — from Childline 1098, a teacher, or the Child Welfare Committee.',
      question: 'A child being pressured to marry can...',
      options: ['Say no and seek help', 'Do nothing at all'],
      correctIndex: 0,
      explanation:
        'Yes. The right to refuse plus real helpers — that is the shield the law gives every child.',
    },
    {
      summary:
        'Some secrets are too big to keep. When a secret puts someone\'s safety or future at risk, telling a trusted adult or Childline 1098 is protection — not betrayal.',
      question: 'A friend\'s safety is at risk. Keeping their secret is...',
      options: ['Not protecting them — get trusted help', 'The only loyal choice'],
      correctIndex: 0,
      explanation:
        'Exactly. Real loyalty connects a friend to help. 1098 knows how to help without making things worse.',
    },
    {
      summary:
        'In a child marriage, the law punishes the adults who arrange or perform it. The child is never treated as the wrongdoer.',
      question: 'Who can be punished for a child marriage?',
      options: ['The adults who arranged it', 'The child who was married'],
      correctIndex: 0,
      explanation: 'Right. The law is the child\'s shield, never their judge.',
    },
  ],

  // ---------------------------------------------------------- zone6: 16-18
  family_shield_16_18: [
    {
      summary:
        'Under the PCMA, 2006, the minimum marriage ages are 18 for girls and 21 for boys. Below these, it is a child marriage and the adults involved commit an offence.',
      question: 'The PCMA minimum ages are...',
      options: ['18 for girls and 21 for boys', '18 for everyone'],
      correctIndex: 0,
      explanation: 'Correct — 18 and 21. Knowing the exact line makes the law usable.',
    },
    {
      summary:
        'A person married as a child can ask a court to annul that marriage after turning adult, within a set time window. District Legal Services Authorities give free legal aid for this.',
      question: 'What can someone married as a child do later?',
      options: ['Petition a court to annul it, with free legal aid', 'Nothing — it is final'],
      correctIndex: 0,
      explanation:
        'Yes. The law offers a way out: a court petition, free legal help — and in the gravest cases the marriage is void from the start.',
    },
    {
      summary:
        'When a friend says home is not safe: listen, believe them, and never interrogate or investigate. Help them reach Childline 1098 or the CWC at their own pace.',
      question: 'A friend discloses an unsafe home. You should...',
      options: ['Listen, believe, connect them to 1098 or the CWC', 'Demand every detail first'],
      correctIndex: 0,
      explanation:
        'Exactly. Support is listening plus a bridge to trained help — investigation belongs to professionals.',
    },
    {
      summary:
        'The JJ Act, 2015 calls a young person in an unsafe home a \'child in need of care and protection\'. That phrase unlocks the CWC, DCPU, counselling, and a safe place if needed.',
      question: 'In law, a young person whose home is unsafe is...',
      options: ['A child in need of care and protection', 'A troublemaker'],
      correctIndex: 0,
      explanation:
        'Right. The law\'s own words open the whole support system — an unsafe home is never a private shame.',
    },
  ],
};

/**
 * Recap for one quiz question of one quest, or null if none exists.
 * Task 10: pass language 'hi' for the hand-written Hindi mirror (falls
 * back to English only if a Hindi item is missing — the smoke test
 * enforces 1:1 parity so this fallback should never fire in practice).
 */
export function getRecap(
  questId: string,
  questionIndex: number,
  language: 'en' | 'hi' = 'en',
): RecapItem | null {
  if (language === 'hi') {
    return RECAPS_HI[questId]?.[questionIndex] ?? RECAPS[questId]?.[questionIndex] ?? null;
  }
  return RECAPS[questId]?.[questionIndex] ?? null;
}
