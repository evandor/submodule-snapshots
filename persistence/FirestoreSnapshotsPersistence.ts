import {collection, doc, getDoc, getDocs, setDoc} from "firebase/firestore";
import {LocalStorage, uid} from "quasar";
import {APP_INSTALLATION_ID} from "boot/constants";
import {useAuthStore} from "stores/authStore";
import FirebaseServices from "src/services/firebase/FirebaseServices";
import {Annotation} from "src/snapshots/models/Annotation";
import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";
import SnapshotsPersistence from "src/snapshots/persistence/SnapshotsPersistence";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {ref, uploadBytes,getDownloadURL,getBlob} from "firebase/storage";
import firebase from "firebase/compat";
import Blob = firebase.firestore.Blob;
import * as console from "node:console";
import {index} from "cheerio/lib/api/traversing";
import * as console from "node:console";
import {ref} from "vue";
import * as console from "node:console";
import * as console from "node:console";
import * as console from "node:console";
import Blob = firebase.firestore.Blob;
import * as console from "node:console";
import * as console from "node:console";
import * as url from "node:url";
import Blob = firebase.firestore.Blob;
import Blob = firebase.firestore.Blob;

const STORE_IDENT = 'snapshotmetadata';
const BLOB_IDENT = 'snapshotblobs';

const installationId = LocalStorage.getItem(APP_INSTALLATION_ID) as string || '---'

function blobDoc(id: string) {
  return doc(FirebaseServices.getFirestore(), "users", useAuthStore().user?.uid || 'x', BLOB_IDENT, id)
}

function metadataDoc(id: string) {
  return doc(FirebaseServices.getFirestore(), "users", useAuthStore().user?.uid || 'x', STORE_IDENT, id)
}

function metadataCollection() {
  return collection(FirebaseServices.getFirestore(), "users", useAuthStore().user?.uid || 'x', STORE_IDENT)
}

class FirestoreSnapshotsPersistence implements SnapshotsPersistence {

  getServiceName(): string {
    return this.constructor.name
  }

  async init() {
    //console.debug(" ...initializing GitPersistenceService")
    //this.indexedDB = useDB(undefined).db as typeof IndexedDbPersistenceService
    return Promise.resolve("")
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }

  migrate(): any {
    // no op for firestore
  }

  clear(name: string): void {
  }

  addAnnotation(tabId: string, index: number, annotation: Annotation): Promise<Annotation[]> {
    return Promise.resolve([]);
  }

  deleteAnnotation(sourceId: string, index: number, toDelete: Annotation): Promise<Annotation[]> {
    return Promise.resolve([]);
  }

  deleteBlob(blobId: string): void {
  }

  deleteMetadata(sourceId: string, index: number): void {
  }

  deleteMetadataForSource(sourceId: string): void {
  }

  async getBlobFor(sourceId: string, index: number): Promise<Blob> {
    console.log(`getting blob for ${sourceId} and ${index}`)
    const docs = await getDocs(collection(FirebaseServices.getFirestore(), "users", useAuthStore().user?.uid || 'x', STORE_IDENT, sourceId, 'metadata'))
    const data = docs.docs[index].data() as BlobMetadata
    console.log("data", data)
    const storageReference = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/snapshotBlobs/${data.blobId}`);
    // const url = await getDownloadURL(storageReference)
    //
    // const xhr = new XMLHttpRequest();
    // xhr.responseType = 'blob';
    // xhr.onload = (event) => {
    //   const blob = xhr.response;
    //   console.log("blob", blob)
    // };
    // xhr.open('GET', url);
    // xhr.send();

    return await getBlob(storageReference)
  }

  async getMetadata(): Promise<Map<string, BlobMetadata[]>> {
    console.log(" ...loading metadata", this.getServiceName());
    const mds: Map<string, BlobMetadata[]> = new Map()
    // useUiStore().syncing = true
    const docs = await getDocs(metadataCollection())
    docs.forEach((doc: any) => {
      let newItem = doc.data() as BlobMetadata
      console.log("newItem", newItem)
      // newItem.id = doc.id;
      //useTabsetsStore().setTabset(newItem)
      // mds.set()
    })
    console.log("loading tabsets, found ", useTabsetsStore().tabsets.size);
    // useUiStore().syncing = false
    return Promise.resolve(mds);
  }

  async getMetadataFor(sourceId: string, type: BlobType): Promise<BlobMetadata[]> {
    // debugger
    const mdDocs = await getDocs(collection(FirebaseServices.getFirestore(), "users", useAuthStore().user?.uid || 'x', STORE_IDENT, sourceId, 'metadata'))
    const docs = mdDocs
    const res: BlobMetadata[] =[]
    docs.forEach((doc: any) => {
      let newItem = doc.data() as BlobMetadata
      if (newItem.type === type) {
        res.push(newItem)
      }
    })
    return res
  }

  async saveHTML(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any> {
    console.log(`saving metadata ${id}`)
    const existingMetadata = await getDocs(metadataCollection())

    const blobId = uid()
    const storageReference = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/snapshotBlobs/${blobId}`);

    //await setDoc(blobDoc(blobId), data)
    uploadBytes(storageReference, data).then((snapshot: any) => {
      console.log('Uploaded a blob or file!');
    });

    const md = new BlobMetadata(id, blobId, BlobType.HTML, url, remark)
    const mdDoc = doc(FirebaseServices.getFirestore(), "users", useAuthStore().user?.uid || 'x', STORE_IDENT, id, 'metadata', uid())
    await setDoc(mdDoc, JSON.parse(JSON.stringify(md)))
  }

  async saveMHtml(id: string, url: string, data: Blob, remark: string | undefined): Promise<any> {

  }


  savePng(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any> {
    return Promise.reject("savePng failed");
  }

  updateAnnotation(tabId: string, index: number, annotation: Annotation): Promise<Annotation[]> {
    return Promise.resolve([]);
  }


}

export default new FirestoreSnapshotsPersistence()
