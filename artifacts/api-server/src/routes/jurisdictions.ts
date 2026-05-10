import { Router, type IRouter } from "express";
import { db, jurisdictionsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

const SEED_DATA = [
  { category: "ORMOC CITY", items: ["Ebony St.", "Imelda Avenue", "Juan Luna St.", "Obrero St.", "Port Area", "Public Market", "Sabang", "Superdome (Arradaza St.)", "Terminal Area", "Bonifacio St.", "JT Kangleon St.", "Real St.", "Rizal Ext.", "Rizal St.", "San Juaquin St.", "San Nicolas St.", "San Vidal St.", "Solidor St.", "Arradaza St.", "Carlos Tan St.", "Cataag St.", "J. Navarro St.", "Mabini St.", "Osmeña St.", "Superdome", "Burgos St.", "Food Court", "San Pedro St.", "Agua Dulce St.", "San Pablo St.", "Aviles St.", "Lopez Jaena St."] },
  { category: "BARANGAY", items: ["Alegria Brgy.", "Batuan Brgy.", "Curva Brgy.", "Domonar Brgy.", "Esperanza Brgy.", "Green Valley Brgy.", "Lao Brgy.", "Leondoni Brgy.", "Licuma Brgy.", "Mabato Brgy.", "Manlilinao Brgy.", "Margen Brgy.", "Mas-in Brgy.", "Matica-a Brgy.", "Nueva Sociedad Brgy.", "RM Tan Brgy.", "San Juan Brgy.", "San Vicente Brgy.", "Doña Feliza Mejia Brgy.", "Don F. Larrazabal Brgy.", "Donghol Brgy.", "Hermosilla Drive Brgy.", "Linao Brgy.", "Malbasag Brgy.", "Nadongholan Brgy.", "Naungan Brgy.", "Bagong Buhay Brgy.", "Cabaon-an Brgy.", "Cabintan Brgy.", "Dolores Brgy.", "Gaas Brgy.", "Isla Verde Brgy.", "Lake Danao Brgy.", "Liberty Brgy.", "Luna Brgy.", "Milagro Brgy.", "Nueva Vista Brgy.", "Red Cross Village Brgy.", "San Isidro Brgy.", "San Pablo Brgy.", "Sto. Niño Brgy.", "Tongonan Brgy.", "Alta Vista Brgy.", "Bantigue Brgy.", "Boroc Brgy.", "Camp Downes Brgy.", "Can Adieng Brgy.", "Can-untog Brgy.", "Cogon Brgy.", "Danhug Brgy.", "Hugpa Brgy.", "Ipil Brgy.", "Laray Boroc Brgy.", "Mabini Brgy.", "Macabug Brgy.", "Patag Brgy.", "Punta Brgy.", "San Antonio Brgy.", "Sumangga Brgy.", "Tambulilid Brgy.", "Airport Brgy.", "Balion Labrador Brgy.", "Bayog Brgy.", "Biliboy Brgy.", "Cabulihan Brgy.", "Cagbuhangin Brgy.", "Catayum Brgy.", "Catmon Brgy.", "Concepcion Brgy.", "Dayhagan Brgy.", "Guintiguian Brgy.", "Hibunaon Brgy.", "Juaton Brgy.", "Kadaohan Brgy.", "Labrador Brgy.", "Magaswe Brgy.", "Maticaa Brgy.", "Nasunogan Brgy.", "Sabong Bao Brgy.", "Salvacion Brgy.", "San Jose Brgy.", "Valencia Brgy.", "Libertad Brgy.", "Lilo-an Brgy."] },
  { category: "TOWN", items: ["ISABEL, LEYTE", "MAHAPLAG, LEYTE", "SAN ISIDRO, LEYTE", "TABANGO, LEYTE", "VILLABA, LEYTE", "ALBUERA, LEYTE", "PALOMPON, LEYTE", "MERIDA, LEYTE", "KANANGA, LEYTE", "MATAG-OB, LEYTE", "CITY OF BAYBAY, LEYTE", "CALUBIAN, LEYTE", "LEYTE, LEYTE", "ALMERIA, BILIRAN", "BILIRAN, BILIRAN", "CABUCGAYAN, BILIRAN", "CAIBIRAN, BILIRAN", "CULABA, BILIRAN", "KAWAYAN, BILIRAN", "MARIPIPI, BILIRAN", "NAVAL, BILIRAN"] },
];

async function seedIfEmpty() {
  const existing = await db.select({ id: jurisdictionsTable.id }).from(jurisdictionsTable).limit(1);
  if (existing.length > 0) return;
  const rows = SEED_DATA.flatMap(({ category, items }) =>
    items.map((name) => ({ name, category }))
  );
  await db.insert(jurisdictionsTable).values(rows).onConflictDoNothing();
}

const router: IRouter = Router();

router.get("/jurisdictions/all", requireAuth, async (_req, res): Promise<void> => {
  await seedIfEmpty();
  const rows = await db.select().from(jurisdictionsTable).orderBy(asc(jurisdictionsTable.category), asc(jurisdictionsTable.name));
  res.json(rows);
});

router.get("/jurisdictions", async (_req, res): Promise<void> => {
  await seedIfEmpty();
  const rows = await db.select().from(jurisdictionsTable).orderBy(asc(jurisdictionsTable.category), asc(jurisdictionsTable.name));
  const grouped: Record<string, string[]> = {};
  for (const row of rows) {
    if (!grouped[row.category]) grouped[row.category] = [];
    grouped[row.category].push(row.name);
  }
  const categories = Object.entries(grouped).map(([category, items]) => ({ category, items }));
  res.json({ categories });
});

router.post("/jurisdictions", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { name, category } = req.body as { name?: string; category?: string };
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (!category || typeof category !== "string" || !category.trim()) {
    res.status(400).json({ error: "category is required" });
    return;
  }
  const [created] = await db.insert(jurisdictionsTable).values({ name: name.trim(), category: category.trim() }).returning();
  res.status(201).json(created);
});

router.put("/jurisdictions/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { name, category } = req.body as { name?: string; category?: string };
  const updates: Record<string, string> = {};
  if (name && typeof name === "string" && name.trim()) updates.name = name.trim();
  if (category && typeof category === "string" && category.trim()) updates.category = category.trim();
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }
  const [updated] = await db
    .update(jurisdictionsTable)
    .set(updates)
    .where(eq(jurisdictionsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Jurisdiction not found" });
    return;
  }
  res.json(updated);
});

router.delete("/jurisdictions/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(jurisdictionsTable).where(eq(jurisdictionsTable.id, id));
  res.json({ message: "Jurisdiction deleted" });
});

export default router;
