import { 
  db, 
  isFirebaseConfigured, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  writeBatch 
} from "./firebase";

interface Word {
  id: string;
  spelling: string;
  phonetic?: string;
  definition: string;
  example?: string;
  exampleTranslation?: string;
  mnemonic?: string;
  audioUrl?: string | null;
  createdAt: string;
  reviewStage: number;
  consecutiveCorrect: number;
  lastResetAt: string;
  nextReviewAt: string;
  userId?: string;
}

interface HistoryItem {
  id: string;
  wordId: string;
  spelling: string;
  correct: boolean;
  reviewedAt: string;
  userId: string;
}

/**
 * Loads words and histories from Firestore for a given userId.
 * Returns null if not configured or no data found.
 */
export async function loadUserDataFromFirestore(userId: string): Promise<{ words: Word[]; histories: HistoryItem[] } | null> {
  if (!isFirebaseConfigured || !db) {
    console.log("[Firestore Sync] Firebase not configured, skipping cloud load.");
    return null;
  }

  try {
    console.log(`[Firestore Sync] Fetching cloud data for user: ${userId}`);
    
    // Fetch words
    const wordsCol = collection(db, "users", userId, "words");
    const wordsSnap = await getDocs(wordsCol);
    const words: Word[] = [];
    wordsSnap.forEach((doc) => {
      words.push({ id: doc.id, ...doc.data() } as Word);
    });

    // Fetch histories
    const historiesCol = collection(db, "users", userId, "histories");
    const historiesSnap = await getDocs(historiesCol);
    const histories: HistoryItem[] = [];
    historiesSnap.forEach((doc) => {
      histories.push({ id: doc.id, ...doc.data() } as HistoryItem);
    });

    console.log(`[Firestore Sync] Successfully loaded from cloud: ${words.length} words, ${histories.length} histories`);
    return { words, histories };
  } catch (error) {
    console.error("[Firestore Sync] Error loading user data from Firestore:", error);
    return null;
  }
}

/**
 * Saves or updates a single word to Firestore.
 */
export async function saveWordToFirestore(userId: string, word: Word): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const wordRef = doc(db, "users", userId, "words", word.id);
    const { id, ...data } = word; // Exclude id if stored as document key
    await setDoc(wordRef, { ...data, userId });
    console.log(`[Firestore Sync] Saved word to cloud: ${word.spelling}`);
  } catch (error) {
    console.error("[Firestore Sync] Error saving word to Firestore:", error);
  }
}

/**
 * Deletes a single word from Firestore.
 */
export async function deleteWordFromFirestore(userId: string, wordId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const wordRef = doc(db, "users", userId, "words", wordId);
    await deleteDoc(wordRef);
    console.log(`[Firestore Sync] Deleted word from cloud: ${wordId}`);
  } catch (error) {
    console.error("[Firestore Sync] Error deleting word from Firestore:", error);
  }
}

/**
 * Saves a single history item to Firestore.
 */
export async function saveHistoryToFirestore(userId: string, history: HistoryItem): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const historyRef = doc(db, "users", userId, "histories", history.id);
    const { id, ...data } = history;
    await setDoc(historyRef, { ...data, userId });
    console.log(`[Firestore Sync] Saved history to cloud: ${history.spelling} (${history.correct ? "✓" : "✗"})`);
  } catch (error) {
    console.error("[Firestore Sync] Error saving history to Firestore:", error);
  }
}

/**
 * Perform a full upload of local data to Firestore (e.g. for initial sync/onboarding)
 */
export async function uploadFullDataToFirestore(userId: string, words: Word[], histories: HistoryItem[]): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    console.log(`[Firestore Sync] Performing full push of ${words.length} words to Firestore...`);
    
    // Batch operations to save Firestore writes overhead
    const batch = writeBatch(db);
    
    for (const word of words) {
      const wordRef = doc(db, "users", userId, "words", word.id);
      const { id, ...data } = word;
      batch.set(wordRef, { ...data, userId });
    }

    for (const h of histories) {
      const historyRef = doc(db, "users", userId, "histories", h.id);
      const { id, ...data } = h;
      batch.set(historyRef, { ...data, userId });
    }

    await batch.commit();
    console.log("[Firestore Sync] Full cloud synchronization completed successfully!");
  } catch (error) {
    console.error("[Firestore Sync] Full upload to Firestore failed:", error);
  }
}
