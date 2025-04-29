const termin_skauti = 'Skauti a skautky 29.6. - 11.7. (celé 2 týždne)';
const termin_rr = 'Rangeri a roveri 11.7. - 14.7.';
const termin_predvoj = 'Predvoj 27.-28.6  (po dohode s vodcom)';
const termin_vav = 'Včielky, vĺčatá, rodinky, Smolenice 14.7. - 19.7.';

const oddiel_vlcata = '1. voj vĺčat';
const oddiel_vcely = '1. roj včielok Malé ženy';
const oddiel_skautky = '2. oddiel skautiek Čunkšipi čokan';
const oddiel_skauti = '1. oddiel skautov brata Runca - Strieborného vlka';
const oddiel_rr = '1. rangersko-roverský oddiel Rangeroveri';
const oddiel_dar = '2. oddiel dospelých a rodín Dinosauri';
const oddiel_smolenice = '3. oddiel skautov Smolenice';

function calculate_payment(oddiely, terminy, veky, originalPocet) {
  let sum = 0;
  if (terminy.length != veky.length) {
    throw new Error('The terminy and veky parameters must match in length!');
  }

  let pocet = originalPocet;  // <<< TU meníme! Berieme pôvodný počet prihlásených

  // Flags to detect special combination
  let hasSkauti = false;
  let hasRangeri = false;

  // calculate sum
  for (let i = 0; i < terminy.length; i++) {
    // detect if both Skauti and Rangeri are present
    for (const termin of terminy[i]) {
      if (termin === termin_skauti) {
        hasSkauti = true;
      }
      if (termin === termin_rr) {
        hasRangeri = true;
      }
    }

    for (const termin of terminy[i]) {
      Logger.log(`Checking term: '${termin}'`);

      switch (termin) {
        case termin_predvoj:
          sum += 15;
          break;

        case termin_skauti:
          if (hasRangeri)
            break;

          sum += 140 - 10 * (pocet - 1);
          pocet--;
          break;

        case termin_rr:
          if (hasSkauti)
            break;

          sum += 25;
          break;

        case termin_vav:
          switch (oddiely[i]) {
            case oddiel_vcely:
            case oddiel_vlcata:
            case oddiel_smolenice:
              sum += 75;
              break;

            case oddiel_dar:
              if (veky[i] <= 1)
                break;
              if (veky[i] <= 6)
                sum += 35;
              else if (veky[i] <= 13)
                sum += 45;
              else
                sum += 65
              break;
          }
          break;

        default:
          throw new Error(`Unexpected pobyt: '${termin}'`);
      }
    }
  }

  // Handle special combined case
  if (hasSkauti && hasRangeri) {
    sum += 18;
  }

  return sum;
}
