import manifesto from "@/data/brand/manifesto.json" assert { type: "json" };

export const brandCore = {
  name: manifesto.brand_core.name,
  version: manifesto.brand_core.version,
  locked: manifesto.brand_core.locked,
  councilStatus: manifesto.brand_core.council_status,
  lastReview: manifesto.brand_core.last_review
};

export const brandStatement = manifesto.statement;
