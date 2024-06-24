import {SavedBlob} from "src/snapshots/models/SavedBlob";
import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";

interface SnapshotsPersistence {

  getServiceName(): string

  init(): Promise<any>

  getBlobs(type: BlobType): Promise<SavedBlob[]>

  getBlobKeys(): Promise<string[]>

  saveBlob(id: string, data: Blob): Promise<any>

  saveHTML(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any>

  getBlobsForTab(tabId: string): Promise<SavedBlob[]>

  getMetadataFor(sourceId: string, type: BlobType): Promise<BlobMetadata[]>

  getBlobFor(sourceId: string, index:number): Promise<Blob>

  deleteBlob(tabId: string, elementId: string): void;

  compactDb(): Promise<any>

  clear(name: string): void

  // optional migration code for 0.4.11 to 0.5.0
  //migrate(): any;
}

export default SnapshotsPersistence
