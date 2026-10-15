import surahsMeta from '../data/surahsMetadata.json';
import quranAyahsData from '../data/quranAyahs.json';
import { Surah, Ayah } from '../types';

export const SURAHS: Surah[] = surahsMeta as Surah[];

export interface ValidationReport {
  isValid: boolean;
  totalSurahsFound: number;
  totalAyahsFound: number;
  expectedSurahs: number;
  expectedAyahs: number;
  missingAyahs: Array<{ surah: number; ayah: number }>;
  duplicateAyahs: Array<{ surah: number; ayah: number; count: number }>;
  formatErrors: string[];
  surahDetails: Array<{
    number: number;
    name: string;
    expectedCount: number;
    foundCount: number;
    isComplete: boolean;
  }>;
}

export class QuranService {
  private static ayahsCache: Record<string, Ayah[]> = quranAyahsData as Record<string, Ayah[]>;

  /**
   * Get all 114 Surahs
   */
  public static getAllSurahs(): Surah[] {
    return SURAHS;
  }

  /**
   * Get single Surah metadata by number (1 to 114)
   */
  public static getSurah(surahNumber: number): Surah | undefined {
    return SURAHS.find((s) => s.number === surahNumber);
  }

  /**
   * Get all Ayahs for a given Surah
   */
  public static getAyahsForSurah(surahNumber: number): Ayah[] {
    const list = this.ayahsCache[String(surahNumber)];
    if (!list) return [];
    return list.map((a) => ({
      surahNumber,
      ayahNumber: a.ayahNumber,
      text: a.text,
    }));
  }

  /**
   * Get specific Ayah text
   */
  public static getAyahText(surahNumber: number, ayahNumber: number): string {
    const surahAyahs = this.ayahsCache[String(surahNumber)];
    if (!surahAyahs) return '';
    const found = surahAyahs.find((a) => a.ayahNumber === ayahNumber);
    return found ? found.text : '';
  }

  /**
   * Calculate total ayahs within an inclusive range
   */
  public static getAyahsInRange(
    startSurah: number,
    startAyah: number,
    endSurah: number,
    endAyah: number
  ): Ayah[] {
    const results: Ayah[] = [];

    for (let s = startSurah; s <= endSurah; s++) {
      const surahMeta = this.getSurah(s);
      if (!surahMeta) continue;

      const fromAyah = s === startSurah ? startAyah : 1;
      const toAyah = s === endSurah ? endAyah : surahMeta.ayahCount;

      const surahAyahs = this.getAyahsForSurah(s);
      for (let a = fromAyah; a <= toAyah; a++) {
        const found = surahAyahs.find((item) => item.ayahNumber === a);
        if (found) {
          results.push(found);
        } else {
          results.push({
            surahNumber: s,
            ayahNumber: a,
            text: `آية ${a}`,
          });
        }
      }
    }

    return results;
  }

  /**
   * Count total ayahs between two coordinates
   */
  public static countAyahsInRange(
    startSurah: number,
    startAyah: number,
    endSurah: number,
    endAyah: number
  ): number {
    if (startSurah > endSurah || (startSurah === endSurah && startAyah > endAyah)) {
      return 0;
    }

    let count = 0;
    for (let s = startSurah; s <= endSurah; s++) {
      const meta = this.getSurah(s);
      if (!meta) continue;

      const fromAyah = s === startSurah ? startAyah : 1;
      const toAyah = s === endSurah ? endAyah : meta.ayahCount;

      count += Math.max(0, toAyah - fromAyah + 1);
    }
    return count;
  }

  /**
   * Get the global index of an Ayah from 1 to 6236
   */
  public static getGlobalAyahIndex(surahNumber: number, ayahNumber: number): number {
    let index = 0;
    for (let s = 1; s < surahNumber; s++) {
      const meta = this.getSurah(s);
      if (meta) index += meta.ayahCount;
    }
    return index + ayahNumber;
  }

