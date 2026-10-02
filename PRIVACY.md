# Privacy policy

Last updated 2 October 2026.

This is a plain-language description of what Lantern
(https://lantern.study) actually stores and who it talks to. It is
a personal, non-commercial project. This is not legal advice and has not been
reviewed by a lawyer.

## What is stored

**Your account.** When you sign in with GitHub or Google, we receive your email
address and display name from that provider. We never see your password for it.
When you sign in with email, we receive only the address you enter. There are no
passwords on Lantern at all: each email sign-in uses a one-time code that
expires after a few minutes.

**Your study progress.** Review scheduling for your cards, which decks you have,
which articles you have read, which series you track, and your drill settings.

**Content you generate.** Stories you create are **private to your account** and
are not visible to other users. A small number are hand-picked as public
examples; nothing of yours becomes an example unless it is deliberately marked.

**AI usage counts.** A per-day tally of how many times you used each AI feature.
This is a number only — the text of what you generated is not kept alongside it.

**An Anthropic API key, if you choose to add one.** It is encrypted before being
stored, and it is never readable by the app in your browser — not even by you.
Only its last four characters are ever shown back.

## What is not done

There is no advertising, no third-party analytics, no tracking pixels, and no
selling or sharing of your data with anyone for marketing. Sign-in emails carry
no tracking: nobody records whether you opened them or clicked a link.

Lantern sets no cookies. Your browser's local storage holds only what the app
needs to work: your sign-in session, your settings and study progress (a copy
for speed when signed in, or the only copy when you're not), and which sign-in
method you last used on that device, so it can be offered first next time.

## Who else sees your data

**Supabase** hosts the database, authentication, and file storage.

**Anthropic** receives the text you submit to AI features — the vocabulary list
used to generate a story, an answer you are having graded, or a photo you upload
for word extraction. If you supply your own API key, those requests are billed to
your own Anthropic account and are subject to Anthropic's terms rather than ours.

**GitHub or Google** handle sign-in only, and learn nothing about how you use the
app afterwards.

**Resend** delivers sign-in emails. It receives your email address and the
email's contents (a one-time code and sign-in link), and keeps delivery logs
for a limited time under its own retention policy.

**Cloudflare Turnstile** checks that a person, not a bot, is asking for a
sign-in email, so the form can't be used to send email to strangers. It loads
only when you open the sign-in dialog, and Cloudflare processes information
about your browser and device to make that check. Most people never see it.

**Jiten** is queried for anime vocabulary lists. No personal information is sent.

Dictionary, kanji, and example-sentence data comes from open datasets (JMdict,
KANJIDIC2, the Tanaka Corpus) that are bundled or stored locally. Looking a word
up sends nothing to their maintainers.

## Where your data is processed

Lantern is run from Japan. The services above are based in, and process data
in, the United States and other countries whose privacy laws differ from
Japan's. Using the app means your data is handled there, by those providers,
only for the purposes described above.

## Your controls

**Export.** From your account page you can download everything tied to your
account as a JSON file, and export your cards as an Anki-compatible file.

**Deletion.** Deleting your account permanently removes your progress, decks,
stories, usage counts, and stored API key. It cannot be undone, and there is no
backup from which it can be restored. If you would rather it be done for you,
email **hello@lantern.study**.

**Retention.** Data is kept until you delete your account.

## Changes to this policy

This is a small, personal project maintained by one person. If this policy
changes, the updated version will be posted here with a new "last updated" date.

## Contact

Questions about this policy or your data: **hello@lantern.study**, or raise
an issue on the project's GitHub repository. Using the app is also subject to
the [Terms of Service](#/terms).
