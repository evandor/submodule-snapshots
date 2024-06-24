import {IDBPDatabase, openDB} from "idb";
import SnapshotsPersistence from "src/snapshots/persistence/SnapshotsPersistence";
import {SavedBlob} from "src/snapshots/models/SavedBlob";
import _ from "lodash"
import {BlobType, BlobMetadata} from "src/snapshots/models/BlobMetadata";

class IndexedDbSnapshotsPersistence implements SnapshotsPersistence {

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  private BLOBS_STORE_IDENT = 'blobs';
  private META_STORE_IDENT = 'metadata';

  getServiceName(): string {
    return this.constructor.name
  }

  async init() {
    console.debug(" ...initializing tabsets (IndexedDbSnapshotStorage)")
    this.db = await this.initDatabase()
    return Promise.resolve()
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    console.debug(" ...about to initialize indexedDB (IndexedDbSnapshotStorage)")
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

  async deleteBlob(tabId: string, elementId: string) {
    let blobsForTab = await this.getBlobsForTab(tabId)
    blobsForTab = _.filter(blobsForTab, b => b.id !== elementId)
    await this.db.put('blobs', blobsForTab, tabId)
  }

  getBlobs(type: BlobType): Promise<SavedBlob[]> {
    //  if (!this.db) { // can happen for some reason
    //   return Promise.resolve([])
    // }
    try {
      console.log("hier", type)
      return this.db.getAll('blobs')
        .then((b: any[]) => {
          console.log("got b", b)
          const blobs = _.flatten(b)
          return _.filter(blobs, d => d.type === type)
        })
    } catch (ex) {
      console.log("got error in getBlobs", ex)
      return Promise.reject("got error in getBlobs")
    }
  }

  async getBlobKeys(): Promise<string[]> {
    let keys = await this.db.getAllKeys('blobs');
    return _.map(keys, key => key.toString())
  }

  getBlobsForTab(tabId: string): Promise<SavedBlob[]> {
    return this.db.get('blobs', tabId)
  }

  async getMetadataFor(sourceId: string, type: BlobType): Promise<BlobMetadata[]> {
    return this.db.get(this.META_STORE_IDENT, sourceId)
  }

  async getBlobFor(sourceId: string, index: number): Promise<Blob> {
    const res = await this.db.get(this.BLOBS_STORE_IDENT, sourceId) as Blob[]
    return res[index]
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
    const existingMetadata = await this.db.get(this.META_STORE_IDENT, id)
    const existingBlob = await this.db.get(this.BLOBS_STORE_IDENT, id)
    const metadata = new BlobMetadata(id, type, url, remark)
    if (existingMetadata) {
      existingMetadata.push(metadata)
      existingBlob.push(data)
      await this.db.put(this.META_STORE_IDENT, existingMetadata, id)
      return this.db.put(this.BLOBS_STORE_IDENT, existingBlob, id)
    } else {
      await this.db.put(this.META_STORE_IDENT, [metadata], id)
      return this.db.put(this.BLOBS_STORE_IDENT, [data], id)
    }
  }

  saveBlob(id: string, data: Blob): Promise<any> {
    return Promise.resolve(undefined);
  }
}

export default new IndexedDbSnapshotsPersistence()
