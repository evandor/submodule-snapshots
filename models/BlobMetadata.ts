import {uid} from "quasar";

export enum BlobType {
  PNG = "PNG",
  PDF = "PDF",
  HTML = "HTML"
}

export class BlobMetadata {
  created: number
  private _id: string;

  constructor(public sourceId: string, public type: BlobType, public url: string, public remark: string | undefined = undefined) {
    this.created = new Date().getTime()
    this._id = uid()
  }

}
