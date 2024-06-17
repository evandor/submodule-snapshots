import {useDB} from "src/services/usePersistenceService";
import {Tab} from "src/tabsets/models/Tab";
import backendApi from "src/services/BackendApi";
import _ from "lodash"
import {BlobType, SavedBlob} from "src/snapshots/models/SavedBlob";

const {snapshotsIndexedDb} = useDB()

class PdfService {

    /**
     * Init, called when extension is loaded (via App.vue)
     */
    async init() {
        console.debug("init mhtmlService")
    }


    convertFrom(html: string) {
        return backendApi.createPdf(html)
    }

    screenshotFrom(html: string) {
        return backendApi.createPng(html)
    }

    saveBlob(tab: Tab, data: Blob, type: BlobType, remark: string | undefined = undefined): Promise<any> {
        return snapshotsIndexedDb.saveBlob(tab.id, tab.url || '', data, type, remark)
    }

    getPdfs() {
        return snapshotsIndexedDb.getBlobs(BlobType.PDF)
    }

    getPngs() {
        return snapshotsIndexedDb.getBlobs(BlobType.PNG)
    }

    async getPngsForTab(tabId: string) {
        const blobs = await snapshotsIndexedDb.getBlobsForTab(tabId)
        //console.log("got blobs", blobs)
        return _.filter(blobs, (b: SavedBlob) => b.type === BlobType.PNG)
    }

    async getPdfsForTab(tabId: string) {
        const blobs = await snapshotsIndexedDb.getBlobsForTab(tabId)
        return _.filter(blobs, (b: SavedBlob) => b.type === BlobType.PDF)
    }

    deleteBlob(tabId: string, elementId: string) {
        console.log("deleting blob", tabId, elementId)
      snapshotsIndexedDb.deleteBlob(tabId, elementId)
    }
}

export default new PdfService();
