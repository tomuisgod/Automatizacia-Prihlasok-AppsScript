for (var i = 1; i < responses.length; i++) {
  var value = responses[i];
  
  Logger.log(`Spracovávam stĺpec ${currentCol}: '${value}'`);

  // Najprv zapisuj normálne odpovede
  targetSheet.getRange(currentRow, currentCol).setValue(value);

  // Zapamätaj si oddiel a vek
  if (currentCol === 1) {
    oddiely.push(value);
  }
  if (currentCol === 5) {
    veky.push(parseInt(value.replace(/[^\d]/g, ''), 10));
  }

  // Ak odpoveď v I je "Kratší čas"
  if (currentCol === 9 && value.includes("Kratší čas")) {
    Logger.log("Našiel som skrátený čas!");
    try {
      targetSheet.getRange(currentRow, 14).setValue("VYRIESIT").setBackground("#ff4040"); // N
    } catch (e) {
      Logger.log("ERROR: " + e.message);
    }
    Logger.log(`Zapisujem VYRIESIT do bunky N${currentRow}`);
  }

  // Ak odpoveď v L je "Nie" alebo v iných stĺpcoch je "Áno"
  if ((currentCol === 12 && value === "Nie") || value === "Áno") {
    targetSheet.getRange(currentRow, 13).setValue(varsymbol); // M
    Logger.log(`Zapisujem varsymbol ${varsymbol} do bunky M${currentRow}`);
  }

  // Ak odpoveď nie je "Kratší čas", "Nie" alebo "Áno", zapíše sa platba do N (payment)
  if (currentCol !== 9 && currentCol !== 12) {
    const payment = calculate_payment(oddiely, veky);
    targetSheet.getRange(currentRow, 14).setValue(payment); // N
    Logger.log(`Zapisujem platbu ${payment} do bunky N${currentRow}`);
  }

  currentCol++; // Posuň sa na ďalší stĺpec
}
