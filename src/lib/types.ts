export type Category = "oberteile" | "hosen" | "schuhe" | "taschen" | "accessoires";

export type GarmentKind =
  | "tshirt"
  | "shirt"
  | "knit"
  | "hoodie"
  | "blazer"
  | "coat"
  | "jeans"
  | "trousers"
  | "skirt"
  | "shorts"
  | "sneaker"
  | "loafer"
  | "boot"
  | "tote"
  | "shoulderbag"
  | "crossbody"
  | "sunglasses"
  | "cap"
  | "beanie"
  | "scarf"
  | "belt"
  | "watch"
  | "necklace";

export type Pattern = "none" | "stripes" | "check" | "denim" | "rib";

/** Demo illustration drawn in SVG. Never used for a real offered article. */
export interface IllustrationImage {
  type: "illustration";
  kind: GarmentKind;
  color: string;
  accent?: string;
  pattern?: Pattern;
}

/** Authentic retailer image from an affiliate feed. `rights` documents the usage basis. */
export interface RetailerImage {
  type: "retailer";
  src: string;
  width: number;
  height: number;
  rights: string;
}

/** AI-generated demo render (Higgsfield). Labelled as demo; never shown as an offered article. */
export interface RenderImage {
  type: "render";
  src: string;
  width: number;
  height: number;
  generator: string;
}

export type ProductImage = IllustrationImage | RetailerImage | RenderImage;

export interface Shop {
  id: string;
  name: string;
  /** Delivery to Switzerland. */
  deliveryDays: string;
  shippingCHF: number;
  freeShippingFromCHF: number | null;
  isDemo: boolean;
}

export interface Offer {
  id: string;
  shopId: string;
  priceCHF: number;
  /** Tracked affiliate deep link. Demo offers have none. */
  affiliateUrl: string | null;
  inStock: boolean;
}

export interface Product {
  id: string;
  title: string;
  category: Category;
  colorName: string;
  colorFamily: ColorFamily;
  kind: GarmentKind;
  tags: string[];
  image: ProductImage;
  offers: Offer[];
  isDemo: boolean;
}

export type ColorFamily = "schwarz" | "weiss" | "grau" | "beige" | "braun" | "blau" | "gruen" | "rot" | "gelb";

export interface CanvasItem {
  uid: string;
  productId: string;
  /** Center position in canvas units (canvas is CANVAS_W x CANVAS_H). */
  x: number;
  y: number;
  /** Width in canvas units; height follows the image aspect ratio. */
  w: number;
  rotation: number;
  z: number;
}

export type Backdrop = "papier" | "kreide" | "sand" | "salbei" | "nacht";

export type LookStatus = "privat" | "veroeffentlicht";

export interface Look {
  id: string;
  title: string;
  note: string;
  occasion: Occasion;
  items: CanvasItem[];
  backdrop: Backdrop;
  status: LookStatus;
  authorName: string;
  ownerEmail: string | null;
  createdAt: string;
  updatedAt: string;
  /** Look this one was remixed from. */
  basedOn: string | null;
  isExample: boolean;
}

export type Occasion = "alltag" | "buero" | "abend" | "wochenende" | "reise";

export interface Draft {
  /** Set when the draft edits a saved look. */
  lookId: string | null;
  title: string;
  note: string;
  occasion: Occasion;
  items: CanvasItem[];
  backdrop: Backdrop;
  basedOn: string | null;
  updatedAt: string;
}

export interface Session {
  name: string;
  email: string;
}
