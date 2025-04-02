function onFormSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var responseSheet = sheet.getSheetByName("Form Responses 1"); // Názov hárka s odpoveďami formulára
  var responses = e.values;
  
  var oddiel = responses[1]; // Predpokladám, že oddiel je v druhom stĺpci
  var targetSheetName = getSheetName(oddiel);
  
  if (targetSheetName) {
    var targetSheet = sheet.getSheetByName(targetSheetName);
    if (targetSheet) {
      var lastRow = targetSheet.getLastRow() + 1;
      var variableNumber = generateVariableNumber();
      
      // Získame hodnotu zo stĺpca, ktorý obsahuje možnosť "Kratší čas"
      var termin = responses[3]; // Predpokladáme, že odpoveď na "termin" je v stĺpci 4 (index 3)
      
      var fee; // Suma na zaplatenie
      
      // Najprv skontrolujeme odpoveď na "termin"
      if (termin === "Kratší čas (do poznámky uveďte termín)") {
        fee = "Platba na kratší čas (do poznámky uveďte termín)";
      } else {
        fee = calculateFee(targetSheetName, responses); // Ak nie je "Kratší čas", nastavíme bežnú cenu
      }
      
      responses.push(variableNumber, fee);
      targetSheet.appendRow(responses);
      
      var lastRowIndex = targetSheet.getLastRow();
      targetSheet.getRange(lastRowIndex, responses.length - 1).setValue(variableNumber); // Pridanie variabilného čísla
      targetSheet.getRange(lastRowIndex, responses.length).setValue(fee); // Pridanie sumy na zaplatenie
      
      // Ak je vybraný "Kratší čas", zvýrazníme bunku s cenou
      if (termin === "Kratší čas (do poznámky uveďte termín)") {
        targetSheet.getRange(lastRowIndex, responses.length).setBackground("yellow"); // Zvýraznenie bunky
      }
      
      addBorders(targetSheet, lastRow);
    } else {
      Logger.log("Hárok " + targetSheetName + " neexistuje.");
    }
  } else {
    Logger.log("Oddiel " + oddiel + " nebol rozpoznaný.");
  }
}

function getSheetName(oddiel) {
  var mapping = {
    "1. roj včielok Malé ženy": "Včielky",
    "1. voj vĺčat": "Vĺčatá",
    "2. oddiel skautiek Čunkšipi čokan": "Skautky",
    "1. oddiel skautov brata Runca - Strieborného vlka": "Skauti",
    "1. rangersko-roverský oddiel Rangeroveri": "RR",
    "2. oddiel dospelých a rodín Dinosaury": "Rodiny"
  };
  return mapping[oddiel] || null;
}

function addBorders(sheet, row) {
  var lastColumn = sheet.getLastColumn();
  var range = sheet.getRange(row, 1, 1, lastColumn);
  range.setBorder(true, true, true, true, true, true);
}

function generateVariableNumber() {
  var var_symbol = Math.floor(1000000 + Math.random() * 9000000); // Generuje 7-ciferné číslo
  return var_symbol;
}

function calculateFee(targetSheetName, responses) {
  var fees = {
    "Skautky": 140,
    "Skauti": 140,
    "Včielky": 75,
    "Vĺčatá": 75
  };
  return fees[targetSheetName] || 0;
}

// uprava tabuliek aby sa neduplikovali stlpce
function removeDuplicateColumns() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var uniqueColumns = {};
  var columnsToDelete = [];

  // Identifikácia duplicitných stĺpcov
  headers.forEach((header, index) => {
    if (uniqueColumns[header] !== undefined) {
      columnsToDelete.push(index);
    } else {
      uniqueColumns[header] = index;
    }
  });

  // Odstránenie duplicitných stĺpcov (zozadu, aby sa indexy neposunuli)
  columnsToDelete.reverse().forEach(colIndex => {
    sheet.deleteColumn(colIndex + 1);
  });
}
