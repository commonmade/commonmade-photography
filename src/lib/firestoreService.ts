import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
    setDoc,
    orderBy,
} from "firebase/firestore";
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";

// Firebase Storage 다운로드 URL → Storage 경로 추출
function storageRefFromDownloadURL(url: string) {
    // URL 형식: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encoded-path>?alt=media&...
    const match = url.match(/\/o\/([^?]+)/);
    if (!match) throw new Error("Invalid Firebase Storage URL: " + url);
    const path = decodeURIComponent(match[1]);
    return ref(storage, path);
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface Category {
    id: string;
    name: string;
    slug: string;
    order: number;
}

export interface Album {
    id: string;
    categorySlug: string;
    title: string;
    subtitle: string;
    location: string;
    coverImageUrl: string;
    order: number;
    createdAt: unknown;
}

export interface Photo {
    id: string;
    albumId: string;
    url: string;
    filename: string;
    order: number;
    createdAt: unknown;
}

interface PageContent {
    [key: string]: unknown;
}

interface SiteConfig {
    [key: string]: string;
}

// ─── FAQ ───────────────────────────────────────────────────────────────────

export interface FaqItem {
    id: string;
    question: string;
    answer: string;
    order: number;
}

export interface PolicySection {
    id: string;
    title: string;
    body: string;
    order: number;
}

export interface ProductItem {
    id: string;
    subtitle: string;
    name: string;
    description: string;
    price: string;
    order: number;
}

// ─── Categories ────────────────────────────────────────────────────────────



// ─── Inquiries ─────────────────────────────────────────────────────────────

export interface Inquiry {
    id: string;
    name: string;
    phone: string;
    email: string;
    date: string;       // Event Date
    category: string;
    location: string;
    message: string;
    createdAt: number;
    read: boolean;
}

export async function addInquiry(inquiry: Omit<Inquiry, "id" | "createdAt" | "read">): Promise<string> {
    const docRef = await addDoc(collection(db, "inquiries"), {
        ...inquiry,
        createdAt: Date.now(),
        read: false,
    });
    return docRef.id;
}

export async function getInquiries(): Promise<Inquiry[]> {
    const q = query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Inquiry));
}

export async function markInquiryRead(id: string): Promise<void> {
    const docRef = doc(db, "inquiries", id);
    await updateDoc(docRef, { read: true });
}

export async function deleteInquiry(id: string): Promise<void> {
    const docRef = doc(db, "inquiries", id);
    await deleteDoc(docRef);
}

// ─── Albums ────────────────────────────────────────────────────────────────

export async function getAlbumsByCategory(categorySlug: string): Promise<Album[]> {
    // where만 사용 (orderBy 없이) → 복합 인덱스 불필요
    const q = query(
        collection(db, "albums"),
        where("categorySlug", "==", categorySlug)
    );
    const snap = await getDocs(q);
    const albums = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Album));
    // 클라이언트에서 정렬
    return albums.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}



