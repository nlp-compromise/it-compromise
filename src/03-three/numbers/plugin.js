import api from './api.js'

export default {
  api,
  // the shared european-numbers plugin reads '1.234,56' - these are our ordinals: '2ª', '3°'
  model: {
    two: {
      europeanNumbers: {
        ordinal: '\\.?[ºª°]',
        // the words beside a number - '50 %', '5,30 €'
        percent: ['per cento', 'percento'],
        currencies: ['euro', 'dollaro', 'dollari', 'sterlina', 'sterline', 'franco', 'franchi', 'lira', 'lire'],
      },
    },
  },
}
