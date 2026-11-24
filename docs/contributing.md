# Contribuire

Questa libreria è ancora in fase di sviluppo, e dipende dall'aiuto sia di sviluppatori sia di persone che parlano italiano.

Non serve saper programmare per aiutare. Segnalarci una parola con il tag sbagliato, in una [issue](https://github.com/nlp-compromise/it-compromise/issues), è un contributo utile. Puoi scriverla in italiano o in inglese.

Tutte le pull request sono benvenute, e vengono esaminate in tempi brevi. Questa libreria è open source, con licenza MIT.

### Installazione

Crea un fork personale del repository su GitHub, poi:

```bash
git clone git@github.com:{IL_TUO_UTENTE}/it-compromise.git
cd it-compromise
pnpm install
pnpm test
```

Questo progetto usa [pnpm](https://pnpm.io/). Funzionano anche `npm install` e `npm test`.

### Fare una modifica

- `./src` contiene il codice. È diviso in `01-one` (divisione in parole), `02-two` (assegnazione dei tag) e `03-three` (le selezioni come `.verbs()`).
- `./data` contiene le liste di parole e i modelli. Sono compressi, quindi esegui `pnpm run pack` dopo averli modificati per vedere il risultato.
- `./tests` contiene i test. Per favore aggiungi un test per la tua modifica.
- `./scratch.js` è un file per fare delle prove. `pnpm run watch` lo riesegue a ogni salvataggio.

Per vedere quali tag ha ricevuto una frase, usa `.debug()`:

```js
nlp('Lei vende conchiglie sulla spiaggia.').debug()
```

### Inviare una pull request

Per favore lavora a partire dal branch `dev`, e invia lì la tua pull request.

Se la modifica è grande, per favore apri prima una issue, così possiamo parlarne.