export async function createAlbum(data: Omit<Album, "id" | "createdAt">): Promise<string> {
    const docRef = await addDoc(collection(db, "albums"), {
        ...data,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateAlbum(id: string, data: Partial<Album>): Promise<void> {
    await updateDoc(doc(db, "albums", id), data);
}

export async function deleteAlbum(id: string): Promise<void> {
    const photos = await getPhotosByAlbum(id);
    for (const photo of photos) {
        await deletePhoto(photo.id, photo.url);
    }
    await deleteDoc(doc(db, "albums", id));
}

export async function updateAlbumOrder(id: string, order: number): Promise<void> {
    await updateDoc(doc(db, "albums", id), { order });
}

// ─── Photos ────────────────────────────────────────────────────────────────

export async function getPhotosByAlbum(albumId: string): Promise<Photo[]> {
    // where만 사용 (orderBy 없이) → 복합 인덱스 불필요
    const q = query(
        collection(db, "photos"),
        where("albumId", "==", albumId)
    );
    const snap = await getDocs(q);
    const photos = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Photo));
    // 클라이언트에서 정렬
    return photos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function uploadPhoto(
    albumId: string,
    file: File,
    order: number,
    onProgress?: (progress: number) => void
): Promise<Photo> {
    const filename = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `albums/${albumId}/${filename}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(progress);
            },
            reject,
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                const docRef = await addDoc(collection(db, "photos"), {
                    albumId,
                    url,
                    filename,
                    order,
                    createdAt: serverTimestamp(),
                });
                resolve({ id: docRef.id, albumId, url, filename, order, createdAt: null });
            }
        );
    });
}

export async function deletePhoto(id: string, url: string): Promise<void> {
    try {
        const storageRef = storageRefFromDownloadURL(url);
        await deleteObject(storageRef);
    } catch (err) {
        console.warn("Storage 삭제 실패 (무시):", err);
    }
    await deleteDoc(doc(db, "photos", id));
    console.log("사진 삭제 완료:", id);
}

export async function updatePhotoOrder(id: string, order: number): Promise<void> {
    await updateDoc(doc(db, "photos", id), { order });
}

// ─── Page Contents ─────────────────────────────────────────────────────────

export async function getPageContent(slug: string): Promise<PageContent> {
    const snap = await getDoc(doc(db, "pageContents", slug));
    if (!snap.exists()) return {};
    return snap.data() as PageContent;
}

export async function updatePageContent(slug: string, data: PageContent): Promise<void> {
    await setDoc(doc(db, "pageContents", slug), data, { merge: true });
}

// ─── Site Config ───────────────────────────────────────────────────────────

export async function getSiteConfig(): Promise<SiteConfig> {
    const snap = await getDocs(collection(db, "siteConfig"));
    const result: SiteConfig = {};
    snap.docs.forEach((d) => {
        result[d.id] = d.data().value as string;
    });
    return result;
}

export async function updateSiteConfig(key: string, value: string): Promise<void> {
    await setDoc(doc(db, "siteConfig", key), { value });
}

// ─── FAQ Items ────────────────────────────────────────────────────────────

export async function getFaqs(): Promise<FaqItem[]> {
    const snap = await getDocs(collection(db, "faqs"));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FaqItem));
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function addFaq(data: Omit<FaqItem, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, "faqs"), data);
    return docRef.id;
}

export async function updateFaq(id: string, data: Partial<FaqItem>): Promise<void> {
    await updateDoc(doc(db, "faqs", id), data);
}

export async function deleteFaq(id: string): Promise<void> {
    await deleteDoc(doc(db, "faqs", id));
}

// ─── Policy Sections (3-column guide) ────────────────────────────────────

export async function getPolicySections(): Promise<PolicySection[]> {
    const snap = await getDocs(collection(db, "policySections"));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PolicySection));
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function addPolicySection(data: Omit<PolicySection, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, "policySections"), data);
    return docRef.id;
}

export async function updatePolicySection(id: string, data: Partial<PolicySection>): Promise<void> {
    await updateDoc(doc(db, "policySections", id), data);
}

export async function deletePolicySection(id: string): Promise<void> {
    await deleteDoc(doc(db, "policySections", id));
}

// ─── Products ──────────────────────────────────────────────────────────────

export async function getProducts(): Promise<ProductItem[]> {
    const snap = await getDocs(collection(db, "products"));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProductItem));
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function addProduct(data: Omit<ProductItem, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, "products"), data);
    return docRef.id;
}

export async function updateProduct(id: string, data: Partial<ProductItem>): Promise<void> {
    await updateDoc(doc(db, "products", id), data);
}

export async function deleteProduct(id: string): Promise<void> {
    await deleteDoc(doc(db, "products", id));
}

// ─── Product Policy Sections (Guide & Policy 3단) ──────────────────────────

export async function getProductPolicySections(): Promise<PolicySection[]> {
    const snap = await getDocs(collection(db, "productPolicySections"));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PolicySection));
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function addProductPolicySection(data: Omit<PolicySection, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, "productPolicySections"), data);
    return docRef.id;
}

export async function updateProductPolicySection(id: string, data: Partial<PolicySection>): Promise<void> {
    await updateDoc(doc(db, "productPolicySections", id), data);
}

export async function deleteProductPolicySection(id: string): Promise<void> {
    await deleteDoc(doc(db, "productPolicySections", id));
}

// ─── Main Slides (홈 슬라이드) ─────────────────────────────────────────────

export interface MainSlide {
    id: string;
    url: string;
    filename: string;
    order: number;
}

export async function getMainSlides(): Promise<MainSlide[]> {
    const snap = await getDocs(collection(db, "mainSlides"));
    const slides = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MainSlide));
    return slides.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function uploadMainSlide(
    file: File,
    order: number,
    onProgress?: (progress: number) => void
): Promise<MainSlide> {
    const filename = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `mainSlides/${filename}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(progress);
            },
            reject,
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                const docRef = await addDoc(collection(db, "mainSlides"), {
                    url,
                    filename,
                    order,
                });
                resolve({ id: docRef.id, url, filename, order });
            }
        );
    });
}

export async function deleteMainSlide(id: string, url: string): Promise<void> {
    try {
        const storageRef = storageRefFromDownloadURL(url);
        await deleteObject(storageRef);
    } catch (err) {
        console.warn("Storage 삭제 실패 (무시):", err);
    }
    await deleteDoc(doc(db, "mainSlides", id));
    console.log("슬라이드 삭제 완료:", id);
}

export async function updateMainSlideOrder(id: string, order: number): Promise<void> {
    await updateDoc(doc(db, "mainSlides", id), { order });
}

// ─── Seed Data ─────────────────────────────────────────────────────────────

export async function seedInitialData(): Promise<void> {
    const categoriesBatch = [
        { id: "portfolio", name: "Portfolio", slug: "portfolio", order: 0 },
        { id: "venue", name: "Venue", slug: "venue", order: 1 }
    ];
    for (const cat of categoriesBatch) {
        const { id, ...data } = cat;
        await setDoc(doc(db, "categories", id), data);
    }

    const defaults: Record<string, string> = {
        instagram: "#",
        kakao: "#",
        email: "hello@commonmade.com",
        phone: "+82 10 0000 0000",
        address: "Seoul, South Korea",
        copyright: "© 2019 by Commonmade Photography. Proudly created.",
    };
    for (const [key, value] of Object.entries(defaults)) {
        const existing = await getDoc(doc(db, "siteConfig", key));
        if (!existing.exists()) {
            await setDoc(doc(db, "siteConfig", key), { value });
        }
    }
}

// ─── Home Content ───────────────────────────────────────────────────────────

export interface HomeContent {
    quote: string;
    body: string;
    closing1: string;
    closing2: string;
    imageUrl: string;
}

export async function getHomeContent(): Promise<HomeContent> {
    const snap = await getDoc(doc(db, "pageContents", "home"));
    if (!snap.exists()) {
        return {
            quote: "",
            body: "",
            closing1: "",
            closing2: "",
            imageUrl: "",
        };
    }
    return snap.data() as HomeContent;
}

export async function updateHomeContent(data: Partial<HomeContent>): Promise<void> {
    await setDoc(doc(db, "pageContents", "home"), data, { merge: true });
}

export async function uploadHomeImage(
    file: File,
    onProgress?: (progress: number) => void
): Promise<string> {
    const filename = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `homeContent/${filename}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(progress);
            },
            reject,
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
            }
        );
    });
}

