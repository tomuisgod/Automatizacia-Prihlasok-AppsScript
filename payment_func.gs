function calculate_payment(pobyty, veky) {
  let sum = 0;
  if (pobyty.length != veky.length) {
    throw new Error('The pobyty and veky parameters must match in length!');
  }

  let pocet = pobyty.length;

  // Flags to detect special combination
  let hasSkauti = false;
  let hasRangeri = false;

  // First pass: detect if Skauti and/or Rangeri are present
  for (let i = 0; i < pobyty.length; i++) {
    if (pobyty[i] === 'Skauti a skautky 29.6. - 11.7. (celé 2 týždne)') {
      hasSkauti = true;
    }
    if (pobyty[i] === 'Rangeri a roveri 11.7. - 14.7.') {
      hasRangeri = true;
    }
  }

  // Second pass: calculate sum
  for (let i = 0; i < pobyty.length; i++) {
    switch (pobyty[i]) {
      case 'Predvoj 27.-28.6 (po dohode s vodcom)':
        sum += 15; // assumed fee for Predvoj
        break;

      case 'Skauti a skautky 29.6. - 11.7. (celé 2 týždne)':
        if (hasRangeri) {
          // Will handle later, skip adding individually
          break;
        }
        sum += 140 - 10 * (pocet - 1);
        pocet--;
        break;

      case 'Rangeri a roveri 11.7. - 14.7.':
        if (hasSkauti) {
          // Will handle later, skip adding individually
          break;
        }
        sum += 25;
        break;

      case 'Včielky a vĺčatá 14.7. - 19.7.':
        sum += 75;
        break;

      default:
        throw new Error(`Unexpected pobyt: '${pobyty[i]}'`);
    }
  }

  // Handle special combined case
  if (hasSkauti && hasRangeri) {
    sum += 18;
  }

  return sum;
}
