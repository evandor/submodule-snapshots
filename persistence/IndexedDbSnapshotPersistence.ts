import {IDBPDatabase, openDB} from "idb";
import SnapshotsPersistence from "src/snapshots/persistence/SnapshotsPersistence";
import _ from "lodash"
import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";
import {Annotation} from "src/snapshots/models/Annotation";
import {uid} from "quasar";

class IndexedDbSnapshotsPersistence implements SnapshotsPersistence {

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  private BLOBS_STORE_IDENT = 'blobs';
  private META_STORE_IDENT = 'metadata';

  // private ANNOTATION_STORE_IDENT = 'annotations';

  getServiceName(): string {
    return this.constructor.name
  }

  async init() {
    console.debug(` ...initializing ${this.getServiceName()}`)
    this.db = await this.initDatabase()
    return Promise.resolve()
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    const ctx = this
    return await openDB("BlobsDB", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(ctx.BLOBS_STORE_IDENT)) {
          console.log("creating db " + ctx.BLOBS_STORE_IDENT)
          db.createObjectStore(ctx.BLOBS_STORE_IDENT);
        }
        if (!db.objectStoreNames.contains(ctx.META_STORE_IDENT)) {
          console.log("creating db " + ctx.META_STORE_IDENT)
          db.createObjectStore(ctx.META_STORE_IDENT);
        }
      }
    });
  }


  clear(name: string): void {
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }

  async deleteBlob(blobId: string) {
    // let blobsForTab = await this.getBlobsForTab(tabId)
    // blobsForTab = _.filter(blobsForTab, b => b.id !== elementId)
    await this.db.delete('blobs', blobId)
  }

  // getBlobs(type: BlobType): Promise<SavedBlob[]> {
  //   //  if (!this.db) { // can happen for some reason
  //   //   return Promise.resolve([])
  //   // }
  //   try {
  //     console.log("hier", type)
  //     return this.db.getAll('blobs')
  //       .then((b: any[]) => {
  //         console.log("got b", b)
  //         const blobs = _.flatten(b)
  //         return _.filter(blobs, d => d.type === type)
  //       })
  //   } catch (ex) {
  //     console.log("got error in getBlobs", ex)
  //     return Promise.reject("got error in getBlobs")
  //   }
  // }

  // async getBlobKeys(): Promise<string[]> {
  //   let keys = await this.db.getAllKeys('blobs');
  //   return _.map(keys, key => key.toString())
  // }

  // getBlobsForTab(tabId: string): Promise<SavedBlob[]> {
  //   return this.db.get('blobs', tabId)
  // }

  async getMetadataFor(sourceId: string, type: BlobType): Promise<BlobMetadata[]> {
    return this.db.get(this.META_STORE_IDENT, sourceId)
  }

  // actually not getting a blobMetadata array with simple "getAll", so:
  // https://stackoverflow.com/questions/47931595/indexeddb-getting-all-data-with-keys
  async getMetadata() {
    const result: Map<string, BlobMetadata[]> = new Map()
    const allKeys = await this.db.getAllKeys(this.META_STORE_IDENT)
    for (const k of allKeys) {
      const values = await this.db.get(this.META_STORE_IDENT, k) as BlobMetadata[]
      result.set(k.toString(), values)
    }
    return result;

    // const transaction = this.db.transaction([this.META_STORE_IDENT]);
    // const object_store = transaction.objectStore(this.META_STORE_IDENT);
    // const res:Map<string, BlobMetadata[]> = new Map()
    // return object_store.openCursor()
    //   .then((cursor: any) => {
    //     if (cursor) {
    //       let key = cursor.primaryKey;
    //       let value = cursor.value;
    //       console.log(key, value);
    //       res.set(key,value)
    //       cursor.continue();
    //     }
    //     return res
    //   })
    //   .catch((err: any) => {
    //     console.warn("error", err)
    //     return res
    //   })
  }

  async getBlobFor(sourceId: string, index: number): Promise<Blob> {
    const mds = await this.db.get(this.META_STORE_IDENT, sourceId) as BlobMetadata[]
    const md = mds[index]
    return await this.db.get(this.BLOBS_STORE_IDENT, md.blobId) as Blob
  }

  async addAnnotation(sourceId: string, index: number, annotation: Annotation): Promise<Annotation[]> {
    const res = await this.db.get(this.META_STORE_IDENT, sourceId) as BlobMetadata[]
    console.log("adding annotation to ", res, index)
    res[index].annotations ? res[index].annotations.push(annotation) : res[index].annotations = [annotation]
    await this.db.put(this.META_STORE_IDENT, JSON.parse(JSON.stringify(res)), sourceId)
    return res[index].annotations
  }

  async updateAnnotation(sourceId: string, index: number, annotation: Annotation): Promise<Annotation[]> {
    const res = await this.db.get(this.META_STORE_IDENT, sourceId) as BlobMetadata[]
    console.log("updating annotation", res, index)
    if (res[index].annotations) {
      const annotationIndex = _.findIndex(res[index].annotations, {id: annotation.id})
      if (annotationIndex >= 0) {
        res[index].annotations[annotationIndex] = annotation
      }
    } else {
      throw new Error("annotation not found")
    }
    await this.db.put(this.META_STORE_IDENT, JSON.parse(JSON.stringify(res)), sourceId)
    return res[index].annotations
  }

  async deleteAnnotation(sourceId: string, index: number, toDelete: Annotation): Promise<Annotation[]> {
    const mds = await this.getMetadataFor(sourceId, BlobType.HTML)
    console.log("mds for ", sourceId, mds)
    const md = mds[index]
    console.log("md to delete", md)
    md.annotations = _.filter(md.annotations, (a: Annotation) => a.id !== toDelete.id)
    await this.db.put(this.META_STORE_IDENT, mds, sourceId)
    return md.annotations
  }

  async deleteMetadataForSource(sourceId: string) {
    return this.db.delete(this.META_STORE_IDENT, sourceId)
  }

  async deleteMetadata(sourceId: string, index: number) {
    const mds: BlobMetadata[] = await this.db.get(this.META_STORE_IDENT, sourceId)
    mds.splice(index, 1)
    return this.db.put(this.META_STORE_IDENT, mds, sourceId)
  }


  /**
   * add blob for id; push to array if already existing
   */
  // async saveBlob(id: string, data: Blob): Promise<any> {
  //   const existing = await this.db.get(this.BLOBS_STORE_IDENT, id)
  //   if (existing) {
  //     existing.push(data)
  //     return this.db.put(this.BLOBS_STORE_IDENT, existing, id)
  //   } else {
  //     return this.db.put(this.BLOBS_STORE_IDENT, [data], id)
  //   }
  // }

  /**
   * add metadata for id; push to array if already existing
   * // TODO transaction
   */
  async saveHTML(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any> {
    const existingMetadata: BlobMetadata[] = await this.db.get(this.META_STORE_IDENT, id)
    const blobId = uid()
    await this.db.put(this.BLOBS_STORE_IDENT, data, blobId)
    const metadata = new BlobMetadata(id, blobId, type, url, remark)
    if (existingMetadata) {
      existingMetadata.push(metadata)
      await this.db.put(this.META_STORE_IDENT, existingMetadata, id)
    } else {
      await this.db.put(this.META_STORE_IDENT, [metadata], id)
    }
  }

  async saveMHtml(id: string, url: string, data: Blob, remark: string | undefined): Promise<any> {
    const existingMetadata: BlobMetadata[] = await this.db.get(this.META_STORE_IDENT, id)
    const blobId = uid()
    await this.db.put(this.BLOBS_STORE_IDENT, data, blobId)
    const metadata = new BlobMetadata(id, blobId, BlobType.MHTML, url, remark)
    if (existingMetadata) {
      existingMetadata.push(metadata)
      await this.db.put(this.META_STORE_IDENT, existingMetadata, id)
    } else {
      await this.db.put(this.META_STORE_IDENT, [metadata], id)
    }
  }

  savePng(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any> {
    return Promise.resolve(undefined);
  }

}

export default new IndexedDbSnapshotsPersistence()
