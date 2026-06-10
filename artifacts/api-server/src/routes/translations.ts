import { Router } from "express";
import { db } from "@workspace/db";
import {
  prayerRequestsTable,
  prayerRequestTranslationsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ai } from "@workspace/integrations-gemini-ai";
import { syncUserFromClerk, requireAuth } from "../lib/auth";
import { requireGroupMember, type GroupAuthRequest } from "../lib/groupAuth";
import { decryptOrNull } from "../lib/encryption";

const router = Router();

const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: "English",
  pt: "Portuguese",
  es: "Spanish",
};

router.post(
  "/groups/:groupId/requests/:requestId/translate",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const requestId = String(req.params.requestId);
      const body = req.body as { targetLanguage?: string };
      const targetLanguage = body.targetLanguage;

      if (!targetLanguage || !SUPPORTED_LANGUAGES[targetLanguage]) {
        res.status(400).json({ error: "targetLanguage must be one of: en, pt, es" });
        return;
      }

      const [row] = await db
        .select()
        .from(prayerRequestsTable)
        .where(
          and(
            eq(prayerRequestsTable.id, requestId),
            eq(prayerRequestsTable.groupId, groupId),
          ),
        )
        .limit(1);

      if (!row) {
        res.status(404).json({ error: "Prayer request not found" });
        return;
      }

      const [cached] = await db
        .select()
        .from(prayerRequestTranslationsTable)
        .where(
          and(
            eq(prayerRequestTranslationsTable.prayerRequestId, requestId),
            eq(prayerRequestTranslationsTable.targetLanguage, targetLanguage),
          ),
        )
        .limit(1);

      if (cached) {
        res.json({
          translatedTitle: cached.translatedTitle,
          translatedDescription: cached.translatedDescription ?? null,
          targetLanguage,
          cached: true,
        });
        return;
      }

      const title = row.title;
      const description = decryptOrNull(row.descriptionEncrypted);
      const targetLangName = SUPPORTED_LANGUAGES[targetLanguage];

      const descriptionSection = description
        ? `Description: ${description}`
        : "";

      const prompt = `You are a prayer request translator. Translate the following prayer request into ${targetLangName}. Return ONLY a JSON object with keys "title" and "description". The "description" key should be null if there is no description. Do not add any explanation or extra text.

Title: ${title}
${descriptionSection}

JSON response:`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text ?? "{}";
      let parsed: { title?: string; description?: string | null } = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        req.log.error({ rawText }, "Failed to parse Gemini translation JSON");
        res.status(500).json({ error: "Translation failed — invalid AI response" });
        return;
      }

      const translatedTitle = parsed.title?.trim() || title;
      const translatedDescription = parsed.description?.trim() || null;

      await db.insert(prayerRequestTranslationsTable).values({
        prayerRequestId: requestId,
        targetLanguage,
        translatedTitle,
        translatedDescription,
      });

      res.json({
        translatedTitle,
        translatedDescription,
        targetLanguage,
        cached: false,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to translate prayer request");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
