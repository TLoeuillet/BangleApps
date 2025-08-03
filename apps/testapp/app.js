// Direction Vibration App pour Bangle.js 2
// Vibre différemment selon la direction de marche (GPS)

let lastPosition = null;
let currentDirection = null;
let vibrationInterval = null;

// Patterns de vibration pour chaque direction
const vibrationPatterns = {
  'Nord': 1,     // 1 vibration courte
  'Est': 2,      // 2 vibrations courtes
  'Sud': 3,      // 3 vibrations courtes
  'Ouest': 4     // 4 vibrations courtes
};

// Fonction pour calculer la direction entre deux points GPS
function calculateDirection(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360; // Normaliser à 0-360°
  
  // Convertir en direction cardinale
  if (bearing >= 315 || bearing < 45) return 'Nord';
  else if (bearing >= 45 && bearing < 135) return 'Est';
  else if bearing >= 135 && bearing < 225) return 'Sud';
  else return 'Ouest';
}

// Fonction pour faire vibrer selon le pattern
function vibratePattern(count) {
  let vibrationsLeft = count;
  
  function doVibration() {
    if (vibrationsLeft > 0) {
      Bangle.buzz(200); // Vibration de 200ms
      vibrationsLeft--;
      if (vibrationsLeft > 0) {
        setTimeout(doVibration, 300); // Pause de 300ms entre vibrations
      }
    }
  }
  
  doVibration();
}

// Fonction appelée lors de la réception de données GPS
function onGPS(gps) {
  if (!gps.fix || !gps.lat || !gps.lon) {
    return; // Pas de signal GPS valide
  }
  
  const currentPosition = {
    lat: gps.lat,
    lon: gps.lon
  };
  
  // Si nous avons une position précédente, calculer la direction
  if (lastPosition) {
    const distance = Math.sqrt(
      Math.pow((currentPosition.lat - lastPosition.lat) * 111320, 2) +
      Math.pow((currentPosition.lon - lastPosition.lon) * 111320 * Math.cos(currentPosition.lat * Math.PI / 180), 2)
    );
    
    // Seulement si on s'est déplacé d'au moins 2 mètres
    if (distance > 2) {
      const direction = calculateDirection(
        lastPosition.lat, lastPosition.lon,
        currentPosition.lat, currentPosition.lon
      );
      
      if (direction !== currentDirection) {
        currentDirection = direction;
        print("Direction: " + direction);
      }
      
      lastPosition = currentPosition;
    }
  } else {
    lastPosition = currentPosition;
  }
}

// Fonction de vibration périodique
function startVibrationTimer() {
  vibrationInterval = setInterval(() => {
    if (currentDirection && vibrationPatterns[currentDirection]) {
      vibratePattern(vibrationPatterns[currentDirection]);
    }
  }, 5000); // Toutes les 5 secondes
}

// Fonction d'arrêt
function stopApp() {
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
  Bangle.removeAllListeners('GPS');
  Bangle.setGPSPower(0);
}

// Interface utilisateur simple
function drawScreen() {
  g.clear();
  g.setFont("Vector", 20);
  g.setFontAlign(0, 0);
  
  g.drawString("Direction GPS", g.getWidth()/2, 30);
  
  if (currentDirection) {
    g.setFont("Vector", 24);
    g.drawString(currentDirection, g.getWidth()/2, 80);
    
    g.setFont("Vector", 16);
    const vibrCount = vibrationPatterns[currentDirection];
    g.drawString(vibrCount + " vibration" + (vibrCount > 1 ? "s" : ""), 
                 g.getWidth()/2, 110);
  } else {
    g.setFont("Vector", 16);
    g.drawString("En attente GPS...", g.getWidth()/2, 80);
  }
  
  g.setFont("Vector", 12);
  g.drawString("Bouton: Quitter", g.getWidth()/2, 160);
}

// Initialisation
function init() {
  // Configurer l'écran
  g.clear();
  drawScreen();
  
  // Configurer le GPS
  Bangle.setGPSPower(1);
  Bangle.on('GPS', onGPS);
  
  // Démarrer le timer de vibration
  startVibrationTimer();
  
  // Mettre à jour l'affichage périodiquement
  setInterval(drawScreen, 1000);
  
  // Gérer le bouton pour quitter
  setWatch(() => {
    stopApp();
    load(); // Retourner au menu principal
  }, BTN1, {repeat: false, edge: "falling"});
}

// Nettoyage à la fermeture de l'app
E.on('kill', stopApp);

// Démarrer l'application
init();

print("App Direction GPS démarrée");
print("Nord: 1 vibration, Est: 2, Sud: 3, Ouest: 4");
print("Vibration toutes les 5 secondes");
