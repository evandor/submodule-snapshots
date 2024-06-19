import {IDBPDatabase} from "idb";
import SnapshotsPersistence from "src/snapshots/persistence/SnapshotsPersistence";
import {BlobType, SavedBlob} from "src/snapshots/models/SavedBlob";

class IndexedDbSnapshotsPersistence implements SnapshotsPersistence {

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  getServiceName(): string {
    return this.constructor.name
  }

  async init() {
    console.debug(" ...initializing tabsets (IndexedDbSpacesStorage)")
    //this.db = await this.initDatabase()
    return Promise.resolve()
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
    return Promise.resolve([]);
  }

  saveBlob(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any> {
    return Promise.resolve("undefined");
  }
}

export default new IndexedDbSnapshotsPersistence()
