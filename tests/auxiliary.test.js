import test from 'tape'
import nlp from './_lib.js'
let here = '[aux] '


let irreg = {
  //essere (to be; auxiliary)
  'essere': ['sono', 'ero', 'fui', 'sarò', 'sia', 'fossi', 'sarei'],
  'essere': ['sei', 'eri', 'fosti', 'sarai', 'sia', 'fossi', 'saresti'],
  'essere': ['è', 'era', 'fu', 'sarà', 'sia', 'fosse', 'sarebbe'],
  'essere': ['siamo', 'eravamo', 'fummo', 'saremo', 'siamo', 'fossimo', 'saremmo'],
  'essere': ['siete', 'eravate', 'foste', 'sarete', 'siate', 'foste', 'sareste'],
  'essere': ['sono', 'erano', 'furono', 'saranno', 'siano', 'fossero', 'sarebbero'],

  //stare (to stay; auxiliary)
  'stare': ['sto', 'stavo', 'stetti', 'starò', 'stia', 'stessi', 'starei'],
  'stare': ['stai', 'stavi', 'stesti', 'starai', 'stia', 'stessi', 'staresti'],
  'stare': ['sta', 'stava', 'stette', 'starà', 'stia', 'stesse', 'starebbe'],
  'stare': ['stiamo', 'stavamo', 'stemmo', 'staremo', 'stiamo', 'stessimo', 'staremmo'],
  'stare': ['state', 'stavate', 'steste', 'starete', 'stiate', 'steste', 'stareste'],
  'stare': ['stanno', 'stavano', 'stettero', 'staranno', 'stiano', 'stessero', 'starebbero'],

  //avere (to have; auxiliary)
  'avere': ['ho', 'avevo', 'ebbi', 'avrò', 'abbia', 'avessi', 'avrei'],
  'avere': ['hai', 'avevi', 'avesti', 'avrai', 'abbia', 'avessi', 'avresti'],
  'avere': ['ha', 'aveva', 'ebbe', 'avrà', 'abbia', 'avesse', 'avrebbe'],
  'avere': ['abbiamo', 'avevamo', 'avemmo', 'avremo', 'abbiamo', 'avessimo', 'avremmo'],
  'avere': ['avete', 'avevate', 'aveste', 'avrete', 'abbiate', 'aveste', 'avreste'],
  'avere': ['hanno', 'avevano', 'ebbero', 'avranno', 'abbiano', 'avessero', 'avrebbero'],

  //dovere (to have to, must, should; modal)
  'dovere': ['devo', 'dovevo', 'dovetti', 'dovrò', 'debba', 'dovessi', 'dovrei'],
  'dovere': ['devi', 'dovevi', 'dovesti', 'dovrai', 'debba', 'dovessi', 'dovresti'],
  'dovere': ['deve', 'doveva', 'dovette', 'dovrà', 'debba', 'dovesse', 'dovrebbe'],
  'dovere': ['dobbiamo', 'dovevamo', 'dovemmo', 'dovremo', 'dobbiamo', 'dovessimo', 'dovremmo'],
  'dovere': ['dovete', 'dovevate', 'doveste', 'dovrete', 'dobbiate', 'doveste', 'dovreste'],
  'dovere': ['devono', 'dovevano', 'dovettero', 'dovranno', 'debbano', 'dovessero', 'dovrebbero'],

  //potere (to be able to, can, could; modal)
  'potere': ['posso', 'potevo', 'potei', 'potrò', 'possa', 'potessi', 'potrei'],
  'potere': ['puoi', 'potevi', 'potesti', 'potrai', 'possa', 'potessi', 'potresti'],
  'potere': ['può', 'poteva', 'poté', 'potrà', 'possa', 'potesse', 'potrebbe'],
  'potere': ['possiamo', 'potevamo', 'potemmo', 'potremo', 'possiamo', 'potessimo', 'potremmo'],
  'potere': ['potete', 'potevate', 'poteste', 'potrete', 'possiate', 'poteste', 'potreste'],
  'potere': ['possono', 'potevano', 'poterono', 'potranno', 'possano', 'potessero', 'potrebbero'],

  // volere (to want, will, would); modal)
  'volere': ['voglio', 'volevo', 'volli', 'vorrò', 'voglia', 'volessi', 'vorrei'],
  'volere': ['vuoi', 'volevi', 'volesti', 'vorrai', 'voglia', 'volessi', 'vorresti'],
  'volere': ['vuole', 'voleva', 'volle', 'vorrà', 'voglia', 'volesse', 'vorrebbe'],
  'volere': ['vogliamo', 'volevamo', 'volemmo', 'vorremo', 'vogliamo', 'volessimo', 'vorremmo'],
  'volere': ['volete', 'volevate', 'voleste', 'vorrete', 'vogliate', 'voleste', 'vorreste'],
  'volere': ['vogliono', 'volevano', 'vollero', 'vorranno', 'vogliano', 'volessero', 'vorrebbero'],

  // sapere (to be able to)
  'sapere': ['so', 'sapevo', 'seppi', 'saprò', 'sappia', 'sapessi', 'saprei'],
  'sapere': ['sai', 'sapevi', 'sapesti', 'saprai', 'sappia', 'sapessi', 'sapresti'],
  'sapere': ['sa', 'sapeva', 'seppe', 'saprà', 'sappia', 'sapesse', 'saprebbe'],
  'sapere': ['sappiamo', 'sapevamo', 'sapemmo', 'sapremo', 'sappiamo', 'sapessimo', 'sapremmo'],
  'sapere': ['sapete', 'sapevate', 'sapeste', 'saprete', 'sappiate', 'sapeste', 'sapreste'],
  'sapere': ['sanno', 'sapevano', 'seppero', 'sapranno', 'sappiano', 'sapessero', 'saprebbero'],
}

test('irreg-root:', function (t) {
  Object.keys(irreg).forEach(k => {
    irreg[k].forEach(str => {
      let doc = nlp(str)
      t.ok(doc.has(`{${k}}`), here + ' ' + str)
    })
  })
  t.end()
})