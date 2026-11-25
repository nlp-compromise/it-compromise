### Unreleased

- **[breaking]** - `nlp.TypedPlugin` type is removed
- **[change]** - typescript types rewritten from the real api - core `View` types now come from `compromise`, and the document type is `ItView`
- **[new]** - types for `nlp.fromSpec()`, `nlp.testSpec()` and `nlp.compile()`
- **[change]** - remove `nlp.lazy()` from types and docs - it lives in a plugin now
- **[new]** - `.contractions().expand()` writes elisions out in full - "c'è" → 'ci è', "l'uomo" → 'lo uomo'
- **[fix]** - `.nouns().toSingular()` no longer over-converts - 'mele' → 'mela' (was 'melm')
- **[fix]** - feminine nouns pluralise properly - 'ragazza' → 'ragazze' (was 'ragazzi'), 'banca' → 'banche', 'arancia' → 'arance' - and come back with `.toSingular()`
- **[fix]** - irregular and invariable noun plurals - 'uovo' → 'uova', 'film' → 'film', 'crisi' → 'crisi' - and singular '-e' nouns ('lo studente', 'la lezione') are no longer tagged `#PluralNoun`
- **[fix]** - `.nouns().toSingular()` finds the singular of an '-i' plural from the words it knows, then its ending, then its article - 'i giovani' → 'giovane' (was 'giovano'), 'le attrici' → 'attrice', 'i pirati' → 'pirata', 'i popoli' → 'popolo'
- **[fix]** - the noun of an elision inflects - `nlp("l'amica").nouns().conjugate()` (was empty), and `.toPlural()` gives "l'amiche" (was 'lo amichi') - and takes its gender from the noun, not from the l'
- **[fix]** - an '-e' ending does not make a noun `#FemaleNoun` - 'ogni giovane', 'ogni fiume' - unless it is a plural ('due mele') - and a bare 'poeta', 'clima' or "l'atleta" is `#MaleNoun`
- **[fix]** - more noun plurals - 'studio' → 'studi' (was 'studios'), 'dominio' → 'domini' (was 'dominii'), 'mago' → 'maghi', 'nostalgia' → 'nostalgie', 'la collega' → 'colleghe', 'orecchio' → 'orecchie', 'grido' → 'grida', 'mille' → 'mila' - and 'delta', 'bici', 'brindisi', 'eclissi' never change
- **[fix]** - an adjective after a determiner, with no noun after it, is tagged as the `#Noun` - 'i medici', 'un italiano', 'i ricchi e i poveri' - but not in 'i giovani studenti'
- **[fix]** - `.numbers().set()`, `.add()` and `.subtract()` accept a written number - `.add('due')` - and ignore a string that isn't one
- **[fix]** - `.numbers().json(n)` returns the nth number, instead of throwing
- **[fix]** - `.numbers().get()` and `.parse()` return `[]` when there are no numbers
- **[fix]** - `.verbs().parse()` returns `[]` when there are no verbs
- **[change]** - remove the undefined `.verbs().toPast()`, `.toPresent()` and `.toFuture()` aliases
- **[change]** - minimum node version is 18
- **[update]** - tests moved to `tests/unit`, `tests/types`, `tests/_hmm` and `tests/_backlog`
- **[update]** - suffix-thumb 6.1.0

### 0.3.2 [Nov 2026]

- **[update]** - smaller suffix-thumb format
- **[new]** - support localized tag names
- **[update]** - dependencies

### 0.3.1 [Sep 2026]

- **[change]** - add typescript types

### 0.3.0 [July 2026]

- **[fix]** - lexicon build no longer lets later word-lists silently overwrite earlier tags (217 collisions - 'sei' was tagged as the number six, 'mia'/'sue' as English names, 'lei' as a currency, 'potere' lost its infinitive)
- **[fix]** - restore past-participle model data - it had been replaced with present-participle forms, so no '-ato' form was generated anywhere
- **[fix]** - feminine noun pluralization ('casa' pluralized to 'casi' instead of 'case') - rebalanced training data, fixed the masculine-only morph-it/conllu harvester bugs
- **[new]** - irregular verb tables generated from wiktionary (verbs.jsonl) - 37 full paradigms + 313 irregular participles ('essere'→'stato', 'bere'→'berrò', 'visto'→'vedere', 'fossi' matches {essere})
- **[new]** - imperfect + imperfect-subjunctive handling in conjugation, lemmatization and {root} matching ('giocavano'→'giocare')
- **[new]** - female-plural adjective model ('meraviglioso'→'meravigliose', was 'meravigliosi')
- **[update]** - ~180 missing core words added to lexicon (questo/quello paradigms, ogni, qualche, cui, chi, ciò, sé, anno, giorno, donne, pizza..)
- **[update]** - tagger rules: auxiliary detection for essere/avere/stare + modals, article→noun rescue for all articles & preposition contractions, reflexive clitics stay pronouns, passive-participle detection, participle gender/number agreement forms in lexicon
- **[fix]** - 'sonoero' typo in essere-auxiliary match, '-ava'/'-esse' suffixes no longer tagged Imperative, '-otto' suffix no longer tags 'prodotto' as a number
- **[update]** - tokenizer: c'era/c'erano, d'→di, quest', quell', mezz', sant', tutt', anch', senz' elisions; consistent l' handling
- **[fix]** - 'primo' and 'miliardo' number parsing
- **[fix]** - fake infinitives removed from lexicon ('pizzare' was tagging 'la pizza' as a verb), 50 real wiktionary verbs added
- **[fix]** - test-suite golds that encoded wrong Italian (insalata→insalate, salsiccia→salsicce, che as Conjunction); suite green at 1,089 passing (was 50 failing)
- **[update]** - corpus tagger accuracy 72% → 76%

### 0.2.1

- **[fix]** - conjugation fixes
- **[fix]** - support infinitive reflexive verbs
- **[update]** - contraction support
- **[fix]** - .toNumber() fix

### 0.2.0

- **[update]** - conditional, imperfect, subjunctive & presentParticiple verb forms
- **[fix]** - tagger updates

### 0.0.6

- **[fix]** - toRoot improvements

### 0.0.2

- **[new]** - number parsing

### 0.0.3

- **[fix]** - client-side window name
