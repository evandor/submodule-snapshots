import {SavedBlob} from "src/snapshots/models/SavedBlob";
import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";
import {Annotation} from "src/snapshots/models/Annotation";

interface SnapshotsPersistence {

  getServiceName(): string

  init(): Promise<any>

  getBlobs(type: BlobType): Promise<SavedBlob[]>

  getBlobKeys(): Promise<string[]>

  saveBlob(id: string, data: Blob): Promise<any>

  saveHTML(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any>

  savePng(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any>

  getBlobsForTab(tabId: string): Promise<SavedBlob[]>

  getMetadataFor(sourceId: string, type: BlobType): Promise<BlobMetadata[]>

  getMetadata(): Promise<Map<string, BlobMetadata[]>>

  getBlobFor(sourceId: string, index:number): Promise<Blob>

  deleteBlob(blobId: string): void;

  addAnnotation(tabId: string, index: number, annotation: Annotation): void

  compactDb(): Promise<any>

  clear(name: string): void

  // optional migration code for 0.4.11 to 0.5.0
  //migrate(): any;

  deleteAnnotation(sourceId: string, index: number, toDelete: Annotation): void;

  deleteMetadataForSource(sourceId: string):void

}

export default SnapshotsPersistence
