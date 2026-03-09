import { extractWithGemini, buildCeoName } from "./src/lib/enrichment/gemini";

async function main() {
  // Test: Marion Feichtner - Name steckt im Firmennamen
  console.log("=== Test: Marion Feichtner Hospitality GmbH ===");
  const r1 = await extractWithGemini({
    companyName: "Marion Feichtner Hospitality",
    website: "https://www.forsthaus-wartenfels.at",
    address: "Wartenfels 1, 5300 Hallwang, Österreich",
    phone: "+43 6235 21900",
    pagesLoaded: ["homepage", "impressum"],
    websiteContent: "Forsthaus Wartenfels - Marion Feichtner Hospitality GmbH. Impressum: Marion Feichtner Hospitality GmbH, Wartenfels 1, 5300 Hallwang. Geschäftsführerin: Marion Feichtner",
    ceoSnippets: "",
    emails: ["hereinspaziert@forsthaus-wartenfels.at"],
    phones: ["+4362352190"],
  });
  if (r1) {
    console.log("Gemini raw:", JSON.stringify(r1, null, 2));
    console.log("buildCeoName:", buildCeoName(r1));
  }

  // Test: Landgasthof Santner
  console.log("\n=== Test: Landgasthof Santner ===");
  const r2 = await extractWithGemini({
    companyName: "Landgasthof und Fleischhauerei Santner",
    website: "https://www.landgasthofsantner.at",
    address: "Marktplatz 3, 5303 Thalgau, Österreich",
    phone: "+43 6235 7216",
    pagesLoaded: ["homepage"],
    websiteContent: "Landgasthof und Fleischhauerei Santner. Dagmar und Christian Santner. Marktplatz 3, 5303 Thalgau. Tel: 06235/7216",
    ceoSnippets: "",
    emails: ["office@landgasthofsantner.at"],
    phones: ["+4362357216"],
  });
  if (r2) {
    console.log("Gemini raw:", JSON.stringify(r2, null, 2));
    console.log("buildCeoName:", buildCeoName(r2));
  }

  // Test: Schloss Fuschl Fischerei - nur "Gerhard"
  console.log("\n=== Test: Schloss Fuschl Fischerei ===");
  const r3 = await extractWithGemini({
    companyName: "Schloss Fuschl Fischerei",
    website: "https://www.schlossfuschlfischerei.com",
    address: "Schloss Straße 19, 5322 Hof bei Salzburg, Österreich",
    phone: "+43 6229 22531533",
    pagesLoaded: ["homepage"],
    websiteContent: "Schloss Fuschl Fischerei GmbH. Fischermeister Gerhard. Frische Fische aus dem Fuschlsee.",
    ceoSnippets: "",
    emails: ["fischerei@schlossfuschlfischerei.com"],
    phones: ["+43622922531533"],
  });
  if (r3) {
    console.log("Gemini raw:", JSON.stringify(r3, null, 2));
    console.log("buildCeoName:", buildCeoName(r3));
  }
}

main().catch(console.error);
