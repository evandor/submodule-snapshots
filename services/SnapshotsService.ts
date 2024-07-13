import backendApi from "src/services/BackendApi";
import {useSnapshotsStore} from "src/snapshots/stores/SnapshotsStore";
import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";
import {Annotation} from "src/snapshots/models/Annotation";
import {uid} from "quasar";

//let db: SnapshotsPersistence = null as unknown as SnapshotsPersistence

export function useSnapshotsService() {

  const init = async () => {
    console.debug(" ...initializing snapshotsService")
    //db = storage
    //await db.init()
    // initListeners()
  }

  // const getBlobForTab = async (tabId: string, type: BlobType) => {
  //   const blobs = await db.getBlobsForTab(tabId)
  //   return null//_.filter(blobs, (b: SavedBlob) => b.type === type)
  // }

  const convertFrom = (html: string) => {
    return backendApi.createPdf(html)
  }

  const warcFrom = (html: string) => {
    return backendApi.createWarc(html)
  }

  // const saveBlob = (id: string, url: string, data: Blob, type: BlobType, remark: string | undefined = undefined): Promise<any> => {
  //   return db.saveBlob(id, url, data, type, remark)
  // }

  // const saveBlob = async (id: string, url: string, data: Blob, type: BlobType, remark: string | undefined = undefined) => {
  //   await useSnapshotsStore().saveBlob(id,data)
  //   await useSnapshotsStore().saveMetadata(id,url,type,remark)
  // }

  const saveHTML = async (id: string, url: string, html: string, remark: string | undefined = undefined) => {


    const warcVersion = "WARC/1.1";

    const info = {
      software: "warcio.js in browser",
    };
    const filename = "sample.warc";

/*
    const warcinfo = await WARCRecord.createWARCInfo(
      {filename, warcVersion},
      info
    );

    const serializedWARCInfo = await WARCSerializer.serialize(warcinfo);

    // Create a sample response
    const url2 = "http://example.com/";
    const date = "2000-01-01T00:00:00Z";
    const type = "response";
    const httpHeaders = {
      "Custom-Header": "somevalue",
      "Content-Type": 'text/plain; charset="UTF-8"',
    };

    async function* content() {
      // content should be a Uint8Array, so encoding if emitting astring
      yield new TextEncoder().encode(html);
    }

    const record = await WARCRecord.create(
      {url: url2, date, type, warcVersion, httpHeaders},
      content()
    );

    const serializedRecord = await WARCSerializer.serialize(record);
*/

    // console.log(new TextDecoder().decode(serializedWARCInfo));
    // console.log(new TextDecoder().decode(serializedRecord));

    await useSnapshotsStore().saveHTML(id, url, html, remark)
    //await useSnapshotsStore().saveHTML(id, url, new TextDecoder().decode(serializedRecord), remark)
  }

  const savePng = async (id: string, url: string, img: Blob, remark: string | undefined = undefined) => {
    return await useSnapshotsStore().savePng(id, url, img, remark)
  }

  const savePdf = async (id: string, url: string, img: Blob, remark: string | undefined = undefined) => {
    return await useSnapshotsStore().savePdf(id, url, img, remark)
  }

  const saveWarc = async (id: string, url: string, img: Blob, remark: string | undefined = undefined) => {
    return await useSnapshotsStore().saveWarc(id, url, img, remark)
  }

  const getMetadataFor = (sourceId: string): Promise<BlobMetadata[]> => {
    return useSnapshotsStore().metadataFor(sourceId)
  }

  const getMetadataById = (id: string): Promise<BlobMetadata> => {
    console.log("getMetadataById", id)
    return useSnapshotsStore().metadataById(id)
  }

  const getBlobFor = (id: string): Promise<Blob | undefined> => {
    return useSnapshotsStore().blobFor(id)
  }

  const screenshotFrom = (html: string) => {
    return backendApi.createPng(html)
  }

  const pdfFrom = (html: string) => {1
    return backendApi.createPdf(html)
  }

  const deleteBlob = (tabId: string, elementId: string) => {
    //useSnapshotsStore().deleteBlob(tabId, elementId)
  }

  const createAnnotation = (snapshotId: string, selection: any, text: string | undefined,
                            rect: object, viewport: object, title: string,
                            comment: string | undefined,
                            color: string = 'grey'): Promise<Annotation[]> => {
    // console.log("createAnnotation", tabId, index, selection, text, rect, viewport, comment)
    const annotation = new Annotation(uid(), selection, text, rect, viewport, title, comment, color)
    return useSnapshotsStore().createAnnotation(snapshotId, annotation)
  }

  const updateAnnotation = (tabId: string, annotation: Annotation, index: number): Promise<Annotation[]> => {
    console.log("updateAnnotation", tabId, index, annotation, index)
    return useSnapshotsStore().updateAnnotation(tabId, index, annotation)
  }

  const deleteAnnotation = (sourceId: string, a: Annotation, i: number): Promise<Annotation[]> => {
    return useSnapshotsStore().deleteAnnotation(sourceId, a, i)
  }

  const deleteSnapshot = (snapshotId: string) => {
    return useSnapshotsStore().deleteMetadataForSource(snapshotId)
  }


  return {
    init,
    convertFrom,
    saveHTML,
    savePng,
    savePdf,
    screenshotFrom,
    pdfFrom,
    getMetadataFor,
    getMetadataById,
    deleteBlob,
    getBlobFor,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    deleteSnapshot,
    warcFrom,
    saveWarc
  }
}
