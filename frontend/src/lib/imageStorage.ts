/**
 * IndexedDB-based image storage for recipe images
 * Handles large base64 images that exceed localStorage limits
 */

const DB_NAME = "SmartChefImages";
const DB_VERSION = 1;
const STORE_NAME = "images";

let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
    if (db) return db;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
    });
}

export async function saveImage(id: string, base64Data: string): Promise<void> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id, data: base64Data, timestamp: Date.now() });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

export async function getImage(id: string): Promise<string | null> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result?.data || null);
    });
}


export async function deleteImage(id: string): Promise<void> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Extract and save all base64 images from markdown, returning markdown with image IDs
 */
export async function saveImagesFromMarkdown(
    recipeId: string,
    markdown: string
): Promise<{ markdown: string; imageIds: string[] }> {
    const imageIds: string[] = [];
    let imageIndex = 0;
    let processedMarkdown = markdown;

    // Find all base64 images
    const regex = /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)\)/g;
    const matches = [...markdown.matchAll(regex)];

    for (const match of matches) {
        const [fullMatch, alt, base64Data] = match;
        const imageId = `${recipeId}-img-${imageIndex++}`;

        try {
            await saveImage(imageId, base64Data);
            imageIds.push(imageId);
            // Replace base64 with reference ID
            processedMarkdown = processedMarkdown.replace(fullMatch, `![${alt}](indexeddb:${imageId})`);
        } catch (e) {
            console.error("Failed to save image:", e);
        }
    }

    return { markdown: processedMarkdown, imageIds };
}

/**
 * Restore base64 images from IndexedDB references in markdown
 */
export async function restoreImagesInMarkdown(markdown: string): Promise<string> {
    const regex = /!\[([^\]]*)\]\(indexeddb:([^)]+)\)/g;
    const matches = [...markdown.matchAll(regex)];

    let restoredMarkdown = markdown;

    for (const match of matches) {
        const [fullMatch, alt, imageId] = match;
        try {
            const base64Data = await getImage(imageId);
            if (base64Data) {
                restoredMarkdown = restoredMarkdown.replace(fullMatch, `![${alt}](${base64Data})`);
            }
        } catch (e) {
            console.error("Failed to restore image:", e);
        }
    }

    return restoredMarkdown;
}
