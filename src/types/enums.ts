export type CustomerTier = "retail" | "vip" | "vvip" | "agent";
export const CustomerTier = { retail: "retail", vip: "vip", vvip: "vvip", agent: "agent" } as const;

export type MaterialType = "human_hair" | "synthetic";
export const MaterialType = { human_hair: "human_hair", synthetic: "synthetic" } as const;

export type CraftType = "lace_front" | "full_lace" | "machine_made" | "three_sixty_lace" | "u_part";
export const CraftType = { lace_front: "lace_front", full_lace: "full_lace", machine_made: "machine_made", three_sixty_lace: "three_sixty_lace", u_part: "u_part" } as const;

export type PriceMode = "per_piece" | "by_weight";
export const PriceMode = { per_piece: "per_piece", by_weight: "by_weight" } as const;

export type CurlPattern = "straight" | "body_wave" | "deep_wave" | "water_wave" | "kinky_curly" | "loose_wave";
export const CurlPattern = { straight: "straight", body_wave: "body_wave", deep_wave: "deep_wave", water_wave: "water_wave", kinky_curly: "kinky_curly", loose_wave: "loose_wave" } as const;

export type CapSize = "petite" | "small" | "medium" | "large" | "xlarge";
export const CapSize = { petite: "petite", small: "small", medium: "medium", large: "large", xlarge: "xlarge" } as const;

export type TxType = "purchase_in" | "sale_out" | "transfer" | "adjustment" | "return_in" | "return_out";
export const TxType = {
    purchase_in: "purchase_in",
    sale_out: "sale_out",
    transfer: "transfer",
    adjustment: "adjustment",
    return_in: "return_in",
    return_out: "return_out"
} as const;

export type QualityStatus = "good" | "defective" | "refurbished";
export const QualityStatus = {
    good: "good",
    defective: "defective",
    refurbished: "refurbished"
} as const;
