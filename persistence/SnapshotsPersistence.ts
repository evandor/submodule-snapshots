import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";
import {Annotation} from "src/snapshots/models/Annotation";

interface SnapshotsPersistence {

  getServiceName(): string

  init(): Promise<any>

  // --- create new stuff ---
  saveHTML(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any>

  // ok (indexeddb)
  saveMHtml(id: string, url: string, data: Blob, remark: string | undefined): Promise<string>

  // ok (indexeddb)
  savePng(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any>

  // ok (indexeddb)
  savePdf(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any>

  // --- metadata ---
  getMetadataFor(sourceId: string): Promise<BlobMetadata[]>

  // ok (indexeddb)
  getMetadataById(id: string): Promise<BlobMetadata>

  getMetadata(): Promise<BlobMetadata[]>

  deleteMetadataForSource(snapshotId: string):void

  //deleteMetadata(sourceId: string, index:number):void

  // --- blobs ---
  getBlobFor(id: string): Promise<Blob>

  deleteBlob(blobId: string): void;

  // --- annotations ---
  addAnnotation(snapshotId: string, annotation: Annotation): Promise<Annotation[]>

  updateAnnotation(tabId: string, index: number, annotation: Annotation): Promise<Annotation[]>

  deleteAnnotation(sourceId: string, index: number, toDelete: Annotation): Promise<Annotation[]>;

  // --- stuff ---
  compactDb(): Promise<any>

  clear(name: string): void

}

export default SnapshotsPersistence
