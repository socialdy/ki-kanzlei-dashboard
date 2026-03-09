import { runEnrichmentPipeline } from "./src/lib/enrichment/pipeline";

async function main() {
  console.log("=== Pipeline Test: Restaurant Thalgau ===");
  console.log("Start:", new Date().toISOString());

  await runEnrichmentPipeline({
    jobId: "773bb749-b9a3-476f-872f-3b017c6bf68f",
    userId: "e3006537-ced6-4740-8958-b7f31e7b93fa",
    query: "Restaurant",
    location: "Thalgau",
    country: "AT",
    companyType: "all",
  });

  console.log("Ende:", new Date().toISOString());
}

main().catch(console.error);
