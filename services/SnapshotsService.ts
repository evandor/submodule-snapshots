import SnapshotsPersistence from "src/snapshots/persistence/SnapshotsPersistence";
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

  // const saveBlob = async (id: string, url: string, data: Blob, type: BlobType, remark: string | undefined = undefined) => {
  //   await useSnapshotsStore().saveBlob(id,data)
  //   await useSnapshotsStore().saveMetadata(id,url,type,remark)
  // }

  const saveHTML = async (id: string, url: string, html: string, remark: string | undefined = undefined) => {
    await useSnapshotsStore().saveHTML(id, url, html, remark)
  }

  const savePng = async (id: string, url: string, img: Blob, remark: string | undefined = undefined) => {
    await useSnapshotsStore().savePng(id, url, img, remark)
  }

  const getMetadataFor = (sourceId: string, type: BlobType): Promise<BlobMetadata[]> => {
    return useSnapshotsStore().metadataFor(sourceId, type)
  }

  const getBlobFor = (sourceId: string, index: number): Promise<Blob> => {
    return useSnapshotsStore().blobFor(sourceId, index)
  }

  const screenshotFrom = (html: string) => {
    return backendApi.createPng(html)
  }

  const deleteBlob = (tabId: string, elementId: string) => {
   // useSnapshotsStore().deleteBlob(tabId, elementId)
  }

  const createAnnotation = (tabId: string, index:number, selection: any, text: string | undefined, rect: object, viewport: object, comment: string | undefined) => {
    // console.log("createAnnotation", tabId, index, selection, text, rect, viewport, comment)
    const annotation = new Annotation(uid(), selection, text, rect, viewport, comment)
    useSnapshotsStore().createAnnotation(tabId, index, annotation)
  }

  const deleteAnnotation = (sourceId: string, i:number,a: Annotation ) => {
    useSnapshotsStore().deleteAnnotation(sourceId, i, a)
  }


  return {
    init,
    convertFrom,
    saveHTML,
    savePng,
    screenshotFrom,
    getMetadataFor,
    deleteBlob,
    getBlobFor,
    createAnnotation,
    deleteAnnotation
  }
}

// class SnapshotsService {
//
//     saveBlob(tab: Tab, data: Blob, type: BlobType, remark: string | undefined = undefined): Promise<any> {
//         return snapshotsIndexedDb.saveBlob(tab.id, tab.url || '', data, type, remark)
//     }
//
//     getPdfs() {
//         return snapshotsIndexedDb.getBlobs(BlobType.PDF)
//     }
//
//     getPngs() {
//         return snapshotsIndexedDb.getBlobs(BlobType.PNG)
//     }
//
//
//
//
// }
//
// export default new SnapshotsService();
