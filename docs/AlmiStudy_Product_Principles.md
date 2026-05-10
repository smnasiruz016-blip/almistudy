# AlmiStudy — Product Principles v1.0

**Status:** Operative spec. Cite sections by number when making product decisions.
**Last revised:** 2026-05-10
**Audience:** Future contributors (human and AI) working on AlmiStudy.

---

## Preamble

AlmiStudy is part of the AlmiWorld product family. The AlmiWorld doctrine is built on one foundational commitment: **build for the people the market makes invisible** — Filipino, Pakistani, Indian, and Bangladeshi migrants moving to the Gulf, UK, Canada, and Australia, plus the long tail of similar migration corridors that mainstream tools ignore.

AlmiStudy's job inside that family is to help these users find legitimate universities offering programs that will actually advance their migration goals — credentials that destination-country regulatory bodies will recognize. That is the entire promise. Everything in this document follows from honoring that promise without drift.

The migrants who use AlmiStudy are typically working full-time and paying for education out of their own savings. Many have already been deceived by diploma mills, fraudulent agents, or schools that misrepresented their accreditation. AlmiStudy exists because they deserve better than the discovery tools currently available to them.

---

## §1 — Foundational identity

### §1.1 — AlmiStudy is a university directory.

AlmiStudy is a curated, country-and-program-organized directory of universities offering degrees and certifications. Each university is listed with the program details, accreditation status, language of instruction, tuition, time commitment, and recognition by destination-country regulatory bodies where applicable.

A user looking for nursing programs in the UK comes to AlmiStudy, finds the universities offering nursing degrees, and sees clearly which are recognized by NMC UK for registered nurse licensure, what the tuition costs, and whether distance learning is available. That is the navigation AlmiStudy provides.

### §1.2 — AlmiStudy serves working migrants seeking credentials.

The reader is specific. Filipino nurses upgrading from Diploma to BScN to qualify for UK NHS work. Pakistani engineers doing online Master's degrees to qualify for Canadian Permanent Residency points. Indian doctors pursuing certifications recognized by Saudi Arabia's healthcare licensing system. Bangladeshi accountants doing CPA equivalence programs for Australian recognition.

This audience is **not** the typical "study abroad" reader (18-year-old considering full-time on-campus university experience). They are working adults, paying out-of-pocket, often with limited time, who need credentials that actually transfer across borders.

Every product decision asks: "Does this help a working migrant make a credential decision honestly, or does this help universities recruit fee-paying international students?" If the answer is the latter, AlmiStudy does not do it.

This rules out: featured university placements, sponsored content, pay-for-position, recruitment partnerships with universities or agents, agent-affiliate programs.

### §1.3 — Doctrinal voice.

AlmiStudy writes plainly. No motivational verbs (discover, unlock, dream, transform, empower, journey, aspire). No urgency manipulation (now, today, limited time, last chance). No "study abroad of your dreams" rhetoric. No false friendliness. Migrants are adults making consequential, often expensive decisions; we treat them as such.

---

## §2 — What AlmiStudy does (and how)

### §2.1 — The directory itself.

