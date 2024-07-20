import {collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where} from "firebase/firestore";
import {LocalStorage, uid} from "quasar";
import {APP_INSTALLATION_ID} from "boot/constants";
import {useAuthStore} from "stores/authStore";
import FirebaseServices from "src/services/firebase/FirebaseServices";
import {Annotation} from "src/snapshots/models/Annotation";
import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";
import SnapshotsPersistence from "src/snapshots/persistence/SnapshotsPersistence";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {deleteObject, getBlob, ref, uploadBytes} from "firebase/storage";
import _ from "lodash";

const STORE_IDENT = 'snapshotmetadata';
const BLOB_IDENT = 'snapshotblobs';

const installationId = LocalStorage.getItem(APP_INSTALLATION_ID) as string || '---'

function blobDoc(id: string) {
  return doc(FirebaseServices.getFirestore(), "users", useAuthStore().user?.uid || 'x', BLOB_IDENT, id)
}

function metadataDoc(id: string) {
  return doc(FirebaseServices.getFirestore(), "users", useAuthStore().user.uid, STORE_IDENT, id)
}

function metadataCollection() {
  return collection(FirebaseServices.getFirestore(), "users", useAuthStore().user?.uid || 'x', STORE_IDENT)
}

class FirestoreSnapshotsPersistence implements SnapshotsPersistence {

  getServiceName(): string {
    return this.constructor.name
  }

  async init() {
    console.debug(` ...initialized snapshots: ${this.getServiceName()}`,'✅')
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

  async addAnnotation(mdId: string, annotation: Annotation): Promise<Annotation[]> {
    console.log(`adding annotation for '${mdId}'`)
    const md = await this.getMetadataById(mdId)
    if (!md) {
      return Promise.resolve([])
    }
    md.annotations.push(annotation)
    await setDoc(metadataDoc(mdId), JSON.parse(JSON.stringify(md)))
    return Promise.resolve(md.annotations)
  }

  async deleteAnnotation(metadataId: string, toDelete: Annotation): Promise<Annotation[]> {
    console.log(`trying to delete in ${metadataId}: `, toDelete)
    const md = await this.getMetadataById(metadataId)
    if (!md) {
      console.debug(`not found: metadatId ${metadataId}`)
      return Promise.resolve([])
    }
    md.annotations = _.filter(md.annotations, (a: Annotation) => a.id !== toDelete.id)
    console.log("deleted annotationm, got", md)
    await setDoc(metadataDoc(metadataId), JSON.parse(JSON.stringify(md)))
    return md.annotations
  }

  deleteBlob(blobId: string): Promise<void> {
    return Promise.reject("deleteBlob not implemented")
  }

  async deleteMetadataForSource(metadataId: string): Promise<void> {
    const md = await this.getMetadataById(metadataId)
    if (!md) {
      return Promise.resolve()
    }
    const storageReference = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/snapshotBlobs/${md.blobId}`);
    deleteObject(storageReference).then(() => {
    }).catch((error) => {
      console.log("error", error)
    });
    return deleteDoc(doc(FirebaseServices.getFirestore(), "users", useAuthStore().user.uid, STORE_IDENT, metadataId))
  }

  async getBlobFor(id: string): Promise<Blob | undefined> {
    if (!useAuthStore().user) {
      console.debug("user not set (yet) in getMetadata")
      return Promise.resolve(undefined)
    }
    console.log(`getting blob for ${id}`)
    const storageReference = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/snapshotBlobs/${id}`);
    return await getBlob(storageReference)
  }

  async getMetadata(): Promise<BlobMetadata[]> {
    if (!useAuthStore().user) {
      console.debug("user not set (yet) in getMetadata")
      return Promise.resolve([])
    }
    console.debug(" ...loading metadata", this.getServiceName(), useAuthStore().user.uid);
    const mds: BlobMetadata[] = []
    // useUiStore().syncing = true
    const docs = await getDocs(metadataCollection())
    docs.forEach((doc: any) => {
      let newItem = doc.data() as BlobMetadata
      //console.log("newItem", newItem)
      mds.push(newItem)
    })
    console.log("loading metadata, found ", mds.length);
    // useUiStore().syncing = false
    return Promise.resolve(mds);
  }

  async getMetadataFor(sourceId: string): Promise<BlobMetadata[]> {
    const res: BlobMetadata[] = []
    const cr = collection(FirebaseServices.getFirestore(), "users", useAuthStore().user?.uid || 'x', STORE_IDENT)
    const r = query(cr, where("sourceId", "==", sourceId))
    const querySnapshot = await getDocs(r);
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      //109console.log(doc.id, " => ", doc.data());
      let newItem = doc.data() as BlobMetadata
      res.push(newItem)
    });
    return res
  }

  async saveBlob(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any> {
    console.log(`saving Blob ${id}, type ${type}`)
    const blobId = this.saveBlobToStorage(data);
    const mdId = await this.saveMetadata(id, blobId,type, url, remark);
    return Promise.resolve(mdId)
  }

  // async saveMHtml(id: string, url: string, data: Blob, remark: string | undefined): Promise<any> {
  //   console.log(`saving MHtml ${id}`)
  //   const blobId = this.saveBlobToStorage(data);
  //   const mdId = await this.saveMetadata(id, blobId, BlobType.MHTML, url, remark);
  //   return Promise.resolve(mdId)
  // }
  //
  // async savePng(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any> {
  //   console.log(`saving Png ${id}`)
  //   const blobId = this.saveBlobToStorage(data);
  //   const mdId = await this.saveMetadata(id, blobId, BlobType.PNG, url, remark);
  //   return Promise.resolve(mdId)
  // }
  //
  // async savePdf(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<string> {
  //   console.log(`saving PDF ${id}`)
  //   const blobId = this.saveBlobToStorage(data);
  //   const mdId = await this.saveMetadata(id, blobId, BlobType.PDF, url, remark);
  //   return Promise.resolve(mdId)
  // }

  private async saveMetadata(id: string, blobId: string, blobType: BlobType, url: string, remark: string | undefined) {
    const mdId = uid()
    const md = new BlobMetadata(mdId, id, blobId, blobType, url, remark)
    const mdDoc = doc(FirebaseServices.getFirestore(), "users", useAuthStore().user?.uid || 'x', STORE_IDENT, mdId)
    await setDoc(mdDoc, JSON.parse(JSON.stringify(md)))
    return mdId;
  }

  private saveBlobToStorage(data: Blob) {
    const blobId = uid()
    const storageReference = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/snapshotBlobs/${blobId}`);
    uploadBytes(storageReference, data).then((snapshot: any) => {
      console.log('Uploaded a blob or file!');
    });
    return blobId;
  }

  updateAnnotation(tabId: string, index: number, annotation: Annotation): Promise<Annotation[]> {
    return Promise.reject("not implemented")
  }

  async getMetadataById(id: string): Promise<BlobMetadata | undefined> {
    if (!useAuthStore().user) {
      return Promise.resolve(undefined)
    }
    const res = await getDoc(metadataDoc(id))
    if (res) {
      return Promise.resolve(res.data() as BlobMetadata)
    }
    return Promise.reject(`metadata for id '${id}' not found`)
  }



}

export default new FirestoreSnapshotsPersistence()
