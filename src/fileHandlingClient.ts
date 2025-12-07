import JSZip from "jszip";
import type { StreamRecord } from "./interfaces/interfaces";

export async function expandAndParseFiles(files: File[]): Promise<{ records: StreamRecord[]; fileNames: string[] }> {
  const expandedFiles: File[] = [];
  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".zip")) {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter((f) => !f.dir && f.name.toLowerCase().endsWith(".json"));
      for (const entry of entries) {
        const content = await entry.async("string");
        const blob = new Blob([content], { type: "application/json" });
        const jsonFile = new File([blob], entry.name, { type: "application/json" });
        expandedFiles.push(jsonFile);
      }
    } else {
      expandedFiles.push(file);
    }
  }

  const jsonFiles = expandedFiles.filter((file) => file.name.toLowerCase().endsWith(".json"));
  if (jsonFiles.length === 0) {
    throw new Error("No JSON files detected. Please drop .json files from Spotify.");
  }

  const allRecords: StreamRecord[] = [];
  const fileNames: string[] = [];
  for (const file of jsonFiles) {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      // Skip if not an array
      continue;
    }
    const withSource = data.map((item: any) => ({ ...item, _source_file: file.name }));
    allRecords.push(...(withSource as StreamRecord[]));
    fileNames.push(file.name);
  }

  return { records: allRecords, fileNames };
}