AlmiStudy organizes universities by:
- **Country** (where the university is)
- **Program / field** (medicine, nursing, engineering, business, IT, education, trades certifications, etc.)
- **Sub-specialty** when relevant (BScN vs MSN; civil engineering vs electrical; MBA vs specialized Master's)

Each entry includes:
- University name and location (city, country)
- Program offered (degree, certification, level)
- Tuition (in native currency + USD reference, with date of last review)
- Language of instruction
- Time commitment (full-time / part-time / distance / hybrid)
- Accreditation body and verification link
- Recognition by destination-country regulatory bodies (where confirmed)
- Whether distance/online learning is available
- Public/private status
- Last reviewed date

### §2.2 — How universities get into the directory.

Curated, not crowdsourced. Each entry is added by the AlmiStudy editorial team (currently the founder, eventually expanding) based on:
- Verified accreditation by a recognized national or international body
- Real evidence the program runs (not just theoretically advertised)
- Public reputation
- Relevance to working-migrant credentialing pathways
- No payment in exchange for inclusion

### §2.3 — Tuition transparency.

Tuition is shown in the university's native currency and converted to USD as a reference point. Both numbers are visible. The exchange rate date and last review date are stated explicitly.

When a university's program has multiple tuition tiers (domestic vs international, full-time vs distance), all are shown clearly. Fee structures with hidden costs (mandatory housing, "facilities fees", insurance) are surfaced when known.

### §2.4 — Time commitment honesty.

Each program entry states realistic time commitment for working students:
- Full-time on-campus, requires relocation
- Part-time on-campus, evening/weekend possible
- Distance/online, full asynchronous
- Hybrid (specify on-campus residency requirements)

Programs that advertise "online" but require unstated on-campus periods (residencies, exams, in-person practicums) get this surfaced explicitly.

### §2.5 — Language of instruction.

Each program states the actual language(s) of instruction. For non-English programs, AlmiStudy notes whether English-medium options exist and whether language proficiency tests (IELTS, TOEFL, German Goethe, etc.) are required for admission.

When language requirements differ for international applicants vs. domestic, both are stated.

---

## §3 — Honest claims and labeling

### §3.1 — Hard rule: only verified-accreditation institutions.

This is the most important principle in this document.

AlmiStudy lists ONLY universities and institutions with verifiable accreditation by a recognized national or international accrediting body. There are no exceptions. There are no "list with caveats" entries for institutions whose accreditation cannot be verified.

Acceptable evidence of accreditation:
- National education ministries (HEC Pakistan, UGC India, CHED Philippines, MOE various countries)
- National accreditation councils (CHEA US, NCAAA Saudi Arabia, TEQSA Australia, QAA UK, AAQ Switzerland, etc.)
- Recognized international bodies (ENQA, INQAAHE)
- Subject-specific professional accreditation (ABET for engineering, ACEN for nursing US, AACSB for business, LCME for medical, etc.)

When listing a university, AlmiStudy:
- States which body accredits it
- Links to the public registry where the user can verify the accreditation independently
- Does not vouch for the accreditation beyond what the public registry says

### §3.2 — Hard exclusion list: known diploma mills.

Schools appearing on official diploma-mill warning lists are never listed in AlmiStudy. The exclusion is not "list with caveats" — it is full exclusion.

Reference exclusion lists:
- US Department of Education's database of accreditation status flags
- CHEA's database for unaccredited US-based institutions
- Oregon Office of Degree Authorization's list of unaccredited institutions
- Government education-ministry warnings from any country
- Any school formally identified as fraudulent by the relevant regulatory authority

When AlmiStudy receives a request to list a school whose accreditation status is in transition, mid-application, or pending recognition: AlmiStudy waits to list it until status is confirmed. Honest absence beats dishonest listing.

### §3.3 — Recognition by destination-country regulators.

For programs where credential transferability matters (medicine, nursing, engineering, accounting, teaching, law), AlmiStudy surfaces recognition information per destination country.

Examples:
- A BScN at Aga Khan University → recognized by NMC UK for registered nurse licensure (link to NMC's recognized international qualifications list)
- An MBBS at AIIMS New Delhi → recognized by GMC UK; not directly recognized by USMLE without ECFMG certification
- A Bachelor of Engineering at COMSATS Pakistan → recognized by Pakistan Engineering Council; transferability to Engineers Canada CEAB requires ESF assessment

When recognition status is unknown or unverified, AlmiStudy says so explicitly: "Recognition status not verified. Confirm with the destination country's regulatory body before applying."

When recognition is partial or conditional (often for healthcare and engineering across borders), AlmiStudy describes the conditions plainly.

### §3.4 — Honest about coverage gaps.

If AlmiStudy has not yet reviewed enough universities for a particular country/program combination, the page for that combination says so plainly:

"We've reviewed 4 verified-accreditation universities for nursing programs in Pakistan. We're working on expanding coverage."

Better than pretending to have full coverage when we don't.

### §3.5 — Honest about what AlmiStudy can't protect users from.

Once a user clicks through from AlmiStudy to a university's website to apply, they are interacting with that university's admissions process, payment systems, and policies. AlmiStudy's responsibility ends at "we listed an accredited institution that posts the program you searched for."

We say this plainly. We do not pretend AlmiStudy can prevent:
- Application fee fraud
- Tuition payment scams
- Misrepresentation by university agents/recruiters
- Changes in program quality or accreditation status after listing
- Visa rejections by destination countries

We can warn about known patterns; we cannot prevent harm we cannot see.

---

## §4 — User experience principles

### §4.1 — No account required to browse.

AlmiStudy's entire directory is browsable without creating an account or providing any personal information. Country navigation, program comparisons, accreditation lookups — all work without sign-up.

### §4.2 — No CV upload, no application brokering.

AlmiStudy does not collect CVs, transcripts, or application documents. AlmiStudy is not a university application service. AlmiStudy does not forward applications to universities. Users go to the university's own application system directly.

This is doctrinally important and practically simple: AlmiStudy is information, not transaction. The transaction (application, payment, enrollment) happens between the user and the university, with AlmiStudy not in the middle.

### §4.3 — No data sales, no marketing partnerships with universities or agents.

AlmiStudy does not sell user data. AlmiStudy does not partner with university recruitment agents who pay commissions per applicant. AlmiStudy does not enter into "preferred partner" agreements that compromise editorial integrity.

The revenue model is AdSense (display advertising on info pages, with no ad influence on directory ordering or listing decisions). This is the only monetization path approved in v1.

---

## §5 — How AlmiStudy speaks to users

### §5.1 — Plain, useful, calm.

AlmiStudy's tone is the tone of a knowledgeable older relative who knows the credential landscape and is helping you navigate it. Not a salesman. Not a study-abroad agent. Not a university recruiter pretending to be your friend. Calm, informative, honest about what's known and unknown.

### §5.2 — Write to the actual reader.

The reader is a Filipino nurse considering a UK BScN top-up program. A Pakistani engineer deciding between Australian, UK, and German Master's options. A Bangladeshi doctor evaluating credentials for the Saudi healthcare licensing track. The copy is written for those readers, in language and frames they will recognize.

Not generic university marketing copy. Not "build your future at our world-class campus." Practical, specific, decision-helping language.

### §5.3 — Honest about what we don't know.

If AlmiStudy's data on a particular country, program, or recognition status is thin, the copy says so. If a recognition pathway is unclear, that's surfaced. Pretending to have answers we don't have erodes trust slowly until users notice — and they always notice.

### §5.4 — No false reassurance about credential transferability.

When a program's recognition by a destination country is uncertain, AlmiStudy does not soften the uncertainty with "should be recognized" or "likely accepted" language. Either it is verifiably recognized (with link to the registry), or recognition is unverified (with that stated plainly), or it is known not to be recognized (with that stated plainly).

The user's decision to spend years and savings on a credential is too consequential for euphemistic language.

---

## §6 — The AlmiWorld family relationship

### §6.1 — AlmiStudy is part of a family.

AlmiCV (CV builder), AlmiSalary (salary intelligence), AlmiJob (recruitment directory), AlmiStudy (university directory), and the AlmiWorld eBooks library work together as one ecosystem for the same audience. A nurse using AlmiStudy to find a UK BScN program may reasonably also need AlmiCV to build the application CV, AlmiSalary to know what UK nurses earn, and AlmiJob to find UK recruitment sites once qualified.

### §6.2 — Cross-product CTAs are at natural transition points.

When a user has consumed the value AlmiStudy is offering on a particular page (e.g., they've reviewed UK BScN programs), a CTA pointing to a related AlmiWorld product is appropriate IF it reflects the next step the user is likely thinking about anyway.

Example, on a nursing-UK university listing page after the directory:
"Building your application CV next? AlmiCV has free templates designed for healthcare workers applying internationally."
"Wondering what UK nurses actually earn? AlmiSalary has salary ranges for nursing roles in the UK."

What this is NOT: an interruption modal, an autoplaying video, an aggressive popup, a dismiss-required interstitial. The CTA appears below the value, not over it.

### §6.3 — One product, one promise.

Each AlmiWorld product makes one promise. AlmiStudy's promise: "We help you find legitimate universities offering programs that will advance your credentialing goals." Not "we'll get you admitted." Not "we'll handle your visa." Not "we'll connect you with agents." One promise, kept well, beats five promises kept poorly.

---

## §7 — Hard boundaries (what AlmiStudy will never become)

### §7.1 — AlmiStudy will not become a university recruitment agency.

No recruitment agency operations. No taking university money to surface programs. No managing the application funnel for any institution. These businesses exist and are well-served by other companies; AlmiStudy's lane is different and smaller.

### §7.2 — AlmiStudy will not become a paid placement service.

Users do not pay AlmiStudy to be placed in programs. Universities do not pay AlmiStudy to be placed in front of applicants. No money flows in either direction in exchange for matching. AlmiStudy is a directory, not a marketplace.

### §7.3 — AlmiStudy will not list unaccredited institutions.

Per §3.1 and §3.2: hard rule. No listings of institutions without verified accreditation, no listings of institutions on diploma-mill warning lists, no exceptions for institutions in pending or transitional accreditation. Listing such schools, even with caveats, would harm exactly the audience AlmiStudy is built to serve.

### §7.4 — AlmiStudy will not become an agent affiliate marketing platform.

University recruitment agents who pay per-applicant commissions are a real industry. They are a misaligned-incentive industry. AlmiStudy never enters affiliate-style partnerships, no matter how lucrative or operationally simple they appear to make the product.

### §7.5 — AlmiStudy will not collect or broker user application data.

Per §4.2: no CV uploads, no transcript collection, no application document handling. The boundary between "directory" and "application service" is the boundary between AlmiStudy as it should be and a different product entirely.

### §7.6 — Hard test: "Who pays for this feature?"

Every proposed feature gets the gut-check: who pays, in money or attention, for this to exist? If the answer is "universities / agents / paid advertisers in education," the feature is in conflict with §1.2 and probably should not exist. If the answer is "users (free use) / AdSense advertisers (with no influence on directory ordering or accreditation decisions)," the feature can be evaluated on its merits.

---

## §8 — Data integrity

### §8.1 — Accreditation status is re-verified at least annually.

Schools change. Accreditation can be revoked, programs can lose recognition, universities can close. AlmiStudy commits to re-verifying every listed school's accreditation status at least once per year.

When accreditation lapses or is revoked, the school is removed from the directory immediately. A holding page redirects from the previous URL with a brief honest explanation: "This program's accreditation status has changed. We've removed the listing while we re-verify."

### §8.2 — Tuition and fee data carries a "last reviewed" date.

Tuition changes. Currency exchange rates change. AlmiStudy displays a "last reviewed" date on every tuition figure so users know how fresh the data is.

When data is older than 18 months, the display is visually flagged as stale and the user is encouraged to verify directly with the institution.

### §8.3 — Recognition data sources are cited.

When AlmiStudy surfaces destination-country recognition info (per §3.3), the source is cited and linked. Examples: NMC's published list of recognized BScN programs, CEAB's accredited engineering programs registry, ECFMG's list of medical schools.

---

## §9 — Founder's promise

This document is the operative spec. When future contributors (human or AI) make AlmiStudy product decisions, they cite sections by number and apply the principles literally. The doc is amended explicitly when reality changes; it is not silently bent when convenient.

If a feature being considered cannot be reconciled with this doc, either the feature changes or the doc is amended through a clear explicit revision (v1.1, v2.0, etc.) with the change documented. Drift without amendment is the failure mode this document exists to prevent.

The migrants who use AlmiStudy deserve a tool built honestly, with no diploma-mill clutter, no hidden agent-affiliate fees, no false reassurance about credentials that won't actually transfer. They are spending years and savings on these decisions. This document is the contract.

---

*v1.0 — initial doctrine for AlmiStudy, drafted 2026-05-10 after foundational decisions: university directory by country/program, audience is working migrants seeking academic credentials, free + AdSense, subdomain almistudy.almiworld.com, URL pattern /universities/{country}/{program}, hard rule against unaccredited institutions, recognition data per destination country, foundation data is the 158-university seed dataset.*
