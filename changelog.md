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
