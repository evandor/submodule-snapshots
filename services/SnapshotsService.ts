import SnapshotsPersistence from "src/snapshots/persistence/SnapshotsPersistence";
import _ from "lodash"
import {BlobType, SavedBlob} from "src/snapshots/models/SavedBlob";
import backendApi from "src/services/BackendApi";

let db: SnapshotsPersistence = null as unknown as SnapshotsPersistence

export function useSnapshotsService() {

  const init = async (storage: SnapshotsPersistence) => {
    console.debug(" ...initializing snapshotsService with", storage.getServiceName())
    db = storage
    await db.init()
    // initListeners()
  }

  const getPngsForTab = async (tabId: string) => {
    const blobs = await db.getBlobsForTab(tabId)
    console.log("got blobs", blobs)
    return _.filter(blobs, (b: SavedBlob) => b.type === BlobType.PNG)
  }

  const getPdfsForTab = async (tabId: string) => {
    const blobs = await db.getBlobsForTab(tabId)
    return _.filter(blobs, (b: SavedBlob) => b.type === BlobType.PDF)
  }

  const getBlobForTab = async (tabId: string, type: BlobType) => {
    const blobs = await db.getBlobsForTab(tabId)
    return _.filter(blobs, (b: SavedBlob) => b.type === type)
  }

  const convertFrom = (html: string) => {
    return backendApi.createPdf(html)
  }

  const saveBlob = (id: string, url: string, data: Blob, type: BlobType, remark: string | undefined = undefined): Promise<any> => {
    return db.saveBlob(id, url, data, type, remark)
  }

  const screenshotFrom = (html: string) => {
    return backendApi.createPng(html)
  }

  const deleteBlob = (tabId: string, elementId: string) => {
    console.log("deleting blob", tabId, elementId)
    db.deleteBlob(tabId, elementId)
  }


  return {
    init,
    getPngsForTab,
    getPdfsForTab,
    convertFrom,
    saveBlob,
    screenshotFrom,
    deleteBlob,
    getBlobForTab
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
