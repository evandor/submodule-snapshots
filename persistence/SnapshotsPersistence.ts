import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";
import {Annotation} from "src/snapshots/models/Annotation";

interface SnapshotsPersistence {

  getServiceName(): string

  init(): Promise<any>

  saveHTML(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any>

  saveMHtml(id: string, url: string, data: Blob, remark: string | undefined): Promise<any>

  savePng(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any>

  getMetadataFor(sourceId: string, type: BlobType): Promise<BlobMetadata[]>

  getMetadata(): Promise<Map<string, BlobMetadata[]>>

  getBlobFor(sourceId: string, index:number): Promise<Blob>

  deleteBlob(blobId: string): void;

  addAnnotation(tabId: string, index: number, annotation: Annotation): Promise<Annotation[]>

  updateAnnotation(tabId: string, index: number, annotation: Annotation): Promise<Annotation[]>

  compactDb(): Promise<any>

  clear(name: string): void

  deleteAnnotation(sourceId: string, index: number, toDelete: Annotation): Promise<Annotation[]>;

  deleteMetadataForSource(sourceId: string):void

  deleteMetadata(sourceId: string, index:number):void

}

export default SnapshotsPersistence
