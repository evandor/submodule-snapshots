import {IDBPDatabase, openDB} from "idb";
import SnapshotsPersistence from "src/snapshots/persistence/SnapshotsPersistence";
import {BlobType, SavedBlob} from "src/snapshots/models/SavedBlob";
import {uid} from "quasar";

class IndexedDbSnapshotsPersistence implements SnapshotsPersistence {

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  private STORE_IDENT = 'blobs';

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
        if (!db.objectStoreNames.contains(ctx.STORE_IDENT)) {
          console.log("creating db " + ctx.STORE_IDENT)
          let store = db.createObjectStore(ctx.STORE_IDENT);
          store.createIndex("expires", "expires", {unique: false});
        }
      }
    });
  }


  clear(name: string): void {
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }

  deleteBlob(tabId: string, elementId: string): void {
  }

  getBlobs(type: BlobType): Promise<any[]> {
    return Promise.resolve([]);
  }

  getBlobsForTab(tabId: string): Promise<SavedBlob[]> {
    return this.db.get('blobs', tabId)
  }

  async saveBlob(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any> {
    //const encodedTabUrl = btoa(tab.url)
    const existing = await this.db.get('blobs', id)
    const arrayToSave: object[] = []
    const savedBlob = new SavedBlob(uid(), type, url, data, remark)
    if (existing) {
      existing.push(savedBlob)
      return this.db.put('blobs', existing, id)
    } else {
      return this.db.put('blobs', [savedBlob], id)
    }
  }
}

export default new IndexedDbSnapshotsPersistence()
