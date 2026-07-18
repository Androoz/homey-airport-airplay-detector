# Installation på Homey Pro

## Installera den publicerade versionen

Installera **Airport Airplay Detector** från [Homey App Store](https://homey.app/a/com.anders.airport-airplay-detector). Detta är den rekommenderade installationsvägen och ger automatiska uppdateringar via Homey.

I Homey-appen:

1. Öppna **Enheter**, tryck **+** och sök efter **Airport Airplay Detector**.
2. Välj **AirPort Express** och lägg till din AirPort Express.
3. Om den inte syns: kontrollera att Homey Pro och AirPort Express finns på samma nät/VLAN och att Bonjour/mDNS inte blockeras.

Resten av dokumentet beskriver utvecklingsinstallation från källkod.

## Förutsättningar

- Homey Pro och AirPort Express måste finnas på samma lokala nät/VLAN där mDNS (Bonjour) kan passera.
- Installera en aktuell Node.js LTS-version på din Mac.
- Öppna Terminal och gå till den här projektmappen.

## Installera verktyg och beroenden

```bash
cd "/Users/anders/Documents/Airport Express Airplay app for Homey Pro"
npm install
npx homey login
npx homey select
```

Logga in med samma Athom-konto som äger Homey Pro. Om du har flera Homey-enheter väljer du rätt Homey Pro med `homey select`.

## Validera och provkör

```bash
npx homey app validate
npx homey app run
```

`app run` installerar appen tillfälligt och visar loggen. Avslutar du kommandot avinstalleras testversionen.

I Homey-appen för utvecklingsinstallationen:

1. Öppna **Enheter**, tryck **+** och välj **Airport Airplay Detector**.
2. Välj **AirPort Express** och lägg till din AirPort Express.
3. Om den inte syns: kontrollera samma nät/VLAN, att Bonjour/mDNS inte blockeras och starta om AirPort Express.

## Testa detekteringen

Ingen kalibrering behövs i version 1.0.0.

De två gamla Flow-flödena **Kalibrera AirPort – inaktiv** och **Kalibrera AirPort – aktiv** kan tas bort; deras åtgärdskort finns inte längre.

1. Stoppa AirPlay och vänta cirka 10 sekunder. Enheten ska visa **AirPlay aktivt: Nej**.
2. Starta ljud via AirPlay till AirPort Express. Inom ungefär 3 sekunder ska enheten visa **AirPlay aktivt: Ja** och Flow-triggern **AirPlay startade** ska köras.
3. Avsluta AirPlay-sessionen. Efter ungefär 9 sekunder ska status återgå till **Nej** och **AirPlay stoppade** ska köras.

Appen skickar en aktiv `_airplay._tcp`-förfrågan var tredje sekund och läser `flags` ur svaret. Homeys inbyggda discovery och AirPort Express lokala `/info`-status används också som reservvägar. Tillfälliga nätverksfel räknas inte som ett stopp.

## Skapa HEOS-flödet

När testet fungerar skapar du:

- **När:** AirPort Express → **AirPlay startade**
- **Då:** Denon HEOS → **Play AUX in** → välj HEOS Amp

Valfritt skapar du ett separat flöde från **AirPlay stoppade** för önskad stopplogik.

## Installera en utvecklingsversion permanent

Avsluta först `homey app run` med Ctrl+C och kör sedan:

```bash
npx homey app install
```

Den permanenta utvecklingsinstallationen finns kvar när Terminal stängs. Använd normalt App Store-versionen ovan för automatisk uppdatering.
