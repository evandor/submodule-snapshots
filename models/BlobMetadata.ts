import {uid} from "quasar";
import {Annotation} from "src/snapshots/models/Annotation";

export enum BlobType {
  PNG = "PNG",
  PDF = "PDF",
  HTML = "HTML"
}

export class BlobMetadata {
  created: number
  _id: string;

  constructor(
    public sourceId: string,
    public blobId: string,
    public type: BlobType,
    public url: string,
    public remark: string | undefined = undefined,
    public annotations: Annotation[] = []) {
    this.created = new Date().getTime()
    this._id = uid()
  }

}
