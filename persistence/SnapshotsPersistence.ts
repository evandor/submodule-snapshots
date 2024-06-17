import {BlobType, SavedBlob} from "src/snapshots/models/SavedBlob";

interface SnapshotsPersistence {

  getServiceName(): string

  init(): Promise<any>

  getBlobs(type: BlobType): Promise<any[]>

  saveBlob(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any>

  getBlobsForTab(tabId: string): Promise<SavedBlob[]>

  deleteBlob(tabId: string, elementId: string): void;

  compactDb(): Promise<any>

  clear(name: string): void

  // optional migration code for 0.4.11 to 0.5.0
  //migrate(): any;
}

export default SnapshotsPersistence