  /**
   * Get Surah & Ayah coordinate from global index (1 to 6236)
   */
  public static getCoordinateFromGlobalIndex(globalIndex: number): { surah: number; ayah: number } {
    let accumulated = 0;
    for (let s = 1; s <= 114; s++) {
      const meta = this.getSurah(s);
      if (!meta) continue;
      if (accumulated + meta.ayahCount >= globalIndex) {
        return {
          surah: s,
          ayah: globalIndex - accumulated,
        };
      }
      accumulated += meta.ayahCount;
    }
    return { surah: 114, ayah: 6 };
  }

  /**
   * Comprehensive validation mechanism for importing Quran data files (Tanzil pipe-delimited format: surah|ayah|text)
   */
  public static validateQuranTextFile(fileContent: string): ValidationReport {
    const lines = fileContent.split(/\r?\n/);
    const surahAyahsMap: Record<number, Set<number>> = {};
    const duplicates: Array<{ surah: number; ayah: number; count: number }> = [];
    const seenCounts: Record<string, number> = {};
    const formatErrors: string[] = [];

    let totalValidAyahs = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const rawLine = lines[lineIndex].trim();
      if (!rawLine || rawLine.startsWith('#')) continue; // skip comments and empty lines

      const parts = rawLine.split('|');
      if (parts.length < 3) {
        if (formatErrors.length < 10) {
          formatErrors.push(`السطر ${lineIndex + 1}: تنسيق غير صالح، يتطلب (سورة|آية|نص)`);
        }
        continue;
      }

      const surahNum = parseInt(parts[0].trim(), 10);
      const ayahNum = parseInt(parts[1].trim(), 10);

      if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
        formatErrors.push(`السطر ${lineIndex + 1}: رقم سورة غير صالح (${parts[0]})`);
        continue;
      }

      const expectedMeta = this.getSurah(surahNum);
      if (!expectedMeta) continue;

      if (isNaN(ayahNum) || ayahNum < 1 || ayahNum > expectedMeta.ayahCount) {
        formatErrors.push(
          `السطر ${lineIndex + 1}: رقم آية غير صالح (${parts[1]}) لسورة ${expectedMeta.name} (عدد آياتها ${expectedMeta.ayahCount})`
        );
        continue;
      }

      const key = `${surahNum}_${ayahNum}`;
      seenCounts[key] = (seenCounts[key] || 0) + 1;

      if (seenCounts[key] === 2) {
        duplicates.push({ surah: surahNum, ayah: ayahNum, count: 2 });
      } else if (seenCounts[key] > 2) {
        const item = duplicates.find((d) => d.surah === surahNum && d.ayah === ayahNum);
        if (item) item.count = seenCounts[key];
      }

      if (!surahAyahsMap[surahNum]) {
        surahAyahsMap[surahNum] = new Set();
      }
      surahAyahsMap[surahNum].add(ayahNum);
      totalValidAyahs++;
    }

    // Check missing ayahs per surah
    const missingAyahs: Array<{ surah: number; ayah: number }> = [];
    const surahDetails: Array<{
      number: number;
      name: string;
      expectedCount: number;
      foundCount: number;
      isComplete: boolean;
    }> = [];

    for (const meta of SURAHS) {
      const foundSet = surahAyahsMap[meta.number] || new Set();
      const foundCount = foundSet.size;

      for (let a = 1; a <= meta.ayahCount; a++) {
        if (!foundSet.has(a)) {
          missingAyahs.push({ surah: meta.number, ayah: a });
        }
      }

      surahDetails.push({
        number: meta.number,
        name: meta.name,
        expectedCount: meta.ayahCount,
        foundCount,
        isComplete: foundCount === meta.ayahCount,
      });
    }

    const totalSurahsFound = Object.keys(surahAyahsMap).length;
    const isValid =
      totalSurahsFound === 114 &&
      totalValidAyahs === 6236 &&
      missingAyahs.length === 0 &&
      duplicates.length === 0 &&
      formatErrors.length === 0;

    return {
      isValid,
      totalSurahsFound,
      totalAyahsFound: totalValidAyahs,
      expectedSurahs: 114,
      expectedAyahs: 6236,
      missingAyahs,
      duplicates,
      formatErrors,
      surahDetails,
    };
  }
}
