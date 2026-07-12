// Home-country degree-RECOGNITION layer (AlmiWorld pSEO Localization Standard).
//
// Complements lib/study-origin-localization.ts (which localizes the DESTINATION
// side — funding/visa/English for 8 dests × 10 origins). This adds the ORIGIN
// side: how a foreign degree is recognised back home (HEC / UGC / Ministry …),
// from the shared, verified @smnasiruz016-blip/almi-data layer. Verified for the
// researched origins; honest-generic (never invented) for the rest.

import { originContext } from "@smnasiruz016-blip/almi-data";

export type OriginRecognition = {
  localized: boolean;
  recognitionBody: string;
  recognitionUrl?: string;
  equivalenceNote: string;
  commonConcern: string;
  sourceNote?: string;
};

/** Never null — unresearched origins get an honest-generic, hedged block. */
export function resolveOriginRecognition(originSlug: string, originName: string): OriginRecognition {
  const loc = originContext(originSlug);
  if (loc) {
    return {
      localized: true,
      recognitionBody: loc.recognitionBody,
      recognitionUrl: loc.recognitionUrl,
      equivalenceNote: loc.equivalenceNote,
      commonConcern: loc.commonConcern.replace(/\s*[.?;]+\s*$/, "").trim(),
      sourceNote: loc.sourceNote,
    };
  }
  return {
    localized: false,
    recognitionBody: `the official degree-recognition authority in ${originName}`,
    equivalenceNote: `If you plan to use your degree back in ${originName}, confirm how a foreign qualification is recognised with the relevant authority there before you rely on it.`,
    commonConcern: `how a foreign degree is recognised back in ${originName}`,
  };
}
